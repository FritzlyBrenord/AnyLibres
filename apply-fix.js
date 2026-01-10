const { readFileSync } = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applyFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('📝 Application de la correction du système de paiement...\n');

  // Lire le fichier SQL
  const sql = readFileSync('./migrations/fix_payment_release_country.sql', 'utf8');

  // Diviser en commandes séparées (par --)
  const commands = sql
    .split(/;[\s\n]*(?=CREATE|DROP|COMMENT)/gi)
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0);

  console.log(`📊 ${commands.length} commandes SQL à exécuter\n`);

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (!command || command.startsWith('--')) continue;

    const cmdType = command.substring(0, 50).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${commands.length}] ${cmdType}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: command.endsWith(';') ? command : command + ';'
      });

      if (error) {
        console.error(`   ❌ Erreur:`, error.message);
        // Continue pour les autres commandes
      } else {
        console.log(`   ✓ OK`);
      }
    } catch (err) {
      console.error(`   ❌ Exception:`, err.message);
    }
  }

  console.log('\n✅ Correction terminée !');
}

applyFix().catch(console.error);
