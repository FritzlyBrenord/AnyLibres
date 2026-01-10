# 🔧 Fix Simple : Ajouter user_id à provider_earnings

## Problème

L'API cherche les earnings avec `user.id`, mais la table `provider_earnings` stocke seulement `provider_id` qui peut être un `profile_id` ou `providers.id`, pas directement un `user_id`.

## Solution

Ajouter une colonne `user_id` à la table `provider_earnings` pour stocker **les deux IDs** :
- `provider_id` : ID du provider (providers.id ou profile.id)
- `user_id` : ID de l'utilisateur (auth.users.id) ← **NOUVEAU**

## 🚀 Exécution

### 1. Ouvrir Supabase SQL Editor

### 2. Copier et exécuter ce script

**Fichier** : `migrations/add_user_id_to_earnings.sql`

Ou copiez directement le contenu dans l'éditeur SQL de Supabase et cliquez sur **RUN**.

### 3. Ce que fait le script

1. ✅ Ajoute la colonne `user_id` à `provider_earnings`
2. ✅ Ajoute une FK vers `auth.users(id)`
3. ✅ Remplit automatiquement `user_id` pour tous les earnings existants
4. ✅ Met à jour la fonction `create_provider_earning()` pour remplir les deux IDs
5. ✅ Met à jour `provider_balance` pour utiliser `user_id` comme `provider_id`

### 4. Vérification

Après l'exécution, vous devriez voir :

```sql
-- Vérifier que user_id est bien rempli
SELECT
  COUNT(*) AS total,
  COUNT(user_id) AS avec_user_id
FROM provider_earnings;
```

**Résultat attendu** : `total` = `avec_user_id` (tous les earnings ont un user_id)

### 5. Tester dans l'app

1. Rechargez le **Tableau de Bord Provider**
2. La section **"Mes gains"** devrait maintenant afficher les vrais montants
3. Les earnings devraient s'afficher dans l'historique

## ✅ Après la migration

L'API utilisera désormais :
- `provider_balance.provider_id = user.id` pour le solde
- `provider_earnings.user_id = user.id` pour l'historique

Plus de confusion entre provider_id et user_id ! 🎉

---

**Date** : 2025-12-11
**Status** : Ready to Execute ✅
