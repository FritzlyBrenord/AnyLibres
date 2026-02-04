import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/permissions
 * Liste toutes les permissions disponibles dans le système, groupées par module
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createAdminClient();

        const { data: permissions, error } = await supabase
            .from('admin_permissions')
            .select('*')
            .order('module', { ascending: true })
            .order('slug', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, permissions });

    } catch (error: any) {
        console.error('❌ Erreur GET /api/admin/permissions:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
