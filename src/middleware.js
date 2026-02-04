// ============================================================================
// Middleware: Sécurisation Stricte des Routes par Rôles
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

  // 1. Définition des Routes
  // --------------------------------------------------------------------------

  // Routes Publiques et Auth (Accessibles sans connexion)
  const publicPaths = [
    '/',
    '/explorer',
    '/categories',
    '/about',
    '/search',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  // Patterns pour routes publiques dynamiques
  const publicDynamicPatterns = [
    /^\/service\/[^\/]+$/,    // /service/*
    /^\/provider\/[^\/]+$/,   // /provider/* (profil public)
    /^\/profile\/[^\/]+$/,    // /profile/*
    /^\/categories\/[^\/]+$/, // /categories/*
    /^\/reset-password\/[^\/]+$/,
  ];

  const authPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  // Routes Provider Uniquement
  const providerPrefix = '/Provider';

  // Routes Admin Uniquement
  const adminPrefix = '/Admin';
  // NOTE: Dans votre structure, le dossier s'appelle (Administrateur)/Admin
  // Donc l'URL est /Admin. Nous sécurisons tout ce qui commence par /Admin


  // 2. Vérifications Préliminaires
  // --------------------------------------------------------------------------

  const isPublicPath = publicPaths.includes(path) ||
    publicDynamicPatterns.some(pattern => pattern.test(path));

  const isAuthPage = authPaths.some(p => path.startsWith(p));

  const rootSession = request.cookies.get('anylibre_root_session')?.value === 'true';
  const { data: { user }, error } = await supabase.auth.getUser();
  const isAuthenticated = (!!user && !error) || rootSession;


  // 3. Logique de Redirection
  // --------------------------------------------------------------------------

  // CAS A: Utilisateur NON Connecté
  if (!isAuthenticated) {
    // Si route publique -> OK
    if (isPublicPath) {
      return response;
    }

    // Si route auth -> OK
    if (isAuthPage) {
      return response;
    }

    // Sinon (route protégée) -> Redirection Login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // CAS B: Utilisateur Connecté
  if (isAuthenticated) {

    // 1. Identification du Rôle (Nécessaire pour toute la suite)
    let userRole = 'client'; // Par défaut

    if (rootSession) {
      userRole = 'super_admin';
    } else if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          if (!profile.is_active) {
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
          }
          userRole = profile.role || 'client';
        }
      } catch (e) {
        console.error('Middleware role check error:', e);
      }
    }

    // 2. CAS 1: Rôles Administratifs (STRICT JAIL MODE)
    // --------------------------------------------------------------------------
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support', 'finance', 'content_manager'];

    if (adminRoles.includes(userRole)) {
      if (!path.startsWith(adminPrefix)) {
        // Redirection immédiate vers /Admin pour TOUTE autre route (public ou protected)
        return NextResponse.redirect(new URL('/Admin', request.url));
      }
      return response;
    }

    // 3. CAS 2: Rôles Standards (Client, Provider)
    // --------------------------------------------------------------------------

    // Rediriger des pages Auth vers Home
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Root / redirige vers /home
    if (path === '/') {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Ne doivent PAS accéder à /Admin
    if (path.startsWith(adminPrefix)) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Règle PROVIDER: Accès Exclusif à /Provider
    if (path.startsWith(providerPrefix)) {
      if (userRole !== 'provider') {
        // Seul provider a accès
        return NextResponse.redirect(new URL('/home', request.url));
      }
      return response;
    }

    // Accès Dashboard (Legacy)
    if (path.startsWith('/dashboard') && userRole !== 'provider') {
      return NextResponse.redirect(new URL('/become-provider', request.url));
    }

    // Tout le reste (routes (protected) standards comme /home, /orders ...)
    // Accessible aux rôles Client et Provider
    return response;
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