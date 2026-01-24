import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const access_token = requestUrl.searchParams.get('access_token');
  const refresh_token = requestUrl.searchParams.get('refresh_token');
  const redirect = requestUrl.searchParams.get('redirect') || '/home';

  console.log('[AUTH-CALLBACK] Received tokens for impersonation');

  if (!access_token || !refresh_token) {
    console.error('[AUTH-CALLBACK] Missing tokens');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const supabase = await createClient();

    // Définir la nouvelle session avec les tokens de l'utilisateur cible
    // setSession() remplace automatiquement la session existante
    console.log('[AUTH-CALLBACK] Setting new session...');
    const { data: sessionData, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('[AUTH-CALLBACK] Erreur setSession:', error);
      return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
    }

    console.log('[AUTH-CALLBACK] Session set successfully for user:', sessionData.user?.email);

    // Créer une réponse de redirection
    const response = NextResponse.redirect(new URL(redirect, request.url));

    // S'assurer que les cookies sont bien définis
    return response;

  } catch (error: any) {
    console.error('[AUTH-CALLBACK] Erreur:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
