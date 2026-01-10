# 🔧 FIX FINAL : Corriger les earnings (provider_id incorrect)

## 🐛 Problème Identifié

Les earnings ont été créés avec **le mauvais ID** :

### Dans la table `orders` :
- `client_id` = `6e2266bb-014c-4af7-8917-7b4f4e921557` (celui qui achète)
- `provider_id` = `f47222d0-5e07-49f0-9202-650403b0ce74` (celui qui fournit le service)

### Dans la table `provider_earnings` (INCORRECT) :
- `provider_id` = `6e2266bb-014c-4af7-8917-7b4f4e921557` ← **C'est le CLIENT_ID, pas le PROVIDER_ID !**

**Résultat** : Les gains sont attribués au client au lieu du provider ! 😱

---

## ✅ Solution

Exécuter **2 migrations dans cet ordre** :

### 1️⃣ Ajouter la colonne `user_id`
**Fichier** : `migrations/add_user_id_to_earnings.sql`

### 2️⃣ Corriger les `provider_id` incorrects
**Fichier** : `migrations/fix_wrong_provider_id_in_earnings.sql`

---

## 🚀 Exécution

### Étape 1 : Ouvrir Supabase SQL Editor

### Étape 2 : Exécuter la première migration

Copiez tout le contenu de **`migrations/add_user_id_to_earnings.sql`** et exécutez-le.

Cela va :
- ✅ Ajouter la colonne `user_id` à `provider_earnings`
- ✅ Ajouter une FK vers `auth.users(id)`

### Étape 3 : Exécuter la deuxième migration (CORRECTION)

Copiez tout le contenu de **`migrations/fix_wrong_provider_id_in_earnings.sql`** et exécutez-le.

Cela va :
- ✅ Corriger `provider_id` dans tous les earnings (prendre depuis `orders.provider_id`)
- ✅ Remplir `user_id` en résolvant `provider_id → user_id`
- ✅ Recalculer tous les soldes `provider_balance`
- ✅ Afficher un résumé des gains par provider

---

## 📊 Vérifications

### 1. Vérifier que provider_id est corrigé

```sql
SELECT
  pe.id,
  pe.provider_id AS earning_provider,
  pe.user_id,
  u.email,
  o.provider_id AS order_provider,
  (pe.net_amount_cents / 100.0) AS net_euros
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
LEFT JOIN auth.users u ON u.id = pe.user_id
LIMIT 10;
```

**Résultat attendu** : `earning_provider` = `order_provider` ✅

### 2. Vérifier les soldes

```sql
SELECT
  pb.provider_id,
  u.email,
  (pb.available_cents / 100.0) AS disponible,
  (pb.pending_cents / 100.0) AS en_attente,
  (pb.total_earned_cents / 100.0) AS total
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC;
```

**Résultat attendu** : Les providers (pas les clients) ont des soldes ✅

### 3. Tester dans l'application

1. Connectez-vous en tant que **provider** (celui qui fournit le service)
2. Allez sur le **Tableau de Bord**
3. Section **"Mes gains"** devrait maintenant afficher les vrais montants

---

## 📝 Ce qui a été corrigé

| Avant | Après |
|-------|-------|
| ❌ `provider_earnings.provider_id` = `orders.client_id` | ✅ `provider_earnings.provider_id` = `orders.provider_id` |
| ❌ Pas de `user_id` | ✅ `user_id` résolu via providers/profiles |
| ❌ Gains attribués au client | ✅ Gains attribués au provider |
| ❌ Soldes incorrects | ✅ Soldes recalculés correctement |

---

## ⚠️ Important

Après avoir exécuté les 2 migrations :
- Les anciens earnings **avec le mauvais provider_id** seront corrigés
- Les soldes seront **recalculés** depuis zéro
- Les futurs earnings seront créés avec **les bons IDs**

---

**Date** : 2025-12-11
**Status** : Ready to Execute ✅
**Ordre d'exécution** :
1. `add_user_id_to_earnings.sql`
2. `fix_wrong_provider_id_in_earnings.sql`
