// API Admin: Récupérer une commande spécifique
// Route: GET /api/admin/orders/[id]

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Vérifier l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer la commande avec toutes les relations
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*),
                order_deliveries (*),
                order_revisions (*),
                provider:providers!orders_provider_id_fkey (
                    id,
                    company_name,
                    profile:profiles (
                        first_name,
                        last_name
                    )
                ),
                service:services (
                    id,
                    title,
                    cover_image
                ),
                dispute:disputes!disputes_order_id_fkey (*)
            `)
            .eq('id', id)
            .single();

        if (orderError || !order) {
            console.error('Erreur récupération commande:', orderError);
            return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
        }

        // Récupérer manuellement le profil du client
        if (order.client_id) {
            const { data: clientProfile } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, email, avatar_url')
                .eq('user_id', order.client_id)
                .single();

            if (clientProfile) {
                order.client = { profile: clientProfile };
            }
        }

        // Récupérer manuellement le dispute si la commande est en litige
        if (order.status === 'disputed') {
            const { data: dispute } = await supabase
                .from('disputes')
                .select('*')
                .eq('order_id', order.id)
                .eq('status', 'open')
                .single();

            if (dispute) {
                order.dispute = dispute;
                console.log('✅ Dispute récupéré:', dispute);
            } else {
                console.log('⚠️ Aucun dispute trouvé pour order:', order.id);
            }
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Erreur API admin orders/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
