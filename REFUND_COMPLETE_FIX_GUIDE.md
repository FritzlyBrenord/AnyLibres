# 🚀 GUIDE COMPLET: Déboguer et Corriger le Système de Remboursement

## 📊 État Actuel vs État Attendu

### ✅ Éléments Correctement Implémentés
- ✅ Table `refunds` créée avec structure complète
- ✅ API route POST `/api/refunds` - Logique correcte
- ✅ API route GET `/api/refunds` - Logique correcte  
- ✅ Composant React `RefundModal` - Interface correcte
- ✅ Intégration dans `/orders/[id]/page.tsx` - Présentation correcte
- ✅ Fonction de trigger `update_updated_at_column()` - Doit exister
- ✅ Types TypeScript - Définis correctement

### ❌ Éléments Manquants - PROBLÈME PRINCIPAL
- ❌ **RLS Policies sur table `refunds`** - CAUSE DE L'ERREUR 500
- ❌ **Logging amélioré pour détecter l'erreur exacte**

---

## 🔴 CAUSE RACINE DE L'ERREUR 500

### Problème
```
Client clique "Demander un remboursement" 
  ↓
Frontend appelle POST /api/refunds ✅
  ↓
API valide les données ✅
  ↓
API exécute: supabase.from("refunds").insert({...}).select().single() ❌
  ↓
Erreur Supabase: "Insuffisant permissions" (silencieux en RLS)
  ↓
Serveur retourne: "Failed to create refund request" (HTTP 500)
```

### Pourquoi?
La table `refunds` **N'A PAS DE POLITIQUES RLS** activées. 

En Supabase, quand on active RLS:
```
RLS enabled + No policies = Cannot read or insert ❌
RLS enabled + Policies = Can read/insert per policy ✅  
RLS disabled = Everyone can read/insert ✅
```

**Votre configuration actuelle:**
```sql
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY; -- ✅ RLS activé
-- Mais AUCUNE policy CREATE POLICY définie! ❌
```

---

## 🛠️ ÉTAPES DE CORRECTION

### ÉTAPE 1: Préparer le SQL de correction

**Fichier créé:** `FIX_REFUNDS_RLS.sql`

Contient:
```sql
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Policy 1: Clients voient leurs remboursements
CREATE POLICY "Clients can view their refunds" ...

-- Policy 2: Providers voient leurs remboursements
CREATE POLICY "Providers can view refunds for their orders" ...

-- Policy 3: Clients demandent un remboursement
CREATE POLICY "Clients can request refunds for their orders" ...

-- Policy 4: Clients mettent à jour leurs demandes rejetées
CREATE POLICY "Clients can update their pending refunds" ...
```

### ÉTAPE 2: Exécuter le SQL dans Supabase

1. **Accéder à Supabase Console:**
   - https://app.supabase.com → Votre Projet → SQL Editor

2. **Copier le contenu de `FIX_REFUNDS_RLS.sql`**

3. **Coller dans l'éditeur SQL Supabase**

4. **Exécuter le script** (Run button)

5. **Vérifier le succès:**
   ```
   Pas d'erreurs = ✅ Success
   ```

### ÉTAPE 3: Vérifier les politiques créées

**Exécuter dans Supabase SQL Editor:**

```sql
-- Afficher toutes les politiques RLS sur la table refunds
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'refunds'
ORDER BY policyname;
```

**Résultat attendu:**
```
schemaname | tablename | policyname                                 | permissive | roles | qual                          | with_check
public     | refunds   | Clients can request refunds...             | true      | {}    | auth.uid() = client_id       | [...]
public     | refunds   | Clients can update their pending refunds   | true      | {}    | client_id = auth.uid()...    | [...]
public     | refunds   | Clients can view their refunds             | true      | {}    | client_id = auth.uid()       | -
public     | refunds   | Providers can view refunds...              | true      | {}    | provider_id = auth.uid()     | -
```

### ÉTAPE 4: Tester INSERT directement dans Supabase

**Prérequis:** Connaître les IDs réels pour tester:
- `order_id`: UUID d'une vraie commande
- `client_id`: UUID du client
- `provider_id`: UUID du provider
- Assurer que la commande existe et que `payment_status = 'succeeded'`

**Tester (dans Supabase SQL Editor):**
```sql
-- D'abord vérifier qu'une commande existe et est payée
SELECT id, client_id, provider_id, payment_status, status 
FROM orders 
WHERE payment_status = 'succeeded' 
LIMIT 1;

-- Récupérer un UUID de commande et client depuis le résultat ci-dessus
-- Puis tester l'insert:
INSERT INTO refunds (
  order_id, 
  client_id, 
  provider_id, 
  amount_cents, 
  currency, 
  reason, 
  status
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,  -- order_id réel
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,  -- client_id réel
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,  -- provider_id réel
  5000,
  'EUR',
  'client_request',
  'pending'
)
RETURNING *;
```

✅ Si le retour montre une ligne avec toutes les données = **RLS fonctionne correctement**

❌ Si erreur "policy with select check expression returns": Le problème persiste

---

## 🧪 ÉTAPE 5: Tester via Frontend

### 5.1 Améliorer le logging côté API

**Fichier modifié:** `src/app/api/refunds/route.ts` 

Le logging a été amélioré pour afficher:
```javascript
if (refundError) {
  console.error("Refund creation error:", {
    message: refundError.message,
    code: refundError.code,
    details: refundError.details,
    hint: refundError.hint,
  });
}
```

### 5.2 Ouvrir la console des serveurs

**Terminal 1 (Node server):**
```bash
cd C:\Projet AnylibreV2\anylibre
npm run dev
```

Regarder les logs dans ce terminal quand on crée un remboursement.

### 5.3 Ouvrir le navigateur

1. **Aller à:** `http://localhost:3000`
2. **Connexion:** Client credentials
3. **Naviguer à:** Une commande payée (`/orders/[id]`)
4. **Cliquer:** "Demander un remboursement"
5. **Remplir le formulaire** et soumettre
6. **Observer les logs serveur:**
   - ✅ Pas d'erreur = Succès!
   - ❌ "Insufficient privileges" = Problème RLS persiste

---

## 🎯 VÉRIFICATION COMPLÈTE

### Checklist de Validation

- [ ] Fichier `FIX_REFUNDS_RLS.sql` a été exécuté dans Supabase
- [ ] `pg_policies` montre 4 politiques pour `refunds`
- [ ] INSERT direct dans Supabase fonctionne (ÉTAPE 4)
- [ ] Frontend teste sans erreur (ÉTAPE 5)
- [ ] Response JSON affiche `"success": true`
- [ ] Nouvelle ligne refund visible dans Supabase table
- [ ] Admin peut voir la demande dans `/admin/refunds`

### Tests Supplémentaires

#### Test 1: Vérifier qu'on ne peut voir que nos remboursements

```javascript
// En tant que client A:
GET /api/refunds
→ Retourne: Remboursements du client A seulement

// En tant que client B:
GET /api/refunds  
→ Retourne: Remboursements du client B seulement
```

#### Test 2: Vérifier qu'on ne peut créer que pour nos commandes

```javascript
// En tant que client A qui tente de rembourser commande de client B:
POST /api/refunds { order_id: "commande_B", ... }
→ Retourne: 404 "Order not found" ou 403 "Unauthorized"
```

#### Test 3: Vérifier le montant

```javascript
POST /api/refunds { order_id: "...", amount_cents: 999999999, ... }
→ Retourne: 400 "Refund amount exceeds order total"
```

---

## 📋 AUTRES TABLES À CORRIGER

Après les refunds, appliquer la même logique à:

### 1. Table `client_balance`
```sql
ALTER TABLE public.client_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their balance"
  ON public.client_balance FOR SELECT
  USING (client_id = auth.uid());
```

### 2. Table `provider_balance` (si elle existe)
```sql
ALTER TABLE public.provider_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their balance"
  ON public.provider_balance FOR SELECT
  USING (provider_id = auth.uid());
```

### 3. Table `transactions` (si elle existe)
```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());
```

---

## 🚀 FLUX COMPLET APRÈS CORRECTION

```
Client dans /orders/[id]
  ↓
Clique "Demander un remboursement"
  ↓
RefundModal s'affiche
  ↓
Remplit: montant, raison, détails
  ↓
Clique "Envoyer"
  ↓
POST /api/refunds {order_id, amount_cents, reason, reason_details}
  ↓
API valide et exécute:
  ✅ Authentification OK
  ✅ Ordre trouvé et appartient au client
  ✅ Montant <= total commande
  ✅ INSERT refunds avec RLS passée ← APRÈS FIX
  ↓
Refund créé avec status = 'pending'
  ↓
Response: { success: true, refund: {...} }
  ↓
Modal se ferme
  ↓
Liste des remboursements mise à jour
  ↓
Notification envoyée à l'admin
  ↓
Admin approuve/rejette dans /admin/refunds
```

---

## 🐛 DÉPANNAGE

### Problème: "Failed to create refund request" persiste

**Causes à vérifier:**

1. ❌ **RLS SQL n'a pas été exécuté**
   - Solution: Exécuter `FIX_REFUNDS_RLS.sql` dans Supabase SQL Editor

2. ❌ **Mauvais IDs dans les tests**
   - Solution: Utiliser les vrais IDs de commandes payées

3. ❌ **Fonction `update_updated_at_column()` n'existe pas**
   - Solution: Créer la fonction (voir ci-dessous)

4. ❌ **Ordre n'a pas `payment_status = 'succeeded'`**
   - Solution: Créer une commande payée d'abord

### Problème: "Order not found"

- Le `order_id` n'existe pas ou n'appartient pas au client
- Vérifier l'UUID est correct

### Problème: "Insufficient permissions" dans logs serveur

- Les politiques RLS sont mauvaises
- Vérifier `FIX_REFUNDS_RLS.sql` a bien été exécuté
- Supprimer les mauvaises policies et re-exécuter

---

## 📝 FONCTION `update_updated_at_column()`

Si elle n'existe pas, la créer:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Vérifier son existence:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column' 
AND routine_schema = 'public';
```

---

## 📞 RÉSUMÉ QUICK-FIX

**En 3 étapes:**

1. **Copier** `FIX_REFUNDS_RLS.sql` complet
2. **Coller** dans Supabase SQL Editor → Run
3. **Tester** en créant un remboursement dans le frontend

**Boom! 🎉 Ça devrait marcher.**

---

## 📚 Fichiers Modifiés

- ✏️ `src/app/api/refunds/route.ts` - Meilleur logging
- ✨ `FIX_REFUNDS_RLS.sql` - SQL de correction (À EXÉCUTER)
- 📄 `REFUND_SYSTEM_DEBUG.md` - Documentation du problème
