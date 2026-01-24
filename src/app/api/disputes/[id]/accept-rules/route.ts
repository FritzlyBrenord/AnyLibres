import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;
        const { role } = await request.json();

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // 2. Resolve identity and check participation
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, user_id')
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            .single();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Profil introuvable' },
                { status: 404 }
            );
        }

        const { data: dispute } = await supabase
            .from('disputes')
            .select('*, order:orders(client_id, provider_id)')
            .eq('id', disputeId)
            .single();

        if (!dispute) {
            return NextResponse.json(
                { success: false, error: 'Litige introuvable' },
                { status: 404 }
            );
        }

        let authorized = false;
        if (role === 'client' && dispute.order.client_id === profile.user_id) {
            authorized = true;
        } else if (role === 'provider') {
            const { data: providerData } = await supabase
                .from('providers')
                .select('id')
                .eq('profile_id', profile.id)
                .single();
            if (providerData && dispute.order.provider_id === providerData.id) {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json(
                { success: false, error: 'Action non autorisée' },
                { status: 403 }
            );
        }

        // 3. Update dispute
        const field = role === 'client' ? 'client_accepted_rules' : 'provider_accepted_rules';

        const { error: updateError } = await supabase
            .from('disputes')
            .update({ [field]: true })
            .eq('id', disputeId);

        if (updateError) {
            return NextResponse.json(
                { success: false, error: 'Erreur de mise à jour' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Accept rules error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
