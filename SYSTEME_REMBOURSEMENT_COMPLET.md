# 🔧 SYSTÈME DE REMBOURSEMENT - GUIDE COMPLET

## 📋 RÉSUMÉ EXÉCUTIF

Ce document explique le **système de remboursement complet** pour AnylibreV2 :
- **API REST** pour créer/gérer les remboursements
- **Composants React** pour l'interface utilisateur
- **Base de données** (tables PostgreSQL)
- **Logique métier** (validation, autorisations, flux)

---

## 1️⃣ ARCHITECTURE GLOBALE

### Flux de remboursement

```
Client clique "Demander remboursement"
    ↓
Ouvre RefundModal (formulaire)
    ↓
Envoie POST /api/refunds
    ↓
API valide : user, order, montant
    ↓
Insère dans table "refunds" (status='pending')
    ↓
Admin voit demande dans admin panel
    ↓
Admin approuve/rejette
    ↓
Mise à jour status + balances
```

---

## 2️⃣ BASE DE DONNÉES

### Table: `refunds`

```sql
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (
    status = ANY (array['pending','approved','rejected','processing','completed','failed','cancelled'])
  ),
  reason text NOT NULL,
  reason_details text,
  admin_notes text,
  refund_method text,
  refund_reference text,
  refunded_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_client ON refunds(client_id);
CREATE INDEX idx_refunds_provider ON refunds(provider_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created ON refunds(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON refunds
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tables dépendantes

**Table: `client_balance`** - Solde disponible du client
```sql
CREATE TABLE client_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Table: `admin_balance`** - Dons et fonds administrateur
```sql
CREATE TABLE admin_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Table: `transactions`** - Historique de tous les mouvements
```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  currency text DEFAULT 'EUR',
  refund_id uuid REFERENCES refunds(id) ON DELETE CASCADE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## 3️⃣ API ENDPOINTS

### POST `/api/refunds` - Créer une demande de remboursement

**Requête:**
```json
{
  "order_id": "uuid-commande",
  "amount_cents": 5000,
  "reason": "Produit endommagé",
  "reason_details": "Le colis est arrivé endommagé"
}
```

**Validations:**
1. ✅ User authentifié (401 sinon)
2. ✅ Order existe (404 sinon)
3. ✅ Client propriétaire de la commande (403 sinon)
4. ✅ Montant ≤ total commande (400 sinon)
5. ✅ Montant > 0 (CHECK en BD)

**Réponse succès (200):**
```json
{
  "success": true,
  "message": "Refund request created successfully",
  "refund": {
    "id": "uuid-refund",
    "order_id": "uuid-commande",
    "client_id": "uuid-client",
    "provider_id": "uuid-provider",
    "amount_cents": 5000,
    "currency": "EUR",
    "status": "pending",
    "reason": "Produit endommagé",
    "created_at": "2025-01-17T10:30:00Z"
  }
}
```

**Réponse erreur (500):**
```json
{
  "success": false,
  "error": "Failed to create refund request"
}
```

**Fichier:** `src/app/api/refunds/route.ts` (lignes 1-85)

---

### GET `/api/refunds?status=pending&order_id=uuid` - Lister les remboursements

**Paramètres:**
- `status` (optionnel): pending, approved, rejected, etc.
- `order_id` (optionnel): filtrer par commande

**Réponse (200):**
```json
{
  "success": true,
  "refunds": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "status": "pending",
      "amount_cents": 5000,
      "reason": "Produit endommagé",
      "created_at": "2025-01-17T10:30:00Z"
    }
  ]
}
```

**Fichier:** `src/app/api/refunds/route.ts` (lignes 86-149)

---

### PATCH `/api/admin/refunds/[id]` - Approuver/Rejeter

**Requête:**
```json
{
  "status": "approved",
  "admin_notes": "Remboursement approuvé"
}
```

**Réponse:**
```json
{
  "success": true,
  "refund": { ... }
}
```

**Fichier:** `src/app/api/admin/refunds/route.ts`

---

## 4️⃣ COMPOSANTS REACT

### RefundModal - Formulaire de demande

**Emplacement:** `src/app/(protected)/orders/[id]/page.tsx` (ligne ~400)

**Props:**
```typescript
{
  open: boolean;
  orderId: string;
  orderTotal: number;
  onSuccess: () => void;
  onClose: () => void;
}
```

**Champs du formulaire:**
- `amount`: montant en EUR (validation: 0 < montant ≤ total)
- `reason`: liste prédéfinie (Produit endommagé, Non conforme, Autre)
- `reason_details`: champ texte libre

**Logique:**
```typescript
const handleSubmit = async (formData) => {
  // 1. Valide les champs
  // 2. Convertit EUR → cents (amount * 100)
  // 3. POST /api/refunds
  // 4. Si succès → appelle onSuccess() + ferme modal
  // 5. Si erreur → affiche toast d'erreur
}
```

---

### Bouton de demande de remboursement

**Emplacement:** `src/app/(protected)/orders/[id]/page.tsx` (ligne ~350)

**Visibilité:**
- ✅ Affiche SI: payment_status === 'succeeded' ET user n'est pas admin
- ❌ Cache SI: payment_status !== 'succeeded' OU user est admin

**Code:**
```tsx
{!isAdmin && order.payment_info?.status === 'succeeded' && (
  <button
    onClick={() => setRefundModal({
      open: true,
      orderId: order.id,
      orderTotal: convertedValues.total,
    })}
    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600..."
  >
    <DollarSign className="w-4 h-4" />
    Demander un remboursement
  </button>
)}
```

---

### Panel Admin des remboursements

**Emplacement:** `src/app/(protected)/admin/AdminOrderDetail.tsx`

**Affiche:**
- Liste des remboursements en attente (status='pending')
- Pour chacun: montant, raison, date
- Boutons: Approuver / Rejeter avec notes

---

## 5️⃣ LOGIQUE MÉTIER

### Règles de validation

```
CRÉATION (Client):
  ✅ User authentifié
  ✅ Order existe
  ✅ Client = propriétaire de la commande
  ✅ Paiement complété (status='succeeded')
  ✅ Montant > 0 et ≤ total commande
  ✅ Pas de remboursement en cours sur cette commande

APPROBATION (Admin):
  ✅ Admin authentifié
  ✅ Refund status = 'pending'
  ✅ Fonds disponibles pour remboursement
  ✅ Provider a reçu le paiement (provider_balance > montant)

REJET (Admin):
  ✅ Admin authentifié
  ✅ Refund status = 'pending'
  ✅ Motif du rejet fourni
```

### Flux de transition de status

```
pending (création)
  ↓
  ├─→ approved (admin approuve)
  │     ↓
  │     processing (traitement en cours)
  │     ↓
  │     completed (remboursement effectué)
  │
  └─→ rejected (admin rejette)
        ↓
        cancelled
```

### Actions sur approbation

```
Quand Admin clique "Approuver":
  1. Valide: refund.status = 'pending'
  2. Met à jour status → 'approved'
  3. Débite provider_balance de amount_cents
  4. Crédite client_balance de amount_cents
  5. Enregistre dans transactions table
  6. Envoie email au client (optionnel)
  7. Met à jour refunded_at = now()
```

---

## 6️⃣ FLUX UTILISATEUR COMPLET

### Scénario: Client demande remboursement

```
1. Client sur page /orders/[id]
   → Voit le bouton "Demander un remboursement"
   → Clique dessus

2. Modale s'ouvre avec formulaire
   → Client remplit: montant (2500€), raison, détails
   → Clique "Envoyer la demande"

3. Frontend appelle POST /api/refunds
   → Envoie: { order_id, amount_cents: 250000, reason, reason_details }
   → API vérifie tout
   → Insère dans table refunds avec status='pending'

4. API retourne succès
   → Modale ferme
   → Toast vert: "Demande envoyée!"
   → Modale se ferme

5. Admin voit notification
   → Admin sur page Finance/Refunds
   → Voit demande dans liste "En attente"
   → Clique "Approuver"

6. Admin approuve
   → API débit provider_balance
   → API crédite client_balance
   → Status passe de 'pending' → 'approved' → 'completed'
   → Client reçoit email de confirmation (optionnel)
```

---

## 7️⃣ PROBLÈMES CONNUS & SOLUTIONS

### ❌ Erreur: "Failed to create refund request"

**Causes possibles:**
1. Table `refunds` n'existe pas
2. Fonction `update_updated_at_column()` manquante
3. Foreign keys invalides (order_id, client_id, provider_id)
4. User not authenticated
5. Order not found
6. Montant invalide

**Solutions:**
```sql
-- 1. Créer la fonction
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Vérifier la table existe
SELECT * FROM information_schema.tables 
WHERE table_name='refunds';

-- 3. Vérifier les foreign keys
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name='refunds';

-- 4. Tester insertion directe
INSERT INTO refunds (
  order_id, client_id, provider_id, 
  amount_cents, currency, reason, status
) VALUES (
  'uuid-order', 'uuid-client', 'uuid-provider',
  5000, 'EUR', 'Test', 'pending'
);
```

### ✅ Vérification complète

```sql
-- Vérifier toutes les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN ('refunds', 'client_balance', 'admin_balance', 'transactions');

-- Vérifier les indexes
SELECT indexname FROM pg_indexes 
WHERE tablename='refunds';

-- Vérifier les triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table='refunds';

-- Compter les remboursements
SELECT COUNT(*) FROM refunds;
```

---

## 8️⃣ FICHIERS IMPLIQUÉS

```
📁 Database:
  └─ REFUNDS_TABLE_FIRST.sql (crée table refunds)
  └─ CREATE_CLIENT_BALANCE_TABLES.sql (crée client_balance, admin_balance, transactions)
  └─ schema.sql (schéma complet)

📁 API:
  └─ src/app/api/refunds/route.ts (POST, GET)
  └─ src/app/api/admin/refunds/route.ts (PATCH approver/rejeter)
  └─ src/app/api/client-balance/route.ts (GET solde client)
  └─ src/app/api/admin/balance/route.ts (GET solde admin)

📁 Components:
  └─ src/components/RefundModal.tsx (formulaire)
  └─ src/components/RefundList.tsx (liste remboursements)
  └─ src/components/ClientBalancePanel.tsx (solde client)
  └─ src/components/AdminRefundSection.tsx (admin panel refunds)
  └─ src/components/AdminDonationPanel.tsx (panel donations)

📁 Pages:
  └─ src/app/(protected)/orders/[id]/page.tsx (bouton + modale)
  └─ src/app/(protected)/admin/AdminOrderDetail.tsx (admin section)
  └─ src/app/(protected)/admin/Finance.tsx (page finance globale)
```

---

## 9️⃣ PROCHAINES ÉTAPES

- [ ] Vérifier toutes les tables créées dans Supabase
- [ ] Tester le flux complet (demander → approuver → remboursement)
- [ ] Ajouter notifications email au client
- [ ] Ajouter logs d'audit pour tous les changements de status
- [ ] Tester les edge cases (montants décimaux, devises multiples, timeouts)
- [ ] Intégrer webhooks de paiement pour auto-approbation

---

**Document créé:** 17 janvier 2026  
**Statut:** Production  
**Mainteneur:** Dev Team AnylibreV2
