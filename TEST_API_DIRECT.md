# Test direct de l'API auto-release

## Contexte
- Balance actuelle: **pending_cents = 100,200** (1,002 USD)
- Provider ID: `6e2266bb-014c-4af7-8917-7b4f4e921557`

## Test à faire

Ouvrez votre navigateur et allez sur:
```
http://localhost:3000/api/auto-release-funds-simple
```

Ou utilisez curl dans le terminal:
```bash
curl http://localhost:3000/api/auto-release-funds-simple
```

## Résultat attendu

L'API devrait:
1. Trouver 1 provider avec pending > 0
2. Libérer les 1,002 USD (100,200 cents)
3. Marquer les earnings comme completed
4. Retourner: `{"success":true,"summary":{"total_providers":1,"released":1,"failed":0}}`

## Vérification après

Rafraîchir la page Balance Management, vous devriez voir:
- **Pending: 0 USD**
- **Available: 5,988 USD** (498,600 + 100,200 = 598,800 cents)
