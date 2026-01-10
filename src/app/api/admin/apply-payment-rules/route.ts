// ============================================================================
// API: Apply Payment Rules - Appliquer les règles aux nouveaux paiements
// Cette fonction doit être appelée quand un earnings arrive
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ReleaseRule {
  id: string;
  name: string;
  delay_hours: number;
  applies_to: string;
  condition?: {
    min_amount?: number;
    max_amount?: number;
    country?: string;
    countries?: string[]; // Support pour plusieurs pays
    provider_age_days?: number;
    provider_rating?: number;
  };
  is_active: boolean;
  priority: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { earning_id, provider_id, amount_cents } = body;

    if (!earning_id || !provider_id || !amount_cents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Récupérer les infos du provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select(`
        id,
        created_at,
        rating,
        country,
        profiles!inner (
          created_at
        )
      `)
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Calculer l'âge du provider en jours
    const profileCreatedAt = (provider as any).profiles?.created_at || provider.created_at;
    const providerCreatedAt = new Date(profileCreatedAt);
    const providerAgeDays = Math.floor(
      (Date.now() - providerCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 2. Récupérer toutes les règles actives triées par priorité
    const { data: rules, error: rulesError } = await supabase
      .from('payment_release_rules')
      .select('*')
      .eq('is_active', true) // ⚠️ IMPORTANT: Seulement les règles ACTIVES
      .order('priority', { ascending: false }); // Du plus prioritaire au moins prioritaire

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      // Utiliser règle par défaut: 14 jours
      return applyDefaultRule(supabase, earning_id, provider_id, amount_cents);
    }

    // Si aucune règle active n'existe
    if (!rules || rules.length === 0) {
      console.log('⚠️  No active rules found, using default rule');
      return applyDefaultRule(supabase, earning_id, provider_id, amount_cents);
    }

    // 3. Trouver la première règle qui s'applique (par ordre de priorité)
    let selectedRule: ReleaseRule | null = null;

    console.log(`🔍 Checking ${rules.length} active rules for provider ${provider_id}`);

    for (const rule of rules as ReleaseRule[]) {
      console.log(`  → Testing rule: ${rule.name} (priority: ${rule.priority})`);

      const applies = checkIfRuleApplies(rule, {
        amount_cents,
        provider_age_days: providerAgeDays,
        provider_rating: provider.rating || 0,
        country: provider.country,
      });

      if (applies) {
        selectedRule = rule;
        console.log(`  ✅ Rule "${rule.name}" applies! Delay: ${rule.delay_hours}h`);
        break; // Prendre la première règle (priorité la plus élevée)
      } else {
        console.log(`  ❌ Rule "${rule.name}" does not apply`);
      }
    }

    // Si aucune règle ne s'applique, utiliser règle par défaut
    if (!selectedRule) {
      return applyDefaultRule(supabase, earning_id, provider_id, amount_cents);
    }

    // 4. Si delay = 0, libérer IMMÉDIATEMENT
    if (selectedRule.delay_hours === 0) {
      console.log('🚀 Delay is 0, releasing funds immediately...');

      // Récupérer l'order_id depuis l'earning
      const { data: earning, error: earningError } = await supabase
        .from('provider_earnings')
        .select('order_id')
        .eq('id', earning_id)
        .single();

      if (earningError || !earning) {
        console.error('❌ Cannot find earning:', earningError);
        return NextResponse.json(
          { success: false, error: 'Earning not found' },
          { status: 404 }
        );
      }

      // Appeler la fonction PostgreSQL pour libérer les fonds
      const { data: released, error: releaseError } = await supabase
        .rpc('release_provider_earning', { p_order_id: earning.order_id });

      if (releaseError) {
        console.error('❌ Failed to release funds:', releaseError);
        return NextResponse.json(
          { success: false, error: 'Failed to release funds immediately' },
          { status: 500 }
        );
      }

      if (!released) {
        console.warn('⚠️  Release function returned false (already released?)');
        return NextResponse.json(
          { success: false, error: 'Funds already released or insufficient balance' },
          { status: 400 }
        );
      }

      console.log('✅ Funds released immediately!');

      return NextResponse.json({
        success: true,
        message: 'Fonds libérés immédiatement !',
        data: {
          rule_applied: selectedRule.name,
          delay_hours: 0,
          released: true,
          released_at: new Date().toISOString(),
        },
      });
    }

    // 5. Sinon, programmer le déblocage pour plus tard
    const releaseAt = new Date();
    releaseAt.setHours(releaseAt.getHours() + selectedRule.delay_hours);

    const { error: scheduleError } = await supabase
      .from('scheduled_releases')
      .insert({
        earning_id,
        provider_id,
        amount_cents,
        rule_id: selectedRule.id,
        rule_name: selectedRule.name,
        delay_hours: selectedRule.delay_hours,
        release_at: releaseAt.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (scheduleError) {
      console.error('Error scheduling release:', scheduleError);
      return NextResponse.json(
        { success: false, error: 'Failed to schedule release' },
        { status: 500 }
      );
    }

    console.log(`📅 Release scheduled for ${releaseAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Paiement programmé pour déblocage dans ${selectedRule.delay_hours}h`,
      data: {
        rule_applied: selectedRule.name,
        delay_hours: selectedRule.delay_hours,
        release_at: releaseAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in apply payment rules API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fonction helper pour vérifier si une règle s'applique
function checkIfRuleApplies(
  rule: ReleaseRule,
  context: {
    amount_cents: number;
    provider_age_days: number;
    provider_rating: number;
    country?: string;
  }
): boolean {
  // Règle "all" s'applique toujours
  if (rule.applies_to === 'all' && !rule.condition) {
    return true;
  }

  // Nouveaux providers
  if (rule.applies_to === 'new_providers' && rule.condition?.provider_age_days) {
    return context.provider_age_days <= rule.condition.provider_age_days;
  }

  // VIP (basé sur rating)
  if (rule.applies_to === 'vip' && rule.condition?.provider_rating) {
    return context.provider_rating >= rule.condition.provider_rating;
  }

  // Seuil de montant
  if (rule.applies_to === 'amount_threshold' && rule.condition) {
    if (rule.condition.min_amount && context.amount_cents < rule.condition.min_amount) {
      return false;
    }
    if (rule.condition.max_amount && context.amount_cents > rule.condition.max_amount) {
      return false;
    }
    return true;
  }

  // Pays spécifique (support pour un ou plusieurs pays)
  if (rule.applies_to === 'country') {
    // Support pour plusieurs pays (nouvelles règles)
    if (rule.condition?.countries && Array.isArray(rule.condition.countries)) {
      return rule.condition.countries.includes(context.country || '');
    }
    // Support pour un seul pays (anciennes règles)
    if (rule.condition?.country) {
      return context.country === rule.condition.country;
    }
  }

  return false;
}

// Fonction pour appliquer la règle par défaut (14 jours)
async function applyDefaultRule(
  supabase: any,
  earning_id: string,
  provider_id: string,
  amount_cents: number
) {
  const defaultDelayHours = 336; // 14 jours
  const releaseAt = new Date();
  releaseAt.setHours(releaseAt.getHours() + defaultDelayHours);

  await supabase.from('scheduled_releases').insert({
    earning_id,
    provider_id,
    amount_cents,
    rule_name: 'Défaut (14 jours)',
    delay_hours: defaultDelayHours,
    release_at: releaseAt.toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: 'Règle par défaut appliquée (14 jours)',
    data: {
      rule_applied: 'Défaut',
      delay_hours: defaultDelayHours,
      release_at: releaseAt.toISOString(),
    },
  });
}
