'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionsContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (slug: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    const isRoot = typeof window !== 'undefined' && localStorage.getItem('anylibre_root_session') === 'true';

    console.log('[PERMISSIONS] Fetching permissions...');
    console.log('[PERMISSIONS] User:', user);
    console.log('[PERMISSIONS] Is Root:', isRoot);

    if (!user) {
      console.log('[PERMISSIONS] No user, setting empty permissions');
      setPermissions([]);
      setLoading(false);
      return;
    }

    const adminRoles = ['admin', 'super_admin', 'moderator', 'support', 'finance', 'content_manager'];
    const userRole = user.role as string;
    console.log('[PERMISSIONS] User role:', userRole);
    console.log('[PERMISSIONS] Is admin role?', adminRoles.includes(userRole));

    if (!adminRoles.includes(userRole) && !isRoot) {
      console.log('[PERMISSIONS] Not admin role and not root, setting empty permissions');
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Root Super Admin or technical super_admin gets all permissions automatically
    if (isRoot || userRole === 'super_admin') {
      console.log('[PERMISSIONS] ⚠️ SUPER ADMIN DETECTED - Granting ALL_ACCESS');
      setPermissions(['ALL_ACCESS']); // Special flag for total access
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[PERMISSIONS] Fetching from API /api/admin/me/permissions');
      const response = await fetch('/api/admin/me/permissions');
      const data = await response.json();
      
      console.log('[PERMISSIONS] API Response:', data);
      
      if (data.success) {
        console.log('[PERMISSIONS] ✅ Loaded permissions:', data.permissions);
        setPermissions(data.permissions);
      } else {
        console.log('[PERMISSIONS] ❌ API returned error:', data.error);
      }
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const hasPermission = (slug: string) => {
    // Si Root ou Super Admin, accès total
    if (permissions.includes('ALL_ACCESS')) {
      console.log(`[PERMISSIONS] hasPermission("${slug}") = TRUE (ALL_ACCESS)`);
      return true;
    }
    
    // Sinon, vérification du slug
    const has = permissions.includes(slug);
    console.log(`[PERMISSIONS] hasPermission("${slug}") = ${has} | Available:`, permissions);
    return has;
  };

  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission, refreshPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
