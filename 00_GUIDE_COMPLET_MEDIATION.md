# 📖 GUIDE COMPLET - Corrections Médiation Présence

## 🎯 Ce Qui a Été Fait

### Le Problème Original

- ❌ Client et Provider ne voyaient pas la présence l'un de l'autre
- ❌ Le chat restait bloqué indéfiniment
- ❌ Les erreurs n'étaient pas visibles
- ❌ Impossible de diagnostiquer les problèmes

### Les Solutions Apportées

- ✅ **Correction d'identité user_id** - Utilise `user.id` directement
- ✅ **Correction recherche provider** - Utilise `eq('user_id', user.id)`
- ✅ **Logs détaillés** - Logs structurés `=== REQUEST ===`
- ✅ **Polling rapide** - Vérifie la présence toutes les 3 secondes
- ✅ **Gestion erreurs** - Affiche les erreurs à l'utilisateur

## 📂 Documents Créés / Modifiés

### Fichiers Modifiés (Code)

1. **`/api/disputes/[id]/presence/route.ts`**
   - GET: Meilleure récupération des présences
   - POST: Gestion correcte de user.id

2. **`/api/disputes/[id]/join/route.ts`**
   - Utilisation correcte de user.id partout
   - Correction recherche provider

3. **`/components/dispute/PresenceVerification.tsx`**
   - Polling réduit de 5s à 3s
   - Affichage des erreurs
   - Logs détaillés

### Fichiers Créés (Documentation)

1. **`CORRECTIONS_MEDIATION_RESUME.md`** ← ⭐ LIRE D'ABORD
   - Résumé des corrections
   - Points clés
   - Checklist finale

2. **`TEST_CHECKLIST.md`** ← ⭐ AVANT DE TESTER
   - Vérifications préalables
   - Étapes du test pas à pas
   - Indicateurs de succès

3. **`MANUAL_TEST_PRESENCE.md`**
   - Guide détaillé du test manuel
   - Scénarios de test
   - Points de contrôle

4. **`DEBUGGING_PRESENCE.md`**
   - Requêtes SQL de diagnostique
   - Requêtes curl
   - Problèmes courants et solutions

5. **`PRESENCE_MEDIATION_FIX_SUMMARY.md`**
   - Détails techniques complets
   - Flux de fonctionnement
   - Tests à faire

6. **`CREATE_MEDIATION_PRESENCE_FUNCTION.sql`**
   - SQL pour la fonction trigger

## 🚀 Guide Rapide (5 minutes)

### 1️⃣ Préparation (1 min)

```bash
# Vérifier que le serveur tourne
npm run dev

# Vérifier les variables d'env dans .env.local:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2️⃣ Vérification BD (1 min)

```sql
-- Dans Supabase SQL Editor:
SELECT COUNT(*) FROM mediation_presence;
-- Doit retourner un nombre (la table existe)
```

### 3️⃣ Ouverture des Onglets de Test (1 min)

- Onglet 1: Connecté en tant que CLIENT
- Onglet 2: Connecté en tant que PROVIDER
- F12 sur les deux → Console active

### 4️⃣ Test (2 min)

1. CLIENT va à `/litige/[dispute-id]` → Voir "En attente du prestataire"
2. PROVIDER va au MÊME litige → Voir "En attente du client"
3. Attendre 3 secondes:
   - CLIENT doit voir "Prestataire présent" ✅
   - PROVIDER doit voir "Client présent" ✅
4. Après 2-3 secondes → Les deux voient "Démarrage de la médiation..."
5. Les deux voient le chat et peuvent communiquer ✅

## 🔍 Vérifications Critiques

### Dans la Console du Navigateur (F12 → Console)

Chercher ces logs EXACTEMENT:

```
✅ PresenceVerification: Joining session...
✅ PresenceVerification: Presence data: {client: true, provider: false}
✅ PresenceVerification: Checking presence (répété)
✅ PresenceVerification: Both parties present! Starting chat...
```

Ou s'il y a une erreur:

```
❌ Erreur: "message d'erreur"
```

### Dans le Terminal du Serveur (npm run dev)

Chercher ces logs:

```
✅ === JOIN MEDIATION REQUEST ===
✅ === PRESENCE GET REQUEST ===
✅ === PRESENCE POST REQUEST ===
✅ Both parties present! Starting session
```

Ou s'il y a une erreur:

```
❌ Error: ...
❌ error: ...
```

### Dans l'Onglet Network (F12 → Network)

Chercher ces requêtes:

- ✅ POST `/api/disputes/[id]/join` → 200 OK
- ✅ GET `/api/disputes/[id]/presence` → 200 OK (toutes les 3s)
- ✅ POST `/api/disputes/[id]/presence` → 200 OK (toutes les 30s)

### Dans la Base de Données

```sql
SELECT user_id, role, is_present FROM mediation_presence
WHERE is_present = true;
-- Doit avoir exactement 2 lignes:
-- 1 avec role = 'client'
-- 1 avec role = 'provider'
```

## ⚠️ Points d'Attention

### 1. user_id vs id

- `user.id` = UUID du Supabase Auth (le bon)
- `profile.user_id` = référence au Auth (doit être identique)
- `profile.id` = ID interne du profile (ne pas confondre)

### 2. Présence Unique

- La table a un **index unique** sur `(dispute_id, user_id) WHERE is_present = true`
- Cela signifie un user ne peut avoir qu'UNE présence active par dispute
- Les anciennes présences deviennent `is_present = false`

### 3. Timeouts

- Heartbeat toutes les 30 secondes pour maintenir la présence
- Si plus de 5 minutes sans heartbeat = considérer comme absent
- (À implémenter avec une fonction cron)

## 🐛 Troubleshooting Rapide

| Symptôme                     | Cause                     | Solution                                                                |
| ---------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| "Présence non trouvée" (404) | Présence pas créée        | Vérifier logs du join pour "Presence creation error"                    |
| "Non autorisé" (401)         | Pas authentifié           | Se connecter d'abord                                                    |
| "Accès refusé" (403)         | Pas participant du litige | Utiliser le bon disputeId                                               |
| "Erreur serveur" (500)       | Exception serveur         | Chercher "error" dans logs                                              |
| Présence ne change pas       | Polling cassé             | Attendre 3s, vérifier les GET toutes les 3s                             |
| Provider ne voit pas client  | Mauvais user_id           | Vérifier DB: `SELECT * FROM mediation_presence WHERE is_present = true` |

## 📋 Checklist Finale

Avant de valider comme "FINI":

- [ ] `npm run build` compile sans erreur
- [ ] `npm run dev` tourne sans erreur
- [ ] Table `mediation_presence` existe
- [ ] Fonction trigger existe
- [ ] Test with 2 navigateurs réussi
- [ ] Pas d'erreur 404/403/500
- [ ] Logs client visibles et corrects
- [ ] Logs serveur visibles et corrects
- [ ] Les deux voient la présence mutuellement
- [ ] Chat fonctionne après presences
- [ ] Pas d'erreurs TypeScript

## 📚 Pour Plus de Détails

- **Résumé complet**: Voir `CORRECTIONS_MEDIATION_RESUME.md`
- **Avant de tester**: Voir `TEST_CHECKLIST.md`
- **Test détaillé**: Voir `MANUAL_TEST_PRESENCE.md`
- **Dépannage**: Voir `DEBUGGING_PRESENCE.md`
- **Tech spécifics**: Voir `PRESENCE_MEDIATION_FIX_SUMMARY.md`

## 🎉 Success Criteria

Vous avez réussi si:

```
┌─────────────────────────────────────┐
│  CLIENT                             │
│  ✅ Voit sa présence (Présent)     │
│  ✅ Voit la présence du Provider   │
│  ✅ Chat se lance quand les 2      │
│  ✅ Peut envoyer des messages      │
└─────────────────────────────────────┘
        ↔️  COMMUNICATION EN TEMPS RÉEL  ↔️
┌─────────────────────────────────────┐
│  PROVIDER                           │
│  ✅ Voit sa présence (Présent)     │
│  ✅ Voit la présence du Client     │
│  ✅ Chat se lance quand les 2      │
│  ✅ Peut envoyer des messages      │
└─────────────────────────────────────┘
```

## 🔗 Liens Importants

1. Accès aux fichiers:
   - Page mediation: `src/app/(protected)/litige/[id]/page.tsx`
   - Composant: `src/components/dispute/PresenceVerification.tsx`
   - API Join: `src/app/api/disputes/[id]/join/route.ts`
   - API Presence: `src/app/api/disputes/[id]/presence/route.ts`

2. Supabase:
   - Table: `mediation_presence`
   - Index: `idx_mediation_presence_unique_active`
   - Trigger: `trigger_update_mediation_presence_timestamp`

---

**Questions? Chercher le mot-clé dans `DEBUGGING_PRESENCE.md` ou dans l'un des fichiers de doc.**

**Code modifié? Chercher `=== ` dans les logs pour tracer.**

**Base de données? Chercher `SELECT ... FROM mediation_presence`** dans le guide SQL.

**Besoin de déployer? Vérifier la checklist dans `CORRECTIONS_MEDIATION_RESUME.md`**
