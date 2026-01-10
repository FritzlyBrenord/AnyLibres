import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Fetch all services with provider details
        const { data: services, error } = await supabase
            .from('services')
            .select(`
        *,
        provider:providers (
          id,
          profile_id,
          company_name,
          profile:profiles (
            user_id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admin services:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ services });
    } catch (error) {
        console.error('Error in admin services API:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
