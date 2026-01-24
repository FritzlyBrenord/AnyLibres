import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { user_id, type } = await request.json();

    if (!user_id || !type) {
      return NextResponse.json(
        { success: false, error: 'user_id et type sont requis' },
        { status: 400 }
      );
    }

    if (type !== 'client' && type !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Type invalide. Utilisez "client" ou "provider"' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_id, role')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Si c'est un prestataire, supprimer d'abord l'entrée provider_profiles
    if (type === 'provider' || profile.role === 'provider') {
      const { error: providerError } = await supabase
        .from('provider_profiles')
        .delete()
        .eq('profile_id', profile.id);

      if (providerError) {
        console.error('[DELETE-USER] Erreur suppression provider_profiles:', providerError);
        // Continue même si la suppression échoue (peut-être qu'il n'existe pas)
      }

      // Supprimer les services du prestataire
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('provider_id', profile.id);

      if (servicesError) {
        console.error('[DELETE-USER] Erreur suppression services:', servicesError);
      }

      // Supprimer les revenus du prestataire
      const { error: earningsError } = await supabase
        .from('provider_earnings')
        .delete()
        .eq('provider_id', profile.id);

      if (earningsError) {
        console.error('[DELETE-USER] Erreur suppression earnings:', earningsError);
      }
    }

    // Supprimer les commandes de l'utilisateur (en tant que client)
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('client_id', profile.id);

    if (ordersError) {
      console.error('[DELETE-USER] Erreur suppression orders:', ordersError);
    }

    // Supprimer les messages de l'utilisateur
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('sender_id', profile.id);

    if (messagesError) {
      console.error('[DELETE-USER] Erreur suppression messages:', messagesError);
    }

    // Supprimer le profil
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user_id);

    if (deleteProfileError) {
      console.error('[DELETE-USER] Erreur suppression profil:', deleteProfileError);
      return NextResponse.json(
        { success: false, error: `Erreur lors de la suppression du profil: ${deleteProfileError.message}` },
        { status: 500 }
      );
    }

    // Supprimer l'utilisateur de Supabase Auth
    try {
      const supabaseAdmin = await createClient();
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteAuthError) {
        console.error('[DELETE-USER] Erreur suppression Auth:', deleteAuthError);
        // Continue même si la suppression Auth échoue
      }
    } catch (authError) {
      console.error('[DELETE-USER] Erreur Auth:', authError);
      // Continue même en cas d'erreur Auth
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'client' ? 'Client' : 'Prestataire'} supprimé avec succès`,
      data: {
        user_id,
        email: profile.email,
        type
      }
    });

  } catch (error: any) {
    console.error('[DELETE-USER] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
