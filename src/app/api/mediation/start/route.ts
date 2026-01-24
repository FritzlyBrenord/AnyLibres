import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { disputeId, orderId } = await request.json();

        // 1. Vérifier l'authentification et le rôle admin
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

        // 2. Vérifier que le litige existe et est ouvert
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select('*')
            .eq('id', disputeId)
            .single();

        if (disputeError || !dispute) {
            return NextResponse.json({ success: false, error: 'Litige introuvable' }, { status: 404 });
        }

        if (dispute.status !== 'open') {
            return NextResponse.json({ success: false, error: 'Le litige doit être ouvert pour démarrer une médiation' }, { status: 400 });
        }

        // 3. Mettre à jour le litige pour démarrer la session de médiation
        const { error: updateError } = await supabase
            .from('disputes')
            .update({
                session_status: 'active',
                mediation_session_started_at: new Date().toISOString(),
                admin_id: user.id,
                admin_joined_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', disputeId);

        if (updateError) {
            console.error('Erreur mise à jour dispute:', updateError);
            throw updateError;
        }

        // 4. Récupérer les informations de la commande pour notifier les parties
        const { data: order } = await supabase
            .from('orders')
            .select('client_id, provider_id')
            .eq('id', orderId)
            .single();

        // 5. Ajouter un message système dans le chat pour notifier les parties
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .contains('metadata', { order_id: orderId })
            .limit(1);

        if (conversations && conversations.length > 0) {
            await supabase.from('messages').insert({
                conversation_id: conversations[0].id,
                sender_id: user.id,
                text: `🎯 **SESSION DE MÉDIATION LANCÉE**\n\nUn administrateur a démarré une session de médiation pour résoudre ce litige.\n\n📋 **Prochaines étapes :**\n1. Les deux parties doivent accepter les règles de médiation\n2. Une discussion encadrée aura lieu pour trouver une solution\n3. L'administrateur facilitera les échanges\n\nMerci de votre coopération.`,
                message_type: 'system',
                metadata: {
                    is_alert: true,
                    mediation_started: true,
                    dispute_id: disputeId
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Session de médiation démarrée avec succès'
        });

    } catch (error: any) {
        console.error('Erreur démarrage médiation:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Erreur serveur'
        }, { status: 500 });
    }
}
