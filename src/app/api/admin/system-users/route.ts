import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Helper: Générer un mot de passe sécurisé aléatoire
 */
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

/**
 * GET /api/admin/system-users
 * Liste tous les utilisateurs ayant un rôle administratif
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createAdminClient();

        // Récupérer les utilisateurs et leurs rôles
        const { data: userRoles, error } = await supabase
            .from('admin_user_roles')
            .select(`
        user_id,
        role:admin_roles(*)
      `);

        if (error) throw error;

        // Récupérer les profils correspondants depuis Supabase Auth & public.profiles
        const userIds = userRoles.map(ur => ur.user_id);

        if (userIds.length === 0) {
            return NextResponse.json({ success: true, users: [] });
        }

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                *,
                overrides:admin_user_permissions(
                    permission_id,
                    action,
                    permission:admin_permissions(slug)
                )
            `)
            .in('id', userIds);

        if (profileError) throw profileError;

        // Fusionner les données
        const users = profiles.map(profile => {
            const userRoleRelation = userRoles.find(ur => ur.user_id === profile.id);
            return {
                ...profile,
                role: userRoleRelation?.role
            };
        });

        return NextResponse.json({ success: true, users });

    } catch (error: any) {
        console.error('❌ Erreur GET /api/admin/system-users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/system-users
 * Crée un nouvel utilisateur système avec un rôle spécifié
 */
export async function POST(request: NextRequest) {
    try {
        const adminClient = await createAdminClient();
        const { id, email, first_name, last_name, password: manualPassword, role_id, overrides } = await request.json();

        if (!email || !role_id) {
            return NextResponse.json(
                { success: false, error: 'Email et rôle sont requis' },
                { status: 400 }
            );
        }

        // 1. Récupérer le nom et le slug du rôle pour le profil
        const { data: roleData, error: roleFetchError } = await adminClient
            .from('admin_roles')
            .select('name, slug')
            .eq('id', role_id)
            .single();

        if (roleFetchError || !roleData?.slug) {
            console.error('❌ Erreur récupération rôle:', roleFetchError || 'Slug manquant');
            return NextResponse.json(
                { success: false, error: 'Le rôle sélectionné est mal configuré (slug manquant). Veuillez exécuter le script de seed SQL.' },
                { status: 400 }
            );
        }

        const roleSlug = roleData.slug;
        const roleName = roleData.name;

        let userId = id;

        // 3. Créer ou Mettre à jour l'utilisateur
        if (id) {
            console.log(`📝 Mise à jour de l'utilisateur ${id}`);
            const updatePayload: any = {
                email,
                user_metadata: { first_name, last_name, role: roleSlug, display_role: roleName }
            };
            if (manualPassword) updatePayload.password = manualPassword;

            const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(id, updatePayload);
            if (authUpdateError) throw authUpdateError;
        } else {
            console.log('✨ Création d\'un nouvel utilisateur système');
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email,
                password: manualPassword || generatePassword(),
                email_confirm: true,
                user_metadata: { first_name, last_name, role: roleSlug, display_role: roleName }
            });

            if (authError) throw authError;
            userId = authData.user.id;
        }

        // 4. Upsert le profil
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: userId,
                user_id: userId, // Ensure redundant link is set
                email,
                first_name,
                last_name,
                display_name: `${first_name} ${last_name}`.trim(),
                role: roleSlug,
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // 5. Assigner/Mettre à jour le rôle RBAC
        // Supprimer l'ancien rôle d'abord pour être propre
        await adminClient.from('admin_user_roles').delete().eq('user_id', userId);

        const { error: roleAssignError } = await adminClient
            .from('admin_user_roles')
            .insert({
                user_id: userId,
                role_id: role_id
            });

        if (roleAssignError) throw roleAssignError;

        // 6. Assigner les surcharges de permissions (overrides)
        // Supprimer les anciens overrides
        await adminClient.from('admin_user_permissions').delete().eq('user_id', userId);

        if (overrides && Array.isArray(overrides) && overrides.length > 0) {
            const overrideData = overrides.map(ov => ({
                user_id: userId,
                permission_id: ov.permission_id,
                action: ov.action
            }));

            const { error: overrideError } = await adminClient
                .from('admin_user_permissions')
                .insert(overrideData);

            if (overrideError) throw overrideError;
        }

        // 7. Retourner les identifiants si nouveau, sinon juste succès
        return NextResponse.json({
            success: true,
            message: id ? 'Utilisateur mis à jour avec succès' : 'Utilisateur système créé avec succès',
            credentials: !id ? { email, password: manualPassword || 'Généré' } : null
        });

    } catch (error: any) {
        console.error('❌ Erreur POST /api/admin/system-users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/system-users
 * Modifie le statut (actif/inactif) d'un utilisateur
 */
export async function PATCH(request: NextRequest) {
    try {
        const adminClient = await createAdminClient();
        const { id, is_active } = await request.json();

        if (!id) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

        console.log(`🔒 Changement du statut actif de ${id} à ${is_active}`);

        // 1. Mettre à jour profiles
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Mettre à jour l'état de ban dans Auth
        // On utilise ban_duration pour bloquer complètement l'accès au niveau Auth
        const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
            user_metadata: { is_active },
            ban_duration: is_active ? 'none' : '876000h' // 100 ans si inactif
        });

        if (authError) throw authError;

        return NextResponse.json({ success: true, message: is_active ? 'Utilisateur activé' : 'Utilisateur bloqué' });

    } catch (error: any) {
        console.error('❌ Erreur PATCH /api/admin/system-users:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/system-users
 * Supprime un utilisateur système (Auth + Profil + Rôle)
 */
export async function DELETE(request: NextRequest) {
    try {
        const adminClient = await createAdminClient();
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID requis' },
                { status: 400 }
            );
        }

        // 1. Supprimer de Auth d'abord
        console.log(`🚫 Suppression définitive de l'utilisateur Auth ${id}`);
        const { error: authError } = await adminClient.auth.admin.deleteUser(id);

        // On ne throw pas forcément tout de suite si le user auth est déjà parti mais que le profil reste
        if (authError && !authError.message.includes('User not found')) {
            console.error('❌ Erreur suppression Auth:', authError);
            throw authError;
        }

        // 2. Supprimer de profiles (au cas où le cascade ne fonctionne pas)
        console.log(`🗑️ Nettoyage manuel du profil ${id}`);
        const { error: profileError } = await adminClient.from('profiles').delete().eq('id', id);

        if (profileError) {
            console.error('❌ Erreur suppression profil:', profileError);
            throw profileError;
        }

        return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });

    } catch (error: any) {
        console.error('❌ Erreur DELETE /api/admin/system-users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
