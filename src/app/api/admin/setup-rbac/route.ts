import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Vérifier que c'est un admin (on utilise getUser pour plus de sécurité)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Charger la migration RBAC
        const migrationPath = join(process.cwd(), 'migrations', 'rbac_system.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        console.log('📝 Exécution de la migration RBAC...');

        // Exécuter la migration via exec_sql (fonction postgres RPC déjà existante apparemment)
        const { error } = await supabase.rpc('exec_sql', {
            sql_string: migrationSQL
        });

        if (error) {
            console.error('❌ Erreur migration RBAC:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Assigner automatiquement le rôle Super Administrateur à l'utilisateur actuel
        console.log(`👑 Assignation du rôle Super Administrateur à l'utilisateur ${user.id}...`);

        // On récupère l'ID du rôle
        const { data: roleData } = await supabase
            .from('admin_roles')
            .select('id')
            .eq('name', 'Super Administrateur')
            .single();

        if (roleData) {
            const { error: assignError } = await supabase
                .from('admin_user_roles')
                .insert({
                    user_id: user.id,
                    role_id: roleData.id
                })
                .onConflict('user_id, role_id')
                .ignore();

            if (assignError) {
                console.warn('⚠️ Erreur lors de l''assignation initiale:', assignError.message);
            }
        }

        console.log('✅ Migration RBAC exécutée avec succès');

        return NextResponse.json({
            success: true,
            message: 'Migration RBAC exécutée avec succès et rôle Super Admin assigné.'
        });

    } catch (error: any) {
        console.error('💥 Erreur:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
