// ============================================================================
// API: Admin Provider Transaction History - Historique unifié (Gains + Retraits)
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Await params for Next.js 15/16
) {
    try {
        const { id: providerId } = await params;
        console.log(`[API HISTORY] Fetching history for provider_id: ${providerId}`);

        const supabase = await createClient();

        if (!providerId) {
            return NextResponse.json(
                { success: false, error: 'ID prestataire requis' },
                { status: 400 }
            );
        }

        // 1. Vérifier les permissions admin
        const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !adminUser) {
            console.error('[API HISTORY] Auth error:', authError);
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        // 2. Récupérer le solde actuel
        const { data: balanceData, error: balanceError } = await supabase
            .from('provider_balance')
            .select('*')
            .eq('provider_id', providerId)
            .single();

        if (balanceError) {
            console.error('[API HISTORY] Balance error:', balanceError);
        }

        // 3. Récupérer les revenus (Earnings)
        const { data: earnings, error: earningsError } = await supabase
            .from('provider_earnings')
            .select(`
        id,
        amount_cents,
        net_amount_cents,
        platform_fee_cents,
        status,
        created_at,
        order_id
      `)
            .eq('user_id', providerId)
            .order('created_at', { ascending: false });

        if (earningsError) {
            console.error('[API HISTORY] Earnings error:', earningsError);
        }

        // 4. Récupérer les retraits (Withdrawals)
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('provider_withdrawals')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (withdrawalsError) {
            console.error('[API HISTORY] Withdrawals error:', withdrawalsError);
        }

        // 5. Unifier et formater les transactions
        const transactions = [
            ...(earnings || []).map(e => ({
                id: e.id,
                date: e.created_at,
                type: 'earning',
                amount: (e.net_amount_cents || 0) / 100,
                status: e.status,
                description: e.order_id ? `Gain commande #${e.order_id.substring(0, 8)}` : 'Gain (ID inconnu)',
            })),
            ...(withdrawals || []).map(w => ({
                id: w.id,
                date: w.created_at,
                type: 'withdrawal',
                amount: -((w.amount_cents || 0) / 100),
                status: w.status,
                description: `Retrait ${w.payment_method_type?.toUpperCase() || 'Méthode inconnue'}`,
            }))
        ];

        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log(`[API HISTORY] Success: Found ${transactions.length} transactions`);

        return NextResponse.json({
            success: true,
            data: {
                balance: {
                    available: (balanceData?.available_cents || 0) / 100,
                    pending: (balanceData?.pending_cents || 0) / 100,
                    withdrawn: (balanceData?.withdrawn_cents || 0) / 100,
                    total_earned: (balanceData?.total_earned_cents || 0) / 100,
                    currency: balanceData?.currency || 'EUR'
                },
                transactions
            }
        });

    } catch (error) {
        console.error('[API HISTORY] Global error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur interne' },
            { status: 500 }
        );
    }
}
