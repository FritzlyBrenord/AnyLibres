# 🔴 DIAGNOSTIC: Système de Remboursement - Erreur 500

## 🎯 Problème Identifié

**Erreur**: "Failed to create refund request" (HTTP 500)  
**Cause Racine**: **La table `refunds` n'a PAS de politiques RLS configurées!**

### Détail du Problème

1. **Table créée**: ✅ `refunds` existe dans Supabase
2. **Structure**: ✅ Correcte (colonnes, contraintes, indexes, triggers)
3. **Politiques RLS**: ❌ **MANQUANTES** - Impossible de lire/écrire sans RLS

Quand une table Supabase a RLS activé (ce qui est recommandé) **sans politiques**, elle devient inaccessible par défaut:
- `INSERT` échoue (silencieusement à cause du `select().single()`)
- `SELECT` retourne 0 lignes
- `UPDATE`/`DELETE` échouent aussi

## 📊 Configuration Actuelle

### Tables avec RLS ✅
- profiles
- providers  
- services
- orders
- order_items
- order_deliveries
- order_revisions
- reviews
- favorites
- messages
- notifications

### Tables SANS RLS Policies ❌
- **refunds** ← LE PROBLÈME!
- Toutes les tables de balance/earnings/transactions

## 🔧 Solutions Requises

### 1. Ajouter RLS à la table `refunds`

Les politiques doivent permettre:
- **SELECT**: Client peut voir ses remboursements, Provider peut voir ses remboursements, Admin peut voir tous
- **INSERT**: Client peut créer une demande pour sa commande  
- **UPDATE**: Admin peut mettre à jour le status
- **DELETE**: Personne ne peut supprimer (soft-delete via status)

### 2. Ajouter RLS aux tables de balance

- `client_balance`
- `provider_balance`
- `admin_balance`
- `transactions`
- `earnings` / `provider_earnings`

## 📝 Code SQL Nécessaire

```sql
-- 1. Activer RLS sur refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- 2. Politique SELECT - Clients voient leurs remboursements
CREATE POLICY "Clients can view their refunds"
  ON public.refunds FOR SELECT
  USING (client_id = auth.uid());

-- 3. Politique SELECT - Providers voient leurs remboursements
CREATE POLICY "Providers can view their refunds"
  ON public.refunds FOR SELECT
  USING (provider_id = auth.uid());

-- 4. Politique SELECT - Admin voit tous les remboursements
CREATE POLICY "Admins can view all refunds"
  ON public.refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (SELECT email FROM public.admin_users)
    )
  );

-- 5. Politique INSERT - Client peut créer un remboursement
CREATE POLICY "Clients can request refunds"
  ON public.refunds FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.client_id = auth.uid()
      AND orders.payment_status = 'succeeded'
    )
  );

-- 6. Politique UPDATE - Admin peut approuver/rejeter
CREATE POLICY "Admins can update refunds"
  ON public.refunds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (SELECT email FROM public.admin_users)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (SELECT email FROM public.admin_users)
    )
  );
```

## 🧪 Tests à Effectuer

### 1. Vérifier RLS est activé
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'refunds';
-- Doit retourner: refunds | true
```

### 2. Vérifier les politiques
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'refunds';
```

### 3. Tester INSERT directement
```sql
INSERT INTO refunds (
  order_id, client_id, provider_id, amount_cents, 
  currency, reason, status
) VALUES (
  'order-uuid', 'user-uuid', 'provider-uuid', 1000, 
  'EUR', 'client_request', 'pending'
);
```

### 4. Tester via API
```javascript
// Frontend
const response = await fetch('/api/refunds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: 'real-order-id',
    amount_cents: 5000,
    reason: 'client_request',
    reason_details: 'Test'
  })
});
console.log(await response.json());
```

## 📋 Statut de Chaque Composant

| Composant | Statut | Notes |
|-----------|--------|-------|
| Table refunds | ✅ Créée | Structure correcte, indexes OK |
| API POST /refunds | ✅ Correct | Code logic OK |
| API GET /refunds | ✅ Correct | Code logic OK |
| RefundModal composant | ✅ Correct | Interface OK |
| RLS Politiques | ❌ MANQUANTES | À créer d'urgence |
| Fonction update_updated_at_column | ⚠️ À vérifier | Doit exister |
| Admin refund routes | ✅ Existent | Mais sans RLS |

## 🚀 Plan d'Action

1. **Immédiat**: Créer migration SQL avec toutes les politiques RLS
2. **Supabase**: Exécuter le SQL dans l'éditeur SQL
3. **Vérification**: Tester INSERT/SELECT avec Supabase SQL
4. **Test Frontend**: Tester le bouton "Demander un remboursement"
5. **Post-Refund**: Ajouter RLS à autres tables de balance

## 🔗 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Votre API: `/api/refunds/route.ts`
