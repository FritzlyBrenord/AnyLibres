import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inAppNotificationService } from '@/lib/notifications/inAppNotificationService';

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await inAppNotificationService.getUserNotifications(user.id, limit, offset);

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
}
