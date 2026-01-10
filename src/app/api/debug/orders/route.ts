import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all orders with full details
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        delivery_deadline,
        metadata,
        order_items(
          selected_extras
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate what the delivery deadline SHOULD be based on metadata
    const debugOrders = orders?.map(order => {
      const metadata = order.metadata as any;
      const totalDeliveryDays = metadata?.total_delivery_days;
      const createdAt = new Date(order.created_at);
      const actualDeadline = new Date(order.delivery_deadline);

      let calculatedDeadline = null;
      if (totalDeliveryDays) {
        calculatedDeadline = new Date(createdAt);
        calculatedDeadline.setDate(calculatedDeadline.getDate() + totalDeliveryDays);
      }

      // Check selected extras
      const orderItems = order.order_items || [];
      const selectedExtras = orderItems.length > 0 ? orderItems[0].selected_extras : [];

      return {
        id: order.id.substring(0, 8),
        created_at: createdAt.toISOString(),
        delivery_deadline_stored: actualDeadline.toISOString(),
        calculated_deadline: calculatedDeadline?.toISOString() || null,
        match: calculatedDeadline ?
          (actualDeadline.getTime() === calculatedDeadline.getTime() ? '✅' : '❌') :
          '?',
        total_delivery_days: totalDeliveryDays,
        selected_extras: selectedExtras,
        delivery_days_from_extras: Array.isArray(selectedExtras)
          ? selectedExtras.reduce((sum: number, extra: any) => sum + (extra.delivery_time_days || 0), 0)
          : 0
      };
    });

    return NextResponse.json({
      success: true,
      orders: debugOrders
    });

  } catch (error: unknown) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
