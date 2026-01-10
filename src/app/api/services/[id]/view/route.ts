
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Increment the views_count using database function or direct update if supported
        // Since Supabase/PostgreSQL doesn't have a simple "increment" without a function or a read-write cycle which is race-condition prone,
        // robust way is a stored procedure 'increment_service_view' or using rpc.
        // However, for simplicity without extra SQL from user, we can try to do a safe update if possible,
        // or just read-update-write if traffic isn't massive yet.
        // Better approach: use the `rpc` if available, or just standard update. 

        // Let's assume we can just update it. To avoid race conditions in high traffic, an RPC is better.
        // But let's try to stick to standard table operations if we can't ask user for more SQL functions.
        // Actually, we can use `rpc` if we ask user to create it, but let's try to see if we can just do:
        // UPDATE services SET views_count = views_count + 1 WHERE id = ...
        // Supabase JS client doesn't support "increment" directly in `.update()` easily without some gymnastics or rpc.

        // Alternative: We will just read and update. It's not atomic but okay for view counts for now.

        const { data: service, error: fetchError } = await supabase
            .from('services')
            .select('views_count')
            .eq('id', id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        const newCount = (service.views_count || 0) + 1;

        const { error: updateError } = await supabase
            .from('services')
            .update({ views_count: newCount })
            .eq('id', id);

        if (updateError) {
            console.error('Error incrementing view:', updateError);
            return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, views_count: newCount });
    } catch (error) {
        console.error('Error in POST /api/services/[id]/view:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
