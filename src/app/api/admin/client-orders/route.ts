import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id est requis' },
        { status: 400 }
      );
    }

    console.log('[API CLIENT-ORDERS] Fetching orders for user_id:', userId);

    // Récupérer toutes les commandes du client, triées par date
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[API CLIENT-ORDERS] Error fetching orders:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    console.log(`[API CLIENT-ORDERS] Found ${orders?.length || 0} orders`);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders || []
      }
    });

  } catch (error: any) {
    console.error('[API CLIENT-ORDERS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
