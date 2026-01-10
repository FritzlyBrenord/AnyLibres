// ============================================================================
// Component: Providers - Wrapper pour tous les providers client
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TrackingProvider } from '@/components/providers/TrackingProvider';
import { TranslationProvider } from '@/components/translation/GlobalTranslationIndicator';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <TranslationProvider>
          <TrackingProvider>{children}</TrackingProvider>
        </TranslationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
