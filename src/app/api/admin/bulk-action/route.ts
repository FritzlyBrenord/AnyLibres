import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { action, user_ids, user_type } = await request.json();

    if (!action || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'action et user_ids (tableau non vide) sont requis' },
        { status: 400 }
      );
    }

    if (!['block', 'unblock', 'delete', 'export'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action invalide. Utilisez "block", "unblock", "delete" ou "export"' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      total: user_ids.length,
      errors: [] as string[]
    };

    // Déterminer si ce sont des IDs de profiles ou de user_ids
    const isClientType = user_type === 'clients';

    for (const id of user_ids) {
      try {
        if (action === 'block' || action === 'unblock') {
          // Bloquer/débloquer l'utilisateur
          const newIsActive = action === 'unblock';

          // Si c'est un client, l'ID est user_id, sinon c'est profile_id (pour provider)
          let userId = id;

          if (!isClientType) {
            // Pour les providers, récupérer le user_id depuis le profile_id
            const { data: providerProfile } = await supabase
              .from('provider_profiles')
              .select('profile_id')
              .eq('id', id)
              .single();

            if (providerProfile) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('id', providerProfile.profile_id)
                .single();

              if (profile?.user_id) {
                userId = profile.user_id;
              }
            }
          }

          // Mettre à jour le profil
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: newIsActive })
            .eq('user_id', userId);

          if (updateError) {
            results.failed++;
            results.errors.push(`Erreur pour ${id}: ${updateError.message}`);
            continue;
          }

          // Ban/Unban dans Supabase Auth
          try {
            const supabaseAdmin = createAdminClient();

            if (action === 'block') {
              await supabaseAdmin.auth.admin.updateUserById(
                userId,
                {
                  user_metadata: { is_banned: true },
                  app_metadata: { is_banned: true }
                }
              );
            } else {
              await supabaseAdmin.auth.admin.updateUserById(
                userId,
                {
                  user_metadata: { is_banned: false },
                  app_metadata: { is_banned: false }
                }
              );
            }
          } catch (authError) {
            console.error(`[BULK-ACTION] Erreur Auth pour ${id}:`, authError);
            // Continue même en cas d'erreur Auth
          }

          results.success++;

        } else if (action === 'delete') {
          // Supprimer l'utilisateur
          let userId = id;

          if (!isClientType) {
            // Pour les providers, récupérer le user_id
            const { data: providerProfile } = await supabase
              .from('provider_profiles')
              .select('profile_id')
              .eq('id', id)
              .single();

            if (providerProfile) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('user_id, id')
                .eq('id', providerProfile.profile_id)
                .single();

              if (profile) {
                userId = profile.user_id;

                // Supprimer provider_profiles
                await supabase
                  .from('provider_profiles')
                  .delete()
                  .eq('profile_id', profile.id);

                // Supprimer services
                await supabase
                  .from('services')
                  .delete()
                  .eq('provider_id', profile.id);

                // Supprimer earnings
                await supabase
                  .from('provider_earnings')
                  .delete()
                  .eq('provider_id', profile.id);
              }
            }
          }

          // Récupérer le profile_id pour la suppression
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (profile) {
            // Supprimer commandes
            await supabase
              .from('orders')
              .delete()
              .eq('client_id', profile.id);

            // Supprimer messages
            await supabase
              .from('messages')
              .delete()
              .eq('sender_id', profile.id);
          }

          // Supprimer le profil
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('user_id', userId);

          if (deleteError) {
            results.failed++;
            results.errors.push(`Erreur suppression ${id}: ${deleteError.message}`);
            continue;
          }

          // Supprimer de Auth
          try {
            const supabaseAdmin = createAdminClient();
            await supabaseAdmin.auth.admin.deleteUser(userId);
          } catch (authError) {
            console.error(`[BULK-ACTION] Erreur Auth delete pour ${id}:`, authError);
          }

          results.success++;

        } else if (action === 'export') {
          // L'export sera géré par le client
          results.success++;
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Erreur pour ${id}: ${error.message}`);
        console.error(`[BULK-ACTION] Erreur pour ${id}:`, error);
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      message: `Action en masse terminée: ${results.success} réussies, ${results.failed} échouées`,
      data: results
    });

  } catch (error: any) {
    console.error('[BULK-ACTION] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
