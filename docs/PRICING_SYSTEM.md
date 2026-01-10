# 💰 Système de Prix et Frais - AnyLibre

## 📋 Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Stockage des prix (centimes)](#stockage-des-prix-centimes)
- [Système de frais dynamiques](#système-de-frais-dynamiques)
- [Configuration par service](#configuration-par-service)
- [API et calculs](#api-et-calculs)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Migration de la base de données](#migration-de-la-base-de-données)

---

## Vue d'ensemble

Le système de pricing d'AnyLibre suit les meilleures pratiques des plateformes de services comme **Fiverr** et **Upwork** :

✅ **Stockage en centimes** : Tous les montants sont stockés en centimes pour éviter les problèmes d'arrondi
✅ **Frais dynamiques** : Configuration flexible des frais par service (2%, 3%, 5%, 10%, etc.)
✅ **Transparence** : Affichage clair du sous-total, frais et total
✅ **Précision** : Pas de multiplication/division par 100 dans les calculs

---

## Architecture

### Flux de calcul

```
Service: 100€
├─ Stockage DB: 10000 centimes (base_price_cents)
├─ Extra +20€:  2000 centimes (extra.price_cents)
├─ Sous-total:  12000 centimes
├─ Frais 5%:    600 centimes (calculé dynamiquement)
└─ Total:       12600 centimes → Affiché: 126.00€
```

### Structure des données

```typescript
interface Service {
  base_price_cents: number;           // 10000 = 100€
  currency: string;                   // 'EUR'
  platform_fee_config?: PlatformFeeConfig;  // Configuration des frais
}

interface Order {
  total_cents: number;                // Total AVEC frais
  fees_cents: number;                 // Montant des frais
  currency: string;
}
```

---

## Stockage des prix (centimes)

### ✅ Règle d'or

**TOUJOURS stocker en centimes, TOUJOURS afficher en divisant par 100**

```typescript
// ✅ CORRECT
const prixEnEuros = 100;
const prixEnCentimes = 10000;        // Stocké dans la DB
const affichage = prixEnCentimes / 100; // 100.00€

// ❌ INCORRECT
const prixEnEuros = 100;
const prixEnCentimes = prixEnEuros * 100; // NE PAS multiplier avant stockage
```

### Exemples de stockage

| Prix affiché | Stocké dans DB (centimes) | Colonne DB |
|--------------|---------------------------|------------|
| 5.50€        | 550                       | `base_price_cents` |
| 100.00€      | 10000                     | `base_price_cents` |
| 0.99€        | 99                        | `base_price_cents` |

---

## Système de frais dynamiques

### Configuration des frais

Chaque service peut avoir sa propre configuration de frais dans `platform_fee_config` (JSONB) :

```typescript
interface PlatformFeeConfig {
  fee_percentage: number;           // Ex: 5 pour 5%
  fee_type: 'percentage' | 'fixed' | 'hybrid';
  paid_by: 'client' | 'provider' | 'split';
  min_fee_cents?: number;           // Frais minimum
  max_fee_cents?: number;           // Frais maximum
  fixed_amount_cents?: number;      // Montant fixe (si fee_type = 'fixed')
}
```

### Configuration par défaut

```typescript
const DEFAULT_PLATFORM_FEE = {
  fee_percentage: 5,                // 5%
  fee_type: 'percentage',
  paid_by: 'client',                // Client paie les frais
  min_fee_cents: 50,                // 0.50€ minimum
};
```

### Types de frais

#### 1. Frais en pourcentage (par défaut)

```json
{
  "fee_percentage": 5,
  "fee_type": "percentage",
  "paid_by": "client"
}
```

**Calcul :** `frais = sous_total × 5%`

| Sous-total | Frais (5%) | Total client |
|------------|------------|--------------|
| 10€        | 0.50€      | 10.50€       |
| 100€       | 5.00€      | 105.00€      |
| 500€       | 25.00€     | 525.00€      |

#### 2. Frais fixes

```json
{
  "fee_type": "fixed",
  "fixed_amount_cents": 200,
  "paid_by": "client"
}
```

**Résultat :** Frais de 2€ peu importe le montant

#### 3. Frais hybrides

```json
{
  "fee_percentage": 3,
  "fee_type": "hybrid",
  "fixed_amount_cents": 100,
  "paid_by": "client"
}
```

**Calcul :** `frais = (sous_total × 3%) + 1€`

---

## Configuration par service

### Exemples de configurations

#### Service standard (5%)

```sql
UPDATE services
SET platform_fee_config = '{
  "fee_percentage": 5,
  "fee_type": "percentage",
  "paid_by": "client",
  "min_fee_cents": 50
}'
WHERE id = 'service-standard-id';
```

#### Service premium (2% seulement)

```sql
UPDATE services
SET platform_fee_config = '{
  "fee_percentage": 2,
  "fee_type": "percentage",
  "paid_by": "client"
}'
WHERE category = 'premium';
```

#### Service micro (frais fixes de 1€)

```sql
UPDATE services
SET platform_fee_config = '{
  "fee_type": "fixed",
  "fixed_amount_cents": 100,
  "paid_by": "client"
}'
WHERE base_price_cents < 1000;
```

#### Service où le prestataire paie

```sql
UPDATE services
SET platform_fee_config = '{
  "fee_percentage": 10,
  "fee_type": "percentage",
  "paid_by": "provider"
}'
WHERE provider_type = 'entreprise';
```

---

## API et calculs

### Fonction de calcul

```typescript
import { calculatePlatformFees } from '@/lib/fees/calculateFees';

const result = calculatePlatformFees(
  10000,  // 100€ en centimes
  service.platform_fee_config
);

console.log(result);
// {
//   subtotal_cents: 10000,
//   fee_cents: 500,              // 5€
//   total_cents: 10500,          // 105€
//   provider_receives_cents: 10000,
//   fee_config: { ... },
//   breakdown: { formula: "..." }
// }
```

### Utilisation dans l'API

```typescript
// app/api/orders/route.ts

import { calculatePlatformFees } from '@/lib/fees/calculateFees';

// Récupérer le service avec sa config
const service = await supabase
  .from('services')
  .select('*, platform_fee_config')
  .eq('id', serviceId)
  .single();

// Calculer sous-total (base + extras)
const subtotal = service.base_price_cents + extrasTotal;

// Calculer frais dynamiquement
const feeCalculation = calculatePlatformFees(
  subtotal,
  service.platform_fee_config
);

// Créer la commande
await supabase.from('orders').insert({
  total_cents: feeCalculation.total_cents,
  fees_cents: feeCalculation.fee_cents,
  metadata: {
    pricing: feeCalculation
  }
});
```

### Affichage dans le frontend

```tsx
import { calculatePlatformFees, getFeeLabel } from '@/lib/fees/calculateFees';

const pricing = calculatePlatformFees(
  subtotal,
  service.platform_fee_config
);

return (
  <div>
    <p>Sous-total: {(pricing.subtotal / 100).toFixed(2)} €</p>
    <p>{pricing.feeLabel}: {(pricing.fees / 100).toFixed(2)} €</p>
    <p>Total: {(pricing.total / 100).toFixed(2)} €</p>
  </div>
);
```

---

## Exemples d'utilisation

### Exemple 1 : Service à 50€ avec frais 5%

```typescript
const service = {
  base_price_cents: 5000,
  platform_fee_config: { fee_percentage: 5, fee_type: 'percentage' }
};

const pricing = calculatePlatformFees(5000, service.platform_fee_config);

// Résultat:
// - Sous-total: 50.00€
// - Frais (5%): 2.50€
// - Total: 52.50€
```

### Exemple 2 : Service à 200€ avec 1 extra de 30€, frais 3%

```typescript
const subtotal = 20000 + 3000; // 200€ + 30€ = 230€

const pricing = calculatePlatformFees(subtotal, {
  fee_percentage: 3,
  fee_type: 'percentage'
});

// Résultat:
// - Sous-total: 230.00€
// - Frais (3%): 6.90€
// - Total: 236.90€
```

### Exemple 3 : Service micro à 5€ avec frais minimum de 1€

```typescript
const pricing = calculatePlatformFees(500, {
  fee_percentage: 10,
  fee_type: 'percentage',
  min_fee_cents: 100  // 1€ minimum
});

// Calcul: 500 × 10% = 50 centimes
// Mais min = 100 centimes
// Donc frais = 1.00€

// Résultat:
// - Sous-total: 5.00€
// - Frais: 1.00€ (min appliqué)
// - Total: 6.00€
```

---

## Migration de la base de données

### Ajouter la colonne aux services existants

```sql
-- Exécuter: migrations/add_platform_fee_config.sql

-- 1. Ajouter la colonne
ALTER TABLE services
ADD COLUMN platform_fee_config JSONB DEFAULT '{
  "fee_percentage": 5,
  "fee_type": "percentage",
  "paid_by": "client",
  "min_fee_cents": 50
}'::jsonb;

-- 2. Mettre à jour les services existants
UPDATE services
SET platform_fee_config = '{
  "fee_percentage": 5,
  "fee_type": "percentage",
  "paid_by": "client",
  "min_fee_cents": 50
}'::jsonb
WHERE platform_fee_config IS NULL;
```

### Modifier les frais pour une catégorie spécifique

```sql
-- Tous les services "design" ont 3% de frais
UPDATE services
SET platform_fee_config = jsonb_set(
  platform_fee_config,
  '{fee_percentage}',
  '3'
)
WHERE 'design' = ANY(categories);
```

---

## FAQ

### Q: Pourquoi stocker en centimes ?

**R:** Pour éviter les erreurs d'arrondi avec les nombres décimaux. Les bases de données et langages de programmation peuvent avoir des imprécisions avec `0.1 + 0.2`.

```javascript
// ❌ Problème avec les décimaux
0.1 + 0.2 === 0.3  // false !

// ✅ Pas de problème avec les entiers
10 + 20 === 30     // true
```

### Q: Comment changer les frais globalement ?

**R:** Modifier la constante `DEFAULT_PLATFORM_FEE` dans `src/types/service.ts`. Les nouveaux services utiliseront cette valeur.

### Q: Peut-on avoir des frais différents par catégorie ?

**R:** Oui ! Utiliser un script SQL pour mettre à jour par catégorie :

```sql
UPDATE services
SET platform_fee_config = '{"fee_percentage": 2, "fee_type": "percentage"}'
WHERE 'premium' = ANY(categories);
```

### Q: Comment gérer les remises/promotions ?

**R:** Les remises doivent être appliquées au `subtotal` AVANT le calcul des frais.

```typescript
const subtotalAvecRemise = subtotal * 0.8; // -20%
const pricing = calculatePlatformFees(subtotalAvecRemise, config);
```

---

## 🎯 Checklist avant déploiement

- [ ] Exécuter la migration SQL (`migrations/add_platform_fee_config.sql`)
- [ ] Vérifier que tous les services ont une config par défaut
- [ ] Tester le checkout avec différents montants
- [ ] Vérifier l'affichage de la page de confirmation
- [ ] Tester avec extras et sans extras
- [ ] Vérifier les calculs pour frais min/max
- [ ] Vérifier les webhooks de paiement
- [ ] Documenter les frais dans les CGV

---

## 📚 Ressources

- **Types**: [`src/types/service.ts`](../src/types/service.ts)
- **Calculs**: [`src/lib/fees/calculateFees.ts`](../src/lib/fees/calculateFees.ts)
- **API Orders**: [`src/app/api/orders/route.ts`](../src/app/api/orders/route.ts)
- **Page Checkout**: [`src/app/(protected)/checkout/[serviceId]/page.tsx`](../src/app/(protected)/checkout/[serviceId]/page.tsx)
- **Migration**: [`migrations/add_platform_fee_config.sql`](../migrations/add_platform_fee_config.sql)

---

**Dernière mise à jour**: 2025-12-10
**Version**: 1.0.0
