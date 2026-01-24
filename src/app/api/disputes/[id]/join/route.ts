import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;
        const { role } = await request.json();

        console.log('=== JOIN MEDIATION REQUEST ===');
        console.log('Dispute ID:', disputeId);
        console.log('Role:', role);

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

        // 2. Verify dispute exists and user is authorized
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select(`
        *,
        order:orders(
          client_id,
          provider_id
        )
      `)
            .eq('id', disputeId)
            .single();

        if (disputeError || !dispute) {
            console.error('Dispute error:', disputeError);
            return NextResponse.json(
                { success: false, error: 'Litige introuvable' },
                { status: 404 }
            );
        }

        console.log('Dispute found:', dispute.id);

        // 3. Resolve Identity - use user.id directly from auth
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, user_id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            console.error('Profile not found for user:', user.id);
            return NextResponse.json(
                { success: false, error: 'Profil introuvable' },
                { status: 404 }
            );
        }

        console.log('Profile found:', profile.id, 'Role:', profile.role);

        const isAdmin = profile.role === 'admin';

        // 4. Verify participant
        let isParticipant = false;
        let debugInfo = {
            isAdmin,
            clientIdMatch: false,
            providerIdMatch: false,
            disputeClientId: dispute.order.client_id,
            disputeProviderId: dispute.order.provider_id,
            authUserId: user.id
        };

        if (isAdmin) {
            isParticipant = true;
            console.log('✅ User is admin');
        } else {
            // Check Client
            if (dispute.order.client_id === user.id) {
                isParticipant = true;
                debugInfo.clientIdMatch = true;
                console.log('✅ User is client');
            }

            // Check Provider - Explicit fetch to ensure robust verification
            // Check Provider - Explicit fetch via Profile relation (Provider -> Profile -> User)
            else if (dispute.order.provider_id) {
                const admin = createAdminClient();

                // 1. Get Provider's Profile ID
                const { data: providerData, error: providerFetchError } = await admin
                    .from('providers')
                    .select('profile_id')
                    .eq('id', dispute.order.provider_id)
                    .single();

                if (providerFetchError) {
                    console.error('Error fetching provider details:', providerFetchError);
                } else if (providerData) {
                    // 2. Get User ID from Profile
                    const { data: profileData, error: profileFetchError } = await admin
                        .from('profiles')
                        .select('user_id')
                        .eq('id', providerData.profile_id)
                        .single();

                    if (profileFetchError) {
                        console.error('Error fetching provider profile:', profileFetchError);
                    } else if (profileData?.user_id === user.id) {
                        isParticipant = true;
                        debugInfo.providerIdMatch = true;
                        console.log('✅ User is provider (verified via provider->profile->user relation)');
                    } else {
                        console.log('❌ Provider mismatch. Profile UserID:', profileData?.user_id, 'Current USer:', user.id);
                    }
                }
            }
        }

        console.log('=== AUTHORIZATION DEBUG INFO ===');
        console.log(JSON.stringify(debugInfo, null, 2));

        if (!isParticipant) {
            console.warn('❌ ACCESS DENIED - User is not a participant of this dispute');
            return NextResponse.json(
                { success: false, error: 'Accès refusé', debugInfo },
                { status: 403 }
            );
        }

        // 5. Create or Update presence record (Upsert)
        // This handles both new joins and reconnections without duplicates
        console.log('Upserting presence record for user:', user.id);

        // We first try to get existing to preserve original joined_at if needed, 
        // but for simplicity and to ensure is_present=true, upsert is best.
        // To preserve joined_at, we could select first, but refreshing it on re-join is also acceptable behavior
        // or we can just let it update.

        const { data: presenceRecord, error: presenceError } = await supabase
            .from('mediation_presence')
            .upsert({
                dispute_id: disputeId,
                user_id: user.id,
                role: role,
                is_present: true,
                last_heartbeat: new Date().toISOString()
                // joined_at is not included in update if row exists? 
                // Upsert updates all fields provided. If we want to keep original joined_at, we'd need a separate logic
                // But typically for a session, re-joining updates the session start for that user.
                // Let's keep it simple: always update to active.
            }, {
                onConflict: 'dispute_id, user_id'
            })
            .select()
            .single();

        if (presenceError) {
            console.error('Presence upsert error:', presenceError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la connexion: ' + presenceError.message },
                { status: 500 }
            );
        }

        console.log('Presence record active:', presenceRecord.id);

        // 7. Update dispute with join timestamp
        const updateField = role === 'client' ? 'client_joined_at' :
            role === 'provider' ? 'provider_joined_at' :
                'admin_joined_at';

        await supabase
            .from('disputes')
            .update({ [updateField]: new Date().toISOString() })
            .eq('id', disputeId);

        // 8. Check if both parties are now present
        const { data: allPresence } = await supabase
            .from('mediation_presence')
            .select('role')
            .eq('dispute_id', disputeId)
            .eq('is_present', true);

        const hasClient = allPresence?.some(p => p.role === 'client');
        const hasProvider = allPresence?.some(p => p.role === 'provider');

        console.log('Current presence - Client:', hasClient, 'Provider:', hasProvider);

        // 9. If both present, update session status
        if (hasClient && hasProvider) {
            console.log('Both parties present! Starting session');
            await supabase
                .from('disputes')
                .update({
                    session_status: 'active',
                    mediation_session_started_at: new Date().toISOString()
                })
                .eq('id', disputeId);
        }

        return NextResponse.json({
            success: true,
            presence_id: presenceRecord.id,
            both_present: hasClient && hasProvider
        });

    } catch (error: any) {
        console.error('Join mediation error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur: ' + error.message },
            { status: 500 }
        );
    }
}
