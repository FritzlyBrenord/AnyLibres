import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();

        const { data: service, error: updateError } = await supabase
            .from('services')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating service (admin):', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ service });
    } catch (error) {
        console.error('Error in ADMIN PATCH /api/services/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { error: deleteError } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting service (admin):', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in ADMIN DELETE /api/services/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
