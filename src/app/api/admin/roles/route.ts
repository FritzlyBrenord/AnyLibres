import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/roles
 * Liste tous les rôles et leurs permissions associées
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createAdminClient();

        // Récupérer les rôles avec leurs permissions
        const { data: roles, error } = await supabase
            .from('admin_roles')
            .select(`
        *,
        permissions:admin_role_permissions(
          permission:admin_permissions(*)
        )
      `)
            .order('name');

        if (error) throw error;

        // Formater les données pour le frontend
        const formattedRoles = roles.map(role => ({
            ...role,
            permissions: role.permissions.map((p: any) => p.permission)
        }));

        return NextResponse.json({ success: true, roles: formattedRoles });

    } catch (error: any) {
        console.error('❌ Erreur GET /api/admin/roles:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/roles
 * Crée un nouveau rôle ou met à jour un rôle existant avec ses permissions
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createAdminClient();
        const { id, name, description, permission_ids } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Le nom du rôle est requis' },
                { status: 400 }
            );
        }

        let roleId = id;

        // 1. Créer ou mettre à jour le rôle
        if (id) {
            const { error: roleError } = await supabase
                .from('admin_roles')
                .update({ name, description, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (roleError) throw roleError;
        } else {
            const { data: newRole, error: roleError } = await supabase
                .from('admin_roles')
                .insert({ name, description })
                .select()
                .single();
            if (roleError) throw roleError;
            roleId = newRole.id;
        }

        // 2. Mettre à jour les permissions si fournies
        if (permission_ids && Array.isArray(permission_ids)) {
            // Supprimer les anciennes permissions
            const { error: deleteError } = await supabase
                .from('admin_role_permissions')
                .delete()
                .eq('role_id', roleId);
            if (deleteError) throw deleteError;

            // Ajouter les nouvelles permissions
            if (permission_ids.length > 0) {
                const rolePermissions = permission_ids.map(pId => ({
                    role_id: roleId,
                    permission_id: pId
                }));
                const { error: insertError } = await supabase
                    .from('admin_role_permissions')
                    .insert(rolePermissions);
                if (insertError) throw insertError;
            }
        }

        return NextResponse.json({
            success: true,
            message: id ? 'Rôle mis à jour' : 'Rôle créé',
            role_id: roleId
        });

    } catch (error: any) {
        console.error('❌ Erreur POST /api/admin/roles:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/roles
 * Supprime un rôle (les cascades SQL s'occupent des liens)
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createAdminClient();
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID requis' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('admin_roles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Rôle supprimé' });

    } catch (error: any) {
        console.error('❌ Erreur DELETE /api/admin/roles:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
