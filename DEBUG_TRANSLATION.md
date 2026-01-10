# 🔍 Debug Translation - Guide de Débogage

## Problèmes Identifiés

### 1. Format des Données Incohérent

Vos services ont **deux formats différents** pour `title` et `short_description` :

**Format 1 : String simple** (ancien format)
```json
{
  "title": "je vais travailler pour vous",
  "short_description": "descriptipn courte"
}
```

**Format 2 : Objet MultiLangText** (nouveau format)
```json
{
  "title": {
    "en": "je vais vous aider a realiser un site",
    "fr": "je vais vous aider a realiser un site"
  },
  "short_description": {
    "en": "realisation site web complet",
    "fr": "realisation site web complet"
  }
}
```

### 2. Problème avec l'Espagnol

Le hook `useSmartTranslate` traduit toujours depuis le français, donc :
- FR → EN ✅ Fonctionne
- FR → ES ✅ Devrait fonctionner maintenant
- Mais si le texte source est déjà en anglais, il sera quand même traduit depuis FR

## 🛠️ Comment Déboguer

### Étape 1 : Ouvrir la Console du Navigateur

1. Ouvrez votre application dans le navigateur
2. Appuyez sur `F12` pour ouvrir DevTools
3. Allez dans l'onglet **Console**

### Étape 2 : Changer la Langue

1. Changez la langue dans le header vers **Espagnol**
2. Observez les logs dans la console :

**Logs attendus :**
```
[useSmartTranslate] Translating: {
  text: "je vais vous aider a realiser un site...",
  targetLang: "es",
  sourceLang: "auto"
}

[API /translate] Request received: {
  textPreview: "je vais vous aider a realiser un site...",
  targetLang: "es",
  sourceLang: "auto"
}

[API /translate] Translation successful: {
  detectedLang: "fr",
  targetLang: "es",
  resultPreview: "Te ayudaré a realizar un sitio..."
}

[useSmartTranslate] Translation result: {
  original: "je vais vous aider a realiser...",
  translated: "Te ayudaré a realizar...",
  detectedLang: "fr",
  targetLang: "es"
}
```

### Étape 3 : Vérifier les Problèmes

**Si vous voyez :**
- `targetLang: "fr"` au lieu de `"es"` → Le LanguageContext ne se met pas à jour
- `translated` est identique à `original` → La traduction a échoué
- Erreur "Translation failed" → Problème avec l'API Google Translate

## 🔧 Solutions

### Solution 1 : Nettoyer le Cache de Traduction

Le cache peut contenir d'anciennes traductions. Pour le vider :

```typescript
// Ajouter temporairement dans GlobalTranslationIndicator.tsx
// ou dans la console du navigateur :
localStorage.clear();
location.reload();
```

### Solution 2 : Vérifier le LanguageContext

Ouvrez `src/contexts/LanguageContext.tsx` et vérifiez que :
1. La langue se met bien à jour dans le state
2. Les composants enfants reçoivent la nouvelle valeur

### Solution 3 : Tester Manuellement l'API

Ouvrez la console du navigateur et testez directement :

```javascript
fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Bonjour le monde',
    targetLang: 'es',
  })
})
.then(r => r.json())
.then(data => console.log('Translation:', data));
```

**Résultat attendu :**
```json
{
  "translatedText": "Hola el mundo",
  "detectedSourceLang": "fr"
}
```

## 📊 Vérifier les Services dans la Base de Données

Certains de vos services ont des formats problématiques :

### Service avec ID `862261e4-0379-4080-bf97-84e1ea85572a`

**Problème** : `title` est une string simple entourée de guillemets triples
```json
"title": "\"\"\"je vais travailler pour vous\"\"\""
```

**Solution** : Nettoyer les données dans Supabase :
```sql
UPDATE services
SET title = REPLACE(REPLACE(title, '"""', ''), '"', '')
WHERE title LIKE '%"""%';
```

### Service avec ID `9dd27931-496f-4758-9aa6-894c58f00d9a`

**Problème** : Contenu aléatoire/test
```json
{
  "title": {
    "en": "ACACNNKNAKN",
    "fr": "janjnajskS"
  }
}
```

**Solution** : C'est un service de test, vous pouvez le supprimer ou corriger les textes.

## 🎯 Test Complet

### Test 1 : Traduction String Simple

1. Créer un service avec : `"title": "Bonjour le monde"`
2. Changer la langue vers EN
3. Vérifier que le titre devient "Hello the world"
4. Changer vers ES
5. Vérifier que le titre devient "Hola el mundo"

### Test 2 : Traduction MultiLangText

1. Créer un service avec :
```json
{
  "title": {
    "fr": "Bonjour le monde",
    "en": "Hello the world"
  }
}
```
2. Changer vers EN → Affiche directement "Hello the world" (pas d'API call)
3. Changer vers ES → Traduit depuis FR vers ES : "Hola el mundo"

## 🐛 Problèmes Connus

### 1. Google Translate Rate Limiting

L'API gratuite a des limites. Si vous voyez beaucoup d'erreurs :
- Attendez quelques minutes
- Réduisez le nombre de services affichés
- Implémentez un throttling

### 2. Traductions en Cache

Le cache persiste pendant toute la session. Pour tester :
- Rafraîchissez la page (F5)
- Ou utilisez le mode incognito

### 3. Textes avec Guillemets Triples

Nettoyez vos données :
```sql
-- Vérifier les services avec guillemets problématiques
SELECT id, title, short_description
FROM services
WHERE title LIKE '%"""%' OR short_description LIKE '%"""%';

-- Nettoyer
UPDATE services
SET
  title = REPLACE(title, '"""', ''),
  short_description = REPLACE(short_description, '"""', '')
WHERE title LIKE '%"""%' OR short_description LIKE '%"""%';
```

## 📝 Checklist de Débogage

- [ ] Console ouverte (F12)
- [ ] Logs `[useSmartTranslate]` visibles
- [ ] Logs `[API /translate]` visibles
- [ ] `targetLang` correspond à la langue choisie
- [ ] Traduction FR → EN fonctionne
- [ ] Traduction FR → ES fonctionne
- [ ] Cache vidé si nécessaire
- [ ] Données nettoyées dans Supabase
- [ ] GlobalTranslationIndicator s'affiche
- [ ] Pas d'erreurs réseau

## 💡 Commandes Utiles

### Vider le Cache de Traduction (Console)
```javascript
// Dans la console du navigateur
sessionStorage.clear();
location.reload();
```

### Forcer une Retraduction
```javascript
// Modifier le cache de traduction
window.__translationCache = {};
```

### Tester l'API Directement
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Bonjour","targetLang":"es"}'
```

## 🆘 Si Rien ne Fonctionne

1. **Vérifier l'installation du package** :
```bash
npm list @vitalets/google-translate-api
```

2. **Réinstaller si nécessaire** :
```bash
npm uninstall @vitalets/google-translate-api
npm install @vitalets/google-translate-api
```

3. **Redémarrer le serveur** :
```bash
npm run dev
```

4. **Vérifier les variables d'environnement** :
   - Pas besoin pour cette API gratuite
   - Mais vérifiez que Next.js tourne sur le bon port

5. **Regarder les logs du terminal** :
   - Les `console.log` côté API apparaissent dans le terminal
   - Les `console.log` côté client apparaissent dans le navigateur
