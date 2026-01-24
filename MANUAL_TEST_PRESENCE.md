# Test Manual - Système de Présence Médiation

## Préparation

1. **Ouvrir 2 navigateurs ou 2 onglets privés**
   - Onglet 1: Pour le CLIENT
   - Onglet 2: Pour le PROVIDER

2. **S'authentifier comme deux utilisateurs différents**
   - Onglet 1: Se connecter en tant que CLIENT
   - Onglet 2: Se connecter en tant que PROVIDER

## Test Scénario 1: Les Deux Parties Arrivent Ensemble

### Étape 1: Client accède à la page de litige
1. Dans Onglet 1 (CLIENT), naviguer vers: `/litige/[dispute-id]`
2. Voir l'écran de "Salle d'Attente"
3. Voir: "⏳ En attente du prestataire..."
4. Ouvrir DevTools (F12) → Console
5. Vérifier les logs:
   ```
   PresenceVerification: Joining session...
   PresenceVerification: Calling join endpoint...
   Join response: { success: true, ... }
   PresenceVerification: Starting presence check...
   PresenceVerification: Presence data: { client: true, provider: false, ... }
   ```

### Étape 2: Provider accède à la page de litige
1. Dans Onglet 2 (PROVIDER), naviguer vers: `/litige/[dispute-id]`
2. Voir l'écran de "Salle d'Attente"
3. Voir: "⏳ En attente du client..."
4. Ouvrir DevTools (F12) → Console
5. Vérifier les logs similaires

### Étape 3: Vérifier les changements UI
1. Dans Onglet 1 (CLIENT):
   - Attendre 3 secondes maximum
   - "Client" doit rester "Présent" ✅
   - "Prestataire" doit passer de "En attente" à "Présent" ✅
   - Message: "✅ Le prestataire est présent. Démarrage imminent..."
   - Après 2-3 secondes: Animation "Démarrage de la médiation..."

2. Dans Onglet 2 (PROVIDER):
   - "Prestataire" doit rester "Présent" ✅
   - "Client" doit passer de "En attente" à "Présent" ✅
   - Message: "✅ Le client est présent. Démarrage imminent..."
   - Après 2-3 secondes: Animation "Démarrage de la médiation..."

### Étape 4: Accès au Chat
1. Les deux doivent voir le chat au même moment
2. Vérifier dans les logs console:
   ```
   PresenceVerification: Both parties present! Starting chat in 2 seconds...
   ```

## Test Scénario 2: Provider Quitte Pendant Le Chat

1. Dans Onglet 2 (PROVIDER), fermer l'onglet ou naviguer ailleurs
2. Dans Onglet 1 (CLIENT), le chat doit:
   - Se bloquer pour édition
   - Afficher "⚠️ Le prestataire a quitté la session"
   - Proposer de revenir à la salle d'attente

## Test Scénario 3: Heartbeat

1. Laisser tourner le test pendant 2-3 minutes
2. Vérifier dans les logs serveur (terminal Node):
   ```
   === PRESENCE POST REQUEST ===
   Dispute ID: xxxxx
   Is present: true
   Found presence record: xxxxx
   Updating heartbeat
   ```
3. Toutes les 30 secondes, ces logs doivent apparaître

## Points de Contrôle ✓

- [ ] Client voit sa présence (Présent)
- [ ] Provider voit sa présence (Présent)
- [ ] Client voit la présence du provider après jointure
- [ ] Provider voit la présence du client après jointure
- [ ] Pas d'erreur 404 dans les logs
- [ ] Pas d'erreur 500 dans les logs
- [ ] Les deux accèdent au chat quand les deux sont présents
- [ ] Heartbeat s'envoie toutes les 30s sans erreur
- [ ] Quitter la session marque `is_present = false`

## Logs à Chercher en Cas de Problème

### Erreur: "Présence non trouvée" (404)
- Signifie que `user_id` n'a pas été enregistré correctement à la jointure
- Vérifier dans les logs du serveur lors du join qu'il y a "User is client/provider/admin"

### Erreur: "Non autorisé" (401)
- Signifie que l'authentification a échoué
- Vérifier que les tokens sont valides
- Vérifier dans les logs "Auth error: ..."

### Erreur: "Erreur serveur" (500)
- Consulter les logs du serveur Node pour détails
- Chercher "error" dans les logs du serveur

### Présence non mise à jour
- Vérifier que le polling toutes les 3 secondes se fait
- Chercher dans les logs "Checking presence" toutes les 3s
- Vérifier que la réponse GET contient les bonnes données

## Débogage Avancé

### Via DevTools (Client)
```javascript
// Dans la console, voir les logs de fetch
// Vérifier l'onglet "Network" pour voir les requêtes:
// GET /api/disputes/[id]/presence (toutes les 3s)
// POST /api/disputes/[id]/presence (heartbeat, toutes les 30s)
// POST /api/disputes/[id]/join (1 fois au démarrage)
```

### Via Terminal (Serveur)
```bash
# Voir les logs du serveur Next.js en direct
npm run dev
# Chercher les logs "===..." pour tracer les requêtes
```

## Checklist Finale Avant Déploiement

- [ ] Pas d'erreurs TypeScript `npm run build`
- [ ] Pas d'erreurs console JavaScript
- [ ] Test avec 2 navigateurs simultanés fonctionne
- [ ] Heartbeat maintient la présence active
- [ ] Départ gracieux (is_present = false) fonctionne
- [ ] Vérifier que la base de données enregistre correctement les présences
