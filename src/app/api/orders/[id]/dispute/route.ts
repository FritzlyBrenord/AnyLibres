
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct Next.js 15+ param typing
) {
    try {
        const orderId = (await params).id;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the open dispute for this order
        const { data: dispute, error } = await supabase
            .from('disputes')
            .select('*')
            .eq('order_id', orderId)
            .eq('status', 'open')
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: 'No open dispute found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: dispute });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
