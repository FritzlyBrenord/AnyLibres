# 📊 Analytics Live - Documentation Complète

## 🎯 Aperçu

**Analytics Live** est une fonctionnalité premium du panneau administrateur Anylibre qui offre une vue d'ensemble en temps réel des activités de la plateforme avec deux modes principaux :

1. **Mode Live** : Mise à jour chaque seconde
2. **Mode Historique** : Données par période (jour, semaine, mois, année)

---

## 🚀 Démarrage Rapide

### Installation

Toutes les dépendances sont déjà configurées dans le projet :

```bash
npm install
```

### Accès à Analytics Live

1. Ouvrir le panneau administrateur
2. Cliquer sur le bouton **"Analytics Live"** dans l'en-tête
3. Sélectionner entre **Live** et **Historique**

---

## 📱 Fonctionnalités Principales

### 1️⃣ **Live Dashboard**

#### Utilisateurs En Ligne

- **Affiche** : Nom, Email, Rôle, Statut (Online/Idle/Away)
- **Informations** : Heure de connexion, Durée en ligne
- **Recherche** : Filtrer par nom ou email
- **Mise à jour** : Temps réel (1 seconde)

#### Statistiques en Temps Réel

- Nombre total d'utilisateurs connectés
- Répartition par rôle (Clients, Prestataires, Admins)
- Commandes actives
- Visiteurs non connectés
- Revenus du jour

#### Commandes En Temps Réel

- **Affiche** : Service, Client, Prestataire, Montant
- **Statuts** : Pending, Accepted, In Progress, Completed, Cancelled
- **Icônes** : Visuelles pour chaque statut
- **Couleurs** : Code couleur par statut
- **Mise à jour** : Automatique lors de changements

#### Visiteurs

- **Affiche** : Localisation, Page visitée, Temps de session
- **Suivi** : Activité des visiteurs non inscrits

### 2️⃣ **Historique Dashboard**

#### Sélection de Période

- Aujourd'hui
- Dernière semaine
- Dernier mois
- Dernière année

#### Statistiques Disponibles

```
- Nombre total de commandes
- Revenus totaux
- Nouvelles inscriptions
- Utilisateurs actifs
- Prestataires actifs
- Visiteurs uniques
```

#### Export de Données

- Télécharger les rapports en format approprié

---

## 🏗️ Architecture Technique

### Structure des Fichiers

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       ├── analytics-live/
│   │       │   └── route.ts          # Endpoint Live
│   │       └── analytics-history/
│   │           └── route.ts          # Endpoint Historique
│   └── (Administrateur)/
│       └── Components/
│           ├── AdminHeader.tsx       # En-tête modifié
│           ├── AnalyticsLive.tsx     # Composant principal
│           └── AnalyticsComponents.tsx # Composants réutilisables
├── config/
│   └── analyticsConfig.ts            # Configuration
├── hooks/
│   └── useRealtimeAnalytics.ts       # Hooks Realtime
└── utils/
    └── userActivityTracker.ts        # Tracker d'activité
```

### Flux de Données

```
AdminHeader (État: showAnalytics)
    ↓
AnalyticsLive Component (State Management)
    ↓
API Endpoints (/api/admin/analytics-live)
    ↓
Supabase (Queries + Realtime)
    ↓
Rendu des Composants
```

---

## 🔌 Endpoints API

### GET `/api/admin/analytics-live?period=week`

**Réponse :**

```json
{
  "onlineUsers": [
    {
      "id": "user-id",
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "role": "provider",
      "connectedAt": "2026-01-15T10:30:00Z",
      "lastActivity": "2026-01-15T10:35:00Z",
      "status": "online"
    }
  ],
  "liveOrders": [
    {
      "id": "order-id",
      "clientName": "Marie Martin",
      "providerName": "Jean Dupont",
      "service": "Design Web",
      "status": "in_progress",
      "amount": 150,
      "currency": "EUR",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:35:00Z"
    }
  ],
  "stats": {
    "totalOnline": 24,
    "clientsOnline": 15,
    "providersOnline": 8,
    "adminsOnline": 1,
    "totalVisitors": 45,
    "activeOrders": 12,
    "completedToday": 8,
    "revenueToday": 2450
  }
}
```

### GET `/api/admin/analytics-history?period=week`

**Réponse :**

```json
{
  "period": "week",
  "startDate": "2026-01-08T00:00:00Z",
  "endDate": "2026-01-15T23:59:59Z",
  "stats": {
    "totalOrders": 156,
    "totalRevenue": 12450,
    "newUsers": 23,
    "newProviders": 5,
    "activeUsers": 145,
    "ordersByStatus": {
      "pending": 5,
      "accepted": 8,
      "in_progress": 12,
      "completed": 125,
      "cancelled": 6
    }
  },
  "dailyStats": [
    {
      "date": "2026-01-08",
      "orders": 22,
      "revenue": 1850,
      "completed": 18,
      "pending": 4
    }
  ]
}
```

---

## 🔄 Réaltime avec Supabase

### Hooks Disponibles

#### 1. `useOrdersRealtime`

```tsx
import { useOrdersRealtime } from "@/hooks/useRealtimeAnalytics";

const [orders, setOrders] = useState([]);

useOrdersRealtime(
  (change) => {
    console.log("Changement de commande:", change);
    // Met à jour l'état
  },
  true // enabled
);
```

#### 2. `useUsersRealtime`

```tsx
const [users, setUsers] = useState([]);

useUsersRealtime((change) => {
  console.log("Changement utilisateur:", change);
}, true);
```

#### 3. `usePresenceRealtime`

```tsx
const [presences, setPresences] = useState([]);

usePresenceRealtime((presenceList) => {
  console.log("Utilisateurs présents:", presenceList);
}, true);
```

---

## 🎨 Thème et Design

### Couleurs Premium

- **Gradient Principal** : Blue → Cyan
- **Statuts** : Codes couleur spécifiques
- **Mode Sombre** : Activé par défaut
- **Mode Clair** : Adapté au contraste

### Composants Réutilisables

```tsx
import {
  StatsCard,
  UserItem,
  OrderItem,
  LoadingSkeleton,
} from "@/app/(Administrateur)/Components/AnalyticsComponents";
```

---

## ⚙️ Configuration

### Fichier : `src/config/analyticsConfig.ts`

```typescript
export const ANALYTICS_CONFIG = {
  REFRESH_INTERVAL: 1000, // 1 seconde
  INACTIVITY_TIMEOUT: 5 * 60000, // 5 minutes
  ALERTS: {
    MAX_PENDING_ORDERS: 50,
    MIN_ACTIVE_USERS: 10,
    MIN_DAILY_REVENUE: 100,
  },
  LIMITS: {
    MAX_USERS_DISPLAY: 50,
    MAX_ORDERS_DISPLAY: 20,
    MAX_VISITORS_DISPLAY: 15,
  },
  REALTIME: {
    ENABLE_ORDERS_REALTIME: true,
    ENABLE_USERS_REALTIME: true,
    ENABLE_PRESENCE: true,
  },
};
```

---

## 📊 Tracking d'Activité

### Initialisation

```tsx
import { useActivityTracker } from "@/utils/userActivityTracker";

function MyComponent() {
  const { user } = useAuth();
  useActivityTracker(user?.id);

  return <div>...</div>;
}
```

### Événements Trackés

- Login / Logout
- Page Views
- Clicks
- Search
- Scroll
- Statut (Online/Idle/Away/Offline)

---

## 🔐 Sécurité

### Protection

- ✅ Vérification d'authentification (Admin only)
- ✅ Authentification Supabase RLS
- ✅ Pas d'données sensibles exposées
- ✅ Rate limiting recommandé

### Bonnes Pratiques

```typescript
// Vérifier l'authentification
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## 🚨 Troubleshooting

### Les données ne se mettent pas à jour

- ✓ Vérifier la connexion Supabase
- ✓ Vérifier les permissions RLS
- ✓ Vérifier les erreurs console

### Realtime ne fonctionne pas

- ✓ Activer Realtime dans Supabase
- ✓ Vérifier `ENABLE_*_REALTIME` en config
- ✓ Vérifier les subscriptions

### Performance lente

- ✓ Réduire `REFRESH_INTERVAL`
- ✓ Réduire `MAX_*_DISPLAY` limits
- ✓ Optimiser les requêtes Supabase

---

## 📈 Optimisations Futures

- [ ] WebSocket direct pour Realtime
- [ ] Cache côté client
- [ ] Graphiques interactifs (recharts)
- [ ] Export PDF/CSV
- [ ] Notifications en temps réel
- [ ] Alertes automatiques
- [ ] Dashboard mobile
- [ ] Filtres avancés

---

## 📝 Notes de Développement

### TypeScript

Tous les composants sont entièrement typés pour une meilleure DX.

### Tailwind CSS

Design responsive utilisant Tailwind CSS v4 avec supports sombre/clair.

### Localisation

Support multi-langue (FR, EN, ES) via `useLanguageContext`.

---

## 🤝 Support

Pour toute question ou problème, consultez :

- Documentation Supabase : https://supabase.com/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation Tailwind : https://tailwindcss.com/docs

---

**Dernière mise à jour** : 15 janvier 2026
**Version** : 1.0.0
**Status** : ✅ Production Ready
