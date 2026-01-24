import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user_id, action } = await request.json();

    if (!user_id || !action) {
      return NextResponse.json(
        { success: false, error: 'user_id et action sont requis' },
        { status: 400 }
      );
    }

    if (action !== 'block' && action !== 'unblock') {
      return NextResponse.json(
        { success: false, error: 'Action invalide. Utilisez "block" ou "unblock"' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_active')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut is_active dans la table profiles
    const newIsActive = action === 'unblock';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: newIsActive })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('[TOGGLE-USER] Erreur mise à jour profil:', updateError);
      return NextResponse.json(
        { success: false, error: `Erreur lors de la mise à jour du profil: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Utiliser l'API Supabase Admin pour ban/unban l'utilisateur dans auth.users
    try {
      const supabaseAdmin = await createClient();

      if (action === 'block') {
        // Bannir l'utilisateur via Supabase Auth Admin
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          {
            user_metadata: { is_banned: true },
            app_metadata: { is_banned: true }
          }
        );

        if (banError) {
          console.error('[TOGGLE-USER] Erreur ban Supabase Auth:', banError);
          // Continue même si le ban échoue, car le profil est déjà désactivé
        }
      } else {
        // Débannir l'utilisateur via Supabase Auth Admin
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          {
            user_metadata: { is_banned: false },
            app_metadata: { is_banned: false }
          }
        );

        if (unbanError) {
          console.error('[TOGGLE-USER] Erreur unban Supabase Auth:', unbanError);
          // Continue même si l'unban échoue
        }
      }
    } catch (authError) {
      console.error('[TOGGLE-USER] Erreur Auth:', authError);
      // Continue même en cas d'erreur Auth
    }

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${action === 'block' ? 'bloqué' : 'débloqué'} avec succès`,
      data: {
        user_id,
        is_active: newIsActive,
        email: profile.email
      }
    });

  } catch (error: any) {
    console.error('[TOGGLE-USER] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
