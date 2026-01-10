import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier que c'est un admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Charger la migration
    const migrationPath = join(process.cwd(), 'migrations', 'fix_payment_release_country.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Exécution de la migration de correction...');

    // Exécuter la migration complète
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      console.error('❌ Erreur migration:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Migration exécutée avec succès');

    return NextResponse.json({
      success: true,
      message: 'Migration exécutée avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
