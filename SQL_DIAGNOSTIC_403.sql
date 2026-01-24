# 🔧 SQL DIAGNOSTIC - Erreur 403 "Accès refusé"

Exécutez ces requêtes dans Supabase SQL Editor pour diagnostiquer le problème.

## 1. Vérifier votre Utilisateur Auth

```sql
-- Voir votre ID Supabase Auth
SELECT id, email, created_at FROM auth.users 
WHERE email = 'VOTRE_EMAIL@example.com';

-- Copier l'ID pour les étapes suivantes (appelons-le AUTH_USER_ID)
```

## 2. Vérifier Votre Profil

```sql
-- Voir votre profil
SELECT id, user_id, role, first_name, last_name FROM profiles 
WHERE user_id = 'AUTH_USER_ID';

-- Doit retourner exactement 1 ligne
-- Copier profile.id pour l'étape suivante (appelons-le PROFILE_ID)
```

## 3. Vérifier le Litige

```sql
-- Voir le litige que vous essayez d'accéder
SELECT 
  d.id as dispute_id,
  d.order_id,
  o.client_id,
  o.provider_id,
  o.status
FROM disputes d
JOIN orders o ON d.order_id = o.id
WHERE d.id = 'DISPUTE_ID'
LIMIT 1;

-- Noter: client_id et provider_id
```

## 4. Comparer les IDs (CLIENT)

Si vous êtes CLIENT:

```sql
-- Vérifier que votre user.id === order.client_id
SELECT 
  'AUTH_USER_ID' as your_user_id,
  o.client_id,
  CASE 
    WHEN 'AUTH_USER_ID' = o.client_id THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END as client_check
FROM orders o
WHERE o.id = (
  SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID'
);

-- Si c'est ❌ NO MATCH, c'est pour ça que vous êtes refusé!
```

## 5. Comparer les IDs (PROVIDER)

Si vous êtes PROVIDER:

```sql
-- Voir votre provider record
SELECT id, user_id FROM providers 
WHERE user_id = 'AUTH_USER_ID'
LIMIT 1;

-- Noter: providers.id (appelons-le PROVIDER_ID)

-- Maintenant vérifier que ce provider_id === order.provider_id
SELECT 
  'PROVIDER_ID' as your_provider_id,
  o.provider_id,
  CASE 
    WHEN 'PROVIDER_ID' = o.provider_id THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END as provider_check
FROM orders o
WHERE o.id = (
  SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID'
);

-- Si c'est ❌ NO MATCH, c'est pour ça que vous êtes refusé!
```

## 6. Vue Complète de Tous les IDs

Requête unique pour voir tout ce qui est important:

```sql
WITH user_auth AS (
  SELECT id FROM auth.users WHERE email = 'VOTRE_EMAIL@example.com'
),
user_profile AS (
  SELECT id, user_id, role FROM profiles 
  WHERE user_id = (SELECT id FROM user_auth) LIMIT 1
),
user_provider AS (
  SELECT id, user_id FROM providers 
  WHERE user_id = (SELECT id FROM user_auth) LIMIT 1
),
dispute_details AS (
  SELECT 
    d.id as dispute_id,
    o.client_id,
    o.provider_id
  FROM disputes d
  JOIN orders o ON d.order_id = o.id
  WHERE d.id = 'DISPUTE_ID' LIMIT 1
)
SELECT 
  (SELECT id FROM user_auth) as auth_user_id,
  (SELECT user_id FROM user_profile) as profile_user_id,
  (SELECT role FROM user_profile) as profile_role,
  (SELECT id FROM user_provider) as provider_id,
  (SELECT user_id FROM user_provider) as provider_user_id,
  (SELECT client_id FROM dispute_details) as order_client_id,
  (SELECT provider_id FROM dispute_details) as order_provider_id;

-- Résultat attendu:
-- auth_user_id === profile_user_id
-- profile_user_id === order_client_id (si client)
-- provider_id === order_provider_id (si provider)
```

## 7. Corriger le Problème (si détecté)

### Problème: Pas de Provider Record

```sql
-- Créer un provider record s'il n'existe pas
INSERT INTO providers (user_id, profile_id)
VALUES ('AUTH_USER_ID', 'PROFILE_ID');
```

### Problème: Order.provider_id Mauvais

```sql
-- Mettre à jour la commande avec le bon provider_id
UPDATE orders 
SET provider_id = 'PROVIDER_ID'
WHERE id = (
  SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID'
);
```

### Problème: Order.client_id Mauvais

```sql
-- Mettre à jour la commande avec le bon client_id
UPDATE orders 
SET client_id = 'AUTH_USER_ID'
WHERE id = (
  SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID'
);
```

## 8. Vérifier Après la Correction

Après la correction, ré-exécutez l'étape 6 pour vérifier que tout correspond.

## 🎯 Cas de Test Rapide

### Si vous voulez tester rapidement:

```sql
-- 1. Créer un utilisateur test (ou utiliser un existant)
-- 2. Avoir un litige existant
-- 3. Exécuter:

SELECT 
  'TEST' as check,
  COUNT(*) as profile_count
FROM profiles 
WHERE user_id IN (SELECT id FROM auth.users LIMIT 1)

UNION ALL

SELECT 
  'PROVIDERS',
  COUNT(*)
FROM providers 
WHERE user_id IN (SELECT id FROM auth.users LIMIT 1)

UNION ALL

SELECT 
  'DISPUTES',
  COUNT(*)
FROM disputes LIMIT 1;

-- Doit avoir:
-- - 1 profile
-- - 1+ providers (si provider)
-- - 1+ disputes
```

## 📊 Table de Correspondance

Vérifier que TOUS ces matchs sont vrais:

| Colonne | Valeur | Doit être égal à |
|---------|--------|------------------|
| auth.users.id | ? | profiles.user_id |
| auth.users.id | ? | providers.user_id (si provider) |
| providers.id | ? | orders.provider_id |
| auth.users.id | ? | orders.client_id (si client) |

## ❌ Exemple d'Erreur Courante

```
auth.users.id = '111-111-111'
profiles.user_id = '222-222-222'  ← ❌ MISMATCH!
providers.user_id = '222-222-222'
orders.provider_id = '333-333-333'
```

**Solution:** Corriger le profile.user_id ou le auth.users.id pour qu'ils correspondent.

---

**Exécutez ces requêtes et cherchez les ❌ NO MATCH - c'est votre problème!**
