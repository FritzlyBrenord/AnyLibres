# 🔴 ERREUR 403: "Accès refusé" - Diagnostic et Solutions

## 🎯 Le Problème

L'utilisateur voit:

```
Connexion à la salle de médiation...
Accès refusé
```

Avec le code HTTP 403 (Forbidden).

## 🔍 Diagnostic

### 1. Regarder les Détails de Débogage

#### Dans la Console du Navigateur (F12 → Console)

Chercher le log:

```
PresenceVerification: Join response: {
  success: false,
  error: "Accès refusé",
  debugInfo: {
    isAdmin: false,
    clientIdMatch: false,
    providerIdMatch: false,
    disputeClientId: "xxx-xxx-xxx",
    disputeProviderId: "yyy-yyy-yyy",
    authUserId: "zzz-zzz-zzz",
    providerFound: false,
    providerUserId: null
  }
}
```

**C'est les informations clés pour diagnostiquer!**

### 2. Regarder les Logs du Serveur

Dans le terminal `npm run dev`, chercher:

```
=== JOIN MEDIATION REQUEST ===
Dispute ID: xxxxx
Role: client/provider
Auth user ID: zzz-zzz-zzz

Profile found: www Role: client/provider

❌ Not a client - dispute client_id: xxx !==auth user_id: zzz

❌ Provider lookup error: ... ou
❌ No provider found for user_id: zzz ou
❌ Provider ID mismatch: aaa !==: bbb

=== AUTHORIZATION DEBUG INFO ===
{
  isAdmin: false,
  clientIdMatch: false,
  providerIdMatch: false,
  disputeClientId: "xxx",
  disputeProviderId: "yyy",
  authUserId: "zzz",
  providerFound: false
}

❌ ACCESS DENIED - User is not a participant of this dispute
```

## ✅ Solutions Selon la Cause

### Cas 1: clientIdMatch = false ET providerFound = false

**Cause:** L'utilisateur n'est ni le client de la commande, ni un provider

**Vérification:**

```sql
-- Voir qui est client et provider de la commande
SELECT client_id, provider_id FROM orders
WHERE id = (SELECT order_id FROM disputes WHERE id = 'YOUR_DISPUTE_ID');

-- Voir l'ID auth de l'utilisateur
SELECT auth.id FROM auth.users auth WHERE email = 'user@example.com';

-- Vérifier si le user a un profil provider
SELECT id, user_id, profile_id FROM providers
WHERE user_id = 'AUTH_USER_ID';
```

**Solution:**

- Faire en sorte que l'utilisateur SOIT le client de la commande
- Ou créer un provider record pour cet utilisateur
- Ou utiliser un autre dispute où l'utilisateur est participant

### Cas 2: clientIdMatch = false ET providerFound = true ET providerIdMatch = false

**Cause:** L'utilisateur a un provider record, mais le provider_id ne correspond pas

**Vérification:**

```sql
-- Voir le provider_id dans la commande
SELECT provider_id FROM orders
WHERE id = (SELECT order_id FROM disputes WHERE id = 'YOUR_DISPUTE_ID');

-- Voir le provider_id du user
SELECT id FROM providers WHERE user_id = 'AUTH_USER_ID';
```

**Solution:**

- Les IDs ne correspondent pas (peut être un bug de création de commande)
- Faire un UPDATE sur la commande avec le bon provider_id
- Ou créer une nouvelle commande avec le bon provider

### Cas 3: Provider lookup error: PGRST116 (no rows returned)

**Cause:** Il n'existe pas de provider record pour ce user

**Vérification:**

```sql
SELECT * FROM providers WHERE user_id = 'AUTH_USER_ID';
-- Doit retourner 1 ligne
```

**Solution:**

```sql
-- Créer un provider record
INSERT INTO providers (user_id, profile_id, ...)
VALUES ('AUTH_USER_ID', 'PROFILE_ID', ...);
```

## 🔧 Checklist de Dépannage

Pour chaque cas:

1. [ ] Ouvrir DevTools (F12)
2. [ ] Aller à Console
3. [ ] Chercher "Join response: {"
4. [ ] Noter les valeurs de debugInfo
5. [ ] Ouvrir le terminal `npm run dev`
6. [ ] Chercher "=== JOIN MEDIATION REQUEST ==="
7. [ ] Noter les logs d'erreur ❌
8. [ ] Exécuter les requêtes SQL ci-dessus
9. [ ] Comparer les IDs

## 🚀 Étapes Précises pour Tester

### Test 1: Vérifier que l'utilisateur est authentifié

Dans la console:

```javascript
// Vérifier que l'utilisateur est connecté
console.log("Current user:", user); // Doit avoir un ID
```

### Test 2: Vérifier que le litige existe

```javascript
// Appeler l'API info du litige
fetch("/api/disputes/DISPUTE_ID/info")
  .then((r) => r.json())
  .then((d) => console.log(d));
// Doit retourner un litige valide
```

### Test 3: Vérifier les IDs

Dans le navigateur:

```javascript
// Regarder debugInfo.disputeClientId et debugInfo.disputeProviderId
// Si vous êtes client, vérifier que votre user.id === disputeClientId
// Si vous êtes provider, vérifier que votre provider.id === disputeProviderId
```

### Test 4: Vérifier le provider record

```sql
SELECT id, user_id FROM providers WHERE user_id = 'YOUR_USER_ID';
```

## 📊 Tableau de Diagnostique

| Symptôme                 | Cause                                   | Solution                                 |
| ------------------------ | --------------------------------------- | ---------------------------------------- |
| `clientIdMatch: false`   | User n'est pas le client de la commande | Être le client ou changer de litige      |
| `providerFound: false`   | User n'a pas de provider record         | Créer un provider record                 |
| `providerIdMatch: false` | Les IDs ne correspondent pas            | UPDATE orders avec le bon provider_id    |
| Tous les checks false    | User n'est pas participant du tout      | Utiliser un litige où on est participant |

## 💡 Cas Communs

### Je suis CLIENT

```
✅ Mon user.id doit === disputes.order.client_id
```

### Je suis PROVIDER

```
✅ Il doit exister un providers record avec mon user_id
✅ Ce provider.id doit === disputes.order.provider_id
```

### Je suis ADMIN

```
✅ Mon profile.role doit === 'admin'
✅ J'ai accès à TOUS les litiges
```

## 🎯 Si Vous Avez Toujours un Problème

1. **Copier le debugInfo complet** de la console
2. **Copier les logs du serveur** (=== JOIN MEDIATION REQUEST === jusqu'à ACCESS DENIED)
3. **Exécuter les requêtes SQL** et noter les résultats
4. **Comparer les IDs** entre:
   - `auth.users.id`
   - `profiles.user_id`
   - `providers.user_id` et `providers.id`
   - `orders.client_id` et `orders.provider_id`
5. **Chercher l'incohérence**

---

**Les IDs doivent être cohérents:**

```
auth user table:
  id = "zzz-zzz-zzz" (ID auth Supabase)

profiles table:
  user_id = "zzz-zzz-zzz" (doit être identique à auth.id)

providers table (si provider):
  user_id = "zzz-zzz-zzz" (doit être identique à auth.id)
  id = "ppp-ppp-ppp" (ID du provider)

orders table:
  client_id = "zzz-zzz-zzz" (pour un client)
  provider_id = "ppp-ppp-ppp" (pour un provider)
```

**Si l'un de ces ne correspond pas = Accès refusé.**
