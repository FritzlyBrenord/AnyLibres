# Test Direct de l'API Auto-Release

## Option 1: Via le navigateur

Ouvrez cette URL dans votre navigateur:

```
http://localhost:3000/api/auto-release-funds?force=true
```

Vous devriez voir un JSON comme:
```json
{
  "success": true,
  "message": "Auto-release completed",
  "summary": {
    "total_processed": 5,
    "released": 5,
    "scheduled": 0,
    "skipped": 0
  }
}
```

## Option 2: Via curl

```bash
curl http://localhost:3000/api/auto-release-funds?force=true
```

## Option 3: Via la console du navigateur

Sur n'importe quelle page de votre app, ouvrez la console (F12) et tapez:

```javascript
fetch('/api/auto-release-funds?force=true')
  .then(r => r.json())
  .then(d => console.log('Résultat:', d));
```

## Que chercher dans les logs du serveur

Après avoir appelé l'API, vous devriez voir dans les logs du serveur Next.js:

```
🚀 Auto-release: MODE FORCE - Libération immédiate de tout!
📋 X earnings pending trouvés
  → Earning xxx: règle "..." (Xh)
    🚀 MODE FORCE: Libération immédiate → XXX EUR
    🎉 Libéré: XXX EUR
...
✅ Auto-release terminé:
   - Total traité: X
   - Libérés: X
```

## Si ça ne marche pas

Partagez-moi:
1. La réponse JSON de l'API
2. Les logs du serveur
3. Les erreurs dans la console (s'il y en a)
