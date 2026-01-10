# 📊 Système de Tracking & AI Insights - Documentation Complète

## 🎯 Vue d'ensemble du Système

Le système de **tracking comportemental avec analyse IA** est maintenant **COMPLÈTEMENT ACTIVÉ** dans votre application AnyLibre. Il fonctionne automatiquement pour tous les utilisateurs (connectés et non-connectés).

---

## ✅ Composants Installés et Actifs

### 1. **Infrastructure SQL** (Supabase)
✅ **5 tables créées** dans `supabase/schema_user_tracking.sql`:

| Table | Description | Données stockées |
|-------|-------------|------------------|
| `user_activity_log` | Journal complet des activités | Vues services/providers, recherches, clics, scroll, durée |
| `user_preferences` | Préférences calculées par l'IA | Catégories favorites, mots-clés fréquents, profil comportemental |
| `ai_recommendations` | Recommandations personnalisées | Services recommandés avec scores de confiance |
| `user_insights` | Insights comportementaux | Analyses générées automatiquement |
| `search_history` | Historique des recherches | Toutes les recherches avec filtres et contexte |

### 2. **APIs Backend** (Route Handlers)
✅ **4 APIs actives**:

| API | Route | Fonction |
|-----|-------|----------|
| Activity Tracking | `/api/tracking/activity` | Enregistre une activité utilisateur en temps réel |
| Sync Data | `/api/tracking/sync` | Synchronise localStorage → Base de données |
| AI Analysis | `/api/ai/analyze` | Analyse comportementale complète avec profil IA |
| Recommandations | `/api/services/recommended` | Génère recommandations personnalisées |

### 3. **Système de Tracking Client**
✅ **Tracker automatique** (`src/lib/tracking/userTracker.ts`):

**Fonctionnalités actives:**
- ✅ Tracking automatique des pages vues
- ✅ Tracking des recherches avec filtres
- ✅ Tracking des vues de services
- ✅ Tracking des vues de providers
- ✅ Détection du type d'appareil (mobile/tablet/desktop)
- ✅ Mesure de scroll depth (profondeur de scroll)
- ✅ Mesure du temps passé sur chaque page
- ✅ Stockage en localStorage (fonctionne sans connexion)
- ✅ Synchronisation automatique toutes les 60 secondes
- ✅ Sync final avant fermeture de page

### 4. **Intégrations Actives dans l'App**
✅ **Tracking activé dans:**
- ✅ **TrackingProvider** → Tracking automatique de toutes les pages
- ✅ **Page Explorer** → Tracking des recherches
- ✅ **Page Service [id]** → Tracking des vues de services
- ✅ **Layout principal** → Provider intégré globalement

---

## 🔄 Comment le Système Fonctionne

### **FLUX COMPLET DU TRACKING**

```
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEUR NAVIGUE                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   TrackingProvider Active     │
         │   • Track page view           │
         │   • Mesure temps/scroll       │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │   Stockage localStorage       │
         │   • Views (100 dernières)     │
         │   • Searches (50 dernières)   │
         │   • Favorites                 │
         │   • Page views                │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Sync Auto (60 sec)           │
         │  POST /api/tracking/sync      │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Base de Données Supabase     │
         │  Table: user_activity_log     │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Utilisateur visite /insights │
         │  GET /api/ai/analyze          │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────────────────┐
         │         ANALYSE IA COMPLÈTE               │
         │  1. Récupère activités 30 derniers jours  │
         │  2. Analyse catégories préférées          │
         │  3. Analyse mots-clés de recherche        │
         │  4. Calcule profil comportemental:        │
         │     • Explorateur                         │
         │     • Chercheur                           │
         │     • Décisif                             │
         │     • Comparateur                         │
         │     • Spontané                            │
         │  5. Calcule score d'engagement (0-1)      │
         │  6. Analyse patterns temporels            │
         │  7. Génère insights personnalisés         │
         └───────────┬───────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Sauvegarde Résultats         │
         │  • user_preferences           │
         │  • user_insights              │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Affichage Page /insights     │
         │  • Profil comportemental      │
         │  • Score d'engagement         │
         │  • Top catégories             │
         │  • Insights personnalisés     │
         │  • Patterns temporels         │
         └───────────────────────────────┘
```

---

## 📱 Exemples Concrets d'Utilisation

### **Scénario 1: Utilisateur Recherche un Service**

1. **User tape** "graphiste logo" dans Explorer → 🔍 **TRACKING DÉCLENCHÉ**
2. **localStorage** enregistre: `{query: "graphiste logo", timestamp: Date.now(), filters: {sort: "popular"}}`
3. **API Call**: `POST /api/tracking/activity` avec `{activityType: "search", searchQuery: "graphiste logo"}`
4. **Base de données**: Nouvelle ligne dans `user_activity_log`

### **Scénario 2: Utilisateur Visite un Service**

1. **User clique** sur un service → 🎯 **TRACKING DÉCLENCHÉ**
2. **localStorage** enregistre: `{id: "uuid-123", type: "service", data: {title, category, price}}`
3. **userTracker.trackServiceView()** appelé
4. **API Call**: `POST /api/tracking/activity` avec `{activityType: "view_service", entityId: "uuid-123"}`
5. **Base de données**: Nouvelle ligne dans `user_activity_log`

### **Scénario 3: Analyse IA après 1 Semaine**

1. **User navigue** vers `/insights`
2. **API Call**: `GET /api/ai/analyze`
3. **Backend**:
   - Récupère toutes activités des 30 derniers jours
   - Compte: 45 vues, 12 recherches, 3 favoris
   - Catégories: Design (20x), Marketing (15x), Dev (10x)
   - Mots-clés: "logo" (8x), "graphiste" (6x)
   - **Profil calculé**: "Chercheur" (ratio recherche/action élevé)
   - **Score engagement**: 0.72 (actif)
4. **Insights générés**:
   - "Vous adorez Design" (20 services consultés)
   - "Vous recherchez activement" (12 recherches)
   - "Utilisateur très actif!" (score > 0.7)
5. **Affichage**: Page insights avec toutes les données visuelles

---

## 🎨 Page /insights - Ce Que L'Utilisateur Voit

### **Sections Affichées:**

#### 1. **Hero Section**
- Badge "Analyse IA Personnalisée"
- Titre avec gradient "Vos Insights Comportementaux"
- Description

#### 2. **Carte Profil** (si données disponibles)
- **Icône du profil**: 🔭 Explorateur / 🔬 Chercheur / ⚡ Décisif / ⚖️ Comparateur / 🎯 Spontané
- **Score d'engagement**: XX% (calculé sur activités)
- **Jours actifs**: Nombre de jours différents avec activité
- **Total activités**: Nombre total d'actions

#### 3. **Catégories Préférées** (si > 0)
- Grille 2 colonnes
- Chaque catégorie avec:
  - Nom de catégorie
  - Nombre de vues
  - Barre de progression (score relatif)

#### 4. **Insights Personnalisés** (si générés)
- Cards avec priorité (high/medium/low)
- Couleurs différentes par priorité
- Titre + description de chaque insight

#### 5. **Habitudes d'Utilisation** (patterns temporels)
- **Heure de pointe**: Ex "14h00"
- **Jour favori**: Ex "Mercredi"

---

## 🔧 Comment Vérifier Que Ça Fonctionne

### **Test 1: Vérifier localStorage**

Ouvrez la console du navigateur et tapez:

```javascript
JSON.parse(localStorage.getItem('anylibre_user_data'))
```

Vous devriez voir:
```json
{
  "views": [
    {"id": "uuid", "type": "service", "timestamp": 1234567890, "data": {...}},
    ...
  ],
  "searches": [
    {"query": "graphiste", "timestamp": 1234567890, "filters": {...}},
    ...
  ],
  "favorites": [],
  "lastSync": 1234567890,
  "sessionStart": 1234567890,
  "pageViews": {"/explorer": 3, "/service/abc": 1}
}
```

### **Test 2: Vérifier Base de Données Supabase**

Dans Supabase SQL Editor:

```sql
-- Voir les dernières activités trackées
SELECT
  activity_type,
  entity_type,
  search_query,
  created_at
FROM user_activity_log
WHERE user_id = 'votre-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

### **Test 3: Tester la Page Insights**

1. Naviguez sur le site (explorez services, faites recherches)
2. Attendez 60 secondes pour le sync auto
3. Allez sur `/insights`
4. Vérifiez que la page charge avec vos données

---

## 📈 Calcul du Profil Comportemental

Le système analyse le **ratio d'activités** pour déterminer le profil:

| Profil | Condition | Description |
|--------|-----------|-------------|
| **Chercheur** | `searchCount / total > 0.4` | Fait beaucoup de recherches avant décision |
| **Décisif** | `actionCount / total > 0.3` | Passe rapidement à l'action (favoris, commandes) |
| **Comparateur** | `viewCount > 50 && actionCount/viewCount < 0.1` | Compare longuement, agit peu |
| **Spontané** | `actionCount/total > 0.2 && searchCount/total < 0.2` | Suit son instinct, cherche peu |
| **Explorateur** | Par défaut | Découvre et parcourt diverses catégories |
| **Nouveau** | `totalActivities === 0` | Pas encore assez de données |

---

## 🎯 Calcul du Score d'Engagement

**Formule:**
```javascript
score = (totalActivities / 100) * 0.4 +
        (uniqueDays / 30) * 0.3 +
        (actionCount / totalActivities) * 0.3
```

**Composantes:**
- **40%**: Volume d'activités (max 100)
- **30%**: Régularité (jours actifs sur 30)
- **30%**: Taux de conversion (actions/vues)

**Résultat**: Score entre 0.0 et 1.0 (affiché en %)

---

## 🚀 Recommandations Personnalisées

### **Comment Ça Marche**

API: `GET /api/services/recommended`

**4 Stratégies de Recommandation:**

1. **Catégories Préférées** (score 0.8)
   - Services populaires dans vos top 3 catégories

2. **Similaires aux Vus** (score 0.75)
   - Services similaires à ceux récemment consultés

3. **Mots-clés de Recherche** (score 0.7)
   - Services matchant vos 5 mots-clés les plus fréquents

4. **Tendances** (score 0.6)
   - Services les plus populaires globalement

**Cache:** Recommandations valides 7 jours

---

## 📊 Tables SQL - Détails

### **user_activity_log**
```sql
- id: UUID
- user_id: UUID (FK profiles)
- activity_type: TEXT (view_service, search, favorite, etc.)
- entity_type: TEXT (service, provider, category, etc.)
- entity_id: UUID
- entity_data: JSONB (données contextuelles)
- search_query: TEXT
- filters_applied: JSONB
- duration_seconds: INTEGER
- scroll_depth: INTEGER
- page_url: TEXT
- referrer_url: TEXT
- device_type: TEXT (mobile/tablet/desktop)
- created_at: TIMESTAMPTZ
```

### **user_preferences**
```sql
- id: UUID
- user_id: UUID (FK profiles, unique)
- favorite_categories: JSONB [{name, count, score}]
- frequent_keywords: JSONB [{keyword, count}]
- behavioral_profile: TEXT (explorer, researcher, etc.)
- engagement_score: DECIMAL
- search_patterns: JSONB (patterns temporels)
- last_calculated_at: TIMESTAMPTZ
```

---

## ⚡ Points Importants

### **Tracking Automatique**
- ✅ Toutes les pages sont automatiquement trackées (via TrackingProvider)
- ✅ Pas besoin d'ajouter du code dans chaque composant
- ✅ Fonctionne même sans connexion (localStorage)

### **Synchronisation**
- ✅ Sync auto toutes les 60 secondes
- ✅ Sync avant fermeture de page (`beforeunload`)
- ✅ Nécessite authentification pour sauvegarder en DB

### **Performances**
- ✅ localStorage limité: 100 vues, 50 recherches
- ✅ Cache des recommandations: 7 jours
- ✅ Analyse calculée à la demande (pas en temps réel)

### **Privacy**
- ✅ Tracking anonyme possible (localStorage seulement)
- ✅ Données par utilisateur (pas de partage)
- ✅ RLS activé sur toutes les tables

---

## 🎨 Prochaines Améliorations Possibles

1. **Dashboard Provider**: Analytics des vues sur leurs services
2. **A/B Testing**: Tester différentes recommandations
3. **Notifications**: Alertes sur nouveaux services dans catégories préférées
4. **Export Données**: Permettre export GDPR
5. **ML Avancé**: Modèle de recommandation plus sophistiqué

---

## 🐛 Troubleshooting

### **Problème: Les données ne s'affichent pas dans /insights**

**Solutions:**
1. Vérifiez que vous êtes connecté
2. Vérifiez localStorage: `localStorage.getItem('anylibre_user_data')`
3. Forcez un sync: Actualisez la page et attendez 60s
4. Vérifiez la base de données Supabase (voir requêtes SQL ci-dessus)

### **Problème: localStorage vide**

**Cause**: Le tracker ne s'initialise pas
**Solutions:**
1. Vérifiez que `TrackingProvider` est bien dans `Providers.tsx`
2. Vérifiez la console pour erreurs JavaScript
3. Hard refresh: Ctrl + Shift + R

### **Problème: "Pas assez de données pour une analyse"**

**Cause**: Moins de 1 activité trackée
**Solution**: Naviguez sur le site (explorer, services, recherches) puis revenez sur /insights

---

## ✅ Checklist de Vérification

- ✅ Tables SQL créées dans Supabase
- ✅ APIs `/api/tracking/*` et `/api/ai/*` fonctionnent
- ✅ `TrackingProvider` créé et intégré
- ✅ localStorage se remplit pendant navigation
- ✅ Sync auto toutes les 60s
- ✅ Page `/insights` accessible
- ✅ Analyse IA génère profil comportemental
- ✅ Recommandations disponibles via API

---

## 📞 Support

Pour toute question:
1. Vérifiez cette documentation
2. Consultez le code source:
   - `src/lib/tracking/userTracker.ts`
   - `src/app/api/ai/analyze/route.ts`
   - `src/app/(protected)/insights/page.tsx`
3. Vérifiez les logs console et réseau (Network tab)

**Système complet et opérationnel ! 🎉**