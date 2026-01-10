# 🔧 Guide d'Exécution - Correction Migration Provider Earnings

## ⚠️ Problème Identifié

**Erreur**: `insert or update on table 'provider_earnings' violates foreign key constraint 'provider_earnings_provider_id_fkey'`

**Cause**: La contrainte FK `provider_earnings.provider_id` pointait vers `auth.users.id`, mais dans la table `orders`, le champ `provider_id` pointe vers `providers.id`, pas directement vers `auth.users.id`.

**Chaîne de relations**:
```
orders.provider_id → providers.id → providers.profile_id → profiles.id → profiles.user_id → auth.users.id
```

---

## ✅ Solution

Le fichier `migrations/fix_provider_earnings_correct.sql` corrige ce problème en :

1. **Supprimant la contrainte FK incorrecte**
2. **Modifiant la fonction `create_provider_earning()`** pour résoudre correctement le `provider_id` :
   - Essaie d'abord : `providers.id` → `profiles.user_id`
   - Si pas trouvé : essaie directement `profiles.id` → `user_id`
   - Si toujours pas trouvé : vérifie si c'est déjà un `user_id` valide
3. **Incluant un script de migration rétroactive** pour créer les earnings des commandes existantes

---

## 📝 Instructions d'Exécution

### Étape 1: Ouvrir Supabase SQL Editor

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle query

### Étape 2: Copier et Exécuter la Migration

1. Ouvrez le fichier : `C:\Projet AnylibreV2\anylibre\migrations\fix_provider_earnings_correct.sql`
2. **Copiez TOUT le contenu** du fichier
3. **Collez** dans l'éditeur SQL de Supabase
4. Cliquez sur **RUN** (ou Ctrl+Enter)

### Étape 3: Surveiller l'Exécution

Vous devriez voir des messages comme :
```
NOTICE:  Starting retroactive earnings creation...
NOTICE:  Progress: 10 earnings created...
NOTICE:  Progress: 20 earnings created...
NOTICE:  === MIGRATION COMPLETE ===
NOTICE:  Success: 25
NOTICE:  Skipped: 3
NOTICE:  Failed: 0
```

---

## 🔍 Vérifications Post-Migration

### 1. Vérifier que les earnings ont été créés

```sql
SELECT
  COUNT(*) AS total_earnings,
  COUNT(DISTINCT provider_id) AS nb_providers,
  SUM(net_amount_cents) / 100.0 AS total_net_euros
FROM provider_earnings;
```

**Résultat attendu** :
```
total_earnings | nb_providers | total_net_euros
---------------|--------------|----------------
      25       |      5       |    1250.50
```

### 2. Vérifier les soldes des providers

```sql
SELECT
  u.email,
  pb.available_cents / 100.0 AS disponible,
  pb.pending_cents / 100.0 AS en_attente,
  pb.total_earned_cents / 100.0 AS total_gagne,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
ORDER BY pb.total_earned_cents DESC
LIMIT 5;
```

**Résultat attendu** :
```
email               | disponible | en_attente | total_gagne | currency
--------------------|------------|------------|-------------|----------
provider1@test.com  |   500.00   |   100.00   |   600.00    | EUR
provider2@test.com  |   300.00   |    50.00   |   350.00    | EUR
```

### 3. Vérifier qu'il n'y a plus de commandes non traitées

```sql
SELECT COUNT(*)
FROM orders o
WHERE o.status IN ('completed', 'delivered')
AND NOT EXISTS (SELECT 1 FROM provider_earnings WHERE order_id = o.id);
```

**Résultat attendu** : `0` (zéro commandes non traitées)

---

## 🎯 Test dans l'Application

### 1. Vérifier le Dashboard Provider

1. Connectez-vous en tant que prestataire
2. Allez sur le **Tableau de Bord**
3. Section **"Mes gains"** devrait afficher :
   - **Montant disponible** : Les euros des commandes complétées
   - **En attente** : Les euros des commandes livrées mais pas encore acceptées
   - **Total gagné** : La somme de tout ce qui a été gagné

### 2. Tester le Workflow Complet

```sql
-- 1. Créer une commande de test (status = 'paid')
-- (faites-le via l'interface utilisateur)

-- 2. Marquer comme livrée
UPDATE orders SET status = 'delivered' WHERE id = 'VOTRE-ORDER-ID';

-- 3. Vérifier que l'earning a été créé automatiquement
SELECT * FROM provider_earnings WHERE order_id = 'VOTRE-ORDER-ID';
-- Devrait montrer: status = 'pending'

-- 4. Vérifier le solde pending
SELECT * FROM provider_balance WHERE provider_id = 'VOTRE-USER-ID';
-- Devrait montrer: pending_cents augmenté

-- 5. Client accepte la commande
UPDATE orders SET status = 'completed' WHERE id = 'VOTRE-ORDER-ID';

-- 6. Vérifier que le paiement a été libéré
SELECT * FROM provider_earnings WHERE order_id = 'VOTRE-ORDER-ID';
-- Devrait montrer: status = 'completed', paid_at renseigné

-- 7. Vérifier le solde available
SELECT * FROM provider_balance WHERE provider_id = 'VOTRE-USER-ID';
-- Devrait montrer:
--   pending_cents diminué
--   available_cents augmenté
--   total_earned_cents augmenté
```

---

## ❌ En cas d'Erreur

### Erreur: "function create_provider_earning does not exist"

**Solution** : Vous devez d'abord exécuter `create_provider_earnings.sql` avant `fix_provider_earnings_correct.sql`

```sql
-- Exécutez dans cet ordre :
\i migrations/create_provider_earnings.sql
\i migrations/fix_provider_earnings_correct.sql
```

### Erreur: "column provider_id does not exist"

**Solution** : Vérifiez que la table `provider_earnings` existe bien

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'provider_earnings';
```

### Erreur: Soldes toujours à 0.00

**Solution** : Ré-exécutez le script de rétroactivité manuellement

```sql
-- Copiez uniquement la section "DO $$" du fichier fix_provider_earnings_correct.sql
-- (lignes 165-217)
```

---

## 📊 Résumé de la Correction

| Avant | Après |
|-------|-------|
| ❌ FK incorrecte : `provider_earnings.provider_id → auth.users.id` | ✅ Pas de FK, résolution au niveau applicatif |
| ❌ Erreur lors de l'insertion si `orders.provider_id` est `providers.id` | ✅ Fonction résout automatiquement `providers.id → user_id` |
| ❌ Commandes existantes sans earnings | ✅ Script rétroactif crée tous les earnings manquants |
| ❌ Dashboard affiche 0.00€ | ✅ Dashboard affiche les vrais gains |

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Supabase (Database → Logs)
2. Copiez les messages d'erreur complets
3. Vérifiez que toutes les tables existent (`provider_earnings`, `provider_balance`)
4. Vérifiez que les fonctions existent (`create_provider_earning`, `release_provider_earning`)

---

**Date**: 2025-12-11
**Version**: 1.1.0 - Correction FK
**Status**: Ready to Execute ✅
