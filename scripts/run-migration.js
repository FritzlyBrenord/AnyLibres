const { readFileSync } = require('fs');
const { join } = require('path');

async function runMigration() {
  try {
    // Charger la migration
    const migrationPath = join(__dirname, '..', 'migrations', 'fix_payment_release_country.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration chargée:', migrationPath);
    console.log('📊 Taille:', sql.length, 'caractères\n');

    // Importer le client Supabase serveur
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables d\'environnement Supabase manquantes');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Exécution de la migration...\n');

    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution:', error);
      process.exit(1);
    }

    console.log('✅ Migration exécutée avec succès !');
    console.log('\n📋 Résultat:', data);

  } catch (error) {
    console.error('💥 Erreur inattendue:', error.message);
    process.exit(1);
  }
}

runMigration();
