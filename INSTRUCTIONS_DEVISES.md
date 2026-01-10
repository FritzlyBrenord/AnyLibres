# 💰 Système de Gestion des Devises - Instructions Complètes

## 📋 Vue d'ensemble

Ce système permet à l'administrateur de gérer plusieurs devises avec conversion automatique ou manuelle, définir une devise par défaut, et gérer les frais de conversion.

## 🎯 Fonctionnalités implémentées

### 1. **Gestion des devises**
- ✅ Ajouter/Modifier/Supprimer des devises (USD, EUR, HTG, CLP, DOP, etc.)
- ✅ Définir une devise par défaut pour le système
- ✅ Activer/Désactiver des devises
- ✅ Configurer le symbole, nom, et formatage de chaque devise

### 2. **Taux de conversion**
- ✅ **Mode automatique** - Taux récupérés via API en temps réel
- ✅ **Mode manuel** - L'admin définit ses propres taux
- ✅ Mise à jour automatique des taux via bouton
- ✅ Historique des taux de change

### 3. **Conversion automatique**
- ✅ Tous les montants sont convertis en devise par défaut (USD)
- ✅ API de conversion pour calculer les montants
- ✅ Frais de conversion configurables par devise

### 4. **API de taux de change**
- ✅ Integration avec exchangerate-api.com (gratuit, 1500 requêtes/mois)
- ✅ Mise à jour en un clic depuis l'interface admin

---

## 🚀 Installation

### Étape 1: Créer la table dans Supabase

1. Ouvrez votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez-collez le contenu de `migrations/create_currencies_system.sql`
5. Exécutez (Run)

Cela va créer:
- Table `currencies` avec 7 devises pré-configurées
- Table `exchange_rates_history` pour l'historique
- Index pour les performances

### Étape 2: Configurer l'API de taux de change (optionnel)

Par défaut, le système utilise l'API gratuite `exchangerate-api.com` sans clé.

Pour obtenir plus de requêtes (gratuit jusqu'à 1500/mois):

1. Allez sur https://www.exchangerate-api.com/
2. Créez un compte gratuit
3. Récupérez votre clé API
4. Ajoutez dans votre `.env.local`:

```env
EXCHANGE_RATE_API_KEY=votre_cle_api_ici
```

### Étape 3: Ajouter la page dans l'admin

1. Ouvrez le fichier de navigation de l'admin
2. Ajoutez l'import:

```tsx
import Currencies from './Components/Currencies';
```

3. Ajoutez l'onglet dans votre menu admin:

```tsx
{ id: 'currencies', label: 'Devises', component: <Currencies /> }
```

---

## 📊 Structure des tables

### Table: `currencies`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `code` | TEXT | Code ISO 4217 (USD, EUR, HTG...) |
| `name` | TEXT | Nom complet (Dollar américain, Euro...) |
| `symbol` | TEXT | Symbole ($, €, G...) |
| `is_default` | BOOLEAN | Si c'est la devise par défaut du système |
| `is_active` | BOOLEAN | Si la devise est active |
| `conversion_mode` | TEXT | 'auto' ou 'manual' |
| `manual_rate_to_default` | DECIMAL | Taux manuel vers devise par défaut |
| `auto_rate_to_default` | DECIMAL | Taux auto (via API) vers devise par défaut |
| `last_rate_update` | TIMESTAMPTZ | Dernière mise à jour du taux |
| `conversion_fee_percentage` | DECIMAL | Frais de conversion (ex: 2.5%) |
| `decimal_places` | INTEGER | Nombre de décimales (2 pour USD/EUR, 0 pour CLP) |
| `position` | TEXT | Position du symbole ('before' ou 'after') |

### Table: `exchange_rates_history`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `from_currency_code` | TEXT | Code devise source |
| `to_currency_code` | TEXT | Code devise destination |
| `rate` | DECIMAL | Taux de change |
| `source` | TEXT | 'api' ou 'manual' |
| `created_at` | TIMESTAMPTZ | Date de l'enregistrement |

---

## 🔧 APIs créées

### 1. `/api/admin/currencies` (GET, POST, PUT, DELETE)

**GET** - Récupérer toutes les devises
```bash
GET /api/admin/currencies?isAdmin=true
```

**POST** - Ajouter une devise
```bash
POST /api/admin/currencies?isAdmin=true
Body: {
  "currency": {
    "code": "HTG",
    "name": "Gourde haïtienne",
    "symbol": "G",
    "is_default": false,
    "is_active": true,
    "conversion_mode": "auto",
    "conversion_fee_percentage": 2.5
  }
}
```

**PUT** - Modifier une devise
```bash
PUT /api/admin/currencies?isAdmin=true
Body: {
  "id": "uuid-here",
  "currency": { ... }
}
```

**DELETE** - Supprimer une devise
```bash
DELETE /api/admin/currencies?isAdmin=true&id=uuid-here
```

### 2. `/api/admin/currencies/exchange-rates` (GET, POST)

**GET** - Mettre à jour tous les taux automatiques
```bash
GET /api/admin/currencies/exchange-rates?isAdmin=true
```

**POST** - Convertir un montant
```bash
POST /api/admin/currencies/exchange-rates
Body: {
  "amount": 100,
  "from_currency": "EUR",
  "to_currency": "USD"
}

Response: {
  "from_amount": 100,
  "from_currency": "EUR",
  "to_currency": "USD",
  "rate": 1.08,
  "converted_amount": 108,
  "conversion_fee": 2.7,
  "final_amount": 105.3
}
```

---

## 💡 Utilisation

### Dans l'interface admin:

1. **Ajouter une devise**:
   - Cliquez sur "Ajouter une devise"
   - Remplissez le code (ex: HTG), nom, symbole
   - Choisissez le mode de conversion (Auto/Manuel)
   - Si manuel, définissez le taux
   - Configurez les frais de conversion (optionnel)

2. **Mettre à jour les taux**:
   - Cliquez sur "Mettre à jour les taux"
   - Tous les taux en mode automatique seront mis à jour

3. **Définir devise par défaut**:
   - Modifiez une devise
   - Cochez "Devise par défaut"
   - Sauvegardez

### Dans le code (pour les développeurs):

```typescript
// Convertir un montant
const response = await fetch('/api/admin/currencies/exchange-rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    from_currency: 'EUR',
    to_currency: 'USD'
  })
});

const result = await response.json();
console.log(result.data.final_amount); // Montant converti après frais
```

---

## 📝 Devises pré-configurées

| Code | Nom | Symbole | Par défaut |
|------|-----|---------|------------|
| USD | Dollar américain | $ | ✅ |
| EUR | Euro | € | ❌ |
| HTG | Gourde haïtienne | G | ❌ |
| CAD | Dollar canadien | CA$ | ❌ |
| GBP | Livre sterling | £ | ❌ |
| CLP | Peso chilien | CLP$ | ❌ |
| DOP | Peso dominicain | RD$ | ❌ |

---

## 🎨 Ordre de priorité des frais

Lorsqu'un paiement est effectué:

1. **Conversion vers devise par défaut** - Si le montant n'est pas en USD
2. **Application des frais de conversion** - Selon le % configuré pour la devise
3. **Application des frais de plateforme** - 5% (ou selon configuration)
4. **Application des frais de retrait** - 2.5% lors du retrait

**Exemple complet**:
```
Client paie: 100 EUR
Taux EUR->USD: 1.08
Frais conversion: 2.5%

100 EUR × 1.08 = 108 USD (brut)
108 USD - (108 × 2.5%) = 105.3 USD (après frais conversion)
105.3 USD - (105.3 × 5%) = 100.03 USD (pour le prestataire après frais plateforme)
```

---

## 🔄 Logique de conversion automatique

Toutes les conversions passent par la devise par défaut:

```
Source → Devise par défaut → Destination

Exemple: EUR → USD → HTG
100 EUR × 0.93 (EUR->USD) = 93 USD
93 USD ÷ 0.0084 (USD->HTG) = 11,071 HTG
```

---

## ⚙️ Configuration avancée

### Changer l'API de taux de change

Modifiez `src/app/api/admin/currencies/exchange-rates/route.ts`:

```typescript
// Remplacer par votre API préférée
const EXCHANGE_RATE_API_URL = 'https://votre-api.com/latest';
```

### Ajouter des frais fixes

Modifiez la table `currencies` pour ajouter une colonne:

```sql
ALTER TABLE currencies ADD COLUMN fixed_fee_cents INTEGER DEFAULT 0;
```

---

## 🚨 Points importants

1. **Une seule devise par défaut** - Le système empêche d'avoir plusieurs devises par défaut
2. **Impossible de supprimer la devise par défaut** - Protection intégrée
3. **Taux automatiques** - Mis à jour manuellement via le bouton (pas de CRON automatique)
4. **Historique** - Tous les taux sont enregistrés dans `exchange_rates_history`
5. **Mode manuel** - Utile si vous voulez contrôler les taux ou si l'API est down

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs API dans le terminal Next.js
3. Vérifiez que la table `currencies` existe dans Supabase
4. Vérifiez que l'API key est correcte (si utilisée)

---

## 🎉 C'est tout!

Votre système de devises est maintenant opérationnel. Les utilisateurs peuvent payer dans leur devise locale, et tout sera automatiquement converti en devise par défaut (USD) pour le système.
