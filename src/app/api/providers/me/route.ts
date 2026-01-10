import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Récupérer le profil provider de l'utilisateur connecté ou un provider spécifique pour admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Vérifier si c'est un accès admin
    const isAdmin = request.headers.get('x-is-admin') === 'true' ||
      url.searchParams.get('isAdmin') === 'true';

    const providerId = url.searchParams.get('provider_id');
    const userId = url.searchParams.get('user_id');

    // Fonction pour normaliser les tableaux
    const normalizeStringArray = (field: unknown): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) {
        return field.map((item: unknown): string => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            const extracted = obj.name || obj.value || obj.label;
            if (typeof extracted === 'string') return extracted;
            return JSON.stringify(item);
          }
          return String(item);
        });
      }
      return [];
    };

    if (isAdmin) {
      console.log('🔑 Accès admin détecté au provider');

      // Logique admin
      if (providerId) {
        // Récupérer un provider spécifique par ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('*, profiles!inner(*)')
          .eq('id', providerId)
          .single();

        if (providerError || !provider) {
          return NextResponse.json(
            { success: false, error: 'Provider non trouvé' },
            { status: 404 }
          );
        }

        const normalizedProvider = {
          ...provider,
          skills: normalizeStringArray(provider.skills),
          languages: provider.languages || [],
          categories: normalizeStringArray(provider.categories),
          portfolio: provider.portfolio || [],
          location: provider.location || {},
          profile: provider.profiles
        };

        return NextResponse.json({
          success: true,
          data: normalizedProvider,
          is_admin_view: true
        });
      } else if (userId) {
        // Récupérer par user_id via profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (profileError || !profile) {
          return NextResponse.json(
            { success: false, error: 'Profil non trouvé' },
            { status: 404 }
          );
        }

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('*, profiles!inner(*)')
          .eq('profile_id', profile.id)
          .single();

        if (providerError || !provider) {
          return NextResponse.json(
            { success: false, error: 'Provider non trouvé' },
            { status: 404 }
          );
        }

        const normalizedProvider = {
          ...provider,
          skills: normalizeStringArray(provider.skills),
          languages: provider.languages || [],
          categories: normalizeStringArray(provider.categories),
          portfolio: provider.portfolio || [],
          location: provider.location || {},
          profile: provider.profiles
        };

        return NextResponse.json({
          success: true,
          data: normalizedProvider,
          is_admin_view: true
        });
      } else {
        // Admin mais pas de paramètre spécifique - vérifier si connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!authError && user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profileError || !profile) {
            return NextResponse.json(
              { success: false, error: 'Profil non trouvé' },
              { status: 404 }
            );
          }

          const { data: provider, error: providerError } = await supabase
            .from('providers')
            .select('*, profiles!inner(*)')
            .eq('profile_id', profile.id)
            .single();

          if (providerError || !provider) {
            return NextResponse.json(
              { success: false, error: 'Provider non trouvé' },
              { status: 404 }
            );
          }

          const normalizedProvider = {
            ...provider,
            skills: normalizeStringArray(provider.skills),
            languages: provider.languages || [],
            categories: normalizeStringArray(provider.categories),
            portfolio: provider.portfolio || [],
            location: provider.location || {},
            profile: provider.profiles
          };

          return NextResponse.json({
            success: true,
            data: normalizedProvider,
            is_admin_view: true
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Accès admin nécessite authentification' },
            { status: 401 }
          );
        }
      }
    } else {
      // Logique normale - utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Non authentifié' },
          { status: 401 }
        );
      }

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'Profil non trouvé' },
          { status: 404 }
        );
      }

      // Récupérer le provider
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (providerError) {
        return NextResponse.json(
          { success: false, error: 'Provider non trouvé' },
          { status: 404 }
        );
      }

      const normalizedProvider = {
        ...provider,
        skills: normalizeStringArray(provider.skills),
        languages: provider.languages || [],
        categories: normalizeStringArray(provider.categories),
        portfolio: provider.portfolio || [],
        location: provider.location || {},
        profile: profile
      };

      return NextResponse.json({
        success: true,
        data: normalizedProvider
      });
    }

  } catch (error) {
    console.error('Erreur récupération provider:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le profil provider
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("📩 Body reçu:", JSON.stringify(body, null, 2));

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le profil utilisateur
    if (body.profile) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          display_name: body.profile.display_name,
          first_name: body.profile.first_name,
          last_name: body.profile.last_name,
          bio: body.profile.bio,
        })
        .eq('id', profile.id);

      if (updateProfileError) {
        console.error("❌ Erreur mise à jour profile:", updateProfileError);
        return NextResponse.json(
          { success: false, error: 'Erreur mise à jour profil utilisateur' },
          { status: 500 }
        );
      }
    }

    // Préparer les données du provider
    const providerData: any = {
      company_name: body.company_name,
      profession: body.profession,
      about: body.about,
      tagline: body.tagline,
      experience_years: body.experience_years,
      hourly_rate: body.hourly_rate,
      starting_price: body.starting_price,
      categories: body.categories || [],
      skills: body.skills || [],
      languages: body.languages || [],
      location: body.location || {},
      portfolio: body.portfolio || [],
      availability: body.availability,
      response_time_hours: body.response_time_hours,
    };

    console.log("📝 Données provider à sauvegarder:", JSON.stringify(providerData, null, 2));

    // Mettre à jour le provider
    const { data: updatedProvider, error: updateError } = await supabase
      .from('providers')
      .update(providerData)
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Erreur mise à jour provider:", updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur mise à jour provider' },
        { status: 500 }
      );
    }

    console.log("✅ Provider mis à jour:", updatedProvider);

    return NextResponse.json({
      success: true,
      data: updatedProvider
    });

  } catch (error) {
    console.error('Erreur mise à jour provider:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}