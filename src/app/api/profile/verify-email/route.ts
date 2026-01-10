import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Send verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Error in verify email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}