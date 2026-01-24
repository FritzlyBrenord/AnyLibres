# ⚡ QUICK FIX - Erreur 403 "Accès refusé"

## 🚀 Procédure Rapide (5 minutes)

### Étape 1: Identifier le Problème

Lancer le test et copier le message d'erreur détaillé de la console:

```javascript
{
  success: false,
  error: "Accès refusé",
  debugInfo: { ... }  ← Copier ce JSON complet
}
```

### Étape 2: Analyser debugInfo

Regarder les valeurs:

- **isAdmin**: true = vous êtes admin ✅
- **clientIdMatch**: true = vous êtes le client ✅
- **providerIdMatch**: true = vous êtes le provider ✅

Si TOUS sont false → ❌ Vous n'êtes pas participant du tout

### Étape 3: Vérifier la Base de Données

Exécuter dans Supabase SQL Editor:

```sql
-- Remplacer DISPUTE_ID par le vrai ID
-- Remplacer YOUR_EMAIL par votre email
SELECT
  au.id as auth_id,
  p.user_id,
  p.role,
  pr.id as provider_id,
  o.client_id,
  o.provider_id
FROM disputes d
JOIN orders o ON d.order_id = o.id
LEFT JOIN auth.users au ON au.email = 'YOUR_EMAIL'
LEFT JOIN profiles p ON p.user_id = au.id
LEFT JOIN providers pr ON pr.user_id = au.id
WHERE d.id = 'DISPUTE_ID';
```

### Étape 4: Corriger Selon le Cas

#### Cas A: Vous êtes CLIENT mais pas reconnu

Le problème: `o.client_id` ne correspond pas à votre `auth.id`

**Solution rapide:**

```sql
UPDATE orders
SET client_id = 'YOUR_AUTH_ID'
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

#### Cas B: Vous êtes PROVIDER mais provider_id ne correspond pas

Le problème: Votre `provider.id` ≠ `order.provider_id`

**Solution A (si vous avez un provider record):**

```sql
UPDATE orders
SET provider_id = (
  SELECT id FROM providers WHERE user_id = 'YOUR_AUTH_ID' LIMIT 1
)
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

**Solution B (si vous n'avez pas de provider record):**

```sql
-- D'abord créer le provider record
INSERT INTO providers (user_id, profile_id)
SELECT au.id, p.id
FROM auth.users au
JOIN profiles p ON p.user_id = au.id
WHERE au.email = 'YOUR_EMAIL';

-- Puis mettre à jour la commande
UPDATE orders
SET provider_id = (
  SELECT id FROM providers WHERE user_id = 'YOUR_AUTH_ID' LIMIT 1
)
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

#### Cas C: Vous n'êtes ni client ni provider

**Solution:** Utiliser un litige où vous êtes participant, OU vous faire ajouter comme client/provider

### Étape 5: Tester à Nouveau

1. Rafraîchir la page dans le navigateur
2. Cliquer à nouveau sur le litige
3. Vérifier que l'erreur 403 est disparue
4. Voir le message "En attente de..." ou "Présent"

## 🎯 Cas Courants - Solutions Directes

### "Je suis CLIENT"

```sql
-- 1. Vérifier
SELECT o.id, o.client_id FROM orders o
JOIN disputes d ON d.order_id = o.id
WHERE d.id = 'DISPUTE_ID';

-- Doit montrer votre auth.id dans o.client_id

-- 2. Si ce n'est pas bon, corriger:
UPDATE orders SET client_id = 'YOUR_AUTH_ID'
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

### "Je suis PROVIDER"

```sql
-- 1. Vérifier que j'ai un provider record
SELECT id, user_id FROM providers WHERE user_id = 'YOUR_AUTH_ID';

-- Si absent, créer:
INSERT INTO providers (user_id, profile_id)
VALUES ('YOUR_AUTH_ID', 'YOUR_PROFILE_ID');

-- 2. Vérifier que provider.id === order.provider_id
SELECT pr.id, o.provider_id FROM providers pr
LEFT JOIN orders o ON o.provider_id = pr.id
WHERE pr.user_id = 'YOUR_AUTH_ID' LIMIT 1;

-- 3. Si ce n'est pas bon, corriger:
UPDATE orders SET provider_id = 'YOUR_PROVIDER_ID'
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

### "Je ne sais pas si je suis CLIENT ou PROVIDER"

```sql
-- Voir votre rôle dans le système
SELECT role FROM profiles WHERE user_id = 'YOUR_AUTH_ID';

-- Rôle = 'client' → vous êtes CLIENT
-- Rôle = 'provider' → vous êtes PROVIDER
-- Rôle = 'admin' → vous êtes ADMIN (accès à tout)
```

## ✅ Validation Finale

Après correction, vérifier:

```sql
-- Voir l'état final
SELECT
  'OK' as status,
  o.client_id,
  o.provider_id,
  au.id as your_auth_id
FROM orders o
LEFT JOIN auth.users au ON au.email = 'YOUR_EMAIL'
WHERE o.id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');

-- Vérifier:
-- votre auth.id = o.client_id (si client)
-- votre auth.id = provider.user_id (si provider)
```

## 🔧 Trucs et Astuces

### Trouver votre USER_ID

```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL';
```

### Trouver votre PROFILE_ID

```sql
SELECT id, user_id FROM profiles WHERE user_id = 'YOUR_USER_ID';
```

### Trouver votre PROVIDER_ID

```sql
SELECT id, user_id FROM providers WHERE user_id = 'YOUR_USER_ID';
```

### Voir la Commande du Litige

```sql
SELECT o.* FROM orders o
WHERE id = (SELECT order_id FROM disputes WHERE id = 'DISPUTE_ID');
```

## 🚨 N'OUBLIEZ PAS

Après faire des UPDATE:

1. ❌ Ne pas fermer Supabase
2. ✅ Rafraîchir la page du navigateur (Ctrl+F5)
3. ✅ Effacer le cache si nécessaire
4. ✅ Essayer à nouveau

## 📞 Si Ça Ne Marche Toujours Pas

1. Faire un screenshot de l'erreur exacte
2. Copier le debugInfo complètement
3. Exécuter les requêtes SQL et noter les résultats
4. Consulter `FIX_403_ACCES_REFUSE.md` pour les cas avancés

---

**C'est la procédure rapide. Pour plus de détails, voir `FIX_403_ACCES_REFUSE.md`**
