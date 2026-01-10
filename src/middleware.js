// ============================================================================
// Middleware: Protection des routes et redirection intelligente
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // Routes publiques accessibles à tous (connecté ou non)
  const publicPaths = [
    '/', // Page d'accueil publique
    '/explorer',
    '/categories',
    '/about',
    '/login',
    '/register',
    '/search',
    '/forgot-password',
  ];

  // Routes dynamiques publiques (avec paramètres)
  const publicDynamicPatterns = [
    /^\/service\/[^\/]+$/, // /service/[id]
    /^\/provider\/[^\/]+$/, // /provider/[id]
    /^\/profile\/[^\/]+$/, // /profile/[id]
    /^\/categories\/[^\/]+$/, // /categories/[slug]
  ];

  // Vérifier si c'est une route publique
  const isPublicPath = publicPaths.includes(path) ||
    publicDynamicPatterns.some(pattern => pattern.test(path));

  // Vérifier l'authentification
  const { data: { user }, error } = await supabase.auth.getUser();
  const isAuthenticated = !!user && !error;

  // Routes d'authentification - rediriger si déjà connecté
  if (isAuthenticated && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Rediriger l'utilisateur connecté de / vers /home
  if (isAuthenticated && path === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Si c'est une route publique, laisser passer
  if (isPublicPath) {
    return response;
  }

  // Routes protégées - nécessitent une authentification
  const protectedPaths = [
    '/home', // Page d'accueil connectée
    '/dashboard',
    '/orders',
    '/messages',
    '/notifications',
    '/favorites',
    '/reviews',
    '/settings',
    '/become-provider',
  ];

  const isProtectedPath = protectedPaths.some(p => path === p || path.startsWith(p + '/'));

  // Si route protégée et pas connecté -> rediriger vers login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Si utilisateur connecté, vérifier son profil
  if (isAuthenticated) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_active, role')
        .eq('user_id', user.id)
        .single();

      // Si profil désactivé -> déconnecter et rediriger
      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
      }

      // Vérifier accès au dashboard (réservé aux providers)
      if (path.startsWith('/dashboard') && profile.role !== 'provider') {
        return NextResponse.redirect(new URL('/become-provider', request.url));
      }
    } catch (error) {
      console.error('❌ Erreur middleware:', error);
      // En cas d'erreur, rediriger vers login
      return NextResponse.redirect(new URL('/login?error=profile_error', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     * - fichiers publics (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};