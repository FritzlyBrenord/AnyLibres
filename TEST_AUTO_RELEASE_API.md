# 🤖 Test de l'API Auto-Release

## ✅ Avantages de cette approche

1. **Utilise l'API manuelle qui fonctionne déjà** (`admin_release_pending_funds`)
2. **Pas de trigger SQL compliqué** - tout en TypeScript
3. **Facile à débugger** - logs clairs dans la console
4. **Flexible** - peut être appelée par CRON, webhook ou manuellement

## 🚀 Comment tester

### Option 1: Test manuel (RECOMMANDÉ)

**Dans votre navigateur ou Postman:**

```
GET http://localhost:3000/api/auto-release-funds
```

Ou avec curl:

```bash
curl http://localhost:3000/api/auto-release-funds
```

### Option 2: Test via le code

Créez un fichier de test:

```typescript
// test-auto-release.ts
async function testAutoRelease() {
  const response = await fetch('http://localhost:3000/api/auto-release-funds');
  const data = await response.json();
  console.log('Résultat:', data);
}

testAutoRelease();
```

## 📋 Ce que l'API fait

1. ✅ Récupère tous les earnings `pending`
2. ✅ Pour chaque earning:
   - Trouve la règle qui s'applique (par priorité)
   - Calcule si le délai est écoulé
   - **SI délai écoulé**: Libère les fonds via `admin_release_pending_funds`
   - **SINON**: Programme pour plus tard dans `scheduled_releases`

3. ✅ Retourne un résumé:
   ```json
   {
     "success": true,
     "message": "Auto-release completed",
     "summary": {
       "total_processed": 5,
       "released": 2,
       "scheduled": 3,
       "skipped": 0
     }
   }
   ```

## 🔄 Automatisation

### Option A: CRON (Vercel, etc.)

Dans `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/auto-release-funds",
    "schedule": "0 * * * *"
  }]
}
```

Ceci appelle l'API toutes les heures.

### Option B: Webhook personnalisé

Appelez l'API quand une commande devient "completed":

Dans `src/app/api/orders/accept/route.ts`, ajoutez après la ligne 163:

```typescript
// Déclencher la libération automatique
try {
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auto-release-funds`, {
    method: 'POST',
  });
} catch (error) {
  console.warn('Auto-release trigger failed:', error);
}
```

### Option C: Bouton admin

Créez un bouton dans l'interface admin:

```typescript
const triggerAutoRelease = async () => {
  const response = await fetch('/api/auto-release-funds');
  const data = await response.json();
  alert(`Libéré: ${data.summary.released} earnings`);
};

return <button onClick={triggerAutoRelease}>🤖 Libérer automatiquement</button>;
```

## 🎯 Configuration des règles

L'API utilise les règles de `payment_release_rules`. Exemples:

### Règle 1: Libération immédiate (delay = 0)

```sql
INSERT INTO payment_release_rules (name, delay_hours, applies_to, is_active, priority)
VALUES ('Libération immédiate', 0, 'all', true, 100);
```

Quand l'API s'exécute, elle libère **immédiatement** tous les earnings.

### Règle 2: Attendre 24h

```sql
INSERT INTO payment_release_rules (name, delay_hours, applies_to, is_active, priority)
VALUES ('Attente 24h', 24, 'all', true, 90);
```

L'API vérifie si 24h sont écoulées depuis la création de l'earning.

### Règle 3: VIP immédiat, autres 7 jours

```sql
-- VIP: immédiat
INSERT INTO payment_release_rules (name, delay_hours, applies_to, condition, is_active, priority)
VALUES ('VIP', 0, 'vip', '{"provider_rating": 4.5}'::jsonb, true, 100);

-- Autres: 7 jours
INSERT INTO payment_release_rules (name, delay_hours, applies_to, is_active, priority)
VALUES ('Standard', 168, 'all', true, 50);
```

## 📊 Logs attendus

Quand vous appelez l'API, vous devriez voir:

```
🤖 Auto-release: Démarrage...
📋 3 earnings pending trouvés
  → Earning xxx: règle "Libération immédiate" (0h)
    ✅ Délai écoulé (25.3h >= 0h) → Libération
    🎉 Libéré: 425.00 EUR
  → Earning yyy: règle "Attente 24h" (24h)
    ⏳ En attente (reste 5.2h)
    📅 Programmé pour: 2026-01-09T10:00:00Z
  → Earning zzz: règle "Standard" (168h)
    ⏳ En attente (reste 142.7h)
    📅 Programmé pour: 2026-01-16T08:00:00Z

✅ Auto-release terminé:
   - Total traité: 3
   - Libérés: 1
   - Programmés: 2
   - Ignorés: 0
```

## 🎉 Avantage final

**Pas besoin de cliquer sur "Accepter"** - appelez juste cette API régulièrement et elle libère automatiquement tout ce qui est prêt!

## 🔧 Dépannage

### Problème: "No pending earnings"

✅ Normal! Créez d'abord une commande avec un earning pending.

### Problème: "Délai non écoulé"

✅ Normal! Attendez ou changez `delay_hours` à 0 dans la règle.

### Problème: "Failed to fetch earnings"

❌ Vérifiez les permissions Supabase sur `provider_earnings`.
