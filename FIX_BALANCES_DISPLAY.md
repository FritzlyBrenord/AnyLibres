# 🔍 Diagnostic: Pourquoi "Gestion Soldes" affiche 0 partout

## Problème
- **Vue d'ensemble** (Finance) → Affiche correctement ✅
- **Gestion Soldes** (BalanceManagement) → Affiche 0 partout ❌

## Cause probable
L'API `/api/admin/balances` ne retourne pas les bonnes données à cause d'un problème de jointure SQL.

## 🧪 Tests à faire

### Test 1: Exécuter DEBUG_BALANCES_API.sql

```sql
-- Dans Supabase SQL Editor, exécuter:
\i DEBUG_BALANCES_API.sql
```

Cela va montrer:
1. Les données brutes dans `provider_balance`
2. Si `provider_id` correspond à un `user_id`
3. Le lien `provider_id` → `profiles`
4. Le lien `profiles` → `providers`
5. Ce que l'API devrait retourner

### Test 2: Vérifier l'API dans le navigateur

1. Ouvrir Chrome DevTools (F12)
2. Aller dans Console
3. Aller dans l'onglet "Gestion Soldes"
4. Regarder dans Network → Trouver la requête `/api/admin/balances`
5. Vérifier la réponse

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "provider_id": "112b64a6-...",
      "provider_name": "Company Name",
      "provider_email": "email@example.com",
      "available_cents": 0,
      "pending_cents": 3000,
      "withdrawn_cents": 0,
      "total_earned_cents": 0,
      "currency": "USD"
    }
  ],
  "total": 1
}
```

**Si vous voyez:**
```json
{
  "success": true,
  "data": [],
  "total": 0
}
```
→ Problème: L'API ne trouve pas les balances

**Si vous voyez:**
```json
{
  "success": false,
  "error": "..."
}
```
→ Problème: Erreur SQL

## 🔧 Solutions possibles

### Solution A: Le problème est dans le lien profiles.user_id

Si la requête SQL dans `DEBUG_BALANCES_API.sql` montre que `profiles.user_id` ne correspond pas à `provider_balance.provider_id`, alors:

**Fichier:** `src/app/api/admin/balances/route.ts` ligne 57-61

```typescript
// AU LIEU DE:
const { data: profile } = await supabase
  .from('profiles')
  .select('email, display_name, id')
  .eq('user_id', balance.provider_id)  // ❌
  .single();

// ESSAYER:
const { data: profile } = await supabase
  .from('profiles')
  .select('email, display_name, id, user_id')
  .eq('id', balance.provider_id)  // ✅ Si provider_id = profile_id
  .single();

// OU:
const { data: profile } = await supabase
  .from('auth.users')
  .select('email, id')
  .eq('id', balance.provider_id)
  .single();
```

### Solution B: Utiliser une vue SQL au lieu de Promise.all

Créer une vue qui fait tout le travail:

```sql
CREATE OR REPLACE VIEW v_admin_balances AS
SELECT
  pb.id,
  pb.provider_id,
  pb.available_cents,
  pb.pending_cents,
  pb.withdrawn_cents,
  pb.total_earned_cents,
  pb.currency,
  pb.last_withdrawal_at,
  pb.created_at,
  pb.is_frozen,
  u.email as provider_email,
  COALESCE(prov.company_name, prof.display_name, 'N/A') as provider_name
FROM provider_balance pb
LEFT JOIN auth.users u ON u.id = pb.provider_id
LEFT JOIN profiles prof ON prof.user_id = pb.provider_id
LEFT JOIN providers prov ON prov.profile_id = prof.id;
```

Puis dans l'API:
```typescript
const { data: balances } = await supabase
  .from('v_admin_balances')
  .select('*')
  .order('total_earned_cents', { ascending: false });
```

## 📋 Checklist de débogage

- [ ] Exécuter `DEBUG_BALANCES_API.sql` dans Supabase
- [ ] Noter les résultats de chaque requête
- [ ] Ouvrir Chrome DevTools
- [ ] Aller dans "Gestion Soldes"
- [ ] Vérifier Network → `/api/admin/balances`
- [ ] Noter la réponse JSON
- [ ] Comparer avec les données SQL
- [ ] Identifier où la jointure échoue

## 🎯 Prochaine étape

Une fois le diagnostic fait, dites-moi ce que vous voyez dans:
1. Le résultat de `DEBUG_BALANCES_API.sql`
2. La réponse de `/api/admin/balances` dans Chrome DevTools
