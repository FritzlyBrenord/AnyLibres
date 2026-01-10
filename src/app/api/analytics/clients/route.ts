import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: provider } = await supabase
            .from('providers')
            .select('id')
            .eq('profile_id', user.id)
            .single();

        if (!provider) {
            return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
        }

        // Get Orders with Client IDs
        const { data: orders, error } = await supabase
            .from('orders')
            .select('client_id, total_cents, fees_cents, created_at')
            .eq('provider_id', provider.id);

        if (error) throw error;

        // Aggregate by Client
        const clientStats: Record<string, { count: number, total_spend_cents: number }> = {};

        orders.forEach(order => {
            if (!clientStats[order.client_id]) {
                clientStats[order.client_id] = { count: 0, total_spend_cents: 0 };
            }
            clientStats[order.client_id].count++;
            // NOTE: Provider revenue from client is total - fees
            clientStats[order.client_id].total_spend_cents += (order.total_cents - (order.fees_cents || 0));
        });

        const uniqueClients = Object.keys(clientStats).length;
        const repeatClients = Object.values(clientStats).filter(s => s.count > 1).length;

        // Convert to array
        const topClients = Object.entries(clientStats)
            .map(([clientId, stats]) => ({
                client_id: clientId,
                orders_count: stats.count,
                total_spend_cents: stats.total_spend_cents
            }))
            .sort((a, b) => b.total_spend_cents - a.total_spend_cents)
            .slice(0, 10); // Top 10

        // Fetch client names/details for these IDs (optional, requires additional DB call)
        // For now, return basic analytics

        return NextResponse.json({
            success: true,
            data: {
                total_unique_clients: uniqueClients,
                repeat_clients_count: repeatClients,
                repeat_rate: uniqueClients > 0 ? (repeatClients / uniqueClients * 100).toFixed(1) : 0,
                top_clients: topClients
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
