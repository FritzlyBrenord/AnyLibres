import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();
    const orderId = params.orderId;

    // Récupérer les informations du provider_earnings pour cette commande
    const { data: earnings, error } = await supabase
      .from('provider_earnings')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      // Pas de provider_earnings trouvé, ce qui est normal (commande pas encore complétée par le client)
      return NextResponse.json({
        success: true,
        earnings: null,
      });
    }

    return NextResponse.json({
      success: true,
      earnings,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de provider_earnings:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
