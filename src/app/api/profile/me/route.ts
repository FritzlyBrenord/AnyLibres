// app/api/profile/me/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le profil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profil non trouvé - créer un profil de base
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            first_name: '',
            last_name: '',
            phone: '',
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return NextResponse.json({
          success: true,
          data: { profile: newProfile },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { profile },
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}