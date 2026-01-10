import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, display_name, phone, bio, location, website } = body;

    // If phone is provided, sync it with auth.users for Phone Auth
    if (phone && phone.trim() !== '') {
      // Always sync if phone is different or not set in auth
      if (!user.phone || phone !== user.phone) {
        // Create admin client with service role key
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Use Admin API to update auth.users
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { phone: phone }
        );

        if (authUpdateError) {
          console.error('Error updating phone in auth:', authUpdateError);
          // Continue anyway, but log the error
        } else {
          console.log('Phone synced to auth.users:', phone);
        }
      }
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        display_name,
        phone,
        bio,
        location,
        website,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          ...profile,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in profile update API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}