import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch mediation messages
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // 2. Fetch dispute and order info
        const { data: dispute } = await supabase
            .from('disputes')
            .select(`
                *,
                order:orders(client_id, provider_id)
            `)
            .eq('id', disputeId)
            .single();

        if (!dispute) {
            return NextResponse.json(
                { success: false, error: 'Litige introuvable' },
                { status: 404 }
            );
        }

        // 3. Resolve Identity and Check authorization
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, user_id')
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            .single();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Profil introuvable' },
                { status: 404 }
            );
        }

        const authUid = profile.user_id;
        const isAdmin = profile.role === 'admin';

        // Resolve Provider ID if applicable
        const { data: providerData } = await supabase
            .from('providers')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

        const providerId = providerData?.id;

        const isParticipant =
            dispute.order.client_id === authUid ||
            (providerId && dispute.order.provider_id === providerId);

        if (!isAdmin && !isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Accès refusé' },
                { status: 403 }
            );
        }

        // 4. Fetch messages
        const { data: rawMessages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .contains('metadata', { dispute_id: disputeId })
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('Messages fetch error:', messagesError);
            return NextResponse.json(
                { success: false, error: 'Erreur de récupération' },
                { status: 500 }
            );
        }

        if (!rawMessages || rawMessages.length === 0) {
            return NextResponse.json({
                success: true,
                messages: []
            });
        }

        // 5. Fetch unique sender profiles
        const senderIds = [...new Set(rawMessages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, role, avatar_url')
            .in('user_id', senderIds);

        const profileMap = (profiles || []).reduce((acc: any, p) => {
            acc[p.user_id] = p;
            return acc;
        }, {});

        // 6. Map profiles to messages
        const messages = rawMessages.map(msg => ({
            ...msg,
            sender: profileMap[msg.sender_id] || {
                first_name: 'Utilisateur',
                last_name: '',
                role: 'unknown'
            }
        }));

        return NextResponse.json({
            success: true,
            messages
        });

    } catch (error: any) {
        console.error('Get mediation messages error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// POST: Send mediation message
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;
        const { text, sender_role } = await request.json();

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_id')
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            .single();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Profil introuvable' },
                { status: 404 }
            );
        }

        const authUid = profile.user_id;

        // 2. Get dispute and order info
        const { data: dispute } = await supabase
            .from('disputes')
            .select(`
                *,
                order:orders(client_id, provider_id)
            `)
            .eq('id', disputeId)
            .single();

        if (!dispute) {
            return NextResponse.json(
                { success: false, error: 'Litige introuvable' },
                { status: 404 }
            );
        }

        // 3. Determine receiver
        let receiverId: string;
        if (sender_role === 'client') {
            receiverId = dispute.order.provider_id;
        } else if (sender_role === 'provider') {
            receiverId = dispute.order.client_id;
        } else {
            // Admin message - send to both
            receiverId = dispute.order.client_id; // Will be handled differently
        }

        // 4. Get or create conversation
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .contains('metadata', { order_id: dispute.order_id })
            .single();

        let conversationId = existingConv?.id;

        if (!conversationId) {
            // Create conversation
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                    participants: [dispute.order.client_id, dispute.order.provider_id],
                    metadata: {
                        order_id: dispute.order_id,
                        dispute_id: disputeId,
                        type: 'mediation'
                    }
                })
                .select()
                .single();

            conversationId = newConv?.id;
        }

        if (!conversationId) {
            return NextResponse.json(
                { success: false, error: 'Erreur de conversation' },
                { status: 500 }
            );
        }

        // 5. Insert message
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: authUid,
                receiver_id: receiverId,
                text: text,
                message_type: 'mediation',
                metadata: {
                    dispute_id: disputeId,
                    sender_role: sender_role,
                    is_mediation: true
                }
            })
            .select()
            .single();

        if (messageError) {
            console.error('Message insert error:', messageError);
            return NextResponse.json(
                { success: false, error: 'Erreur d\'envoi' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error: any) {
        console.error('Send mediation message error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
