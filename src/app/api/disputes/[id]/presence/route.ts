import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Check presence status
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;

        console.log('=== PRESENCE GET REQUEST ===');
        console.log('Dispute ID:', disputeId);

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        console.log('Auth user ID:', user.id);

        // 2. Get all ACTIVE presence for this dispute
        // Filter by is_present = true AND last_heartbeat within last 60 seconds
        const heartbeatThreshold = new Date(Date.now() - 60000).toISOString();

        const { data: presenceRecords, error: presenceError } = await supabase
            .from('mediation_presence')
            .select('role, user_id, is_present, last_heartbeat, joined_at')
            .eq('dispute_id', disputeId)
            .eq('is_present', true)
            .gt('last_heartbeat', heartbeatThreshold);

        if (presenceError) {
            console.error('Presence error:', presenceError);
            return NextResponse.json(
                { success: false, error: 'Erreur de récupération: ' + presenceError.message },
                { status: 500 }
            );
        }

        console.log('Active presence records:', presenceRecords);

        // 3. Resolve requester identity
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, id')
            .eq('user_id', user.id)
            .single();

        const isRequesterAdmin = profile?.role === 'admin';

        // 4. Build presence status object - show which roles are present
        const presence = {
            client: presenceRecords?.some(p => p.role === 'client') || false,
            provider: presenceRecords?.some(p => p.role === 'provider') || false,
            admin: presenceRecords?.some(p => p.role === 'admin') || false,
            records: presenceRecords || []  // Also return full records for debugging
        };

        console.log('Presence status:', presence);

        return NextResponse.json({
            success: true,
            presence,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Get presence error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur: ' + error.message },
            { status: 500 }
        );
    }
}

// POST: Update presence (heartbeat or leave)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;
        const { is_present } = await request.json();

        console.log('=== PRESENCE POST REQUEST ===');
        console.log('Dispute ID:', disputeId);
        console.log('Is present:', is_present);

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        console.log('Auth user ID:', user.id);

        // 2. Find user's presence record using user.id directly
        const { data: presenceRecord, error: findError } = await supabase
            .from('mediation_presence')
            .select('*')
            .eq('dispute_id', disputeId)
            .eq('user_id', user.id)
            .eq('is_present', true)
            .single();

        if (findError && findError.code !== 'PGRST116') {  // PGRST116 = no rows returned
            console.error('Find presence error:', findError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la recherche de présence: ' + findError.message },
                { status: 500 }
            );
        }

        if (!presenceRecord) {
            console.warn('Presence record not found for user:', user.id);
            return NextResponse.json(
                { success: false, error: 'Présence non trouvée' },
                { status: 404 }
            );
        }

        console.log('Found presence record:', presenceRecord.id);

        // 3. Update presence
        if (is_present === false) {
            // User is leaving
            console.log('Marking user as left');
            await supabase
                .from('mediation_presence')
                .update({
                    is_present: false,
                    left_at: new Date().toISOString()
                })
                .eq('id', presenceRecord.id);
        } else {
            // Heartbeat update
            console.log('Updating heartbeat');
            await supabase
                .from('mediation_presence')
                .update({
                    last_heartbeat: new Date().toISOString()
                })
                .eq('id', presenceRecord.id);
        }

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });

    } catch (error: any) {
        console.error('Update presence error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur: ' + error.message },
            { status: 500 }
        );
    }
}
