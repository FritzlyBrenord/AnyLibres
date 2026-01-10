# 💰 Installation du Système de Gains des Prestataires

## 📋 Vue d'ensemble

Ce guide vous explique comment installer et configurer le système de gains pour les prestataires, incluant :
- ✅ Création des tables de base de données
- ✅ Création des fonctions et triggers automatiques
- ✅ Initialisation rétroactive pour les commandes existantes
- ✅ Vérification et tests

---

## 🚀 Installation

### Étape 1: Exécuter la migration SQL principale

Connectez-vous à votre base de données Supabase et exécutez :

```sql
-- Fichier: migrations/create_provider_earnings.sql
\i migrations/create_provider_earnings.sql
```

**OU** copiez-collez tout le contenu du fichier dans l'éditeur SQL de Supabase.

### Étape 2: Vérifier que les tables sont créées

```sql
-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('provider_earnings', 'provider_balance');

-- Devrait retourner:
-- provider_earnings
-- provider_balance
```

### Étape 3: Initialiser les earnings pour les commandes existantes

**Option A: Via SQL (Recommandé)**

```sql
-- Exécuter le script de rétroactivité
DO $$
DECLARE
  v_order RECORD;
  v_earning_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_order IN
    SELECT id, provider_id, status
    FROM orders
    WHERE status IN ('completed', 'delivered')
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Créer l'earning
      v_earning_id := create_provider_earning(v_order.id);

      -- Si completed, libérer immédiatement
      IF v_order.status = 'completed' THEN
        PERFORM release_provider_earning(v_order.id);
      END IF;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed for order %: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Total earnings created: %', v_count;
END $$;
```

**Option B: Via API**

```bash
# Appeler l'API d'initialisation
curl -X POST http://localhost:3000/api/admin/init-earnings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Vérifications

### 1. Vérifier les soldes des prestataires

```sql
SELECT
  pb.provider_id,
  u.email,
  (pb.available_cents / 100.0)::DECIMAL(10,2) AS disponible_euros,
  (pb.pending_cents / 100.0)::DECIMAL(10,2) AS en_attente_euros,
  (pb.total_earned_cents / 100.0)::DECIMAL(10,2) AS total_gagne_euros,
  pb.currency
FROM provider_balance pb
JOIN auth.users u ON u.id = pb.provider_id
WHERE pb.total_earned_cents > 0
ORDER BY pb.total_earned_cents DESC;
```

**Résultat attendu :**
```
provider_id | email | disponible | en_attente | total_gagne | currency
------------|-------|-----------|------------|-------------|----------
uuid-123... | pro@example.com | 500.00 | 100.00 | 600.00 | EUR
```

### 2. Vérifier les earnings créés

```sql
SELECT
  pe.id,
  pe.provider_id,
  o.id AS order_id,
  (pe.net_amount_cents / 100.0)::DECIMAL(10,2) AS montant_net_euros,
  pe.status,
  pe.created_at
FROM provider_earnings pe
JOIN orders o ON o.id = pe.order_id
ORDER BY pe.created_at DESC
LIMIT 10;
```

### 3. Vérifier les triggers

```sql
-- Vérifier que les triggers existent
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_auto_create_earning', 'trg_auto_release_earning');
```

**Résultat attendu :**
```
trigger_name | event_manipulation | event_object_table
-------------|--------------------|-----------------
trg_auto_create_earning | UPDATE | orders
trg_auto_release_earning | UPDATE | orders
```

---

## 🧪 Tests

### Test 1: Créer manuellement un earning

```sql
-- Créer un earning pour une commande spécifique
SELECT create_provider_earning('VOTRE-ORDER-ID-ICI');

-- Vérifier qu'il a été créé
SELECT * FROM provider_earnings WHERE order_id = 'VOTRE-ORDER-ID-ICI';
```

### Test 2: Libérer un paiement

```sql
-- Libérer le paiement d'une commande
SELECT release_provider_earning('VOTRE-ORDER-ID-ICI');

-- Vérifier que le solde a été mis à jour
SELECT * FROM provider_balance WHERE provider_id = 'VOTRE-PROVIDER-ID';
```

### Test 3: Workflow complet (commande → livraison → acceptation)

```sql
-- 1. Créer une commande de test (status = 'paid')
-- (faites-le via l'interface)

-- 2. Marquer comme livrée
UPDATE orders SET status = 'delivered' WHERE id = 'ORDER-ID';
-- ✅ Le trigger devrait créer automatiquement un earning avec status='pending'

-- Vérifier
SELECT * FROM provider_earnings WHERE order_id = 'ORDER-ID';
-- Devrait montrer: status = 'pending'

SELECT * FROM provider_balance WHERE provider_id = 'PROVIDER-ID';
-- Devrait montrer: pending_cents augmenté

-- 3. Client accepte la commande
UPDATE orders SET status = 'completed' WHERE id = 'ORDER-ID';
-- ✅ Le trigger devrait libérer automatiquement le paiement

-- Vérifier
SELECT * FROM provider_earnings WHERE order_id = 'ORDER-ID';
-- Devrait montrer: status = 'completed', paid_at renseigné

SELECT * FROM provider_balance WHERE provider_id = 'PROVIDER-ID';
-- Devrait montrer:
--   pending_cents diminué
--   available_cents augmenté
--   total_earned_cents augmenté
```

---

## 📊 Flux de Fonctionnement

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX DES PAIEMENTS                       │
└─────────────────────────────────────────────────────────────┘

1. Commande créée (status = 'paid')
   └─> Argent retenu par la plateforme (escrow)

2. Provider livre (status = 'delivered')
   └─> ✅ TRIGGER: create_provider_earning()
       ├─> Crée un earning (status = 'pending')
       └─> Ajoute au pending_cents du provider

3. Client accepte (status = 'completed')
   └─> ✅ TRIGGER: release_provider_earning()
       ├─> Earning: status = 'completed'
       ├─> pending_cents → available_cents
       └─> total_earned_cents augmente

4. Provider retire l'argent
   └─> available_cents → withdrawn_cents
       (via future API de retrait)
```

---

## 💡 Calcul des Montants

Le montant net reçu par le prestataire dépend de la configuration des frais :

### Cas 1: Client paie les frais (par défaut)

```
Service: 100€
Frais (5%): 5€
Total payé par client: 105€

Provider reçoit: 100€ ✅
Plateforme garde: 5€
```

### Cas 2: Provider paie les frais

```
Service: 100€
Frais (5%): 5€
Total payé par client: 100€

Provider reçoit: 95€ ✅
Plateforme garde: 5€
```

### Cas 3: Frais partagés (50/50)

```
Service: 100€
Frais (5%): 5€
Total payé par client: 102.50€

Provider reçoit: 97.50€ ✅
Plateforme garde: 5€
```

---

## 🔧 Dépannage

### Problème: Solde à 0€ malgré des commandes complétées

**Solution :**

```sql
-- 1. Vérifier si les tables existent
SELECT * FROM provider_balance LIMIT 1;

-- 2. Vérifier si des earnings existent
SELECT COUNT(*) FROM provider_earnings;

-- 3. Ré-exécuter l'initialisation rétroactive
-- (voir Étape 3 ci-dessus)
```

### Problème: Triggers ne fonctionnent pas

**Solution :**

```sql
-- Supprimer et recréer les triggers
DROP TRIGGER IF EXISTS trg_auto_create_earning ON orders;
DROP TRIGGER IF EXISTS trg_auto_release_earning ON orders;

-- Puis ré-exécuter create_provider_earnings.sql
```

### Problème: Montants incorrects

**Solution :**

```sql
-- Recalculer tous les earnings
DO $$
DECLARE
  v_earning RECORD;
BEGIN
  FOR v_earning IN SELECT * FROM provider_earnings
  LOOP
    -- Recalculer avec la fonction
    UPDATE provider_earnings pe
    SET
      (amount_cents, platform_fee_cents, net_amount_cents) = (
        SELECT amount_cents, platform_fee_cents, net_amount_cents
        FROM calculate_provider_net_amount(pe.order_id)
      )
    WHERE pe.id = v_earning.id;
  END LOOP;
END $$;

-- Puis recalculer les soldes
-- (à faire manuellement ou via un script)
```

---

## 📚 Ressources

- **Migration SQL** : `migrations/create_provider_earnings.sql`
- **API Earnings** : `src/app/api/provider/earnings/route.ts`
- **API Init** : `src/app/api/admin/init-earnings/route.ts`
- **Dashboard Provider** : `src/app/(protected)/Provider/TableauDeBord/page.tsx`

---

## ✅ Checklist d'Installation

- [ ] Migration SQL exécutée
- [ ] Tables `provider_earnings` et `provider_balance` créées
- [ ] Fonctions PostgreSQL créées
- [ ] Triggers activés
- [ ] Earnings rétroactifs créés
- [ ] Soldes vérifiés
- [ ] Test workflow complet effectué
- [ ] Dashboard affiche les gains correctement

---

**Date**: 2025-12-11
**Version**: 1.0.0
**Status**: Production Ready ✅
