# ⚡ CHECKLIST PRE-TEST - Médiation Présence

## 🔍 Vérifications Requises AVANT de Tester

### 1. Backend Compilation ✓

```bash
npm run build
# ✅ Doit compiler sans erreurs TypeScript
# ✅ Pas de warnings critiques
```

### 2. Serveur en Cours d'Exécution ✓

```bash
npm run dev
# ✅ Voir le message "compiled client and server successfully"
# ✅ Voir "Ready in XXXms"
# ✅ Pas d'erreurs dans le terminal
```

### 3. Base de Données - Table Existe ✓

```sql
-- Exécuter dans Supabase SQL Editor
SELECT COUNT(*) FROM mediation_presence;
-- ✅ Doit retourner un nombre (0 ou +)
-- ❌ Si erreur "table doesn't exist", la table n'existe pas
```

### 4. Base de Données - Fonction Trigger ✓

```sql
-- Vérifier que la fonction existe
SELECT * FROM pg_proc
WHERE proname = 'update_mediation_presence_timestamp';
-- ✅ Doit retourner 1 ligne
```

### 5. Base de Données - Trigger ✓

```sql
-- Vérifier que le trigger existe
SELECT * FROM pg_trigger
WHERE tgname = 'trigger_update_mediation_presence_timestamp';
-- ✅ Doit retourner 1 ligne
```

### 6. Authentification Supabase ✓

```bash
# Dans la console du navigateur:
# Vérifier que l'utilisateur peut se connecter
# ✅ La page de login fonctionne
# ✅ La redirection après login fonctionne
```

### 7. Variables d'Environnement ✓

```bash
# Dans .env.local, vérifier:
# ✅ NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# ✅ SUPABASE_SERVICE_ROLE_KEY=xxx
```

## 🧪 Avant de Ouvrir le Navigateur

### 1. Créer un Litige de Test

```sql
-- Ou utiliser un litige existant
-- Mais noter son ID pour le test
SELECT id, order_id, reason FROM disputes LIMIT 1;
-- Copier l'ID pour utiliser dans l'URL
```

### 2. Identifier des Utilisateurs de Test

```bash
# Avoir au minimum:
# ✅ 1 utilisateur CLIENT authentifié
# ✅ 1 utilisateur PROVIDER authentifié
# ✅ Pouvoir accéder au litige comme les deux utilisateurs

# Tip: Utiliser des onglets privés/incognito pour 2 sessions
```

### 3. Ouvrir DevTools Préalablement

```bash
# Sur les deux onglets de test:
# 1. Appuyer sur F12 (DevTools)
# 2. Aller à l'onglet Console
# 3. Dérouler jusqu'en bas (on verra les logs)
# 4. Préparer aussi l'onglet Network
```

## 🚀 Lancer le Test

### Phase 1: Client Rejoint

1. USER 1 (CLIENT):
   - Accéder à `/litige/[dispute-id]`
   - Voir l'écran de "Salle d'Attente"
   - Vérifier les logs console:

   ```
   PresenceVerification: Joining session...
   PresenceVerification: Presence data: {client: true, provider: false}
   ```

2. Console doit montrer:
   - ✅ `client: true`
   - ✅ `provider: false`
   - ✅ Message "⏳ En attente du prestataire..."

### Phase 2: Provider Rejoint

1. USER 2 (PROVIDER):
   - Accéder au MÊME litige `/litige/[dispute-id]`
   - Voir l'écran de "Salle d'Attente"
   - Vérifier les logs console

2. Console doit montrer:
   - ✅ `client: true`
   - ✅ `provider: true`
   - ✅ Message "✅ Le client est présent. Démarrage imminent..."

3. USER 1 (CLIENT) - Console doit CHANGER:
   - ✅ `provider: true` (passe de false à true)
   - ✅ Message change à "✅ Le prestataire est présent..."
   - ⏳ Après ~2 secondes: "Démarrage de la médiation..."

### Phase 3: Accès au Chat

1. Les DEUX doivent voir:
   - ✅ Animation "Démarrage de la médiation..."
   - ✅ Transition vers le chat (MediationChatRoom)
   - ✅ Pouvoir envoyer un message

2. Les DEUX reçoivent le message:
   - ✅ USER 1 envoie un message → USER 2 le voit
   - ✅ USER 2 envoie un message → USER 1 le voit

## 🔴 Points d'Erreur Courants

### ❌ Erreur: "Non autorisé" (401)

- Cause: Pas authentifié
- Solution: Se connecter d'abord

### ❌ Erreur: "Accès refusé" (403)

- Cause: L'utilisateur ne fait pas partie du litige
- Solution: Utiliser le bon disputeId avec un utilisateur autorisé

### ❌ Erreur: "Présence non trouvée" (404)

- Cause: L'enregistrement de présence n'a pas été créé
- Solution: Vérifier les logs du join pour "Presence creation error"

### ❌ Erreur: "Erreur serveur" (500)

- Cause: Une exception serveur
- Solution: Chercher "Error" dans les logs du terminal Node

### ❌ Pas de changement de présence

- Cause: Polling ne fonctionne pas
- Solution: Attendre 3 secondes, vérifier les logs "Checking presence"

### ❌ Provider ne voit pas le client

- Cause: Problème de user_id ou de requête
- Solution: Vérifier la base de données:

```sql
SELECT user_id, role FROM mediation_presence
WHERE dispute_id = 'YOUR_ID' AND is_present = true;
-- Doit avoir 2 lignes: 1 client et 1 provider
```

## 📊 Vérifications en Temps Réel

### Onglet Network (F12)

Quand le CLIENT rejoint:

```
POST /api/disputes/[id]/join → 200 OK
GET  /api/disputes/[id]/presence → 200 OK (répété toutes les 3s)
```

Quand le PROVIDER rejoint:

```
POST /api/disputes/[id]/join → 200 OK
GET  /api/disputes/[id]/presence → 200 OK (répété toutes les 3s)
```

Les réponses doivent avoir:

```json
{
  "success": true,
  "presence": {
    "client": true,
    "provider": true
  }
}
```

## 📝 Logs à Vérifier

### Terminal Node (Serveur)

```
=== JOIN MEDIATION REQUEST ===
Auth user ID: xxx
User is client/provider
Presence created: yyy

=== PRESENCE GET REQUEST ===
Auth user ID: xxx
Active presence records: [...]
Presence status: {client: true, provider: true}
```

### Console Browser (Client)

```
PresenceVerification: Joining session...
PresenceVerification: Calling join endpoint...
Join response: {success: true}
PresenceVerification: Presence data: {client: true, provider: true}
PresenceVerification: Both parties present! Starting chat in 2 seconds...
```

## ✨ Indicateurs de Succès

- [x] Pas d'erreur 404, 403, ou 500
- [x] Les deux voient la présence l'un de l'autre
- [x] Le passage au chat se fait automatiquement
- [x] Les messages s'échangent correctement
- [x] Les logs sont clairs et structurés
- [x] Le heartbeat s'envoie sans erreur

## 🎉 Quand C'est OK

Vous pouvez considérer que ça fonctionne si:

1. **CLIENT voit:** Client (Présent) + Provider (En attente)
2. **PROVIDER voit:** Client (En attente) + Provider (Présent)
3. Les deux **voient mutuellement** leurs présences changées en 3 secondes max
4. Quand les deux sont présents → **transition automatique au chat**
5. **Pas d'erreurs** dans la console du navigateur
6. **Pas d'erreurs** dans les logs du serveur
7. Les messages **s'échangent en temps réel**

---

**C'est prêt? Commencez par "Phase 1: Client Rejoint" ci-dessus! 🚀**
