// ============================================================================
// API: Admin Payment Rules - Gestion des règles de déblocage automatique
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier auth admin
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

    // Récupérer toutes les règles actives
    const { data: rules, error } = await supabase
      .from('payment_release_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching payment rules:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rules', data: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rules || [],
    });
  } catch (error) {
    console.error('Error in payment rules API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier auth admin
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

    const body = await request.json();
    const { rules } = body;

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { success: false, error: 'Rules array is required' },
        { status: 400 }
      );
    }

    // Supprimer toutes les anciennes règles
    await supabase.from('payment_release_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insérer les nouvelles règles
    const rulesToInsert = rules.map((rule: any) => ({
      name: rule.name,
      delay_hours: rule.delay_hours,
      applies_to: rule.applies_to,
      condition: rule.condition || null,
      is_active: rule.is_active !== false,
      priority: rule.priority || 0,
      created_by: user.id,
    }));

    const { data, error } = await supabase
      .from('payment_release_rules')
      .insert(rulesToInsert)
      .select();

    if (error) {
      console.error('Error saving payment rules:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save rules' },
        { status: 500 }
      );
    }

    // Logger l'action
    await supabase.from('admin_actions_log').insert({
      admin_id: user.id,
      action_type: 'update_payment_rules',
      target_type: 'payment_rules',
      target_id: user.id,
      metadata: {
        rules_count: rules.length,
        rules: rules.map((r: any) => ({ name: r.name, delay_hours: r.delay_hours })),
      },
      performed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Règles sauvegardées avec succès',
      data,
    });
  } catch (error) {
    console.error('Error in payment rules save API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
