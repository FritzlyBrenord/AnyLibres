// ============================================================================
// Script TypeScript pour tester l'API auto-release avec affichage des règles
// ============================================================================

interface ReleaseRule {
  id: string;
  name: string;
  delay_hours: number;
  applies_to: string;
  condition?: {
    min_amount?: number;
    max_amount?: number;
    country?: string;
    countries?: string[];
    provider_age_days?: number;
    provider_rating?: number;
  };
  is_active: boolean;
  priority: number;
}

async function testAutoReleaseAPI(url: string) {
  console.log('\n🧪 TEST API AUTO-RELEASE-FUNDS-SIMPLE');
  console.log('='.repeat(70));
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('📊 RÉPONSE DE L\'API:');
    console.log(JSON.stringify(data, null, 2));

    if (data.summary) {
      console.log('\n📈 RÉSUMÉ D\'EXÉCUTION:');
      console.log(`  ├─ Total earnings: ${data.summary.total_earnings || 0}`);
      console.log(`  ├─ ✅ Libérés: ${data.summary.released || 0}`);
      console.log(`  ├─ ⏳ En attente: ${data.summary.skipped || 0}`);
      console.log(`  └─ ❌ Échecs: ${data.summary.failed || 0}`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'appel API:', error.message);
  }
}

function displayRulesDocumentation() {
  console.log('\n\n📋 DOCUMENTATION DES RÈGLES DE DELAY_HOURS');
  console.log('='.repeat(70));

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              RÈGLES DE LIBÉRATION DES FONDS (delay_hours)        ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│ TYPE: "all"                                                      │
├──────────────────────────────────────────────────────────────────┤
│ Description: S'applique à TOUS les providers                    │
│ Conditions:  Aucune condition spécifique                         │
│ Exemple:     { applies_to: "all", delay_hours: 168 }            │
│              → 168h = 7 jours pour tout le monde                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TYPE: "new_providers"                                            │
├──────────────────────────────────────────────────────────────────┤
│ Description: Providers récents (compte jeune)                    │
│ Conditions:  provider_age_days <= X                              │
│ Exemple:     {                                                   │
│                applies_to: "new_providers",                      │
│                delay_hours: 336,                                 │
│                condition: { provider_age_days: 30 }              │
│              }                                                   │
│              → 336h (14 jours) si compte <= 30 jours             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TYPE: "vip"                                                      │
├──────────────────────────────────────────────────────────────────┤
│ Description: Providers avec excellente réputation                │
│ Conditions:  provider_rating >= X                                │
│ Exemple:     {                                                   │
│                applies_to: "vip",                                │
│                delay_hours: 48,                                  │
│                condition: { provider_rating: 4.5 }               │
│              }                                                   │
│              → 48h (2 jours) si rating >= 4.5 étoiles            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TYPE: "amount_threshold"                                         │
├──────────────────────────────────────────────────────────────────┤
│ Description: Selon le montant de la transaction                  │
│ Conditions:  min_amount <= montant <= max_amount                 │
│ Exemple:     {                                                   │
│                applies_to: "amount_threshold",                   │
│                delay_hours: 240,                                 │
│                condition: {                                      │
│                  min_amount: 50000,  // $500                     │
│                  max_amount: 1000000 // $10,000                  │
│                }                                                 │
│              }                                                   │
│              → 240h (10 jours) si $500 <= montant <= $10,000     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TYPE: "country"                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Description: Basé sur le pays du provider                        │
│ Conditions:  country OU countries (liste)                        │
│ Exemple 1:   {                                                   │
│                applies_to: "country",                            │
│                delay_hours: 72,                                  │
│                condition: { country: "FR" }                      │
│              }                                                   │
│              → 72h (3 jours) pour la France                      │
│                                                                  │
│ Exemple 2:   {                                                   │
│                applies_to: "country",                            │
│                delay_hours: 504,                                 │
│                condition: {                                      │
│                  countries: ["NG", "GH", "KE"]                   │
│                }                                                 │
│              }                                                   │
│              → 504h (21 jours) pour Nigeria, Ghana, Kenya        │
└──────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════╗
║                    RÈGLE PAR DÉFAUT (FALLBACK)                   ║
╚══════════════════════════════════════════════════════════════════╝

Si AUCUNE règle active ne correspond → Applique la règle par défaut:
  • name: "Défaut (14 jours)"
  • delay_hours: 336 (14 jours × 24 heures)
  • priority: 0

╔══════════════════════════════════════════════════════════════════╗
║                   LOGIQUE DE SÉLECTION                           ║
╚══════════════════════════════════════════════════════════════════╝

1. Récupérer toutes les règles actives (is_active = true)
2. Trier par priority (DESC) - Plus haute priorité d'abord
3. Pour chaque règle (dans l'ordre de priorité):
   a. Vérifier si applies_to correspond
   b. Vérifier toutes les conditions
   c. Si tout correspond → APPLIQUER cette règle
   d. Si non → Passer à la règle suivante
4. Si aucune règle ne correspond → Règle par défaut (336h)

╔══════════════════════════════════════════════════════════════════╗
║              EXEMPLES DE DELAY_HOURS RECOMMANDÉS                 ║
╚══════════════════════════════════════════════════════════════════╝

• Providers VIP (rating >= 4.8):        24-48h    (1-2 jours)
• Providers fiables (rating >= 4.5):    72-120h   (3-5 jours)
• Providers normaux:                    168h      (7 jours)
• Nouveaux providers (<30 jours):       336h      (14 jours)
• Montants > $1000:                     240-336h  (10-14 jours)
• Pays à risque élevé:                  504-720h  (21-30 jours)
• Par défaut:                           336h      (14 jours)

╔══════════════════════════════════════════════════════════════════╗
║                    CONVERSION HEURES → JOURS                     ║
╚══════════════════════════════════════════════════════════════════╝

  24h  = 1 jour
  48h  = 2 jours
  72h  = 3 jours
  120h = 5 jours
  168h = 7 jours (1 semaine)
  240h = 10 jours
  336h = 14 jours (2 semaines)
  504h = 21 jours (3 semaines)
  720h = 30 jours (1 mois)

`);

  console.log('='.repeat(70));
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const apiUrl = args[0] || 'http://localhost:3000/api/auto-release-funds-simple';

  // Afficher la documentation des règles
  displayRulesDocumentation();

  // Tester l'API
  await testAutoReleaseAPI(apiUrl);
}

// Point d'entrée
if (require.main === module) {
  main();
}

export { testAutoReleaseAPI, displayRulesDocumentation };
