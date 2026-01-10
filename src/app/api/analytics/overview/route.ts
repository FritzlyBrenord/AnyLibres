import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Check Auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Get Provider Profile (to verify they are a provider)
        const { data: provider, error: providerError } = await supabase
            .from('providers')
            .select('id, rating, total_reviews, response_time_hours, completed_orders_count')
            .eq('profile_id', user.id)
            .single();

        if (providerError || !provider) {
            // If not a provider yet, return empty stats or specific error
            return NextResponse.json(
                { success: false, error: 'Provider profile not found' },
                { status: 404 }
            );
        }

        // 3. Aggregate Orders Data
        // We need: Total Revenue, Orders in Queue, Cancelled Orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, status, total_cents, fees_cents, created_at')
            .eq('provider_id', provider.id);

        if (ordersError) {
            throw ordersError;
        }

        const totalOrders = orders.length;
        let totalRevenueCents = 0;
        let activeOrdersCount = 0;
        let completedOrdersCount = 0;
        let cancelledOrdersCount = 0;

        // Calculate last month's revenue for growth comparison
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let currentMonthRevenueCents = 0;

        orders.forEach((order) => {
            // Calculate Revenue (Total - Fees)
            // Only for paid/completed orders? Or all except cancelled/pending payment?
            // Assuming 'paid', 'confirmed', 'completed' count towards revenue visible
            if (['paid', 'confirmed', 'completed', 'delivered'].includes(order.status)) {
                const netAmount = order.total_cents - (order.fees_cents || 0);
                totalRevenueCents += netAmount;
                completedOrdersCount++;

                if (new Date(order.created_at) >= firstDayCurrentMonth) {
                    currentMonthRevenueCents += netAmount;
                }
            }

            if (['pending', 'in_progress', 'delivered'].includes(order.status)) { // Delivered but not yet completed/accepted
                activeOrdersCount++;
            }

            if (order.status === 'cancelled') {
                cancelledOrdersCount++;
            }
        });

        const avgSellingPriceCents = completedOrdersCount > 0
            ? Math.round(totalRevenueCents / completedOrdersCount)
            : 0;

        // Calculate 7-day revenue history
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenue: Record<string, number> = {};
        // Initialize last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            // Key by date string to match order dates, mapped to day name for chart
            const dateKey = d.toISOString().split('T')[0];
            dailyRevenue[dateKey] = 0;
        }

        const chartData = [];

        // Fill with real data
        orders.forEach((order) => {
            if (['paid', 'confirmed', 'completed', 'delivered'].includes(order.status)) {
                const orderDate = new Date(order.created_at);
                if (orderDate >= sevenDaysAgo) {
                    const dateKey = orderDate.toISOString().split('T')[0];
                    if (dailyRevenue.hasOwnProperty(dateKey)) { // Only count if within the initialized 7 days range
                        const netAmount = order.total_cents - (order.fees_cents || 0);
                        dailyRevenue[dateKey] += netAmount;
                    }
                }
            }
        });

        // Format for Recharts
        // We iterate through the initialized 7 days to ensure order
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateKey = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });

            chartData.push({
                name: dayName.charAt(0).toUpperCase() + dayName.slice(1), // Capitalize
                value: (dailyRevenue[dateKey] || 0) / 100 // Convert to units
            });
        }

        // 4. Return Aggregated Data
        return NextResponse.json({
            success: true,
            data: {
                kpi: {
                    total_revenue: {
                        amount_cents: totalRevenueCents,
                        currency: 'EUR', // Should ideally come from user prefs or dominant currency
                        growth_percent: 0, // Placeholder for complex calc
                    },
                    orders: {
                        total: totalOrders,
                        completed: completedOrdersCount,
                        active: activeOrdersCount,
                        cancelled: cancelledOrdersCount,
                    },
                    avg_selling_price_cents: avgSellingPriceCents,
                },
                provider_stats: {
                    rating: provider.rating,
                    total_reviews: provider.total_reviews,
                    response_time_hours: provider.response_time_hours,
                },
                recent_activity: orders.slice(0, 5), // Return last 5 orders for simple list
                revenue_history: chartData
            },
        });

    } catch (error) {
        console.error('Analytics Overview API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Server Error' },
            { status: 500 }
        );
    }
}
