'use client';

import { useEffect, useState } from 'react';

/**
 * Composant qui gère l'authentification via hash fragment (#access_token=...)
 * Utilisé après une redirection magic link pour l'impersonation
 */
export default function AuthHashHandler() {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleAuthHash = async () => {
      // Vérifier s'il y a un hash fragment avec des tokens
      const hash = window.location.hash;

      if (!hash || !hash.includes('access_token') || isProcessing) {
        return;
      }

      setIsProcessing(true);
      console.log('[AUTH-HASH] Détection de tokens dans le hash fragment');

      try {
        // Parser le hash fragment pour extraire les tokens
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          console.error('[AUTH-HASH] Tokens manquants dans le hash');
          return;
        }

        console.log('[AUTH-HASH] Envoi des tokens au callback serveur...');

        // Nettoyer le hash AVANT la redirection
        window.history.replaceState(null, '', window.location.pathname);

        // Rediriger vers le callback serveur qui va créer la session avec cookies
        const redirectUrl = window.location.pathname;
        const callbackUrl = `/api/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&redirect=${encodeURIComponent(redirectUrl)}`;

        console.log('[AUTH-HASH] Redirection vers:', callbackUrl);
        window.location.href = callbackUrl;
      } catch (error) {
        console.error('[AUTH-HASH] Erreur:', error);
        setIsProcessing(false);
      }
    };

    // Attendre un peu que le DOM soit prêt
    const timeout = setTimeout(handleAuthHash, 100);
    return () => clearTimeout(timeout);
  }, [isProcessing]);

  return null;
}
