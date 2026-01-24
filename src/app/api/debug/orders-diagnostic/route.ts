import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Vérifier les variables d'environnement
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗',
    };

    // Créer le client Supabase
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Vérifier la connexion à la base de données
    let dbCheck = { status: 'unknown', error: null };
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
      
      dbCheck = {
        status: error ? 'failed' : 'success',
        error: error?.message || null
      };
    } catch (e) {
      dbCheck = {
        status: 'error',
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        environment: envCheck,
        authentication: {
          authenticated: !!user,
          userId: user?.id || null,
          email: user?.email || null,
          authError: authError?.message || null,
        },
        database: dbCheck,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur diagnostic',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
