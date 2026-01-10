// ============================================================================
// API: New Providers
// Route: /api/providers/new
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: providers || [] });
  } catch (error) {
    console.error('Error fetching new providers:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}