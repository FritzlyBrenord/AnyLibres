import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Récupérer les paramètres
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const verification = url.searchParams.get('verification') || 'all';
    const sort_by = url.searchParams.get('sort_by') || 'newest';
    const providerId = url.searchParams.get('provider_id');

    console.log('[API PROVIDERS] Fetching providers...', { providerId });

    // ÉTAPE 1 : Récupérer TOUS les providers ou un provider spécifique
    let providersQuery = supabase
      .from('providers')
      .select(`
        *,
        profile:profiles (
          id,
          user_id,
          first_name,
          last_name,
          display_name,
          email,
          email_verified,
          phone,
          phone_verified,
          avatar_url,
          location,
          created_at,
          is_active
        )
      `);

    // Filtre par provider_id spécifique (priorité maximale)
    if (providerId) {
      providersQuery = providersQuery.eq('id', providerId);
      console.log('[API PROVIDERS] Filtering by provider_id:', providerId);
    }

    // Appliquer les autres filtres
    if (search) {
      providersQuery = providersQuery.or(
        `company_name.ilike.%${search}%,profession.ilike.%${search}%,profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`
      );
    }

    if (status !== 'all') {
      providersQuery = providersQuery.eq('is_active', status === 'active');
    }

    if (verification !== 'all') {
      providersQuery = providersQuery.eq('is_verified', verification === 'verified');
    }

    const { data: providers, error: providersError } = await providersQuery;

    if (providersError) {
      console.error('[API PROVIDERS] Error:', providersError);
      return NextResponse.json(
        { success: false, error: providersError.message },
        { status: 500 }
      );
    }

    console.log(`[API PROVIDERS] Found ${providers?.length || 0} providers`);

    // ÉTAPE 2 : Enrichir avec les statistiques des commandes comme fournisseur
    const providersWithStats = await Promise.all(
      (providers || []).map(async (provider) => {
        // Calculer les revenus totaux (commandes livrées/complétées)
        const { data: providerOrders, error: ordersError } = await supabase
          .from('orders')
          .select('total_cents, status, payment_status')
          .eq('provider_id', provider.id);

        let total_earned = 0;
        let completed_orders_count = 0;
        let disputed_orders_count = 0;

        if (providerOrders && !ordersError) {
          providerOrders.forEach(order => {
            if (order.status === 'disputed') {
              disputed_orders_count += 1;
            }
            if (order.payment_status === 'succeeded') {
              // Pour les prestataires, ils reçoivent le montant moins les frais
              const providerAmount = (order.total_cents / 100) * 0.95; // Exemple: 95% du total
              total_earned += providerAmount;

              if (order.status === 'completed') {
                completed_orders_count += 1;
              }
            }
          });
        }

        // Récupérer le nombre réel d'avis depuis la table reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating_overall', { count: 'exact' })
          .or(`reviewee_id.eq.${provider.profile?.user_id},reviewee_id.eq.${provider.id}`)
          .eq('reviewer_type', 'client');

        const actual_reviews_count = reviewsData?.length || 0;
        const actual_average_rating = reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating_overall, 0) / reviewsData.length
          : 0;

        return {
          ...provider,
          total_earned: parseFloat(total_earned.toFixed(2)),
          completed_orders_count,
          disputed_orders_count,
          // Remplacer les valeurs cachées de la table providers par les vraies valeurs
          total_reviews: actual_reviews_count,
          rating: parseFloat(actual_average_rating.toFixed(1)),
          // Ajouter les infos du profil directement
          first_name: provider.profile?.first_name,
          last_name: provider.profile?.last_name,
          display_name: provider.profile?.display_name,
          email: provider.profile?.email,
          phone: provider.profile?.phone,
          avatar_url: provider.profile?.avatar_url,
          location: provider.profile?.location,
          user_id: provider.profile?.user_id
        };
      })
    );

    // ÉTAPE 3 : Trier
    let sortedProviders = [...providersWithStats];

    if (sort_by === 'newest') {
      sortedProviders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort_by === 'oldest') {
      sortedProviders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort_by === 'highest_rating') {
      sortedProviders.sort((a, b) => b.rating - a.rating);
    } else if (sort_by === 'most_orders') {
      sortedProviders.sort((a, b) => b.completed_orders_count - a.completed_orders_count);
    }

    return NextResponse.json({
      success: true,
      data: {
        providers: sortedProviders,
        total: sortedProviders.length
      }
    });

  } catch (error: any) {
    console.error('[API PROVIDERS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}