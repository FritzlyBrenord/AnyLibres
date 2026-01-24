# DEBUGGING GUIDE - Système de Présence Médiation

## 1. Vérifier la Base de Données

### Voir tous les enregistrements de présence pour un litige
```sql
SELECT 
  mp.id,
  mp.user_id,
  mp.role,
  mp.is_present,
  mp.joined_at,
  mp.last_heartbeat,
  mp.left_at,
  p.first_name,
  p.last_name
FROM mediation_presence mp
LEFT JOIN profiles p ON mp.user_id = p.user_id
WHERE mp.dispute_id = 'YOUR_DISPUTE_ID'
ORDER BY mp.joined_at DESC;
```

### Voir les présences ACTIVES seulement
```sql
SELECT * FROM mediation_presence
WHERE dispute_id = 'YOUR_DISPUTE_ID'
AND is_present = true;
```

### Nettoyer les présences mortes (hanged)
```sql
-- Marquer comme absent si plus de 5 minutes sans heartbeat
UPDATE mediation_presence
SET is_present = false, left_at = now()
WHERE is_present = true
AND last_heartbeat < now() - interval '5 minutes';
```

## 2. Vérifier les Logs Client (DevTools)

### Ouvrir la console (F12 → Console)

#### Logs attendus lors de la jointure:
```
PresenceVerification: Joining session...
PresenceVerification: Calling join endpoint...
Join response: {success: true, presence_id: "xxx", both_present: false}
PresenceVerification: Starting heartbeat...
PresenceVerification: Starting presence check...
PresenceVerification: Checking presence
PresenceVerification: Presence data: {client: true, provider: false, admin: false, records: [...]}
```

#### Logs attendus toutes les 3 secondes:
```
PresenceVerification: Checking presence
PresenceVerification: Presence data: {...}
```

#### Logs attendus toutes les 30 secondes:
```
PresenceVerification: Sending heartbeat
```

#### Quand les deux arrivent:
```
PresenceVerification: Both parties present! Starting chat in 2 seconds...
```

### Onglet Network (F12 → Network)

Chercher les requêtes:
- **GET** `/api/disputes/[id]/presence` - Toutes les 3 secondes ✅
- **POST** `/api/disputes/[id]/presence` - Heartbeat toutes les 30 secondes ✅
- **POST** `/api/disputes/[id]/join` - Une seule fois au démarrage ✅

Vérifier:
```json
// Réponse GET /api/disputes/[id]/presence
{
  "success": true,
  "presence": {
    "client": true,
    "provider": false,
    "admin": false,
    "records": [...]
  },
  "timestamp": "2026-01-23T..."
}

// Réponse POST /api/disputes/[id]/presence (heartbeat)
{
  "success": true,
  "timestamp": "2026-01-23T..."
}

// Réponse POST /api/disputes/[id]/join
{
  "success": true,
  "presence_id": "xxx",
  "both_present": false
}
```

## 3. Vérifier les Logs Serveur (Terminal Node)

Chercher les logs de structure `=== XXX ===`:

### Log lors du join
```
=== JOIN MEDIATION REQUEST ===
Dispute ID: xxxxx
Role: client
Auth user ID: yyyyy
Profile found: zzzzz Role: client
User is client
Current presence - Client: true Provider: false
Both parties present! Starting session   <-- Quand les deux arrivent
Presence created: wwwww
```

### Log lors de la vérification de présence
```
=== PRESENCE GET REQUEST ===
Dispute ID: xxxxx
Auth user ID: yyyyy
Auth user ID: yyyyy
Active presence records: [
  {role: 'client', user_id: 'xxx', is_present: true, ...},
  {role: 'provider', user_id: 'yyy', is_present: true, ...}
]
Presence status: {client: true, provider: true, admin: false, records: [...]}
```

### Log lors du heartbeat
```
=== PRESENCE POST REQUEST ===
Dispute ID: xxxxx
Is present: true
Auth user ID: yyyyy
Found presence record: wwwww
Updating heartbeat
```

## 4. Problèmes Courants et Solutions

### Problème: "Présence non trouvée" (404) lors du heartbeat

**Cause probable:** La création de présence a échoué silencieusement
- Vérifier dans les logs du join s'il y a une erreur "Presence creation error"

**Solution:**
```sql
-- Vérifier que l'enregistrement existe
SELECT * FROM mediation_presence 
WHERE dispute_id = 'YOUR_ID' AND user_id = 'YOUR_USER_ID';

-- Si absent, créer manuellement (debug seulement):
INSERT INTO mediation_presence (dispute_id, user_id, role, is_present)
VALUES ('dispute-id', 'user-id', 'client', true);
```

### Problème: "Non autorisé" (401)

**Cause probable:** Token d'authentification manquant ou expiré
- Vérifier que l'utilisateur est bien connecté
- Vérifier dans les logs "Auth error: ..."

**Solution:**
- Recharger la page
- Se reconnecter
- Vérifier les cookies de session

### Problème: "Accès refusé" (403) lors du join

**Cause probable:** L'utilisateur ne fait pas partie du litige
- Vérifier que `client_id` ou `provider_id` correspond à `user.id`

**Solution:**
```sql
-- Vérifier les IDs dans la commande
SELECT o.client_id, o.provider_id, d.id as dispute_id
FROM disputes d
JOIN orders o ON d.order_id = o.id
WHERE d.id = 'YOUR_DISPUTE_ID';

-- Vérifier l'ID de l'utilisateur auth
SELECT auth.id, p.user_id FROM auth.users auth
LEFT JOIN profiles p ON auth.id = p.user_id
LIMIT 5;
```

### Problème: Provider ne voit pas le client bien que le client soit présent

**Cause probable:** Problème de synchronisation ou user_id incohérent
- Vérifier que les deux utilisateurs ont des `user_id` dans la table `profiles`

**Solution:**
```sql
-- Vérifier les présences
SELECT user_id, role, is_present FROM mediation_presence
WHERE dispute_id = 'YOUR_DISPUTE_ID'
ORDER BY joined_at DESC;

-- Si la table est vide, vérifier les logs du client pour "Presence creation error"
```

### Problème: Heartbeat ne s'envoie pas

**Cause probable:** L'intervalle n'est pas lancé correctement
- Vérifier dans la console client que les logs "Sending heartbeat" apparaissent
- Attendre 30 secondes après la jointure

**Solution:**
- Forcer un heartbeat manuel dans la console:
```javascript
// Dans la console du navigateur
fetch(`/api/disputes/YOUR_ID/presence`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({is_present: true})
}).then(r => r.json()).then(d => console.log(d));
```

## 5. Commandes de Test Rapides

### Tester directement l'API avec curl

```bash
# 1. Join (remplacer les tokens et IDs)
curl -X POST http://localhost:3000/api/disputes/DISPUTE_ID/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"role":"client"}'

# 2. Check presence
curl -X GET http://localhost:3000/api/disputes/DISPUTE_ID/presence \
  -H "Authorization: Bearer TOKEN"

# 3. Heartbeat
curl -X POST http://localhost:3000/api/disputes/DISPUTE_ID/presence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"is_present":true}'

# 4. Leave
curl -X POST http://localhost:3000/api/disputes/DISPUTE_ID/presence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"is_present":false}'
```

## 6. Vérification des Dépendances

### Vérifier que la table mediation_presence existe
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'mediation_presence';
```

### Vérifier que les indexes existent
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'mediation_presence';
-- Doit avoir:
-- idx_mediation_presence_dispute
-- idx_mediation_presence_user
-- idx_mediation_presence_active
-- idx_mediation_presence_unique_active
```

### Vérifier que la fonction trigger existe
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'update_mediation_presence_timestamp';
```

## 7. Monitoring en Temps Réel

### Terminal 1: Logs du serveur
```bash
npm run dev
# Chercher les logs "===" en temps réel
```

### Terminal 2: Watch de la base de données
```bash
# Avec psql connecté à Supabase:
SELECT * FROM mediation_presence
WHERE dispute_id = 'YOUR_DISPUTE_ID'
AND is_present = true;
-- Rafraîchir (Ctrl+R ou F5) toutes les secondes
```

### Terminal 3: Tail des erreurs
```bash
# Voir uniquement les erreurs
npm run dev 2>&1 | grep -i error
```

## 8. Checklist de Débogage

Quand quelque chose ne fonctionne pas:

1. [ ] Ouvrir DevTools du client (F12)
2. [ ] Aller à l'onglet Console
3. [ ] Chercher les logs "PresenceVerification:"
4. [ ] Chercher les erreurs rouges
5. [ ] Aller à l'onglet Network
6. [ ] Chercher les requêtes `/api/disputes/[id]/presence`
7. [ ] Vérifier le status HTTP (200 ok, 404 not found, 500 error)
8. [ ] Vérifier la réponse JSON (success: true/false)
9. [ ] Ouvrir le terminal Node
10. [ ] Chercher les logs "===" correspondants
11. [ ] Chercher "error" ou "Error"
12. [ ] Exécuter les requêtes SQL de test
13. [ ] Vérifier les présences dans la base de données

## 9. Contacts/Support

Si quelque chose reste cassé:
1. Créer un ticket avec tous les logs (client + serveur + DB)
2. Préciser le disputeId exact
3. Préciser les user IDs impliqués
4. Joindre les timestamps des erreurs
