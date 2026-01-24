
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { disputeId, details, status, resolutionNote, resolutionType } = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        // 1. Verify Admin Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        // 2. Build Update Object
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (details !== undefined) updateData.details = details;
        if (status !== undefined) updateData.status = status;
        if (resolutionNote !== undefined) updateData.resolution_note = resolutionNote;
        if (resolutionType !== undefined) updateData.resolution_type = resolutionType;
        if (status === 'resolved') {
            updateData.resolved_at = new Date().toISOString();
            updateData.admin_id = user.id;
        }

        // 3. Update Dispute
        const { error: updateError } = await supabase
            .from('disputes')
            .update(updateData)
            .eq('id', disputeId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update Dispute Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
