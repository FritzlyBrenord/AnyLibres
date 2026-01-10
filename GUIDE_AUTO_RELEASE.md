# 🤖 Guide : Déblocage Automatique des Paiements

## Vue d'ensemble

Le système de déblocage automatique permet de libérer les fonds des prestataires selon des règles personnalisables définies par l'administrateur.

## 🔄 Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT PAIE UNE COMMANDE                                     │
│    └─> Argent ajouté à pending_cents du prestataire            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API APPLY-PAYMENT-RULES (Automatique)                       │
│    POST /api/admin/apply-payment-rules                          │
│    {                                                            │
│      "earning_id": "uuid",                                      │
│      "provider_id": "uuid",                                     │
│      "amount_cents": 50000                                      │
│    }                                                            │
│                                                                 │
│    → Récupère les règles ACTIVES (is_active = true)           │
│    → Trie par priorité (décroissant)                          │
│    → Trouve la première règle qui correspond                   │
│    → Calcule release_at = now + delay_hours                    │
│    → Crée scheduled_release                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CRON AUTO-RELEASE (Toutes les heures)                       │
│    GET /api/cron/auto-release-payments                          │
│    Header: Authorization: Bearer CRON_SECRET                    │
│                                                                 │
│    → Récupère scheduled_releases où release_at <= now          │
│    → Vérifie que le compte n'est pas gelé                      │
│    → Transfère pending_cents → available_cents                 │
│    → Marque scheduled_release comme completed                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PRESTATAIRE PEUT RETIRER SON ARGENT                         │
│    POST /api/provider/withdrawals                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Gestion des Règles

### Interface Admin : PaymentReleaseRules

**Fichier:** `src/app/(Administrateur)/Components/PaymentReleaseRules.tsx`

L'admin peut :
- ✅ Créer des règles personnalisées
- ✅ Activer/Désactiver des règles
- ✅ Définir la priorité
- ✅ Configurer les conditions

### Structure d'une Règle

```typescript
interface ReleaseRule {
  id: string;
  name: string;                    // Ex: "VIP Instant"
  delay_hours: number;             // Ex: 0 (immédiat), 168 (7 jours)
  applies_to: string;              // 'all' | 'new_providers' | 'vip' | 'amount_threshold' | 'country'
  condition?: {
    min_amount?: number;           // Montant min en cents
    max_amount?: number;           // Montant max en cents
    countries?: string[];          // Liste de codes pays ['FR', 'BE', 'CH']
    provider_age_days?: number;    // Âge max du provider en jours
    provider_rating?: number;      // Note minimum (ex: 4.8)
  };
  is_active: boolean;              // ⚠️ IMPORTANT: false = règle ignorée
  priority: number;                // Plus élevé = prioritaire
}
```

---

## 🎯 Exemples de Règles

### Règle 1: VIP Immédiat
```json
{
  "name": "VIP Instant Release",
  "delay_hours": 0,
  "applies_to": "vip",
  "condition": {
    "provider_rating": 4.8
  },
  "is_active": true,
  "priority": 20
}
```
**Résultat:** Prestataires avec note ≥ 4.8 → déblocage immédiat

---

### Règle 2: Nouveaux Prestataires (Sécurité élevée)
```json
{
  "name": "Nouveaux Providers - 30 jours",
  "delay_hours": 720,
  "applies_to": "new_providers",
  "condition": {
    "provider_age_days": 30
  },
  "is_active": true,
  "priority": 10
}
```
**Résultat:** Prestataires inscrits depuis < 30 jours → déblocage après 30 jours

---

### Règle 3: Petits Montants (Risque faible)
```json
{
  "name": "Petits Montants < 100€",
  "delay_hours": 24,
  "applies_to": "amount_threshold",
  "condition": {
    "max_amount": 10000
  },
  "is_active": true,
  "priority": 5
}
```
**Résultat:** Paiements < 100€ → déblocage après 24h

---

### Règle 4: Montants Élevés (Sécurité)
```json
{
  "name": "Montants > 5000€",
  "delay_hours": 168,
  "applies_to": "amount_threshold",
  "condition": {
    "min_amount": 500000
  },
  "is_active": true,
  "priority": 15
}
```
**Résultat:** Paiements > 5000€ → déblocage après 7 jours

---

### Règle 5: Pays Spécifiques
```json
{
  "name": "France & Belgique - Rapide",
  "delay_hours": 48,
  "applies_to": "country",
  "condition": {
    "countries": ["FR", "BE"]
  },
  "is_active": true,
  "priority": 12
}
```
**Résultat:** Prestataires en France ou Belgique → déblocage après 48h

---

### Règle 6: Défaut pour Tous
```json
{
  "name": "Standard - 14 jours",
  "delay_hours": 336,
  "applies_to": "all",
  "is_active": true,
  "priority": 0
}
```
**Résultat:** Si aucune autre règle ne s'applique → déblocage après 14 jours

---

## 🔍 Logique d'Application

### Ordre de Priorité

L'API vérifie les règles **par ordre de priorité décroissant** :

```
1. VIP (priorité 20)              ← Vérifié en premier
2. Montants élevés (priorité 15)
3. Pays spécifiques (priorité 12)
4. Nouveaux providers (priorité 10)
5. Petits montants (priorité 5)
6. Standard (priorité 0)          ← Vérifié en dernier
```

### Exemple Concret

**Prestataire:**
- Note: 4.9 ⭐
- Âge: 45 jours
- Pays: France
- Paiement: 250€

**Vérification:**
1. ✅ **Règle VIP** (priorité 20)
   - Condition: rating ≥ 4.8 → **OUI (4.9 ≥ 4.8)**
   - **RÈGLE APPLIQUÉE** → Déblocage immédiat (0h)
   - STOP

Les autres règles ne sont **pas vérifiées** car on a déjà trouvé une règle.

---

### Exemple 2

**Prestataire:**
- Note: 4.2 ⭐
- Âge: 15 jours
- Pays: Allemagne
- Paiement: 80€

**Vérification:**
1. ❌ Règle VIP: rating < 4.8
2. ❌ Règle Montants élevés: 80€ < 5000€
3. ❌ Règle Pays: Allemagne ∉ [FR, BE]
4. ✅ **Règle Nouveaux Providers** (priorité 10)
   - Condition: âge ≤ 30 jours → **OUI (15 ≤ 30)**
   - **RÈGLE APPLIQUÉE** → Déblocage après 30 jours (720h)
   - STOP

---

## 🚫 Règles Inactives

**IMPORTANT:** Les règles avec `is_active = false` sont **complètement ignorées**.

```typescript
// Cette règle N'EST PAS prise en compte
{
  "name": "Test Règle",
  "is_active": false,  // ❌ IGNORÉE
  "priority": 100,
  // ...
}
```

L'admin peut désactiver une règle sans la supprimer en cliquant sur le bouton d'activation dans l'interface.

---

## 📡 Utilisation de l'API

### 1. Appliquer une règle manuellement

```bash
POST /api/admin/apply-payment-rules
Content-Type: application/json

{
  "earning_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "987e4567-e89b-12d3-a456-426614174000",
  "amount_cents": 50000
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Paiement programmé pour déblocage dans 0h",
  "data": {
    "rule_applied": "VIP Instant Release",
    "delay_hours": 0,
    "release_at": "2026-01-08T15:30:00.000Z"
  }
}
```

### 2. Intégration Automatique

Appelez l'API automatiquement quand un `provider_earning` est créé :

```typescript
// Dans votre fonction de création d'earning
async function createProviderEarning(orderId: string, providerId: string, amountCents: number) {
  // 1. Créer l'earning
  const earning = await supabase
    .from('provider_earnings')
    .insert({
      order_id: orderId,
      provider_id: providerId,
      amount_cents: amountCents,
      status: 'pending'
    })
    .select()
    .single();

  // 2. Appliquer automatiquement les règles
  await fetch('/api/admin/apply-payment-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      earning_id: earning.data.id,
      provider_id: providerId,
      amount_cents: amountCents
    })
  });

  return earning;
}
```

---

## ⏰ Configuration du CRON

### Vercel Cron (Recommandé)

**Fichier:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-release-payments",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Variables d'environnement

```env
CRON_SECRET=votre-secret-tres-securise-ici
```

### Test manuel du CRON

```bash
curl -X GET https://your-domain.com/api/cron/auto-release-payments \
  -H "Authorization: Bearer votre-secret-tres-securise-ici"
```

---

## 📊 Tables de Base de Données

### `payment_release_rules`
Stocke les règles configurées par l'admin.

### `scheduled_releases`
Stocke les déblocages programmés.

```sql
CREATE TABLE scheduled_releases (
  id UUID PRIMARY KEY,
  earning_id UUID,
  provider_id UUID,
  amount_cents INTEGER,
  rule_id UUID,
  rule_name TEXT,
  delay_hours INTEGER,
  release_at TIMESTAMP,
  status TEXT, -- 'pending' | 'completed' | 'on_hold'
  hold_reason TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `provider_balance`
Solde actuel de chaque prestataire.

```sql
CREATE TABLE provider_balance (
  id UUID PRIMARY KEY,
  provider_id UUID,
  available_cents INTEGER,   -- Argent retirable
  pending_cents INTEGER,      -- En attente de déblocage
  withdrawn_cents INTEGER,    -- Déjà retiré
  total_earned_cents INTEGER, -- Total gagné
  is_frozen BOOLEAN
);
```

---

## 🔐 Sécurité

### Comptes Gelés

Si un prestataire est gelé (`is_frozen = true`), le CRON :
- ❌ Ne libère PAS les fonds
- ✅ Marque le `scheduled_release` comme `on_hold`
- ✅ Ajoute la raison: "Account frozen"

L'admin peut dégeler le compte dans BalanceManagement.tsx.

### Logging

Toutes les actions sont loggées dans `admin_actions_log` :
- Libération manuelle
- Libération automatique
- Gel/dégel de compte
- Modification des règles

---

## 🎯 Cas d'Usage

### Scénario 1: Protection Anti-Fraude
```
Nouveaux prestataires → 30 jours d'attente
Montants > 5000€ → 7 jours d'attente
```

### Scénario 2: Récompenser les VIP
```
Prestataires avec note ≥ 4.8 → Déblocage immédiat
```

### Scénario 3: Optimiser la Trésorerie
```
Petits montants < 100€ → 24h
Montants moyens → 7 jours
Montants élevés → 14 jours
```

### Scénario 4: Régulation par Pays
```
France/Belgique → 48h (confiance élevée)
Autres pays → 14 jours
```

---

## 🐛 Dépannage

### Problème: Aucune règle ne s'applique
**Solution:** La règle par défaut (14 jours) est appliquée automatiquement.

### Problème: Règle VIP ne fonctionne pas
**Vérifications:**
1. La règle est-elle active (`is_active = true`) ?
2. Le prestataire a-t-il un rating suffisant ?
3. La priorité est-elle la plus élevée ?

### Problème: CRON ne libère pas les fonds
**Vérifications:**
1. Le `CRON_SECRET` est-il correct ?
2. Le CRON tourne-t-il toutes les heures ?
3. Le compte est-il gelé ?
4. Les logs dans Vercel montrent-ils des erreurs ?

---

## 📞 Support

Pour toute question ou problème, vérifiez :
1. Les logs dans `/api/cron/auto-release-payments`
2. La table `admin_actions_log`
3. La table `scheduled_releases` pour voir les déblocages programmés

---

**Version:** 1.0
**Dernière mise à jour:** 2026-01-08
