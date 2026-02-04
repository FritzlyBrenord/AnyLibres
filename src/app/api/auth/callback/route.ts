import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const access_token = requestUrl.searchParams.get('access_token');
  const refresh_token = requestUrl.searchParams.get('refresh_token');
  const redirect = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next') || '/home';

  // 1. Handle PKCE Code Exchange (Standard Supabase Flow)
  // This is used for Email Verification, Password Reset, Magic Links
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[AUTH-CALLBACK] Code exchanged successfully. Redirecting to:', redirect);
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    console.error('[AUTH-CALLBACK] Code exchange error:', error);
    // Continue to check for other tokens just in case, or fail?
    // Usually code failure is fatal for this flow.
  }

  // 2. Handle Token Impersonation (Existing Logic)
  console.log('[AUTH-CALLBACK] Checking tokens for impersonation');

  if (!access_token || !refresh_token) {
    // If we had a code and it failed, we might end up here.
    // If we had no code and no tokens, it's an error or invalid access.
    if (code) {
      return NextResponse.redirect(new URL('/login?error=auth_code_error', request.url));
    }
    console.error('[AUTH-CALLBACK] Missing tokens or code');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const supabase = await createClient();

    // Définir la nouvelle session avec les tokens de l'utilisateur cible
    // setSession() remplace automatiquement la session existante
    console.log('[AUTH-CALLBACK] Setting new session via tokens...');
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

