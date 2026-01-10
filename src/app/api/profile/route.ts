import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier si c'est un accès admin
    const url = new URL(request.url);
    const isAdmin = request.headers.get('x-is-admin') === 'true' || 
                    url.searchParams.get('isAdmin') === 'true';
    
    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Si admin avec paramètres spécifiques, permettre l'accès aux autres profils
    const profileId = url.searchParams.get('profile_id');
    const userIdParam = url.searchParams.get('user_id');
    
    if (isAdmin && (profileId || userIdParam)) {
      console.log('🔑 Accès admin détecté avec paramètres spécifiques');
      
      let query = supabase.from('profiles').select('*');
      
      if (profileId) {
        query = query.eq('id', profileId);
      } else if (userIdParam) {
        query = query.eq('user_id', userIdParam);
      }
      
      const { data: profile, error: profileError } = await query.single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'Profil non trouvé' },
          { status: 404 }
        );
      }

      // Récupérer l'email depuis la table auth.users via une requête admin
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
      
      return NextResponse.json({
        success: true,
        data: {
          profile: {
            ...profile,
            email: authUser?.user?.email || '',
            is_admin_view: true
          }
        }
      });
    }
    
    // Pour tous les autres cas (y compris admin sans paramètres), récupérer le profil de l'utilisateur connecté
    console.log('[API PROFILE] Fetching profile for user:', user.id);

    // Essayer d'abord avec la jointure users
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, users!inner(email)')
      .eq('user_id', user.id)
      .single();

    // Si la jointure échoue, faire deux requêtes séparées
    if (profileError) {
      console.log('[API PROFILE] Jointure failed, trying separate queries');
      
      // 1. Récupérer le profil
      const { data: profileData, error: profileDataError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileDataError || !profileData) {
        console.error('[API PROFILE] Profile not found:', profileDataError);
        return NextResponse.json(
          { success: false, error: 'Profil non trouvé dans la base de données' },
          { status: 404 }
        );
      }

      // 2. Récupérer l'email depuis la session ou une autre table si nécessaire
      // L'email est déjà dans l'objet user de Supabase Auth
      return NextResponse.json({
        success: true,
        data: {
          profile: {
            ...profileData,
            email: user.email,
            ...(isAdmin && { is_admin_view: true })
          }
        }
      });
    }

    // Si on arrive ici, la jointure a fonctionné
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          ...profile,
          email: profile.users?.email || user.email,
          ...(isAdmin && { is_admin_view: true })
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour le profil
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Mettre à jour le profil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        display_name: body.display_name,
        phone: body.phone,
        bio: body.bio,
        location: body.location,
        website: body.website,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          ...updatedProfile,
          email: user.email
        }
      }
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}