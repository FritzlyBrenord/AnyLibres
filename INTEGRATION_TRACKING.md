# Guide d'Intégration du Système de Tracking

## 📋 Vue d'ensemble

Le système de tracking est **déjà créé** mais **pas encore activé** dans l'application. Ce guide explique comment l'intégrer.

## ✅ Ce qui existe déjà

### 1. Tables SQL (Supabase)
- ✅ `user_activity_log` - Toutes les activités utilisateur
- ✅ `user_preferences` - Préférences calculées par l'IA
- ✅ `ai_recommendations` - Recommandations personnalisées
- ✅ `user_insights` - Insights comportementaux
- ✅ `search_history` - Historique des recherches

### 2. APIs Backend
- ✅ `/api/tracking/activity` - Enregistre une activité
- ✅ `/api/tracking/sync` - Synchronise localStorage → DB
- ✅ `/api/ai/analyze` - Analyse comportementale IA
- ✅ `/api/services/recommended` - Recommandations personnalisées

### 3. Système de Tracking
- ✅ `src/lib/tracking/userTracker.ts` - Classe singleton de tracking
- ✅ Tracking localStorage + sync automatique
- ✅ Détection device type
- ✅ Tracking scroll depth

## 🚀 Comment Activer le Tracking

### Étape 1: Créer un Provider de Tracking

**Fichier à créer:** `src/components/providers/TrackingProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { userTracker } from '@/lib/tracking/userTracker';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Track page views
  useEffect(() => {
    userTracker.trackPageView(pathname);

    return () => {
      userTracker.trackPageExit();
    };
  }, [pathname]);

  return <>{children}</>;
}
```

### Étape 2: Ajouter le Provider dans le Layout

**Fichier à modifier:** `src/app/layout.tsx`

```typescript
import { TrackingProvider } from '@/components/providers/TrackingProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <TrackingProvider>
            {children}
          </TrackingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Étape 3: Intégrer dans les Pages

#### A. Page de Service (track view)

**Fichier:** `src/app/(public)/service/[id]/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { userTracker } from '@/lib/tracking/userTracker';

export default function ServicePage({ params }) {
  const serviceId = params.id;

  useEffect(() => {
    // Track service view
    userTracker.trackServiceView(serviceId, {
      category: service.category,
      price: service.base_price_cents,
    });
  }, [serviceId]);

  // ... rest of component
}
```

#### B. Barre de Recherche (track search)

**Fichier:** `src/components/search/SearchBar.tsx` ou similaire

```typescript
import { userTracker } from '@/lib/tracking/userTracker';

const handleSearch = (query: string, filters: any) => {
  // Track search
  userTracker.trackSearch(query, filters);

  // Execute search
  performSearch(query, filters);
};
```

#### C. Bouton Favoris (track favorite)

```typescript
import { userTracker } from '@/lib/tracking/userTracker';

const handleFavoriteToggle = async (serviceId: string) => {
  const newState = !isFavorite;
  setIsFavorite(newState);

  // Track favorite action
  userTracker.trackFavorite(serviceId, newState);

  // Save to database
  await saveFavorite(serviceId, newState);
};
```

#### D. Page Provider (track provider view)

**Fichier:** `src/app/(public)/provider/[id]/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { userTracker } from '@/lib/tracking/userTracker';

export default function ProviderPage({ params }) {
  const providerId = params.id;

  useEffect(() => {
    // Track provider view
    userTracker.trackProviderView(providerId, {
      name: provider.name,
      rating: provider.rating,
    });
  }, [providerId]);

  // ... rest of component
}
```

## 📊 Vérifier que le Tracking Fonctionne

### 1. Dans le Browser Console

```javascript
// Voir les données en localStorage
JSON.parse(localStorage.getItem('anylibre_user_data'));
```

### 2. Dans Supabase

```sql
-- Voir les activités récentes
SELECT * FROM user_activity_log
ORDER BY created_at DESC
LIMIT 20;

-- Voir les préférences calculées
SELECT * FROM user_preferences
ORDER BY last_calculated_at DESC;
```

### 3. Tester la Page Insights

1. Naviguer vers `/insights`
2. Devrait charger l'analyse comportementale
3. Si vide → pas assez de données → commencer à naviguer

## 🎯 Utiliser les Recommandations

### Dans la Page Home

**Fichier:** `src/app/(protected)/home/page.tsx`

```typescript
const [recommendations, setRecommendations] = useState([]);

useEffect(() => {
  // Charger les recommandations personnalisées
  fetch('/api/services/recommended')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setRecommendations(data.data);
      }
    });
}, []);

// Afficher les recommandations
<section>
  <h2>Recommandé pour vous</h2>
  {recommendations.map(service => (
    <ServiceCard key={service.id} service={service} />
  ))}
</section>
```

## 🔄 Flux Complet

1. **User navigue** → `TrackingProvider` track page view
2. **User voit un service** → `trackServiceView()` → API `/api/tracking/activity` → Table `user_activity_log`
3. **User fait une recherche** → `trackSearch()` → API → DB
4. **Toutes les 60s** → Sync localStorage vers DB via `/api/tracking/sync`
5. **User visite /insights** → API `/api/ai/analyze` → Calcule profil comportemental → Sauvegarde dans `user_preferences` et `user_insights`
6. **User voit recommandations** → API `/api/services/recommended` → Charge de `ai_recommendations` ou génère nouvelles

## ⚠️ Points Importants

1. **Le tracking nécessite l'authentification** pour stocker en DB
2. **LocalStorage fonctionne même sans auth** (pour utilisateurs non connectés)
3. **Sync automatique toutes les 60 secondes** si utilisateur connecté
4. **Sync final avant fermeture** de la page (`beforeunload`)

## 📝 Prochaines Étapes

1. ✅ Créer `TrackingProvider.tsx`
2. ✅ Ajouter dans `layout.tsx`
3. ✅ Intégrer dans pages service/provider
4. ✅ Intégrer dans barre de recherche
5. ✅ Tester le flux complet
6. ✅ Vérifier les données dans Supabase
7. ✅ Vérifier la page `/insights`

## 🎨 Exemple Complet d'Intégration

Voir les fichiers suivants pour des exemples complets:
- `src/lib/tracking/userTracker.ts` - Le tracker
- `src/app/api/tracking/activity/route.ts` - L'API d'activité
- `src/app/api/ai/analyze/route.ts` - L'analyse IA
- `src/app/(protected)/insights/page.tsx` - La page d'insights