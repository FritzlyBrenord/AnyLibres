// API Admin: Actions sur les commandes
// Route: POST /api/admin/orders/action
// Permet à l'admin d'exécuter TOUTES les actions (client + prestataire + admin spéciales)

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/payment';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { order_id, action, message: deliveryMessage, reason, details } = body;

        console.log(`[ADMIN ORDER ACTION] 🟢 Action: ${action} pour commande: ${order_id}`);

        if (!order_id || !action) {
            console.error('[ADMIN ORDER ACTION] ❌ Paramètres manquants');
            return NextResponse.json(
                { success: false, error: 'order_id et action requis' },
                { status: 400 }
            );
        }

        // Vérifier l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('[ADMIN ORDER ACTION] ❌ Authentification échouée:', authError);
            return NextResponse.json(
                { success: false, error: 'Non authentifié' },
                { status: 401 }
            );
        }

        console.log(`[ADMIN ORDER ACTION] ✅ User: ${user.id}`);

        // TODO: Vérifier que l'utilisateur est admin
        // Pour l'instant, on fait confiance à la protection de la page admin

        // Récupérer la commande
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .single();

        if (orderError || !order) {
            console.error('[ADMIN ORDER ACTION] ❌ Commande non trouvée:', orderError);
            return NextResponse.json(
                { success: false, error: 'Commande non trouvée' },
                { status: 404 }
            );
        }

        console.log(`[ADMIN ORDER ACTION] ✅ Commande trouvée - Statut: ${order.status}`);

        let updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        let responseMessage = '';

        switch (action) {
            case 'start':
                console.log(`[ADMIN ORDER ACTION] 🔵 Action START - Vérification statut: ${order.status}`);
                // Démarrer la commande (prestataire commence le travail)
                if (order.status !== 'paid') {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible de démarrer. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible de démarrer. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }
                updateData.status = 'in_progress';
                // Note: started_at n'existe pas dans le schéma
                responseMessage = 'Commande démarrée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action START - OK`);
                break;

            case 'deliver':
                console.log(`[ADMIN ORDER ACTION] 🟣 Action DELIVER - Vérification statut: ${order.status}`);
                // Marquer comme livrée (prestataire livre)
                if (order.status !== 'in_progress') {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible de livrer. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible de livrer. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                // Créer une livraison admin
                const { error: deliveryError } = await supabase
                    .from('order_deliveries')
                    .insert({
                        order_id: order_id,
                        delivery_number: 1,
                        message: deliveryMessage || 'Livraison effectuée par l\'administrateur'
                    });

                if (deliveryError) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Erreur création livraison:', deliveryError);
                }

                updateData.status = 'delivered';
                // Note: delivered_at n'existe pas dans le schéma
                responseMessage = 'Commande marquée comme livrée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action DELIVER - OK`);
                break;

            case 'accept':
                console.log(`[ADMIN ORDER ACTION] 🟢 Action ACCEPT - Vérification statut: ${order.status}`);
                // Accepter la livraison (client accepte)
                if (order.status !== 'delivered') {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible d'accepter. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible d'accepter. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                // Créer l'earning pour le prestataire
                try {
                    console.log(`[ADMIN ORDER ACTION] 📊 Création earning pour order: ${order_id}`);
                    const { data: earningId, error: earningError } = await supabase
                        .rpc('create_provider_earning', { p_order_id: order_id });

                    if (earningError) {
                        console.error('[ADMIN ORDER ACTION] ⚠️ Erreur création earning:', earningError);
                        // Continuer quand même
                    } else {
                        console.log('[ADMIN ORDER ACTION] ✅ Earning créé:', earningId);
                    }
                } catch (err) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Exception earning:', err);
                }

                // Libérer l'escrow si applicable
                try {
                    const { data: payment, error: paymentError } = await supabase
                        .from('payments')
                        .select('*')
                        .eq('order_id', order_id)
                        .single();

                    if (paymentError) {
                        console.log('[ADMIN ORDER ACTION] ℹ️ Pas de paiement trouvé');
                    } else if (payment && payment.escrow_status === 'held') {
                        console.log(`[ADMIN ORDER ACTION] 💰 Libération escrow pour: ${payment.id}`);
                        try {
                            const paymentService = getPaymentService();
                            await paymentService.releaseEscrow(payment.id);
                            console.log('[ADMIN ORDER ACTION] ✅ Escrow libéré');
                        } catch (err) {
                            console.error('[ADMIN ORDER ACTION] ⚠️ Erreur libération escrow:', err);
                        }
                    } else {
                        console.log('[ADMIN ORDER ACTION] ℹ️ Escrow pas en hold');
                    }
                } catch (err) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Exception escrow:', err);
                }

                updateData.status = 'completed';
                // Note: completed_at n'existe pas dans le schéma - on utilise completed_at qui existe
                updateData.completed_at = new Date().toISOString();
                responseMessage = 'Commande acceptée et terminée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action ACCEPT - OK`);
                break;

            case 'revision':
                console.log(`[ADMIN ORDER ACTION] 🔄 Action REVISION - Vérification statut: ${order.status}`);
                // Demander une révision (client demande des modifications)
                if (order.status !== 'delivered') {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible de demander une révision. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible de demander une révision. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                // Créer une demande de révision
                const { error: revisionError } = await supabase
                    .from('order_revisions')
                    .insert({
                        order_id: order_id,
                        requested_by: user.id,
                        reason: reason || 'Révision demandée par l\'administrateur',
                        details: details || null,
                        status: 'pending'
                    });

                if (revisionError) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Erreur création révision:', revisionError);
                }

                updateData.status = 'in_progress';
                updateData.revision_count = (order.revision_count || 0) + 1;
                responseMessage = 'Révision demandée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action REVISION - OK`);
                break;

            case 'cancel':
                console.log(`[ADMIN ORDER ACTION] 🔴 Action CANCEL - Vérification statut: ${order.status}`);
                // Annuler la commande
                if (['completed', 'cancelled'].includes(order.status)) {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible d'annuler. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible d'annuler. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                // TODO: Gérer le remboursement si nécessaire

                updateData.status = 'cancelled';
                // Note: cancelled_at et cancellation_reason n'existent pas dans le schéma
                responseMessage = 'Commande annulée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action CANCEL - OK`);
                break;

            case 'reactivate':
                console.log(`[ADMIN ORDER ACTION] 🔵 Action REACTIVATE - Vérification statut: ${order.status}`);
                // Réactiver une commande annulée
                if (order.status !== 'cancelled') {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible de réactiver. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible de réactiver. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                updateData.status = 'paid';
                // Note: cancelled_at et cancellation_reason n'existent pas dans le schéma
                responseMessage = 'Commande réactivée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action REACTIVATE - OK`);
                break;

            case 'force_complete':
                console.log(`[ADMIN ORDER ACTION] ⚡ Action FORCE_COMPLETE - Vérification statut: ${order.status}`);
                // Forcer la complétion d'une commande
                if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
                    console.error(`[ADMIN ORDER ACTION] ❌ Impossible de forcer. Statut actuel: ${order.status}`);
                    return NextResponse.json(
                        { success: false, error: `Impossible de forcer. Statut actuel: ${order.status}` },
                        { status: 400 }
                    );
                }

                // Créer l'earning pour le prestataire
                try {
                    console.log(`[ADMIN ORDER ACTION] 📊 Création earning (force) pour order: ${order_id}`);
                    const { data: earningId, error: forceEarningError } = await supabase
                        .rpc('create_provider_earning', { p_order_id: order_id });

                    if (forceEarningError) {
                        console.error('[ADMIN ORDER ACTION] ⚠️ Erreur création earning (force):', forceEarningError);
                    } else {
                        console.log('[ADMIN ORDER ACTION] ✅ Earning créé (force):', earningId);
                    }
                } catch (err) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Exception earning (force):', err);
                }

                // Libérer l'escrow si applicable
                try {
                    const { data: forcePayment, error: forcePaymentError } = await supabase
                        .from('payments')
                        .select('*')
                        .eq('order_id', order_id)
                        .single();

                    if (forcePaymentError) {
                        console.log('[ADMIN ORDER ACTION] ℹ️ Pas de paiement trouvé (force)');
                    } else if (forcePayment && forcePayment.escrow_status === 'held') {
                        console.log(`[ADMIN ORDER ACTION] 💰 Libération escrow (force) pour: ${forcePayment.id}`);
                        try {
                            const paymentService = getPaymentService();
                            await paymentService.releaseEscrow(forcePayment.id);
                            console.log('[ADMIN ORDER ACTION] ✅ Escrow libéré (force)');
                        } catch (err) {
                            console.error('[ADMIN ORDER ACTION] ⚠️ Erreur libération escrow (force):', err);
                        }
                    } else {
                        console.log('[ADMIN ORDER ACTION] ℹ️ Escrow pas en hold (force)');
                    }
                } catch (err) {
                    console.error('[ADMIN ORDER ACTION] ⚠️ Exception escrow (force):', err);
                }

                updateData.status = 'completed';
                updateData.completed_at = new Date().toISOString();
                responseMessage = 'Commande forcée comme terminée';
                console.log(`[ADMIN ORDER ACTION] ✅ Action FORCE_COMPLETE - OK`);
                break;

            default:
                console.error(`[ADMIN ORDER ACTION] ❌ Action inconnue: ${action}`);
                return NextResponse.json(
                    { success: false, error: `Action inconnue: ${action}` },
                    { status: 400 }
                );
        }

        // Mettre à jour la commande
        console.log(`[ADMIN ORDER ACTION] 📝 Mise à jour commande avec:`, updateData);
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order_id)
            .select()
            .single();

        if (updateError) {
            console.error('[ADMIN ORDER ACTION] ❌ Erreur mise à jour commande:', updateError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la mise à jour: ' + updateError.message },
                { status: 500 }
            );
        }

        console.log(`[ADMIN ORDER ACTION] ✅ SUCCÈS: ${responseMessage}`);

        return NextResponse.json({
            success: true,
            order: updatedOrder,
            message: responseMessage
        });

    } catch (error) {
        console.error('[ADMIN ORDER ACTION] ❌❌ ERREUR GLOBALE:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
