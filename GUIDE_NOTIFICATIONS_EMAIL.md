# Guide des Notifications Email - AnyLibre

## 📧 Système de Notifications Email Implémenté

Ce guide explique le système complet de notifications par email pour tous les événements importants sur AnyLibre.

---

## 🎯 Types de Notifications

### 1. **Nouvelle Commande**
- ✅ Email envoyé au **prestataire** lorsqu'une nouvelle commande est créée
- ✅ Email envoyé au **client** pour confirmer sa commande
- **Déclencheur**: Création réussie d'une commande (paiement validé)
- **Fichier**: `src/app/api/orders/route.ts` (lignes 277-324)

### 2. **Messages (après 20 minutes sans réponse)**
- ✅ Email envoyé uniquement si le destinataire n'a pas répondu après 20 minutes
- **Déclencheur**: Message envoyé dans une conversation de commande
- **Fichiers**:
  - Tracking: `src/lib/email/messageNotificationTracker.ts`
  - API messages: `src/app/api/orders/[id]/messages/route.ts` (lignes 179-199)
  - Cron job: `src/app/api/notifications/process-messages/route.ts`

### 3. **Livraison de Commande**
- ✅ Email envoyé au **client** lorsque le prestataire livre la commande
- **Déclencheur**: Livraison d'une commande par le prestataire
- **Fichier**: `src/app/api/orders/deliver/route.ts` (lignes 148-181)

### 4. **Demande de Révision**
- ✅ Email envoyé au **prestataire** lorsque le client demande une révision
- **Déclencheur**: Client demande une révision sur une commande livrée
- **Fichier**: `src/app/api/orders/request-revision/route.ts` (lignes 129-169)

### 5. **Litige Ouvert**
- ✅ Email envoyé au **client** et au **prestataire** lorsqu'un litige est ouvert
- **Déclencheur**: Client ouvre un litige sur une commande
- **Fichier**: `src/app/api/orders/open-dispute/route.ts` (lignes 105-132)

### 6. **Retrait d'Argent**
- ✅ Email envoyé au **prestataire** lors d'une demande de retrait
- **Déclencheur**: Prestataire crée une demande de retrait
- **Fichier**: `src/app/api/provider/withdrawals/route.ts` (lignes 238-260)
- Statuts: `pending`, `completed`, `failed`

---

## 🛠️ Configuration Requise

### Variables d'environnement (.env.local)

```env
# Configuration SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
EMAIL_FROM=votre-email@gmail.com

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Secret pour le cron job des notifications de messages
CRON_SECRET=your-secret-key
```

### Générer un mot de passe d'application Gmail

1. Allez sur [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Créez un nouveau mot de passe d'application
3. Copiez-le dans `SMTP_PASSWORD`

---

## 📊 Base de Données

### Table pour les notifications de messages

Exécutez la migration SQL:

```bash
# Appliquer la migration
psql -U postgres -d anylibre -f supabase/migrations/create_message_notifications_table.sql
```

Ou via Supabase Dashboard:
1. Allez dans SQL Editor
2. Copiez le contenu de `supabase/migrations/create_message_notifications_table.sql`
3. Exécutez la requête

---

## 🧪 Tests

### 1. Tester l'envoi d'email simple

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester l'envoi
curl "http://localhost:3000/api/test-email?email=votre-email@gmail.com&type=simple"
```

### 2. Tester le template de nouvelle commande

```bash
curl "http://localhost:3000/api/test-email?email=votre-email@gmail.com&type=order"
```

### 3. Tester le template de livraison

```bash
curl "http://localhost:3000/api/test-email?email=votre-email@gmail.com&type=delivery"
```

### 4. Tester une vraie commande

1. Connectez-vous en tant que client
2. Créez une commande sur un service
3. Vérifiez les logs du serveur pour voir:
   ```
   📧 Notifications email envoyées avec succès
   ```
4. Vérifiez votre boîte mail (client et prestataire)

---

## 🐛 Dépannage

### Problème: Aucun email reçu

**Vérifications à faire:**

1. **Logs du serveur**
   - Cherchez `📧 Notifications email envoyées avec succès`
   - Cherchez `❌ Erreur lors de l'envoi des emails`

2. **Email dans profiles**
   ```sql
   -- Vérifier que les emails sont bien enregistrés
   SELECT user_id, email, first_name, last_name
   FROM profiles
   WHERE user_id = 'votre-user-id';
   ```

   **IMPORTANT**: Le champ `email` dans la table `profiles` doit être renseigné !

   Si vide, mettez à jour:
   ```sql
   UPDATE profiles
   SET email = (SELECT email FROM auth.users WHERE id = profiles.user_id)
   WHERE email IS NULL;
   ```

3. **Configuration SMTP**
   ```bash
   # Vérifier les variables d'environnement
   cat .env.local | grep SMTP
   ```

4. **Tester manuellement**
   ```bash
   curl "http://localhost:3000/api/test-email?email=votre-email@gmail.com"
   ```

5. **Vérifier le mot de passe Gmail**
   - Utilisez un **mot de passe d'application**, pas votre mot de passe Gmail normal
   - Le mot de passe doit faire 16 caractères (généré par Google)

### Problème: Email dans spam

- Ajoutez `noreply@anylibre.com` à vos contacts
- Marquez l'email comme "Non spam"
- Pour la production, configurez SPF/DKIM/DMARC

### Problème: Erreur "Invalid login"

- Vérifiez que vous utilisez un **mot de passe d'application** Gmail
- Vérifiez que la 2FA est activée sur votre compte Gmail
- Régénérez un nouveau mot de passe d'application si nécessaire

---

## 🔄 Cron Job pour Messages (20 minutes)

### Configuration

Les notifications de messages nécessitent un cron job qui s'exécute toutes les 5 minutes:

**Vercel** (production):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/notifications/process-messages",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Développement local**:
```bash
# Installer node-cron
npm install node-cron

# Ou utiliser un cron système
*/5 * * * * curl -H "Authorization: Bearer your-secret-key" http://localhost:3000/api/notifications/process-messages
```

---

## 📝 Architecture des Fichiers

```
src/
├── lib/
│   └── email/
│       ├── emailService.ts              # Service SMTP de base
│       ├── notificationService.ts        # Templates et envois
│       └── messageNotificationTracker.ts # Tracking messages 20min
│
└── app/
    └── api/
        ├── orders/
        │   ├── route.ts                  # ✅ Nouvelle commande
        │   ├── deliver/route.ts          # ✅ Livraison
        │   ├── request-revision/route.ts # ✅ Révision
        │   ├── open-dispute/route.ts     # ✅ Litige
        │   └── [id]/messages/route.ts    # ✅ Messages
        │
        ├── provider/
        │   └── withdrawals/route.ts      # ✅ Retrait
        │
        ├── notifications/
        │   └── process-messages/route.ts # Cron job messages
        │
        └── test-email/route.ts           # Tests
```

---

## ✨ Templates d'Email

Tous les templates utilisent un design moderne avec:
- 📱 Responsive (mobile-friendly)
- 🎨 Couleurs dégradées selon le type
- 🔗 Boutons CTA clairs
- 📧 Footer professionnel
- ⚡ HTML optimisé

**Couleurs par type:**
- 🟢 Commande/Livraison: Vert (#10b981)
- 🔵 Confirmation: Bleu (#3b82f6)
- 🟣 Messages: Violet (#8b5cf6)
- 🟠 Révision: Orange (#f59e0b)
- 🔴 Litige/Annulation: Rouge (#ef4444)

---

## 🚀 Prochaines Étapes

### À implémenter en production:

1. ✅ Migration SQL pour `pending_message_notifications`
2. ⏰ Configuration du cron job Vercel
3. 📧 Domaine personnalisé pour les emails (au lieu de Gmail)
4. 🔐 Configuration SPF/DKIM/DMARC
5. 📊 Tableau de bord pour suivre les emails envoyés
6. 🔔 Notifications push (optionnel)

---

## 📞 Support

En cas de problème:
1. Vérifiez les logs du serveur
2. Testez avec `/api/test-email`
3. Vérifiez la table `profiles` (champ `email`)
4. Vérifiez la configuration SMTP dans `.env.local`

**Note**: Les emails sont envoyés de manière asynchrone et ne bloquent jamais les opérations principales (commandes, livraisons, etc.). Si un email échoue, l'opération continue normalement.
