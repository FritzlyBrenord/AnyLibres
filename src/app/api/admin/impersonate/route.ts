import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur courant est un admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Utiliser le client admin pour vérifier le rôle (bypass RLS)
    const supabaseAdmin = createAdminClient();

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé. Seuls les administrateurs peuvent utiliser cette fonctionnalité.' },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur cible existe (avec client admin pour bypass RLS)
    console.log('[IMPERSONATE] Recherche utilisateur avec user_id:', user_id);

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, display_name, role, user_id')
      .eq('user_id', user_id)
      .single();

    console.log('[IMPERSONATE] Résultat recherche:', { targetProfile, profileError });

    if (profileError || !targetProfile) {
      console.error('[IMPERSONATE] Utilisateur non trouvé');
      return NextResponse.json(
        { success: false, error: `Utilisateur non trouvé` },
        { status: 404 }
      );
    }

    // Empêcher l'impersonation d'un autre admin
    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Impossible de se connecter en tant qu\'administrateur' },
        { status: 403 }
      );
    }

    // 1️⃣ Générer un magic link avec Admin API
    console.log('[IMPERSONATE] Génération du magic link...');
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetProfile.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[IMPERSONATE] Erreur génération magic link:', linkError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la génération du lien de connexion' },
        { status: 500 }
      );
    }

    const tokenHash = linkData.properties.hashed_token;
    console.log('[IMPERSONATE] Token hash généré:', tokenHash.substring(0, 20) + '...');

    // 2️⃣ Vérifier l'OTP pour créer la session SSR avec cookies
    console.log('[IMPERSONATE] Création de la session via verifyOtp...');
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: tokenHash,
    });

    if (verifyError) {
      console.error('[IMPERSONATE] Erreur verifyOtp:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Impossible de créer la session' },
        { status: 500 }
      );
    }

    console.log('[IMPERSONATE] Session créée avec succès pour:', sessionData.user?.email);

    // Sauvegarder l'information d'impersonation dans la session
    const redirectUrl = targetProfile.role === 'provider'
      ? '/Provider/TableauDeBord'
      : '/home';

    // Retourner le succès avec l'URL de redirection
    return NextResponse.json({
      success: true,
      message: 'Impersonation réussie',
      data: {
        redirect: redirectUrl,
        email: targetProfile.email,
        display_name: targetProfile.display_name || `${targetProfile.first_name || ''} ${targetProfile.last_name || ''}`.trim(),
        role: targetProfile.role,
        admin_id: currentUser.id
      }
    });

  } catch (error: any) {
    console.error('[IMPERSONATE] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
