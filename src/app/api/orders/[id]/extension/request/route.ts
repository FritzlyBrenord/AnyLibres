import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await props.params;
        const supabase = await createClient();
        const { days, reason } = await request.json();

        if (!days || days < 1) {
            return NextResponse.json({ success: false, error: 'Le délai doit être d\'au moins 1 jour' }, { status: 400 });
        }

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        // 2. Verify Order ownership (must be the provider)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('provider_id, status, extension_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
        }

        // Check if order is in a state where extension can be requested
        if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
            return NextResponse.json({ success: false, error: 'Impossible de demander un délai pour une commande terminée' }, { status: 400 });
        }

        if (order.extension_status === 'pending') {
            return NextResponse.json({ success: false, error: 'Une demande est déjà en attente' }, { status: 400 });
        }

        // Resolve Provider ID for the current user
        const { data: providerInfo } = await supabase
            .from('providers')
            .select('id')
            .eq('profile_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id)
            .single();

        if (providerInfo?.id !== order.provider_id) {
            return NextResponse.json({ success: false, error: 'Seul le prestataire peut demander un délai' }, { status: 403 });
        }

        // 3. Update Order with request
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                extension_requested_days: days,
                extension_reason: reason,
                extension_status: 'pending',
                extension_requested_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error requesting extension:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
