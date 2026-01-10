// app/api/favorites/count/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Compter le nombre exact de favoris
    const { count, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.id);

    if (countError) {
      console.error('Error counting favorites:', countError);
      return NextResponse.json(
        { error: 'Failed to count favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        count: count || 0,
        client_id: profile.id
      },
    });
  } catch (error: any) {
    console.error('Error in favorites count API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}