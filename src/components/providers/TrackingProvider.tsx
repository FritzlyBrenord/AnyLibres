// ============================================================================
// PROVIDER: Tracking System
// Système de tracking automatique des pages vues
// ============================================================================

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { userTracker } from '@/lib/tracking/userTracker';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track page views automatiquement
  useEffect(() => {
    userTracker.trackPageView(pathname);

    // Track page exit au démontage
    return () => {
      userTracker.trackPageExit();
    };
  }, [pathname]);

  return <>{children}</>;
}