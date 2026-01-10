// ============================================================================
// API: Admin Currencies - Gérer les devises de la plateforme
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET - Récupérer toutes les devises
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .order('is_default', { ascending: false })
      .order('code', { ascending: true });

    if (error) {
      console.error('[API CURRENCIES] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des devises' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { currencies: currencies || [] },
    });

  } catch (error) {
    console.error('[API CURRENCIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajouter une nouvelle devise
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { currency } = body;

    // Valider les données
    if (!currency.code || !currency.name || !currency.symbol) {
      return NextResponse.json(
        { success: false, error: 'Code, nom et symbole requis' },
        { status: 400 }
      );
    }

    // Si c'est la devise par défaut, désactiver les autres
    if (currency.is_default) {
      await supabase
        .from('currencies')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('currencies')
      .insert({
        ...currency,
        code: currency.code.toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API CURRENCIES] Error creating:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { currency: data },
    });

  } catch (error) {
    console.error('[API CURRENCIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Mettre à jour une devise
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, currency } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Si c'est la devise par défaut, désactiver les autres
    if (currency.is_default) {
      await supabase
        .from('currencies')
        .update({ is_default: false })
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('currencies')
      .update({
        ...currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API CURRENCIES] Error updating:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { currency: data },
    });

  } catch (error) {
    console.error('[API CURRENCIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprimer une devise
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin');
    const id = searchParams.get('id');

    if (!isAdmin || isAdmin !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Vérifier que ce n'est pas la devise par défaut
    const { data: currency } = await supabase
      .from('currencies')
      .select('is_default')
      .eq('id', id)
      .single();

    if (currency?.is_default) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer la devise par défaut' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('currencies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API CURRENCIES] Error deleting:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('[API CURRENCIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
