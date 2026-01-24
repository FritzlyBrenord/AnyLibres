import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await props.params;
        const supabase = await createClient();
        const { approved } = await request.json();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        // 2. Verify Order ownership (must be the client)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('client_id, delivery_deadline, extension_requested_days, extension_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
        }

        if (order.client_id !== user.id) {
            return NextResponse.json({ success: false, error: 'Seul le client peut répondre à cette demande' }, { status: 403 });
        }

        if (order.extension_status !== 'pending') {
            return NextResponse.json({ success: false, error: 'Aucune demande en attente pour cette commande' }, { status: 400 });
        }

        // 3. Prepare Update Data
        const updateData: any = {
            extension_status: approved ? 'approved' : 'rejected',
            updated_at: new Date().toISOString()
        };

        if (approved && order.delivery_deadline && order.extension_requested_days) {
            // Additionner le délai
            const currentDeadline = new Date(order.delivery_deadline);
            currentDeadline.setDate(currentDeadline.getDate() + order.extension_requested_days);
            updateData.delivery_deadline = currentDeadline.toISOString();
        }

        // 4. Update Order
        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, new_deadline: updateData.delivery_deadline });

    } catch (error: any) {
        console.error('Error responding to extension:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
