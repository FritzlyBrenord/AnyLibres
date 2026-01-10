import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, delivery_id, reason, details } = body;

    if (!order_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'order_id et reason sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que la commande appartient au client
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    if (order.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Vous n\'êtes pas autorisé à faire cette action' },
        { status: 403 }
      );
    }

    // Vérifier que la commande est en statut 'delivered'
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { success: false, error: 'La commande doit être livrée pour demander une révision' },
        { status: 400 }
      );
    }

    // Compter le nombre de révisions déjà faites
    const { count } = await supabase
      .from('order_revisions')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order_id);

    const revisionNumber = (count || 0) + 1;

    // Créer la révision
    const { data: revision, error: revisionError } = await supabase
      .from('order_revisions')
      .insert({
        order_id,
        delivery_id: delivery_id || null,
        revision_number: revisionNumber,
        requested_by: user.id,
        reason,
        details: details || null,
        status: 'pending',
      })
      .select()
      .single();

    if (revisionError) {
      console.error('Erreur création révision:', revisionError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de la révision' },
        { status: 500 }
      );
    }

    // Le trigger mettra automatiquement le statut de la commande à 'revision_requested'

    return NextResponse.json({
      success: true,
      message: 'Révision demandée avec succès',
      data: { revision },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}