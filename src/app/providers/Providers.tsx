// ============================================================================
// Component: Providers - Wrapper pour tous les providers client
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TrackingProvider } from '@/components/providers/TrackingProvider';
import { TranslationProvider } from '@/components/translation/GlobalTranslationIndicator';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationModal } from '@/components/notifications/NotificationModal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <TranslationProvider>
            <TrackingProvider>
              {children}
              <NotificationModal />
            </TrackingProvider>
          </TranslationProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
