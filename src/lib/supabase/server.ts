// ============================================================================
// Supabase Client - Server Side
// Utiliser dans les API routes et Server Components
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const isRoot = cookieStore.get('anylibre_root_session')?.value === 'true';

  // 👑 SI ROOT : On retourne un client Admin (Service Role) qui bypass le RLS
  if (isRoot && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('👑 Client Supabase Root: Utilisation du Service Role');
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // On mock les fonctions auth pour que le reste du code croie qu'on est loggé
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: process.env.ROOT_ADMIN_EMAIL || 'root@anylibre.com',
      role: 'super_admin',
      user_metadata: { display_name: 'Root Super Admin', role: 'super_admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };

    // Extension du client pour simuler une session valide
    return new Proxy(adminClient, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          return {
            ...target.auth,
            getUser: async () => ({ data: { user: mockUser }, error: null }),
            getSession: async () => ({ data: { session: { user: mockUser } }, error: null }),
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as any;
  }

  // 📁 CLIENT STANDARD
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie peut être en read-only dans certains contextes
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie peut être en read-only dans certains contextes
          }
        },
      },
    }
  );
}

/**
 * Crée un client Supabase Admin avec la clé service role
 * À utiliser UNIQUEMENT dans les API routes d'administration
 * Bypass les Row Level Security policies
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}