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

        // Get Services with Views and Orders counts
        const { data: services, error } = await supabase
            .from('services')
            .select('id, title, views_count, orders_count, base_price_cents, rating, reviews_count')
            .eq('provider_id', provider.id)
            .order('views_count', { ascending: false });

        if (error) throw error;

        // Calculate derived metrics
        const servicesWithMetrics = services.map(service => ({
            ...service,
            conversion_rate: service.views_count > 0
                ? ((service.orders_count / service.views_count) * 100).toFixed(2)
                : 0,
            revenue_estimated_cents: service.orders_count * service.base_price_cents // Rough estimate
        }));

        return NextResponse.json({
            success: true,
            data: servicesWithMetrics
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
