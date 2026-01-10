# Test de l'API Auto-Release-Funds-Simple

## 🔗 URL pour tester l'API

### En développement local:
```
http://localhost:3000/api/auto-release-funds-simple
```

### En production (remplacer par votre domaine):
```
https://votre-domaine.com/api/auto-release-funds-simple
```

---

## 📋 RÈGLES DE DELAY_HOURS

### Types de règles disponibles:

| Type | `applies_to` | Description | Exemple delay_hours |
|------|-------------|-------------|-------------------|
| 🌍 **Tous** | `all` | S'applique à tous les providers | 168h (7 jours) |
| 🆕 **Nouveaux** | `new_providers` | Compte créé < X jours | 336h (14 jours) |
| ⭐ **VIP** | `vip` | Rating >= X étoiles | 48h (2 jours) |
| 💰 **Montant** | `amount_threshold` | Selon le montant | 240h (10 jours) |
| 🌎 **Pays** | `country` | Selon le pays | Variable |

---

## 🧪 Comment tester avec cURL

### Test GET:
```bash
curl -X GET http://localhost:3000/api/auto-release-funds-simple
```

### Test POST (équivalent):
```bash
curl -X POST http://localhost:3000/api/auto-release-funds-simple
```

---

## 📊 Afficher les règles actives (SQL)

Connectez-vous à votre base de données et exécutez:

```sql
-- Voir toutes les règles actives
SELECT
  id,
  name,
  delay_hours,
  ROUND(delay_hours::numeric / 24, 1) as delay_days,
  applies_to,
  condition,
  priority,
  is_active
FROM payment_release_rules
WHERE is_active = true
ORDER BY priority DESC;
```

### Résultat attendu:
```
┌──────────────────────┬────────────────────┬─────────────┬────────────┬──────────────────┬────────────────────────┬──────────┬───────────┐
│ id                   │ name               │ delay_hours │ delay_days │ applies_to       │ condition              │ priority │ is_active │
├──────────────────────┼────────────────────┼─────────────┼────────────┼──────────────────┼────────────────────────┼──────────┼───────────┤
│ xxx-vip              │ VIP Premium        │ 0           │ 0.0        │ vip              │ {"provider_rating":4.8}│ 20       │ true      │
│ xxx-high-amount      │ Montants Élevés    │ 168         │ 7.0        │ amount_threshold │ {"min_amount":500000}  │ 15       │ true      │
│ xxx-new-providers    │ Nouveaux Providers │ 720         │ 30.0       │ new_providers    │ {"provider_age_days":30}│ 10      │ true      │
│ xxx-small-amounts    │ Petits Montants    │ 24          │ 1.0        │ amount_threshold │ {"max_amount":10000}   │ 5        │ true      │
│ xxx-standard         │ Standard           │ 336         │ 14.0       │ all              │ null                   │ 0        │ true      │
└──────────────────────┴────────────────────┴─────────────┴────────────┴──────────────────┴────────────────────────┴──────────┴───────────┘
```

---

## 🔍 Comprendre la réponse de l'API

### Réponse en cas de succès:
```json
{
  "success": true,
  "message": "Auto-release terminé",
  "summary": {
    "total_earnings": 10,
    "released": 3,
    "skipped": 7,
    "failed": 0
  }
}
```

### Signification:
- **total_earnings**: Nombre total d'earnings en pending
- **released**: Earnings libérés avec succès (délai écoulé)
- **skipped**: Earnings en attente (délai pas encore écoulé)
- **failed**: Erreurs lors de la libération

---

## 🎯 Logique de sélection du delay_hours

```
1. Récupérer toutes les règles actives (is_active = true)
2. Trier par priority (DESC) - Plus haute priorité d'abord
3. Pour chaque earning pending:
   a. Récupérer les infos du provider (âge, rating, pays, etc.)
   b. Parcourir les règles par ordre de priorité
   c. Vérifier si la règle s'applique:
      - applies_to correspond ?
      - Toutes les conditions sont remplies ?
   d. Si OUI → Appliquer le delay_hours de cette règle
   e. Si NON → Passer à la règle suivante
4. Si AUCUNE règle ne correspond → Défaut: 336h (14 jours)
```

---

## 📝 Exemples de conditions

### Règle VIP (rating >= 4.5):
```json
{
  "applies_to": "vip",
  "delay_hours": 48,
  "condition": {
    "provider_rating": 4.5
  }
}
```

### Règle Nouveaux providers (<30 jours):
```json
{
  "applies_to": "new_providers",
  "delay_hours": 336,
  "condition": {
    "provider_age_days": 30
  }
}
```

### Règle Montant ($50 - $500):
```json
{
  "applies_to": "amount_threshold",
  "delay_hours": 120,
  "condition": {
    "min_amount": 5000,
    "max_amount": 50000
  }
}
```

### Règle Pays (France, Belgique):
```json
{
  "applies_to": "country",
  "delay_hours": 72,
  "condition": {
    "countries": ["FR", "BE"]
  }
}
```

---

## 🔧 Règle par défaut (FALLBACK)

Si aucune règle active ne correspond, le système applique automatiquement:

```javascript
{
  id: 'default',
  name: 'Défaut (14 jours)',
  delay_hours: 336,  // 14 jours × 24 heures
  applies_to: 'all',
  is_active: true,
  priority: 0
}
```

**Fichier source**: [route.ts:125](src/app/api/auto-release-funds-simple/route.ts#L125)

---

## ⏱️ Conversion heures → jours

| Heures | Jours | Utilisation typique |
|--------|-------|---------------------|
| 0h     | 0j    | Libération immédiate (VIP++) |
| 24h    | 1j    | Petits montants |
| 48h    | 2j    | Providers fiables |
| 72h    | 3j    | Pays de confiance |
| 120h   | 5j    | Montants moyens |
| 168h   | 7j    | Standard |
| 240h   | 10j   | Montants élevés |
| 336h   | 14j   | **PAR DÉFAUT** |
| 504h   | 21j   | Nouveaux + montant élevé |
| 720h   | 30j   | Pays à risque |

---

## 🚀 Tester directement dans le navigateur

Ouvrez simplement dans votre navigateur:
```
http://localhost:3000/api/auto-release-funds-simple
```

Vous verrez la réponse JSON directement !

---

## 📌 Vérifier les scheduled_releases créés

```sql
-- Voir les releases programmés
SELECT
  sr.id,
  sr.rule_name,
  sr.delay_hours,
  sr.amount_cents / 100.0 as amount_usd,
  sr.release_at,
  sr.status,
  pe.created_at as earning_created_at,
  EXTRACT(HOUR FROM (sr.release_at - pe.created_at)) as actual_delay_hours
FROM scheduled_releases sr
JOIN provider_earnings pe ON sr.earning_id = pe.id
ORDER BY sr.release_at ASC;
```

Cette requête vous montrera quel **delay_hours** a été appliqué à chaque earning !
