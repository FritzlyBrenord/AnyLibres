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

        // Get all orders to calculate monthly revenue
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_cents, fees_cents, created_at, status')
            .eq('provider_id', provider.id)
            .in('status', ['paid', 'completed', 'delivered', 'confirmed']) // Count revenue from relevant statuses
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Aggregating by Month (YYYY-MM)
        const monthlyRevenue: Record<string, number> = {};

        orders.forEach(order => {
            const date = new Date(order.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const netAmount = order.total_cents - (order.fees_cents || 0);

            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + netAmount;
        });

        // Convert object to array for Recharts
        const chartData = Object.entries(monthlyRevenue).map(([date, amount]) => ({
            date,
            amount_cents: amount,
            amount_formatted: (amount / 100).toFixed(2)
        }));

        // Calculate totals
        const totalEarningsCents = orders.reduce((acc, curr) => acc + (curr.total_cents - (curr.fees_cents || 0)), 0);
        const pendingClearanceCents = 0; // Logic for pending clearance would imply checking specific 'pending_funds' status or date rules
        // For now, assume simple calculation or placeholder

        return NextResponse.json({
            success: true,
            data: {
                chart_data: chartData,
                summary: {
                    total_earnings_cents: totalEarningsCents,
                    pending_clearance_cents: pendingClearanceCents,
                    available_for_withdrawal_cents: totalEarningsCents // Simplify for now
                }
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
