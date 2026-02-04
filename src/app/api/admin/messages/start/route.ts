import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { target_user_id } = await request.json();

        if (!target_user_id) {
            return NextResponse.json({ success: false, error: 'Missing target_user_id' }, { status: 400 });
        }

        // Get current admin user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get admin profile
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!adminProfile) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
        }

        // Check if conversation already exists between admin and target user
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .contains('participants', [adminProfile.id, target_user_id])
            .single();

        if (existingConv) {
            return NextResponse.json({
                success: true,
                data: { conversation_id: existingConv.id, created: false }
            });
        }

        // Create new conversation
        const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
                participants: [adminProfile.id, target_user_id],
                created_by: adminProfile.id
            })
            .select()
            .single();

        if (convError) {
            console.error('Error creating conversation:', convError);
            return NextResponse.json({ success: false, error: 'Failed to create conversation' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: { conversation_id: newConv.id, created: true }
        });

    } catch (error) {
        console.error('Start conversation error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
