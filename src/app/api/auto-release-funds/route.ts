// ============================================================================
// API: Auto Release Funds - Libération automatique selon les règles
// ============================================================================
// Cette API vérifie tous les earnings pending et les libère automatiquement
// selon les règles configurées, en utilisant l'API manuelle qui fonctionne déjà
//
// UTILISATION:
//   1. Appelez cette API via CRON toutes les heures: GET /api/auto-release-funds
//   2. OU créez un webhook qui l'appelle quand une commande est completed
//   3. OU appelez-la manuellement pour tester
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
    countries?: string[];
    provider_age_days?: number;
    provider_rating?: number;
  };
  is_active: boolean;
  priority: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Paramètre optionnel: force=true pour libérer TOUT immédiatement
    const { searchParams } = new URL(request.url);
    const forceRelease = searchParams.get('force') === 'true';

    if (forceRelease) {
      console.log('🚀 Auto-release: MODE FORCE - Libération immédiate de tout!');
    } else {
      console.log('🤖 Auto-release: Démarrage...');
    }

    // 1. Récupérer tous les earnings pending avec les infos du provider
    const { data: pendingEarnings, error: earningsError } = await supabase
      .from('provider_earnings')
      .select(`
        id,
        order_id,
        provider_id,
        user_id,
        net_amount_cents,
        created_at,
        orders!inner (
          id,
          provider_id,
          created_at
        )
      `)
      .eq('status', 'pending');

    if (earningsError) {
      console.error('❌ Erreur récupération earnings:', earningsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch earnings' },
        { status: 500 }
      );
    }

    if (!pendingEarnings || pendingEarnings.length === 0) {
      console.log('✅ Aucun earning pending à traiter');
      return NextResponse.json({
        success: true,
        message: 'No pending earnings to process',
        processed: 0,
      });
    }

    console.log(`📋 ${pendingEarnings.length} earnings pending trouvés`);

    // 2. Récupérer les règles actives
    const { data: rules, error: rulesError } = await supabase
      .from('payment_release_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError || !rules || rules.length === 0) {
      console.warn('⚠️ Aucune règle active, utilisation du délai par défaut (14 jours)');
    }

    // 3. Pour chaque earning, vérifier s'il doit être libéré
    let processed = 0;
    let released = 0;
    let scheduled = 0;
    let skipped = 0;

    for (const earning of pendingEarnings) {
      processed++;

      try {
        // Récupérer les infos du provider
        const { data: provider } = await supabase
          .from('providers')
          .select(`
            id,
            rating,
            country,
            created_at,
            profiles!inner (
              created_at
            )
          `)
          .eq('id', earning.orders.provider_id)
          .single();

        if (!provider) {
          console.warn(`⚠️ Provider non trouvé pour earning ${earning.id}`);
          skipped++;
          continue;
        }

        // Calculer l'âge du provider
        const providerCreatedAt = new Date((provider as any).profiles?.created_at || provider.created_at);
        const providerAgeDays = Math.floor(
          (Date.now() - providerCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Trouver la règle qui s'applique
        let selectedRule: ReleaseRule | null = null;

        if (rules && rules.length > 0) {
          for (const rule of rules as ReleaseRule[]) {
            if (checkIfRuleApplies(rule, {
              amount_cents: earning.net_amount_cents,
              provider_age_days: providerAgeDays,
              provider_rating: provider.rating || 0,
              country: provider.country,
            })) {
              selectedRule = rule;
              break;
            }
          }
        }

        // Règle par défaut si aucune ne s'applique
        if (!selectedRule) {
          selectedRule = {
            id: 'default',
            name: 'Défaut (14 jours)',
            delay_hours: 336, // 14 jours
            applies_to: 'all',
            is_active: true,
            priority: 0,
          };
        }

        console.log(`  → Earning ${earning.id}: règle "${selectedRule.name}" (${selectedRule.delay_hours}h)`);

        // Vérifier si le délai est écoulé
        const earningCreatedAt = new Date(earning.created_at);
        const hoursElapsed = (Date.now() - earningCreatedAt.getTime()) / (1000 * 60 * 60);

        // MODE FORCE: Libérer immédiatement sans vérifier le délai
        const shouldRelease = forceRelease || (hoursElapsed >= selectedRule.delay_hours);

        if (shouldRelease) {
          // DÉLAI ÉCOULÉ: Libérer maintenant!
          if (forceRelease) {
            console.log(`    🚀 MODE FORCE: Libération immédiate → ${earning.net_amount_cents / 100} EUR`);
          } else {
            console.log(`    ✅ Délai écoulé (${hoursElapsed.toFixed(1)}h >= ${selectedRule.delay_hours}h) → Libération`);
          }

          // Utiliser l'API manuelle qui fonctionne déjà
          console.log(`    → Appel admin_release_pending_funds(provider_id=${earning.user_id}, amount=${earning.net_amount_cents})`);

          const { data: releaseResult, error: releaseError } = await supabase
            .rpc('admin_release_pending_funds', {
              p_provider_id: earning.user_id,
              p_amount_cents: earning.net_amount_cents,
            });

          if (releaseError) {
            console.error(`    ❌ Échec libération:`, JSON.stringify(releaseError, null, 2));
            skipped++;
          } else if (!releaseResult || releaseResult.length === 0 || !releaseResult[0]?.success) {
            console.error(`    ❌ Fonction retournée sans succès:`, JSON.stringify(releaseResult, null, 2));
            skipped++;
          } else {
            console.log(`    🎉 Libéré: ${earning.net_amount_cents / 100} EUR`);
            console.log(`    📊 Résultat:`, releaseResult[0]);
            released++;
          }
        } else {
          // DÉLAI NON ÉCOULÉ: Programmer ou attendre
          const remainingHours = selectedRule.delay_hours - hoursElapsed;
          console.log(`    ⏳ En attente (reste ${remainingHours.toFixed(1)}h)`);

          // Créer un scheduled_release si pas déjà fait
          const releaseAt = new Date(earningCreatedAt);
          releaseAt.setHours(releaseAt.getHours() + selectedRule.delay_hours);

          const { error: scheduleError } = await supabase
            .from('scheduled_releases')
            .upsert({
              earning_id: earning.id,
              provider_id: earning.user_id,
              amount_cents: earning.net_amount_cents,
              rule_id: selectedRule.id,
              rule_name: selectedRule.name,
              delay_hours: selectedRule.delay_hours,
              release_at: releaseAt.toISOString(),
              status: 'pending',
            }, {
              onConflict: 'earning_id',
              ignoreDuplicates: false,
            });

          if (scheduleError) {
            console.warn(`    ⚠️ Échec création scheduled_release:`, scheduleError);
          } else {
            console.log(`    📅 Programmé pour: ${releaseAt.toISOString()}`);
          }

          scheduled++;
        }
      } catch (error) {
        console.error(`❌ Erreur traitement earning ${earning.id}:`, error);
        skipped++;
      }
    }

    console.log('');
    console.log('✅ Auto-release terminé:');
    console.log(`   - Total traité: ${processed}`);
    console.log(`   - Libérés: ${released}`);
    console.log(`   - Programmés: ${scheduled}`);
    console.log(`   - Ignorés: ${skipped}`);

    return NextResponse.json({
      success: true,
      message: 'Auto-release completed',
      summary: {
        total_processed: processed,
        released,
        scheduled,
        skipped,
      },
    });
  } catch (error: any) {
    console.error('💥 Erreur inattendue:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fonction pour vérifier si une règle s'applique
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

  // Pays spécifique
  if (rule.applies_to === 'country' && rule.condition?.countries) {
    return rule.condition.countries.includes(context.country || '');
  }

  return false;
}

// Permettre les appels POST aussi (pour webhook)
export async function POST(request: NextRequest) {
  return GET(request);
}
