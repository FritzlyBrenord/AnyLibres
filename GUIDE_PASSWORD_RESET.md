# Guide de Configuration - Réinitialisation de Mot de Passe

## Vue d'ensemble

Ce système de réinitialisation de mot de passe permet aux utilisateurs de demander un lien par email pour réinitialiser leur mot de passe. Le lien expire après 5 minutes pour des raisons de sécurité.

## Architecture

```
1. User clique "Mot de passe oublié" → Page /forgot-password
2. User entre son email → API /api/auth/forgot-password
3. API génère token (expire en 5 min) + envoie email SMTP
4. User clique lien email → Page /reset-password/[id]?token=xxx
5. User entre nouveau mot de passe → API /api/auth/reset-password
6. API valide token, met à jour mot de passe, redirige vers login
```

## Schéma de Base de Données

Exécutez le fichier SQL dans Supabase SQL Editor:

**Fichier:** `supabase/schema_password_reset.sql`

```sql
CREATE TABLE public.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    token_id UUID DEFAULT gen_random_uuid() UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Variables d'Environnement

Assurez-vous que `.env.local` contient les variables SMTP pour l'envoi d'emails:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
EMAIL_FROM=votre-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** Pour Gmail, utilisez un mot de passe d'application (pas votre mot de passe principal).
> [Créer un mot de passe d'application](https://myaccount.google.com/apppasswords)

## Routes Créées

### Frontend (Pages)

- `/forgot-password` - Page pour demander la réinitialisation
- `/reset-password/[id]` - Page pour entrer le nouveau mot de passe

### Backend (API Routes)

- `POST /api/auth/forgot-password` - Demande de réinitialisation
  - Input: `{ email: string }`
  - Output: `{ success: true, message: string }`

- `POST /api/auth/reset-password` - Réinitialisation du mot de passe
  - Input: `{ tokenId: string, token: string, password: string, confirmPassword: string }`
  - Output: `{ success: true, message: string }`

- `GET /api/auth/reset-password?tokenId=xxx&token=xxx` - Vérification du token
  - Output: `{ success: true, email: string }` ou `{ success: false, error: string }`

## Sécurité

1. **Expiration automatique**: Les tokens expirent après 5 minutes
2. **Usage unique**: Les tokens sont marqués comme utilisés après la réinitialisation
3. **Hash du token**: Seul le hash est stocké (pas le token en clair)
4. **ID public unique**: L'ID public dans l'URL est différent du hash sécurisé
5. **Messages génériques**: On ne révèle pas si l'email existe dans la base

## Workflow Utilisateur

1. Utilisateur clique sur "Mot de passe oublié" sur la page de connexion
2. Utilisateur entre son adresse email sur `/forgot-password`
3. Un email est envoyé avec un lien de réinitialisation (valide 5 minutes)
4. Utilisateur clique sur le lien → `/reset-password/[id]?token=xxx`
5. Utilisateur entre son nouveau mot de passe (min. 8 caractères)
6. Après succès, redirection automatique vers la page de connexion

## Maintenance

### Nettoyer les tokens expirés

Les tokens expirés sont automatiquement supprimés lors de nouvelles demandes.
Pour un nettoyage manuel, exécutez dans Supabase SQL Editor:

```sql
SELECT cleanup_expired_password_reset_tokens();
```

### Logs

Surveillez les logs pour détecter les problèmes:
- `📧 Demande de réinitialisation pour:` - Nouvelle demande
- `✅ Email de réinitialisation envoyé à:` - Email envoyé avec succès
- `❌ Erreur envoi email:` - Problème d'envoi SMTP
- `✅ Mot de passe réinitialisé avec succès pour:` - Réinitialisation réussie

## Tests

Pour tester le flux:

1. Créer un compte utilisateur
2. Aller sur `/forgot-password`
3. Entrer l'email du compte
4. Vérifier la réception de l'email (vérifiez aussi les spams)
5. Cliquer sur le lien dans l'email
6. Entrer un nouveau mot de passe
7. Se connecter avec le nouveau mot de passe

## Dépannage

### L'email n'est pas reçu

- Vérifiez les paramètres SMTP dans `.env.local`
- Vérifiez les dossiers spam/indésirables
- Consultez les logs serveur
- Testez avec `/api/test-email` si disponible

### Le lien ne fonctionne pas

- Vérifiez que `NEXT_PUBLIC_APP_URL` est correctement configuré
- Assurez-vous que le token n'a pas expiré (5 minutes)
- Vérifiez que le lien n'a pas déjà été utilisé

### Erreur "Token invalide"

- Le lien a expiré (plus de 5 minutes)
- Le lien a déjà été utilisé
- Le token a été altéré dans l'URL
