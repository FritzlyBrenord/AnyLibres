# 🔍 Vérification du Système de Prix

## Votre commande actuelle

D'après les données de la base :

| Élément | Valeur en DB (centimes) | Affichage (€) |
|---------|------------------------|---------------|
| Prix de base | 1200 | 12.00€ |
| Prix item (avec extras) | 2100 | 21.00€ |
| Frais (5%) | 105 | 1.05€ |
| **Total** | **2205** | **22.05€** |

## ✅ Vérification des calculs

### Calcul des frais
```
2100 × 5% = 105 centimes ✅
105 centimes = 1.05€ ✅
```

### Calcul du total
```
2100 + 105 = 2205 centimes ✅
2205 centimes = 22.05€ ✅
```

### Affichage
```
Total en DB: 2205 centimes
Affichage: 2205 / 100 = 22.05€ ✅
```

## ❓ Questions à vérifier

### 1. Quel est le prix réel du service ?

Vérifiez dans votre interface admin ou dans la table `services` :

```sql
SELECT id, title, base_price_cents, currency
FROM services
WHERE id = 'votre-service-id';
```

**Si le résultat est :**
- `base_price_cents = 1200` → Le service coûte **12.00€** ✅
- Mais vous voulez **22.00€** → Il faut modifier pour `2200`
- Mais vous voulez **0.12€** → Il faut modifier pour `12`

### 2. Comment corriger le prix d'un service ?

Si le prix est incorrect, utilisez :

```sql
-- Pour un service à 100€
UPDATE services
SET base_price_cents = 10000
WHERE id = 'service-id';

-- Pour un service à 22.50€
UPDATE services
SET base_price_cents = 2250
WHERE id = 'service-id';

-- Pour un service à 5.99€
UPDATE services
SET base_price_cents = 599
WHERE id = 'service-id';
```

### 3. Vérifier les extras

```sql
SELECT id, title, base_price_cents, extras
FROM services
WHERE id = 'votre-service-id';
```

Les extras doivent aussi être en centimes :

```json
{
  "extras": [
    {
      "id": "extra-1",
      "name": "Extra rapide",
      "price_cents": 500    // 5.00€
    },
    {
      "id": "extra-2",
      "name": "Support premium",
      "price_cents": 1000   // 10.00€
    }
  ]
}
```

## 🛠️ Corriger les prix dans l'interface admin

Quand vous créez ou modifiez un service, assurez-vous de :

### ❌ NE PAS FAIRE
```typescript
// Si l'utilisateur entre "100" (100€)
const price = 100;
await supabase.from('services').insert({
  base_price_cents: price  // ❌ FAUX: stocke 100 centimes = 1€
});
```

### ✅ À FAIRE
```typescript
// Si l'utilisateur entre "100" (100€)
const priceInEuros = 100;
const priceInCents = priceInEuros * 100;  // 10000 centimes
await supabase.from('services').insert({
  base_price_cents: priceInCents  // ✅ CORRECT: 10000 centimes = 100€
});
```

### ✅ Encore mieux : utiliser les utilitaires
```typescript
import { eurosToCents } from '@/lib/fees/priceUtils';

const priceInEuros = 100;
await supabase.from('services').insert({
  base_price_cents: eurosToCents(priceInEuros)  // 10000
});
```

## 🔧 Script de vérification SQL

Exécutez ce script pour vérifier tous vos services :

```sql
-- Voir tous les services avec leur prix affiché
SELECT
  id,
  title,
  base_price_cents,
  (base_price_cents / 100.0) AS prix_affiché_euros,
  currency
FROM services
ORDER BY base_price_cents DESC;
```

## 📊 Exemples de prix corrects

| Prix souhaité | Valeur à stocker (base_price_cents) |
|---------------|-------------------------------------|
| 0.50€ | 50 |
| 5.00€ | 500 |
| 5.99€ | 599 |
| 10.00€ | 1000 |
| 12.00€ | 1200 |
| 22.05€ | 2205 |
| 50.00€ | 5000 |
| 99.99€ | 9999 |
| 100.00€ | 10000 |
| 500.00€ | 50000 |
| 1000.00€ | 100000 |

## ✅ Checklist de vérification

- [ ] Le prix dans `services.base_price_cents` correspond au prix souhaité × 100
- [ ] Les extras dans `services.extras[].price_cents` sont aussi en centimes
- [ ] L'affichage divise toujours par 100 avant d'afficher
- [ ] Les calculs de frais utilisent les montants en centimes
- [ ] Le total final est correct (sous-total + frais)

## 🚨 Cas d'usage de votre commande

Basé sur vos données :

```
Service (base_price_cents): 1200 centimes
└─ Affichage: 12.00€

Extras ajoutés: 900 centimes
└─ Affichage: 9.00€

Sous-total: 2100 centimes
└─ Affichage: 21.00€

Frais (5%): 105 centimes
└─ Affichage: 1.05€

TOTAL: 2205 centimes
└─ Affichage: 22.05€
```

**Si vous voyez "22.05€" affiché mais que vous attendiez un autre montant, c'est que le prix de base du service (1200 centimes = 12€) n'est pas correct dans la base de données.**

## 💡 Solution

1. **Vérifiez le prix du service dans la base de données**
2. **Si incorrect, corrigez-le avec un UPDATE**
3. **Assurez-vous que toutes les nouvelles créations utilisent `eurosToCents()`**

---

**Date**: 2025-12-10
**Status**: Système fonctionnel ✅ - Vérifier les prix en DB
