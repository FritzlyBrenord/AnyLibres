
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { order_id, details } = await request.json();

        // 1. Check authentication and admin role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        // 2. Get the closed dispute (cancelled or resolved)
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select('*')
            .eq('order_id', order_id)
            .in('status', ['cancelled', 'resolved'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (disputeError || !dispute) {
            return NextResponse.json({ success: false, error: 'Litige clos introuvable pour cette commande' }, { status: 404 });
        }

        // 3. Reopen Dispute
        const updatePayload: any = {
            status: 'open',
            resolution_type: null,
            resolution_note: `Réouvert par l'administrateur ${user.id} le ${new Date().toISOString()}`,
            resolved_at: null,
            updated_at: new Date().toISOString()
        };

        if (details) {
            updatePayload.details = details;
        }

        const { error: updateDisputeError } = await supabase
            .from('disputes')
            .update(updatePayload)
            .eq('id', dispute.id);

        if (updateDisputeError) throw updateDisputeError;

        // 4. Update Order Status back to 'disputed'
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'disputed',
                updated_at: new Date().toISOString()
            })
            .eq('id', order_id);

        if (orderUpdateError) throw orderUpdateError;

        // 5. Update Chat Metadata (Restore admin involvement)
        const { data: conversations } = await supabase
            .from('conversations')
            .select('*')
            .contains('metadata', { order_id: order_id });

        if (conversations && conversations.length > 0) {
            const conversation = conversations[0];
            const newMetadata = {
                ...conversation.metadata,
                type: 'dispute',
                dispute_status: 'open',
                admin_involved: true
            };

            await supabase
                .from('conversations')
                .update({ metadata: newMetadata })
                .eq('id', conversation.id);

            // Send System message to chat
            await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                text: `⚖️ **LITIGE RÉOUVERT**\n\nCe litige a été réouvert par un administrateur pour réexamen. Les fonds sont à nouveau bloqués.`,
                message_type: 'system',
                metadata: {
                    is_alert: true,
                    dispute_id: dispute.id
                }
            });
        }

        return NextResponse.json({ success: true, dispute_id: dispute.id });

    } catch (error: any) {
        console.error('Reopen Dispute Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur lors de la réouverture du litige' }, { status: 500 });
    }
}
