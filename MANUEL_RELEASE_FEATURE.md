# 🎯 Fonctionnalité de Libération Manuelle des Fonds

## 📋 Résumé

Cette fonctionnalité permet à l'administrateur de **libérer manuellement** les fonds en attente (pending) d'un prestataire vers son solde disponible (available).

## 🔧 Fichiers créés/modifiés

### 1. Migration SQL
**Fichier:** `migrations/add_manual_release_function.sql`

**Fonctions créées:**
- `admin_release_pending_funds(provider_id, amount_cents)` - Libère les fonds manuellement
- `get_pending_releases_details(provider_id)` - Récupère les détails des releases programmées

### 2. API Endpoint
**Fichier:** `src/app/api/admin/release-funds/route.ts`

**Endpoint:** `POST /api/admin/release-funds`

**Paramètres:**
```json
{
  "provider_id": "uuid-du-prestataire",
  "amount_cents": 1000  // Optionnel: null = tout libérer
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "released_cents": 3000,
    "new_available_cents": 3000,
    "new_pending_cents": 0,
    "message": "Successfully released..."
  }
}
```

### 3. Interface Admin
**Fichier:** `src/app/(Administrateur)/Components/BalanceManagement.tsx`

**Ajouts:**
- Bouton "Libérer fonds" (icône cadenas ouvert) dans chaque ligne
- Modal de confirmation avec champ de montant optionnel
- Mise à jour automatique après libération

## 🚀 Installation

### Étape 1: Exécuter la migration SQL

```sql
-- Dans Supabase SQL Editor, exécuter:
\i migrations/add_manual_release_function.sql
```

Ou copiez/collez tout le contenu du fichier dans Supabase SQL Editor.

### Étape 2: Vérifier les permissions

La fonction utilise `SECURITY DEFINER`, assurez-vous que l'admin a les droits sur:
- `provider_balance`
- `scheduled_releases`
- `provider_earnings`

### Étape 3: Tester la fonctionnalité

1. Allez dans l'interface admin → Finances → Balances
2. Trouvez un prestataire avec `pending_cents > 0`
3. Cliquez sur le bouton vert avec l'icône de cadenas ouvert
4. Dans la modal:
   - Laissez vide pour tout libérer
   - Ou entrez un montant spécifique (en euros)
5. Cliquez "Libérer"
6. Vérifiez que le montant est transféré de pending → available

## 📊 Exemple d'utilisation

### Scénario: Libérer 30€ en attente pour un prestataire

**Avant:**
```
pending_cents: 3000 (30€)
available_cents: 0
```

**Action admin:**
1. Cliquer sur "Libérer fonds"
2. Laisser le champ vide (ou entrer 30.00)
3. Confirmer

**Après:**
```
pending_cents: 0
available_cents: 3000 (30€)
```

**Dans scheduled_releases:**
- Les releases concernées sont marquées `status = 'completed'`
- Metadata ajouté: `{"manually_released": true, "released_by": "admin"}`

## 🔒 Sécurité

- ✅ Vérification du rôle admin dans l'API
- ✅ Validation que le montant ne dépasse pas le pending
- ✅ Fonction SQL `SECURITY DEFINER` pour bypasser RLS
- ✅ Logging dans metadata des releases

## 🎨 Interface

### Bouton dans la liste
- **Vert** si `pending_cents > 0` → Cliquable
- **Gris** si `pending_cents = 0` → Désactivé

### Modal de libération
- Affiche le prestataire et le montant en attente
- Champ de saisie optionnel pour montant partiel
- Boutons: Annuler / Libérer

## 🧪 Tests

### Test 1: Libération totale
```sql
SELECT * FROM admin_release_pending_funds(
  '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6',  -- provider_id
  NULL  -- Tout libérer
);
```

### Test 2: Libération partielle
```sql
SELECT * FROM admin_release_pending_funds(
  '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6',
  1000  -- 10€ seulement
);
```

### Test 3: Vérifier les details
```sql
SELECT * FROM get_pending_releases_details(
  '112b64a6-b09a-4e7a-a9aa-c47c4e20cbf6'
);
```

## ✅ Checklist d'installation

- [ ] Exécuter `migrations/add_manual_release_function.sql`
- [ ] Vérifier que les fonctions sont créées
- [ ] Tester l'API endpoint avec Postman/curl
- [ ] Vérifier l'interface admin
- [ ] Tester la libération totale
- [ ] Tester la libération partielle
- [ ] Vérifier que les scheduled_releases sont mis à jour

## 📝 Notes

- La libération manuelle **ne vérifie PAS** les règles de payment_release_rules
- C'est une action administrative qui bypass toutes les règles automatiques
- Les fonds libérés manuellement sont **immédiatement disponibles** pour retrait
- Un audit trail est conservé dans les metadata des scheduled_releases
