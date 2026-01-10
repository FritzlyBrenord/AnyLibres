// ============================================================================
// Component: FavoriteButton - Bouton ajout/retrait favoris
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface FavoriteButtonProps {
  serviceId: string;
  initialIsFavorite?: boolean;
}

export default function FavoriteButton({ serviceId, initialIsFavorite = false }: FavoriteButtonProps) {
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier le statut favori au chargement
    checkFavoriteStatus();
  }, [serviceId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites?serviceId=${serviceId}`);
      const data = await response.json();
      if (data.success) {
        setIsFavorite(data.data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      if (isFavorite) {
        // Retirer des favoris
        const response = await fetch(`/api/favorites?serviceId=${serviceId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (data.success) {
          setIsFavorite(false);
        } else {
          throw new Error(data.error || 'Failed to remove from favorites');
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serviceId }),
        });
        const data = await response.json();

        if (data.success) {
          setIsFavorite(true);
        } else {
          throw new Error(data.error || 'Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rediriger vers login si non authentifié
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isFavorite
          ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300 hover:text-red-600'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFavorite ? t.service.removeFromFavorites : t.service.addToFavorites}
    >
      <Heart
        className={`w-5 h-5 transition-all ${
          isFavorite ? 'fill-red-600' : ''
        }`}
      />
      <span className="hidden sm:inline">
        {isFavorite ? t.service.removeFromFavorites : t.service.addToFavorites}
      </span>
    </button>
  );
}
