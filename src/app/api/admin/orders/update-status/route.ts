
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { orderId, status, resolutionNote } = await request.json();

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

        // 2. Update Order Status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // 3. If refunded, update payment status too
        if (status === 'refunded') {
            await supabase
                .from('orders')
                .update({ payment_status: 'refunded' })
                .eq('id', orderId);
        }

        // 4. Add system message to the chat
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .contains('metadata', { order_id: orderId })
            .limit(1);

        if (conversations && conversations.length > 0) {
            const statusLabel =
                status === 'refunded' ? 'Remboursée' :
                    status === 'completed' ? 'Terminée' :
                        status === 'cancelled' ? 'Annulée' : status;

            await supabase.from('messages').insert({
                conversation_id: conversations[0].id,
                sender_id: user.id,
                text: `⚖️ **ACTION ADMINISTRATIVE**\n\nL'administrateur a changé le statut de la commande en : **${statusLabel}**.\n\nNote : ${resolutionNote || "Décision administrative suite au litige."}`,
                message_type: 'system'
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update Status Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
