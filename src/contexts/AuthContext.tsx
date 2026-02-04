// ============================================================================
// Context: AuthContext - Gestion de la session utilisateur
// ============================================================================

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Profile } from '@/types/auth';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Récupérer le profil complet
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (!error && profile) {
          setUser(profile);
        } else {
          setUser(null);
        }
      } else {
        // No auth user, but maybe root session?
        if (typeof window !== 'undefined' && localStorage.getItem('anylibre_root_session') === 'true') {
          setUser({
            id: '00000000-0000-0000-0000-000000000000',
            email: 'root@anylibre.com',
            display_name: 'Root Super Admin',
            role: 'super_admin'
          } as unknown as Profile);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Fallback: Check if we are in a Root Session
      if (typeof window !== 'undefined' && localStorage.getItem('anylibre_root_session') === 'true') {
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'root@anylibre.com',
          display_name: 'Root Super Admin',
          role: 'super_admin'
        } as unknown as Profile);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Écouter les changements d'authentification
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Clear Root Session serverside cookie
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
    
    localStorage.removeItem('anylibre_root_session');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}