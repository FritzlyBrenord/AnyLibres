// ============================================================================
// CRON Job: Auto Release Payments - Libère automatiquement les fonds
// À exécuter toutes les heures via cron ou Vercel Cron
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier le secret key pour sécuriser le endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting auto-release job...');

    // 1. Récupérer tous les paiements à libérer (release_at <= maintenant)
    const now = new Date().toISOString();
    const { data: scheduledReleases, error: fetchError } = await supabase
      .from('scheduled_releases')
      .select('*')
      .eq('status', 'pending')
      .lte('release_at', now)
      .order('release_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled releases:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch releases' },
        { status: 500 }
      );
    }

    if (!scheduledReleases || scheduledReleases.length === 0) {
      console.log('✅ No payments to release');
      return NextResponse.json({
        success: true,
        message: 'No payments to release',
        released_count: 0,
      });
    }

    console.log(`📦 Found ${scheduledReleases.length} payments to release`);

    // 2. Pour chaque paiement programmé, libérer les fonds
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const release of scheduledReleases) {
      try {
        // Récupérer le solde actuel du provider
        const { data: balance, error: balanceError } = await supabase
          .from('provider_balance')
          .select('*')
          .eq('provider_id', release.provider_id)
          .single();

        if (balanceError || !balance) {
          console.error(`❌ Balance not found for provider ${release.provider_id}`);
          results.failed++;
          results.errors.push(`Balance not found: ${release.provider_id}`);
          continue;
        }

        // Vérifier que le compte n'est pas gelé
        const { data: frozen } = await supabase
          .from('provider_frozen_accounts')
          .select('is_frozen')
          .eq('provider_id', release.provider_id)
          .eq('is_frozen', true)
          .single();

        if (frozen) {
          console.log(`⚠️  Account frozen, skipping: ${release.provider_id}`);
          // Marquer comme "on_hold" au lieu de "completed"
          await supabase
            .from('scheduled_releases')
            .update({
              status: 'on_hold',
              hold_reason: 'Account frozen',
              updated_at: new Date().toISOString(),
            })
            .eq('id', release.id);
          continue;
        }

        // Libérer les fonds: pending → available
        const newPending = Math.max(0, balance.pending_cents - release.amount_cents);
        const newAvailable = balance.available_cents + release.amount_cents;

        const { error: updateError } = await supabase
          .from('provider_balance')
          .update({
            pending_cents: newPending,
            available_cents: newAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq('provider_id', release.provider_id);

        if (updateError) {
          console.error(`❌ Failed to update balance for ${release.provider_id}:`, updateError);
          results.failed++;
          results.errors.push(`Update failed: ${release.provider_id}`);
          continue;
        }

        // Marquer le release comme complété
        await supabase
          .from('scheduled_releases')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', release.id);

        // Logger l'action
        await supabase.from('admin_actions_log').insert({
          admin_id: '00000000-0000-0000-0000-000000000000', // System user
          action_type: 'auto_release_funds',
          target_type: 'provider_balance',
          target_id: balance.id,
          metadata: {
            provider_id: release.provider_id,
            amount_cents: release.amount_cents,
            rule_name: release.rule_name,
            delay_hours: release.delay_hours,
            previous_pending: balance.pending_cents,
            previous_available: balance.available_cents,
            new_pending: newPending,
            new_available: newAvailable,
          },
          performed_at: new Date().toISOString(),
        });

        console.log(`✅ Released ${release.amount_cents / 100}€ for provider ${release.provider_id}`);
        results.success++;
      } catch (err) {
        console.error(`❌ Error processing release ${release.id}:`, err);
        results.failed++;
        results.errors.push(`Processing error: ${release.id}`);
      }
    }

    console.log(`🎉 Auto-release job completed: ${results.success} success, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Auto-release job completed',
      total_processed: scheduledReleases.length,
      success_count: results.success,
      failed_count: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('💥 Fatal error in auto-release job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optionnel: POST pour tester manuellement
export async function POST(request: NextRequest) {
  return GET(request);
}
