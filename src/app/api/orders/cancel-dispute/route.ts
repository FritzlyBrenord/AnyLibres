
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { order_id } = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        // 1. Get the dispute to verify ownership
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select('*')
            .eq('order_id', order_id)
            .eq('status', 'open')
            .single();

        if (disputeError || !dispute) {
            return NextResponse.json({ success: false, error: 'Litige introuvable' }, { status: 404 });
        }

        // Only the creator or Admin can cancel
        // Check if user is admin via profile role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';

        if (dispute.opened_by_id !== user.id && !isAdmin) {
            return NextResponse.json({ success: false, error: 'Vous ne pouvez pas annuler ce litige' }, { status: 403 });
        }

        // 2. Cancel Dispute
        const { error: updateDisputeError } = await supabase
            .from('disputes')
            .update({
                status: 'cancelled',
                resolution_type: 'withdrawn_by_user',
                resolution_note: `Annulé par l'utilisateur ${user.id} (${isAdmin ? 'Admin' : 'Client'})`,
                resolved_at: new Date().toISOString()
            })
            .eq('id', dispute.id);

        if (updateDisputeError) throw updateDisputeError;

        // 3. Revert Order Status
        // If we have delivery capability, we should check if there was a delivery to decide 'in_progress' vs 'delivered'.
        // For simplicity/safety, we revert to 'in_progress' usually, UNLESS a delivery exists and is not rejected.
        // Let's check deliveries.
        const { data: deliveries } = await supabase
            .from('order_deliveries')
            .select('*')
            .eq('order_id', order_id)
            .order('delivery_number', { ascending: false })
            .limit(1);

        let newStatus = 'in_progress';
        if (deliveries && deliveries.length > 0) {
            // If the last delivery is not rejected, maybe we should go back to 'delivered'?
            // But usually disputes happen *after* delivery.
            // If we cancel the dispute, we assume we are back to reviewing the delivery.
            newStatus = 'delivered';
        }

        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order_id);

        if (orderUpdateError) throw orderUpdateError;

        // 4. Update Chat Metadata (Remove dispute flags)
        const { data: conversations } = await supabase
            .from('conversations')
            .select('*')
            .contains('metadata', { order_id: order_id });

        if (conversations && conversations.length > 0) {
            const conversation = conversations[0];
            const newMetadata = {
                ...conversation.metadata,
                type: 'order', // Revert to normal order chat
                dispute_status: 'cancelled',
                admin_involved: false
            };
            // Remove dispute_id if cleaner, but keeping history is fine.

            await supabase
                .from('conversations')
                .update({ metadata: newMetadata })
                .eq('id', conversation.id);

            // System message
            await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                text: `ℹ️ **LITIGE ANNULÉ**\n\nLe litige a été annulé par l'utilisateur. La commande reprend son cours normal (${newStatus === 'delivered' ? 'Livrée' : 'En cours'}).`,
                message_type: 'system',
                metadata: { is_alert: false }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Cancel Dispute Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
