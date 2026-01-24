//C:\Projet AnylibreV2\anylibre\src\app\api\admin\orders\route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // TODO: Add refined Admin Role check here if "isAdmin" flag is available in metadata or specific table
        // For now, assuming the page protection handles the access, but API should ideally verify too.

        // Fetch all orders with provider details (if FK exists) and items
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    service_id,
                    title,
                    unit_price_cents,
                    quantity,
                    subtotal_cents
                ),
                order_deliveries (
                    id,
                    delivery_number,
                    message,
                    file_url,
                    external_link,
                    delivered_at
                ),
                order_revisions (
                    id,
                    revision_number,
                    reason,
                    details,
                    status,
                    requested_at
                ),
                dispute:disputes!order_id (*)
            `)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching admin orders:', ordersError);
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
        }

        console.log(`[ADMIN ORDERS API] Found ${ordersData?.length || 0} orders`);

        if (!ordersData || ordersData.length === 0) {
            return NextResponse.json({ orders: [] });
        }

        // Collect IDs for batch fetching
        const clientIds = Array.from(new Set(ordersData.map(o => o.client_id).filter(Boolean)));
        const providerIds = Array.from(new Set(ordersData.map(o => o.provider_id).filter(Boolean)));

        console.log(`[ADMIN ORDERS API] Searching for ${clientIds.length} clients and ${providerIds.length} providers`);
        console.log('[ADMIN ORDERS API] Sample client_id:', clientIds[0]);
        console.log('[ADMIN ORDERS API] Sample provider_id:', providerIds[0]);

        // Fetch client profiles, providers, and their profiles in parallel
        const [profilesResult, providersResult] = await Promise.all([
            // Client Profiles - chercher par user_id car client_id dans orders = user_id dans profiles
            supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, email, avatar_url')
                .in('user_id', clientIds),

            // Provider Details with Profiles
            supabase
                .from('providers')
                .select(`
                    id,
                    profile_id,
                    company_name,
                    profile:profiles (
                        first_name,
                        last_name,
                        email,
                        avatar_url
                    )
                `)
                .in('id', providerIds)
        ]);

        if (profilesResult.error) console.error('[ADMIN ORDERS API] Error fetching client profiles:', profilesResult.error);
        if (providersResult.error) console.error('[ADMIN ORDERS API] Error fetching provider details:', providersResult.error);

        console.log(`[ADMIN ORDERS API] Found ${profilesResult.data?.length || 0} client profiles`);
        console.log(`[ADMIN ORDERS API] Found ${providersResult.data?.length || 0} provider profiles`);

        // Create lookup maps - utiliser user_id pour matcher avec client_id dans orders
        const clientIdToProfile = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
        const providerIdToData = new Map(providersResult.data?.map(p => [p.id, p]) || []);

        console.log(`[ADMIN ORDERS API] Client map size: ${clientIdToProfile.size}`);
        console.log(`[ADMIN ORDERS API] Provider map size: ${providerIdToData.size}`);

        // Merge data
        const orders = ordersData.map(order => ({
            ...order,
            client: clientIdToProfile.has(order.client_id) ? {
                profile: clientIdToProfile.get(order.client_id)
            } : null,
            provider: providerIdToData.get(order.provider_id) || null
        }));

        console.log(`[ADMIN ORDERS API] Returning ${orders.length} orders with enriched data`);
        console.log('[ADMIN ORDERS API] Sample order:', {
            id: orders[0]?.id,
            client_found: !!orders[0]?.client,
            provider_found: !!orders[0]?.provider
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error in admin orders API:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}


