import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // 2. Fetch dispute basic info first
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select('*')
            .eq('id', disputeId)
            .single();

        if (disputeError || !dispute) {
            console.error('Error fetching dispute:', disputeError);
            return NextResponse.json(
                { success: false, error: 'Litige introuvable' },
                { status: 404 }
            );
        }

        // 3. Fetch Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', dispute.order_id)
            .single();

        if (orderError || !order) {
            console.error('Error fetching order for dispute:', orderError);
            return NextResponse.json(
                { success: false, error: 'Commande introuvable' },
                { status: 404 }
            );
        }

        // 4. Resolve Identity and Check authorization
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

        const authUid = profile.user_id;
        const isAdmin = profile.role === 'admin';

        // Resolve Provider ID if applicable
        const { data: providerData } = await supabase
            .from('providers')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

        const providerId = providerData?.id;

        const isParticipant =
            order.client_id === authUid ||
            (providerId && order.provider_id === providerId);

        if (!isAdmin && !isParticipant) {
            console.error('Unauthorized access attempt:', { authUid, providerId, clientId: order.client_id, orderProviderId: order.provider_id });
            return NextResponse.json(
                { success: false, error: 'Accès refusé' },
                { status: 403 }
            );
        }

        // 5. Fetch Profiles separately
        const { data: clientProfile } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, avatar_url')
            .eq('user_id', order.client_id)
            .single();

        const { data: providerProfile } = await supabase
            .from('profiles')
            .select(`
                user_id, 
                first_name, 
                last_name, 
                avatar_url, 
                providers!inner(id)
            `)
            .eq('providers.id', order.provider_id)
            .single();

        // 6. Construct complete object
        const fullDispute = {
            ...dispute,
            order: {
                ...order,
                client: clientProfile,
                provider: providerProfile
            }
        };

        return NextResponse.json({
            success: true,
            dispute: fullDispute
        });

    } catch (error: any) {
        console.error('Get dispute info error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
