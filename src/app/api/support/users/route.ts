import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { user_ids } = await request.json();

        if (!user_ids || !Array.isArray(user_ids)) {
            return NextResponse.json({ success: false, error: 'Invalid user_ids' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get user emails from auth.users
        const userEmails: Record<string, string> = {};

        for (const userId of user_ids) {
            const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

            if (!error && user && user.email) {
                userEmails[userId] = user.email;
            }
        }

        return NextResponse.json({ success: true, data: userEmails });

    } catch (error) {
        console.error('Error fetching user emails:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
