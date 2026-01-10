# 🌍 Système de Traduction AnyLibre

## Vue d'ensemble

Le système de traduction d'AnyLibre gère **deux types de traductions** :

1. **Traduction Manuelle** : Textes statiques de l'interface (boutons, labels, navigation)
2. **Traduction Automatique** : Contenu dynamique saisi par les utilisateurs (titres de services, descriptions)

## 🎯 Architecture

### Fichiers Clés

```
src/
├── types/
│   └── languages.ts              # Configuration centralisée des langues
├── i18n/
│   └── translations.ts            # Traductions manuelles (interface)
├── hooks/
│   ├── useSafeLanguage.ts        # Hook pour traductions manuelles
│   └── useSmartTranslate.ts      # Hook pour traductions automatiques
├── components/
│   └── translation/
│       ├── GlobalTranslationIndicator.tsx  # Indicateur unique global
│       └── TranslationIndicator.tsx        # (Deprecated - ne plus utiliser)
└── app/
    └── api/
        └── translate/
            └── route.ts          # API de traduction automatique
```

## 📋 Configuration des Langues

### Ajouter une nouvelle langue

**Étape 1** : Modifier `src/types/languages.ts`

```typescript
// 1. Ajouter le code de langue
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de'; // Ajout de 'de'

// 2. Ajouter la configuration
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    // ... langues existantes ...
    {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        enabled: true,
    },
];
```

**Étape 2** : Ajouter les traductions dans `src/i18n/translations.ts`

```typescript
export const translations = {
    fr: { /* ... */ },
    en: { /* ... */ },
    es: { /* ... */ },
    de: {  // Nouvelle langue
        navigation: {
            explore: 'Erkunden',
            about: 'Über uns',
            // ... etc
        },
        // ... autres sections
    },
};
```

**Étape 3** : C'est tout ! Le système est dynamique.

## 🔧 Utilisation

### 1. Traduction Manuelle (Textes Statiques)

Pour les textes de l'interface (boutons, labels, etc.) :

```tsx
import { useSafeLanguage } from '@/hooks/useSafeLanguage';

function MyComponent() {
    const { t, language } = useSafeLanguage();

    return (
        <div>
            <h1>{t.home.hero.title}</h1>
            <button>{t.navigation.login}</button>
            <p>Langue actuelle : {language}</p>
        </div>
    );
}
```

### 2. Traduction Automatique (Contenu Utilisateur)

Pour le contenu dynamique (titres de services, descriptions, etc.) :

```tsx
import { useSmartTranslate } from '@/hooks/useSmartTranslate';

function ServiceCard({ service }) {
    // Traduit automatiquement selon la langue choisie dans le header
    const title = useSmartTranslate(service.title);
    const description = useSmartTranslate(service.short_description);

    return (
        <div>
            <h3>{title.translatedText}</h3>
            <p>{description.translatedText}</p>
        </div>
    );
}
```

**⚠️ Important** :
- Le texte ORIGINAL s'affiche pendant la traduction (pas de texte vide)
- Un indicateur GLOBAL unique apparaît en bas à droite pendant la traduction
- Les traductions sont mises en cache pour éviter les appels répétés

## 🎨 Indicateur de Traduction Global

L'indicateur global s'affiche automatiquement en bas à droite :

- **En cours** : "Traduction en cours... X éléments"
- **Succès** : "Traduction terminée" (disparaît après 3s)
- **Erreur** : "Erreur de traduction - Vérifiez votre connexion"

**Pas besoin de code supplémentaire** - Il est déjà configuré dans `Providers.tsx`

## 🔄 Flux de Traduction

```
User change langue (Header)
    ↓
LanguageContext.language mis à jour
    ↓
useSmartTranslate détecte le changement
    ↓
Affiche texte original immédiatement
    ↓
Appelle /api/translate en arrière-plan
    ↓
GlobalTranslationIndicator s'affiche
    ↓
Texte mis à jour quand traduction terminée
    ↓
Indicateur affiche succès puis disparaît
```

## 💾 Cache de Traduction

Les traductions sont automatiquement mises en cache :

```typescript
// Cache key format : "texte_original_langueCible"
"Bonjour le monde_en" → "Hello world"
```

- Cache en mémoire (survit pendant la session)
- Évite les appels API répétés
- Réinitialisé au rafraîchissement de page

## 🛠️ API de Traduction

### Endpoint : `/api/translate`

**Méthode** : POST

**Body** :
```json
{
    "text": "Texte à traduire",
    "targetLang": "en",
    "sourceLang": "auto"  // optionnel
}
```

**Réponse** :
```json
{
    "translatedText": "Translated text",
    "detectedSourceLang": "fr"
}
```

**Features** :
- 3 tentatives automatiques en cas d'échec
- Délai progressif entre tentatives (1s, 2s, 3s)
- Retourne le texte original si tout échoue

## 📊 Types TypeScript

### SupportedLanguage
```typescript
type SupportedLanguage = 'fr' | 'en' | 'es';
```

### UseSmartTranslateResult
```typescript
interface UseSmartTranslateResult {
    translatedText: string;      // Texte traduit (ou original pendant traduction)
    isTranslating: boolean;       // État de traduction
    hasError: boolean;            // Erreur de traduction
    retry: () => void;            // Fonction pour réessayer
}
```

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

1. Utiliser `useSafeLanguage()` pour les textes statiques
2. Utiliser `useSmartTranslate()` pour le contenu utilisateur
3. Toujours afficher le texte original pendant la traduction
4. Ajouter les langues dans `languages.ts` d'abord

### ❌ À NE PAS FAIRE

1. Ne pas créer d'indicateurs individuels par carte
2. Ne pas cacher le texte pendant la traduction
3. Ne pas appeler directement `/api/translate` (utiliser le hook)
4. Ne pas hardcoder les codes de langue (utiliser `SupportedLanguage`)

## 🔍 Débogage

### La traduction ne fonctionne pas ?

1. **Vérifier la console** : Rechercher les erreurs API
2. **Vérifier le cache** : Rafraîchir la page (F5)
3. **Vérifier la connexion** : L'API Google Translate est-elle accessible ?
4. **Vérifier le LanguageProvider** : Est-il bien dans `Providers.tsx` ?

### L'indicateur ne s'affiche pas ?

1. **Vérifier TranslationProvider** : Doit être dans `Providers.tsx`
2. **Vérifier l'ordre** : TranslationProvider doit entourer les composants
3. **Console** : Rechercher les erreurs de hook

## 📝 Exemple Complet

```tsx
// MonComposant.tsx
'use client';

import { useSafeLanguage } from '@/hooks/useSafeLanguage';
import { useSmartTranslate } from '@/hooks/useSmartTranslate';

export function MonComposant({ service }) {
    // Traductions manuelles (interface)
    const { t } = useSafeLanguage();

    // Traductions automatiques (contenu utilisateur)
    const title = useSmartTranslate(service.title);
    const description = useSmartTranslate(service.description);

    return (
        <div className="service-card">
            {/* Texte statique traduit manuellement */}
            <span className="badge">{t.home.popularServices.badge}</span>

            {/* Contenu utilisateur traduit automatiquement */}
            <h2>{title.translatedText}</h2>
            <p>{description.translatedText}</p>

            {/* Pas besoin d'indicateur - il est global ! */}
        </div>
    );
}
```

## 🚀 Performances

- **Cache** : Les traductions sont mises en cache
- **Lazy** : Traduction seulement au changement de langue
- **Parallèle** : Plusieurs traductions simultanées (compteur dans l'indicateur)
- **Fallback** : Texte original si échec

## 📞 Support

Pour questions ou problèmes :
1. Vérifier cette documentation
2. Consulter les types TypeScript
3. Regarder les exemples dans le code
