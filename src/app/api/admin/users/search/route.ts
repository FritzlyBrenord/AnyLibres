import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const supabase = createAdminClient();

        // Search in profiles table
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role, avatar')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .in('role', ['client', 'provider'])
            .limit(10);

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
        }

        // Format results
        const results = profiles?.map(profile => ({
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            email: profile.email,
            role: profile.role === 'client' ? 'Client' : 'Prestataire',
            avatar: profile.avatar
        })) || [];

        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error('User search error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
