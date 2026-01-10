# 📊 Guide Complet de la Réponse API Auto-Release

## 🔗 URL de l'API

```
GET/POST http://localhost:3000/api/auto-release-funds-simple
```

---

## 📋 Structure de la Réponse JSON

La réponse de l'API contient maintenant **TOUTES les informations** sur les règles appliquées :

```json
{
  "success": true,
  "message": "Auto-release terminé",
  "summary": { ... },           // Résumé global
  "active_rules": [ ... ],      // TOUTES les règles actives
  "earnings_details": [ ... ],  // Détails par earning avec règle appliquée
  "metadata": { ... }            // Informations complémentaires
}
```

---

## 1️⃣ `summary` - Résumé Global

```json
"summary": {
  "total_earnings": 1,    // Nombre total d'earnings en pending
  "released": 0,          // Earnings libérés (délai écoulé)
  "skipped": 1,           // Earnings en attente (délai non écoulé)
  "failed": 0             // Erreurs lors du traitement
}
```

---

## 2️⃣ `active_rules` - Liste des Règles Actives

**Toutes** les règles configurées dans votre système :

```json
"active_rules": [
  {
    "id": "xxx-vip-rule-id",
    "name": "VIP Premium",
    "delay_hours": 48,               // Délai en heures
    "delay_days": "2.0",             // Délai en jours (converti)
    "applies_to": "vip",             // Type de règle
    "condition": {                   // Conditions d'application
      "provider_rating": 4.8
    },
    "priority": 20,                  // Priorité (plus élevé = prioritaire)
    "is_active": true
  },
  {
    "id": "xxx-new-providers",
    "name": "Nouveaux Providers",
    "delay_hours": 336,
    "delay_days": "14.0",
    "applies_to": "new_providers",
    "condition": {
      "provider_age_days": 30       // Compte <= 30 jours
    },
    "priority": 10,
    "is_active": true
  },
  {
    "id": "xxx-standard",
    "name": "Standard",
    "delay_hours": 168,
    "delay_days": "7.0",
    "applies_to": "all",
    "condition": null,                // Aucune condition
    "priority": 0,
    "is_active": true
  }
]
```

### Types de `applies_to` possibles :

| Type | Description | Exemple de condition |
|------|-------------|---------------------|
| `all` | Tous les providers | `null` |
| `new_providers` | Comptes récents | `{"provider_age_days": 30}` |
| `vip` | Haute réputation | `{"provider_rating": 4.5}` |
| `amount_threshold` | Selon montant | `{"min_amount": 5000, "max_amount": 50000}` |
| `country` | Selon pays | `{"countries": ["FR", "BE"]}` |

---

## 3️⃣ `earnings_details` - Détails par Earning

**Pour chaque earning**, vous voyez :
- Les infos du provider
- **Quelle règle a été appliquée** (avec `delay_hours`)
- Combien de temps reste avant libération
- Le statut actuel

```json
"earnings_details": [
  {
    "earning_id": "abc-123",
    "provider_id": "provider-uuid",
    "amount_cents": 25000,
    "amount_usd": "250.00",
    "earning_created_at": "2026-01-08T10:30:00Z",

    // ℹ️ Informations du provider
    "provider_info": {
      "age_days": 45,              // Âge du compte en jours
      "rating": 4.2,               // Note du provider
      "location": "France"         // Pays
    },

    // 🎯 RÈGLE APPLIQUÉE (IMPORTANT!)
    "rule_applied": {
      "rule_id": "xxx-standard-id",
      "rule_name": "Standard",
      "delay_hours": 336,          // ⭐ DÉLAI EN HEURES APPLIQUÉ
      "delay_days": "14.0",        // ⭐ DÉLAI EN JOURS APPLIQUÉ
      "applies_to": "all",
      "priority": 0
    },

    // ⏱️ Informations de libération
    "release_info": {
      "release_at": "2026-01-22T10:30:00Z",  // Date de libération
      "is_ready": false,                      // Prêt à être libéré ?
      "hours_remaining": 312.5,               // Heures restantes
      "days_remaining": "13.0"                // Jours restants
    },

    // 📊 Statut actuel
    "status": "waiting"    // 'waiting', 'ready_to_release', 'released', 'failed'
  }
]
```

### Statuts possibles :

| Statut | Signification |
|--------|---------------|
| `waiting` | En attente (délai non écoulé) |
| `ready_to_release` | Prêt à être libéré (délai écoulé) |
| `released` | Libéré avec succès |
| `failed` | Erreur lors du traitement |

---

## 4️⃣ `metadata` - Métadonnées

```json
"metadata": {
  "total_active_rules": 5,
  "execution_time": "2026-01-09T14:25:00Z",
  "default_rule": {
    "name": "Défaut (14 jours)",
    "delay_hours": 336,
    "delay_days": 14,
    "applies_to": "all"
  }
}
```

---

## 🎯 Comment Interpréter la Réponse

### Exemple 1 : Provider VIP

```json
{
  "earning_id": "xyz-789",
  "provider_info": {
    "rating": 4.9,
    "age_days": 120
  },
  "rule_applied": {
    "rule_name": "VIP Premium",
    "delay_hours": 48,           // ⭐ Libération dans 48h (2 jours)
    "delay_days": "2.0",
    "applies_to": "vip"
  },
  "release_info": {
    "hours_remaining": 36.5,
    "days_remaining": "1.5"
  },
  "status": "waiting"
}
```

**Interprétation** : Ce provider a un rating de 4.9, donc la règle VIP s'applique avec un délai de **48 heures**. Il reste 36.5h avant la libération.

---

### Exemple 2 : Nouveau Provider

```json
{
  "earning_id": "abc-456",
  "provider_info": {
    "rating": 3.8,
    "age_days": 15               // Compte de 15 jours
  },
  "rule_applied": {
    "rule_name": "Nouveaux Providers",
    "delay_hours": 336,          // ⭐ Libération dans 336h (14 jours)
    "delay_days": "14.0",
    "applies_to": "new_providers"
  },
  "release_info": {
    "hours_remaining": 280,
    "days_remaining": "11.7"
  },
  "status": "waiting"
}
```

**Interprétation** : Compte créé il y a 15 jours (< 30 jours), donc règle "Nouveaux Providers" appliquée avec **336h de délai**.

---

### Exemple 3 : Petit Montant

```json
{
  "earning_id": "small-123",
  "amount_cents": 5000,          // $50
  "amount_usd": "50.00",
  "rule_applied": {
    "rule_name": "Petits Montants",
    "delay_hours": 24,           // ⭐ Libération dans 24h (1 jour)
    "delay_days": "1.0",
    "applies_to": "amount_threshold"
  },
  "release_info": {
    "hours_remaining": 0,
    "is_ready": true             // Prêt à libérer !
  },
  "status": "ready_to_release"
}
```

**Interprétation** : Montant de $50, donc règle "Petits Montants" appliquée. Le délai de **24h est écoulé**, le paiement va être libéré.

---

## 📊 Tableau Récapitulatif des Règles Typiques

| Règle | `applies_to` | Condition | `delay_hours` | `delay_days` |
|-------|--------------|-----------|---------------|--------------|
| VIP Premium | `vip` | rating >= 4.8 | 0-48 | 0-2 |
| Providers Fiables | `vip` | rating >= 4.5 | 72-120 | 3-5 |
| Petits Montants | `amount_threshold` | amount <= $100 | 24 | 1 |
| Montants Moyens | `amount_threshold` | $100 < amount < $500 | 120-168 | 5-7 |
| Montants Élevés | `amount_threshold` | amount >= $500 | 240-336 | 10-14 |
| Nouveaux Providers | `new_providers` | age <= 30 jours | 336-720 | 14-30 |
| Pays de Confiance | `country` | FR, BE, CH | 72 | 3 |
| Pays à Risque | `country` | Liste spécifique | 504-720 | 21-30 |
| Standard/Défaut | `all` | Aucune | 336 | 14 |

---

## 🧪 Tester l'API

### Dans le navigateur :
```
http://localhost:3000/api/auto-release-funds-simple
```

### Avec cURL :
```bash
curl http://localhost:3000/api/auto-release-funds-simple | jq
```

### Avec Postman :
- Method: `GET` ou `POST`
- URL: `http://localhost:3000/api/auto-release-funds-simple`
- Headers: `Content-Type: application/json`

---

## 📝 Exemple de Réponse Complète

Voir le fichier : [EXAMPLE_RESPONSE.json](./EXAMPLE_RESPONSE.json)

---

## 🔍 Vérifier les Règles Appliquées dans la DB

```sql
-- Voir quelle règle a été appliquée pour chaque earning
SELECT
  sr.earning_id,
  sr.rule_name,
  sr.delay_hours,
  ROUND(sr.delay_hours::numeric / 24, 1) as delay_days,
  sr.amount_cents / 100.0 as amount_usd,
  sr.release_at,
  sr.status,
  pe.created_at as earning_created_at,
  EXTRACT(HOUR FROM (sr.release_at - pe.created_at)) as actual_hours_applied
FROM scheduled_releases sr
JOIN provider_earnings pe ON sr.earning_id = pe.id
ORDER BY sr.created_at DESC;
```

Cette requête vous montre **exactement** quel `delay_hours` a été appliqué à chaque earning !

---

## 🎯 Points Clés

1. **`active_rules`** = Toutes les règles configurées (par ordre de priorité)
2. **`earnings_details.rule_applied`** = La règle spécifique appliquée à chaque earning
3. **`delay_hours`** = Le délai en heures avant libération
4. **`release_info`** = Infos sur la date de libération et temps restant
5. **Règle par défaut** = 336h (14 jours) si aucune règle ne correspond

---

## 💡 Astuce

Pour voir uniquement les earnings avec leur règle appliquée :

```bash
curl http://localhost:3000/api/auto-release-funds-simple | jq '.earnings_details[] | {earning_id, rule: .rule_applied.rule_name, delay_hours: .rule_applied.delay_hours, hours_remaining: .release_info.hours_remaining}'
```

Résultat :
```json
{
  "earning_id": "abc-123",
  "rule": "Standard",
  "delay_hours": 336,
  "hours_remaining": 312.5
}
```

---

**Fichier source** : [route.ts](./src/app/api/auto-release-funds-simple/route.ts)
