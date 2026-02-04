import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/me/permissions
 * Récupère les permissions de l'utilisateur actuellement connecté
 * 
 * ⚠️ LOGIQUE MODIFIÉE:
 * - admin_role_permissions = Template uniquement (pour pré-remplir l'UI)
 * - admin_user_permissions = SOURCE OFFICIELLE (vérité absolue)
 * - On lit UNIQUEMENT admin_user_permissions pour vérifier les accès
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[PERMISSIONS API] Starting...');

        // 1. Récupérer l'utilisateur (via client standard pour vérifier la session cookie)
        const supabase = await createClient();
        const adminClient = createAdminClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[PERMISSIONS API] ❌ No user authenticated');
            return NextResponse.json(
                { success: false, error: 'Non authentifié' },
                { status: 401 }
            );
        }

        console.log('[PERMISSIONS API] User ID:', user.id);

        // 2. ✅ NOUVELLE LOGIQUE: Lire UNIQUEMENT admin_user_permissions
        // On ignore complètement admin_role_permissions pour les vérifications d'accès
        const { data: userPermissions, error } = await adminClient
            .from('admin_user_permissions')
            .select('permission:admin_permissions(slug)')
            .eq('user_id', user.id);

        if (error) {
            console.error('[PERMISSIONS API] ❌ Error fetching permissions:', error);
            throw error;
        }

        console.log('[PERMISSIONS API] Raw user permissions:', userPermissions);

        // 3. Extraire les slugs de permissions
        const permissions = userPermissions
            ?.map((up: any) => up.permission?.slug)
            .filter(Boolean) || [];

        console.log('[PERMISSIONS API] ✅ Final permissions:', permissions);

        return NextResponse.json({
            success: true,
            permissions
        });

    } catch (error: any) {
        console.error('❌ Erreur GET /api/admin/me/permissions:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
