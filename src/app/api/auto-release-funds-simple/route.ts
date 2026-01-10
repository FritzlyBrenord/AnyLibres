// ============================================================================
// API: Auto Release Funds - Avec respect strict des règles payment_release_rules
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
    countries?: string[];
    provider_age_days?: number;
    provider_rating?: number;
  };
  is_active: boolean;
  priority: number;
}

interface EarningDetail {
  earning_id: string;
  provider_id: string;
  amount_cents: number;
  amount_usd: string;
  earning_created_at: string;
  provider_info: {
    age_days: number;
    rating: number;
    location: string;
  };
  rule_applied: {
    rule_id: string;
    rule_name: string;
    delay_hours: number;
    delay_days: string;
    applies_to: string;
    priority: number;
  };
  release_info: {
    release_at: string;
    is_ready: boolean;
    hours_remaining: number;
    days_remaining: string | number;
  };
  status: string;
  released_at?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('🤖 AUTO-RELEASE: Vérification avec règles...');

    // 1. Récupérer les règles actives
    const { data: rules, error: rulesError } = await supabase
      .from('payment_release_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) {
      console.error('❌ Erreur règles:', rulesError);
      return NextResponse.json({ success: false, error: rulesError.message }, { status: 500 });
    }

    if (!rules || rules.length === 0) {
      console.log('⚠️ Aucune règle active - auto-release désactivé');
      return NextResponse.json({
        success: true,
        message: 'No active rules - auto-release disabled',
        summary: { total_providers: 0, released: 0, failed: 0, skipped: 0 },
      });
    }

    console.log(`📋 ${rules.length} règle(s) active(s) trouvée(s)`);

    // 2. Récupérer tous les earnings en pending avec scheduled_releases
    const { data: earnings, error: earningsError } = await supabase
      .from('provider_earnings')
      .select(`
        id,
        provider_id,
        net_amount_cents,
        created_at,
        status,
        order_id
      `)
      .eq('status', 'pending');

    if (earningsError) {
      console.error('❌ Erreur récupération earnings:', earningsError);
      return NextResponse.json({ success: false, error: earningsError.message }, { status: 500 });
    }

    if (!earnings || earnings.length === 0) {
      console.log('✅ Aucun earning pending à libérer');
      return NextResponse.json({
        success: true,
        message: 'No pending earnings',
        summary: { total_earnings: 0, released: 0, skipped: 0, failed: 0 },
      });
    }

    let released = 0;
    let failed = 0;
    let skipped = 0;

    const now = new Date();
    const detailedResults: EarningDetail[] = [];

    for (const earning of earnings) {
      try {
        // 3. Récupérer le provider via profile_id
        // D'abord récupérer le profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, created_at, location')
          .eq('user_id', earning.provider_id)
          .single();

        if (profileError || !profile) {
          console.warn(`⚠️ Profile non trouvé pour provider_id ${earning.provider_id}`, profileError);

          detailedResults.push({
            earning_id: earning.id,
            provider_id: earning.provider_id,
            amount_cents: earning.net_amount_cents,
            amount_usd: (earning.net_amount_cents / 100).toFixed(2),
            earning_created_at: earning.created_at,
            provider_info: {
              age_days: 0,
              rating: 0,
              location: 'Profile non trouvé',
            },
            rule_applied: {
              rule_id: 'N/A',
              rule_name: 'Erreur - Profile non trouvé',
              delay_hours: 0,
              delay_days: '0',
              applies_to: 'none',
              priority: 0,
            },
            release_info: {
              release_at: new Date().toISOString(),
              is_ready: false,
              hours_remaining: 0,
              days_remaining: '0',
            },
            status: 'skipped',
            error: profileError?.message || 'Profile not found',
          });

          skipped++;
          continue;
        }

        // Ensuite récupérer le provider
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, rating, created_at, location')
          .eq('profile_id', profile.id)
          .single();

        if (providerError || !provider) {
          console.warn(`⚠️ Provider non trouvé pour provider_id ${earning.provider_id} - skip`, providerError);

          // Ajouter aux résultats même en cas d'échec
          detailedResults.push({
            earning_id: earning.id,
            provider_id: earning.provider_id,
            amount_cents: earning.net_amount_cents,
            amount_usd: (earning.net_amount_cents / 100).toFixed(2),
            earning_created_at: earning.created_at,
            provider_info: {
              age_days: 0,
              rating: 0,
              location: 'Provider non trouvé',
            },
            rule_applied: {
              rule_id: 'N/A',
              rule_name: 'Erreur - Provider non trouvé',
              delay_hours: 0,
              delay_days: '0',
              applies_to: 'none',
              priority: 0,
            },
            release_info: {
              release_at: new Date().toISOString(),
              is_ready: false,
              hours_remaining: 0,
              days_remaining: '0',
            },
            status: 'skipped',
            error: providerError?.message || 'Provider not found',
          });

          skipped++;
          continue;
        }

        const providerCreatedAt = new Date(profile.created_at || provider.created_at);
        const providerAgeDays = Math.floor((now.getTime() - providerCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Extraire le pays depuis location (JSONB)
        let location = 'Unknown';
        if (provider.location && typeof provider.location === 'object') {
          location = (provider.location as Record<string, unknown>)?.country as string || 'Unknown';
        } else if (profile.location && typeof profile.location === 'object') {
          location = (profile.location as Record<string, unknown>)?.country as string || 'Unknown';
        }

        // 4. Trouver la règle qui s'applique
        let selectedRule: ReleaseRule | null = null;
        const sortedRules = [...(rules as ReleaseRule[])].sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
          if (checkIfRuleApplies(rule, {
            amount_cents: earning.net_amount_cents,
            provider_age_days,
            provider_rating: provider.rating || 0,
            country: location,
          })) {
            selectedRule = rule;
            break;
          }
        }

        // 5. Si aucune règle ne s'applique, appliquer le défaut (14 jours)
        if (!selectedRule) {
          selectedRule = {
            id: 'default',
            name: 'Défaut (14 jours)',
            delay_hours: 336,
            applies_to: 'all',
            is_active: true,
            priority: 0,
          };
        }

        // 6. Vérifier ou créer scheduled_release
        const { data: scheduledRelease, error: scheduleError } = await supabase
          .from('scheduled_releases')
          .select('*')
          .eq('earning_id', earning.id)
          .eq('status', 'pending')
          .single();

        let releaseAt: Date;

        if (scheduleError || !scheduledRelease) {
          // Créer un scheduled_release
          releaseAt = new Date(earning.created_at);
          releaseAt.setHours(releaseAt.getHours() + selectedRule.delay_hours);

          await supabase.from('scheduled_releases').insert({
            earning_id: earning.id,
            provider_id: earning.provider_id,
            amount_cents: earning.net_amount_cents,
            rule_id: selectedRule.id === 'default' ? null : selectedRule.id,
            rule_name: selectedRule.name,
            delay_hours: selectedRule.delay_hours,
            release_at: releaseAt.toISOString(),
            status: 'pending'
          });
        } else {
          releaseAt = new Date(scheduledRelease.release_at);
        }

        // 7. Calculer les heures restantes
        const hoursRemaining = ((releaseAt.getTime() - now.getTime()) / 3600000).toFixed(2);
        const isReady = releaseAt <= now;

        // Ajouter les détails de cette règle
        detailedResults.push({
          earning_id: earning.id,
          provider_id: earning.provider_id,
          amount_cents: earning.net_amount_cents,
          amount_usd: (earning.net_amount_cents / 100).toFixed(2),
          earning_created_at: earning.created_at,
          provider_info: {
            age_days: providerAgeDays,
            rating: provider.rating || 0,
            location,
          },
          rule_applied: {
            rule_id: selectedRule.id,
            rule_name: selectedRule.name,
            delay_hours: selectedRule.delay_hours,
            delay_days: (selectedRule.delay_hours / 24).toFixed(1),
            applies_to: selectedRule.applies_to,
            priority: selectedRule.priority,
          },
          release_info: {
            release_at: releaseAt.toISOString(),
            is_ready: isReady,
            hours_remaining: isReady ? 0 : parseFloat(hoursRemaining),
            days_remaining: isReady ? 0 : (parseFloat(hoursRemaining) / 24).toFixed(1),
          },
          status: isReady ? 'ready_to_release' : 'waiting',
        });

        // Libérer seulement si le délai est écoulé
        if (!isReady) {
          skipped++;
          console.log(`⏳ Earning ${earning.id} pas encore prêt (${hoursRemaining}h restantes)`);
          continue;
        }

        // 8. Appel RPC pour libérer les fonds
        const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_release_pending_funds', {
          p_provider_id: earning.provider_id,
          p_amount_cents: earning.net_amount_cents
        });

        if (rpcError || !rpcResult?.[0]?.success) {
          console.error(`❌ Échec RPC libération pour earning ${earning.id}:`, rpcError?.message || rpcResult?.[0]?.message);
          failed++;
          continue;
        }

        // 9. Marquer l'earning comme completed
        await supabase.from('provider_earnings').update({
          status: 'completed',
          paid_at: now.toISOString()
        }).eq('id', earning.id);

        // 10. Marquer le scheduled_release comme completed
        if (scheduledRelease) {
          await supabase.from('scheduled_releases').update({
            status: 'completed',
            completed_at: now.toISOString()
          }).eq('id', scheduledRelease.id);
        }

        released++;
        console.log(`✅ Earning ${earning.id} libéré (${earning.net_amount_cents/100} USD)`);

        // Mettre à jour le statut dans les résultats détaillés
        const resultIndex = detailedResults.findIndex(r => r.earning_id === earning.id);
        if (resultIndex >= 0) {
          detailedResults[resultIndex].status = 'released';
          detailedResults[resultIndex].released_at = now.toISOString();
        }

      } catch (error: any) {
        console.error('❌ Exception:', error.message);
        failed++;

        // Ajouter l'erreur aux résultats
        detailedResults.push({
          earning_id: earning.id,
          provider_id: earning.provider_id,
          amount_cents: earning.net_amount_cents,
          amount_usd: (earning.net_amount_cents / 100).toFixed(2),
          earning_created_at: earning.created_at,
          provider_info: {
            age_days: 0,
            rating: 0,
            location: 'unknown',
          },
          rule_applied: {
            rule_id: 'error',
            rule_name: 'Erreur',
            delay_hours: 0,
            delay_days: '0',
            applies_to: 'none',
            priority: 0,
          },
          release_info: {
            release_at: new Date().toISOString(),
            is_ready: false,
            hours_remaining: 0,
            days_remaining: '0',
          },
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-release terminé',
      summary: {
        total_earnings: earnings.length,
        released,
        skipped,
        failed
      },
      active_rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        delay_hours: rule.delay_hours,
        delay_days: (rule.delay_hours / 24).toFixed(1),
        applies_to: rule.applies_to,
        condition: rule.condition,
        priority: rule.priority,
        is_active: rule.is_active,
      })),
      earnings_details: detailedResults,
      metadata: {
        total_active_rules: rules.length,
        execution_time: new Date().toISOString(),
        default_rule: {
          name: 'Défaut (14 jours)',
          delay_hours: 336,
          delay_days: 14,
          applies_to: 'all',
        }
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur auto-release:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Vérifie si une règle s'applique à un earning
// ---------------------------------------------------------------------------
function checkIfRuleApplies(rule: ReleaseRule, context: {
  amount_cents: number;
  provider_age_days: number;
  provider_rating: number;
  country?: string;
}): boolean {
  switch (rule.applies_to) {
    case 'all':
      break;
    case 'new_providers':
      if (rule.condition?.provider_age_days !== undefined && context.provider_age_days > rule.condition.provider_age_days) return false;
      break;
    case 'vip':
      if (rule.condition?.provider_rating !== undefined && context.provider_rating < rule.condition.provider_rating) return false;
      break;
    case 'amount_threshold':
      break;
    case 'country':
      if (rule.condition?.countries && !rule.condition.countries.includes(context.country || '')) return false;
      if (rule.condition?.country && rule.condition.country !== context.country) return false;
      break;
    default:
      return false;
  }

  if (rule.condition) {
    if (rule.condition.min_amount !== undefined && context.amount_cents < rule.condition.min_amount) return false;
    if (rule.condition.max_amount !== undefined && context.amount_cents > rule.condition.max_amount) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Support POST pour tester depuis Postman ou cron
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  return GET(request);
}
