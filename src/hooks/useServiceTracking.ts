// ============================================================================
// Hook: useServiceTracking - Tracking des services visités
// Enregistre automatiquement quand un utilisateur consulte un service
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TrackServiceViewOptions {
  serviceId: string;
  serviceTitle?: string;
  categoryId?: string;
  providerId?: string;
}

export function useServiceTracking({
  serviceId,
  serviceTitle,
  categoryId,
  providerId,
}: TrackServiceViewOptions) {
  const { user } = useAuth();

  useEffect(() => {
    // Ne rien faire si pas d'utilisateur ou pas de serviceId
    if (!user || !serviceId) return;

    const trackView = async () => {
      try {
        // Enregistrer la vue dans la base de données
        await fetch('/api/user/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId,
            serviceTitle,
            categoryId,
            providerId,
          }),
        });

        // Aussi enregistrer dans localStorage pour les suggestions rapides
        const recentViews = JSON.parse(
          localStorage.getItem('recentViews') || '[]'
        );

        const newView = {
          id: serviceId,
          title: serviceTitle,
          viewedAt: new Date().toISOString(),
        };

        // Ajouter en début de liste
        const updatedViews = [
          newView,
          ...recentViews.filter((v: any) => v.id !== serviceId),
        ].slice(0, 20); // Garder seulement les 20 derniers

        localStorage.setItem('recentViews', JSON.stringify(updatedViews));
      } catch (error) {
        console.error('Error tracking service view:', error);
        // Ne pas bloquer l'affichage si le tracking échoue
      }
    };

    // Délai pour éviter les tracking multiples lors de la navigation
    const timer = setTimeout(trackView, 1000);

    return () => clearTimeout(timer);
  }, [serviceId, user, serviceTitle, categoryId, providerId]);
}

// Hook pour tracker les recherches
export function useSearchTracking() {
  const { user } = useAuth();

  const trackSearch = (query: string, filters?: Record<string, any>) => {
    if (!query.trim()) return;

    try {
      // Enregistrer dans localStorage
      const recentSearches = JSON.parse(
        localStorage.getItem('recentSearches') || '[]'
      );

      const newSearch = {
        query: query.trim(),
        filters,
        searchedAt: new Date().toISOString(),
      };

      // Ajouter en début de liste
      const updatedSearches = [
        newSearch,
        ...recentSearches.filter((s: any) => s.query !== query.trim()),
      ].slice(0, 10); // Garder seulement les 10 dernières

      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      // Si utilisateur connecté, enregistrer aussi dans la base de données
      if (user) {
        fetch('/api/user/track-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim(),
            filters,
          }),
        }).catch((error) => {
          console.error('Error tracking search:', error);
        });
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  return { trackSearch };
}

// Hook pour tracker les clics sur les catégories
export function useCategoryTracking() {
  const { user } = useAuth();

  const trackCategory = (categoryId: string, categoryName: string) => {
    if (!user || !categoryId) return;

    try {
      fetch('/api/user/track-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          categoryName,
        }),
      }).catch((error) => {
        console.error('Error tracking category:', error);
      });
    } catch (error) {
      console.error('Error tracking category:', error);
    }
  };

  return { trackCategory };
}
