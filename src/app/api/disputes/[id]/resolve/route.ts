import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const disputeId = params.id;
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resolution_type, resolution_note, wants_refund } = body;

        // 1. Check current status and get order_id
        const { data: currentDispute, error: fetchError } = await supabase
            .from('disputes')
            .select('status, order_id')
            .eq('id', disputeId)
            .single();

        if (fetchError || !currentDispute) {
            return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
        }

        if (currentDispute.status === 'closed' || currentDispute.status === 'resolved') {
            return NextResponse.json({ success: false, error: 'Dispute is already closed and cannot be reopened.' }, { status: 400 });
        }

        // 2. Prepare update data
        const updateData: any = {
            status: 'closed',
            session_status: 'ended',
            resolution_type: resolution_type, // 'agreement' or 'no_agreement'
            resolution_note: resolution_note,
            updated_at: new Date().toISOString(),
            mediation_session_ended_at: new Date().toISOString(),
            resolved_at: new Date().toISOString(),
        };

        // If refund requested
        if (wants_refund) {
            updateData.resolution_note = `[REFUND REQUESTED] ${resolution_note}`;
        }

        // 3. Update Dispute
        const { error: updateError } = await supabase
            .from('disputes')
            .update(updateData)
            .eq('id', disputeId);

        if (updateError) {
            console.error('Error closing dispute:', updateError);
            return NextResponse.json({ success: false, error: 'Failed to close dispute' }, { status: 500 });
        }

        // 3b. Update Order Status if Agreement
        if (resolution_type === 'agreement' && currentDispute.order_id) {
            const { error: orderUpdateError } = await supabase
                .from('orders')
                .update({
                    status: 'revision_requested',
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentDispute.order_id);

            if (orderUpdateError) {
                console.error('Error updating order status:', orderUpdateError);
                // We keep going as the dispute is already closed, but log it
            }
        }

        // 4. Update Presence (Mark user as left/not present)
        // We update presence for the user who closed it, or maybe all users?
        // Usually, closing the room boots everyone, so we might want to set is_present=false for this user at least.
        await supabase
            .from('mediation_presence')
            .update({ is_present: false, left_at: new Date().toISOString() })
            .eq('dispute_id', disputeId)
            .eq('user_id', user.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in resolution API:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
