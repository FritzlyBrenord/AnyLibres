import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inAppNotificationService } from '@/lib/notifications/inAppNotificationService';

export async function POST(req: NextRequest) {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { notificationId, all } = body;

        let result;
        if (all) {
            result = await inAppNotificationService.markAllAsRead(user.id);
        } else if (notificationId) {
            result = await inAppNotificationService.markAsRead(notificationId);
        } else {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
