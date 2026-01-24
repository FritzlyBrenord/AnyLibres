# Corrections - Système de Présence pour Médiation (Litige)

## Problèmes Identifiés et Corrigés

### 1. **Endpoint `/api/disputes/[id]/presence` (GET)**

**Problème:** L'endpoint ne retournait que les présences ACTIVES mais ne vérifiait pas correctement les user_id

**Corrections appliquées:**

- ✅ Ajout de logs détaillés pour diagnostiquer les problèmes
- ✅ Changement de la requête pour récupérer les présences avec les user_id
- ✅ Ajout de détails de debug (records complets) dans la réponse
- ✅ Gestion correcte du profil utilisateur avec `eq('user_id', user.id)`

### 2. **Endpoint `/api/disputes/[id]/presence` (POST)**

**Problème:** Utilisait `profile.user_id` au lieu de `user.id` directement, causant des échecs de recherche de présence

**Corrections appliquées:**

- ✅ Utilisation directe de `user.id` pour chercher la présence
- ✅ Meilleure gestion des erreurs avec distinction entre "présence non trouvée" et erreurs serveur
- ✅ Ajout de logs détaillés pour chaque étape
- ✅ Gestion correcte du code d'erreur PGRST116 (pas de lignes retournées)

### 3. **Endpoint `/api/disputes/[id]/join` (POST)**

**Problème:**

- Utilisait `profile.user_id` au lieu de `user.id` pour les vérifications
- Utilisait `eq('profile_id', profile.id)` au lieu de `eq('user_id', user.id)` pour les providers

**Corrections appliquées:**

- ✅ Utilisation directe de `user.id` pour toutes les vérifications
- ✅ Correction de la requête provider: `eq('user_id', user.id)` au lieu de `eq('profile_id', ...)`
- ✅ Ajout de logs détaillés pour le diagnostique
- ✅ Vérification correcte du client et provider

### 4. **Composant `PresenceVerification.tsx`**

**Problèmes:**

- ❌ Heartbeat toutes les 30 secondes trop rare
- ❌ Vérification de présence toutes les 5 secondes trop lente pour une bonne UX
- ❌ Pas de gestion d'erreurs affichées à l'utilisateur
- ❌ Pas de logs pour diagnostiquer les problèmes

**Corrections appliquées:**

- ✅ Polling de présence réduit à 3 secondes (meilleure réactivité)
- ✅ Heartbeat toutes les 30 secondes (inchangé)
- ✅ Ajout d'affichage des erreurs à l'utilisateur
- ✅ Logs détaillés à chaque étape du processus
- ✅ Gestion d'erreur lors de la jointure et envoi d'erreur visuelle

## Flux Correct de Fonctionnement

### Étape 1: Jointure à la Session

1. User clique sur le litige → accès à la page d'attente
2. `PresenceVerification` appelle `/api/disputes/[id]/join` (POST)
3. Le serveur:
   - Authentifie l'utilisateur avec `user.id`
   - Résout le profil avec `eq('user_id', user.id)`
   - Vérifie les droits d'accès (client/provider/admin)
   - Crée un enregistrement dans `mediation_presence` avec `user_id = user.id`

### Étape 2: Vérification de Présence (Polling)

1. Toutes les 3 secondes, le client appelle `/api/disputes/[id]/presence` (GET)
2. Le serveur:
   - Récupère tous les enregistrements avec `is_present = true`
   - Retourne les rôles présents (client, provider, admin)
   - Le client met à jour l'UI pour montrer qui est présent

### Étape 3: Heartbeat

1. Toutes les 30 secondes, le client appelle `/api/disputes/[id]/presence` (POST)
2. Avec `is_present = true` pour mettre à jour `last_heartbeat`
3. Cela signale au serveur que l'utilisateur est toujours présent

### Étape 4: Activation du Chat

1. Quand les deux parties (client ET provider) sont présentes:
   - PresenceVerification détecte `presence.client === true && presence.provider === true`
   - Appelle `onBothPresent()` après 2 secondes
   - Transition vers `MediationChatRoom`

## Clés de Débogage

### Pour Tester Localement:

```bash
# 1. Ouvrir la DevTools (F12)
# 2. Aller à l'onglet Console
# 3. Voir les logs:
#    - "PresenceVerification: Joining session..."
#    - "Presence data:" + les données reçues
#    - "Both parties present! Starting chat..."
```

### Logs Serveur:

```
=== JOIN MEDIATION REQUEST ===
Auth user ID: xxxxx
Profile found: yyyy
User is client/provider/admin
Current presence - Client: true/false Provider: true/false

=== PRESENCE GET REQUEST ===
Dispute ID: xxxxx
Auth user ID: xxxxx
Active presence records: [...]
Presence status: { client: bool, provider: bool, admin: bool }

=== PRESENCE POST REQUEST ===
Dispute ID: xxxxx
Is present: true/false
Found presence record: xxxxx
Updating heartbeat
```

## Points Importants

1. **user.id vs profile.user_id:**
   - `user.id` = l'ID de Supabase Auth (UUID du user auth)
   - `profile.user_id` = référence au user auth depuis la table profiles
   - Les deux doivent être identiques et cohérents

2. **Unique Index:**
   - La table `mediation_presence` a un index unique: `idx_mediation_presence_unique_active`
   - Sur `(dispute_id, user_id) WHERE is_present = true`
   - Cela garantit qu'un user ne peut avoir qu'UNE présence active par dispute

3. **Timeouts:**
   - Heartbeat manqué > 5 minutes = considérer comme absent
   - Session timeout > 15 minutes = annuler la médiation

## Tests à Faire

1. ✅ User A (client) rejoint → doit voir "En attente du prestataire"
2. ✅ User B (provider) rejoint → User A doit voir "Prestataire présent"
3. ✅ User B (provider) doit voir "Client présent"
4. ✅ Quand les deux sont présents → transition vers chat (après 2s)
5. ✅ Si User A quitte → User B doit être notifié (paused chat)
6. ✅ Vérifier les logs pour absence d'erreurs 404 ou 500

## Fichiers Modifiés

- ✅ `/api/disputes/[id]/presence/route.ts` - GET et POST
- ✅ `/api/disputes/[id]/join/route.ts` - POST
- ✅ `src/components/dispute/PresenceVerification.tsx` - Logique complète

## SQL à Exécuter (Important!)

Vérifiez que la fonction et le trigger existent dans Supabase:

```sql
-- La fonction doit exister:
CREATE OR REPLACE FUNCTION update_mediation_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Et le trigger doit exister:
CREATE TRIGGER IF NOT EXISTS trigger_update_mediation_presence_timestamp
BEFORE UPDATE ON mediation_presence
FOR EACH ROW
EXECUTE FUNCTION update_mediation_presence_timestamp();
```
