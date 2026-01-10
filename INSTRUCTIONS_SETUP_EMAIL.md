# 🚀 Instructions de Configuration - Notifications Email

## ⚠️ IMPORTANT - À faire MAINTENANT

### Étape 1: Exécuter les Migrations SQL dans Supabase

Vous devez créer les tables nécessaires dans votre base de données Supabase:

#### A. Via Supabase Dashboard (RECOMMANDÉ)

1. **Allez sur**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Créer la table pour notifications de messages:**
   - Copiez tout le contenu de `supabase/migrations/create_message_notifications_table.sql`
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run" (Exécuter)

3. **Synchroniser les emails dans profiles:**
   - Copiez tout le contenu de `supabase/migrations/sync_profiles_email.sql`
   - Collez dans l'éditeur SQL
   - Cliquez sur "Run" (Exécuter)

#### B. Via psql (Alternative)

```bash
# Si vous avez accès au terminal
psql -U postgres -h your-db-host -d postgres -f supabase/migrations/create_message_notifications_table.sql
psql -U postgres -h your-db-host -d postgres -f supabase/migrations/sync_profiles_email.sql
```

---

## Étape 2: Vérifier que la Configuration SMTP est Correcte

Votre `.env.local` doit contenir:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=brenordfritzly19@gmail.com
SMTP_PASSWORD=psogsaakoldegbgp
EMAIL_FROM=brenordfritzly19@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

✅ C'est déjà configuré correctement!

---

## Étape 3: Tester l'Envoi d'Email

### Test Simple

```bash
# Redémarrez le serveur si nécessaire
npm run dev

# Dans un autre terminal:
curl "http://localhost:3000/api/test-email?email=brenordfritzly19@gmail.com&type=simple"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Email envoyé avec succès !",
  "to": "brenordfritzly19@gmail.com",
  "type": "simple"
}
```

### Test de Template de Commande

```bash
curl "http://localhost:3000/api/test-email?email=brenordfritzly19@gmail.com&type=order"
```

---

## Étape 4: Tester avec un Vrai Message

1. **Envoyez un message** dans une conversation de commande
2. **Regardez les logs du serveur** pour voir:

```
✅ Message envoyé avec succès
📧 DEBUG - Expéditeur: {
  id: 'xxx',
  email: 'expediteur@email.com',
  name: 'Nom Expéditeur'
}
📧 DEBUG - Destinataire: {
  id: 'yyy',
  email: 'destinataire@email.com',
  name: 'Nom Destinataire'
}
⏰ Notification programmée pour dans 20 minutes
```

3. **Vérifiez la réponse de l'API** (dans la console du navigateur):

```json
{
  "success": true,
  "data": { "message": {...} },
  "debug": {
    "notification": {
      "senderEmail": "expediteur@email.com",
      "recipientEmail": "destinataire@email.com",
      "trackingStatus": "success"
    },
    "scheduledFor": "2025-12-13T15:45:00.000Z"
  }
}
```

---

## Étape 5: Vérifier que la Table a Bien Enregistré la Notification

Dans Supabase Dashboard > Table Editor > `pending_message_notifications`:

Vous devriez voir une ligne avec:
- `status`: "pending"
- `scheduled_for`: Dans 20 minutes
- `sender_id`: ID de l'expéditeur
- `recipient_id`: ID du destinataire
- `message_preview`: Extrait du message

---

## 🐛 Dépannage

### Problème 1: "Email non trouvé" dans les logs

**Cause**: La colonne `email` n'existe pas dans la table `profiles` ou elle est vide.

**Solution**: Exécutez la migration `sync_profiles_email.sql` (Étape 1)

### Problème 2: Erreur "relation pending_message_notifications does not exist"

**Cause**: La table n'a pas été créée.

**Solution**: Exécutez la migration `create_message_notifications_table.sql` (Étape 1)

### Problème 3: "trackingStatus": "failed"

**Cause**: Erreur lors de l'insertion dans la table.

**Solution**:
1. Vérifiez que les migrations ont été exécutées
2. Regardez les logs du serveur pour voir l'erreur exacte
3. Vérifiez que les colonnes `sender_id` et `recipient_id` existent et sont de type UUID

### Problème 4: Email non reçu après 20 minutes

**Cause**: Le cron job n'est pas configuré.

**Solution temporaire - Test manuel**:
```bash
# Appelez manuellement l'API de traitement
curl -H "Authorization: Bearer your-secret-key" "http://localhost:3000/api/notifications/process-messages"
```

**Solution permanente**:
Ajoutez dans `.env.local`:
```env
CRON_SECRET=your-secret-key
```

Et configurez un cron job système ou utilisez Vercel Cron (en production).

---

## ✅ Checklist de Vérification

- [ ] Migration `create_message_notifications_table.sql` exécutée
- [ ] Migration `sync_profiles_email.sql` exécutée
- [ ] Test `/api/test-email` réussi
- [ ] Logs montrent les emails des utilisateurs (pas "Email non trouvé")
- [ ] Table `pending_message_notifications` contient des données
- [ ] Variable `CRON_SECRET` configurée dans `.env.local`

---

## 📞 Si Ça Ne Marche Toujours Pas

1. **Partagez les logs du serveur** (parties avec 📧 et ❌)
2. **Vérifiez dans Supabase** si les tables existent
3. **Testez d'abord** `/api/test-email` avant de tester les messages

**Note**: Les notifications de messages sont programmées pour **20 minutes** après l'envoi. Pour tester plus rapidement, vous pouvez temporairement changer `NOTIFICATION_DELAY_MINUTES = 1` dans `messageNotificationTracker.ts`.
