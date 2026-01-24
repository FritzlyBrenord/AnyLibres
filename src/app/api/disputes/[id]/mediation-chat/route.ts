import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// helper to determine content type
const getContentType = (type: string) => {
    switch (type) {
        case 'image': return 'image/*';
        case 'video': return 'video/*';
        case 'audio': return 'audio/*';
        case 'voice': return 'audio/webm';
        default: return 'application/octet-stream';
    }
};

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

        // 3. Resolve Identity
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

        // Provider check logic: find ID from provider table via profile 
        const adminClient = createAdminClient();
        const { data: provider } = await adminClient
            .from('providers')
            .select('id')
            .eq('profile_id', profile.id)
            .single();
        const providerId = provider?.id;

        // 4. Verify Authorization
        const isClient = dispute.order.client_id === authUid;
        const isProvider = (providerId && dispute.order.provider_id === providerId) || (dispute.order.provider_id === authUid); // Fallback for direct match
        const isParticipant = isClient || isProvider || isAdmin;

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, error: 'Accès refusé' },
                { status: 403 }
            );
        }

        // 5. Fetch messages from mediation_messages
        // Removing the failing nested join 'sender:sender_id'
        const { data: rawMessages, error: messagesError } = await supabase
            .from('mediation_messages')
            .select('*')
            .eq('dispute_id', disputeId)
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

        // 6. Manual Join for Profiles (Sender Info)
        const senderIds = [...new Set(rawMessages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, role, avatar_url')
            .in('user_id', senderIds);

        const profileMap = (profiles || []).reduce((acc: any, p) => {
            acc[p.user_id] = p;
            return acc;
        }, {});

        const messages = rawMessages.map(msg => ({
            ...msg,
            sender: profileMap[msg.sender_id] || {
                first_name: 'Utilisateur',
                last_name: '',
                role: msg.sender_role || 'unknown', // Fallback to column value
                avatar_url: null
            }
        }));

        return NextResponse.json({
            success: true,
            messages: messages
        });

    } catch (error: any) {
        console.error('Get mediation messages error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// POST: Send mediation message (Text or File)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: disputeId } = await params;

        // Parse request as FormData to handle files
        const formData = await request.formData();
        const content = formData.get('content') as string;
        const type = formData.get('type') as string; // 'text', 'image', 'video', 'document', 'audio', 'voice'
        const file = formData.get('file') as File | null;
        const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : null;
        const replyToId = formData.get('reply_to_id') as string | null;

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
            .select('id, role, user_id')
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            .single();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Profil introuvable' },
                { status: 404 }
            );
        }

        const authUid = profile.user_id; // UUID of the user in auth.users
        const senderRole = profile.role;

        // 2. File Upload Logic
        let mediaUrl = null;
        let mediaName = null;
        let mediaSize = null;

        if (file && type !== 'text') {
            const adminClient = createAdminClient(); // Use admin client to bypass storage RLS for upload if needed, or normal client if RLS is set up for auth user
            // Path: dispute_id/type/timestamp_filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${disputeId}/${type}/${fileName}`;

            const { data: uploadData, error: uploadError } = await adminClient
                .storage
                .from('mediation-attachments')
                .upload(filePath, file, {
                    contentType: file.type || getContentType(type),
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return NextResponse.json(
                    { success: false, error: 'Erreur upload fichier' },
                    { status: 500 }
                );
            }

            // Get Public URL
            const { data: urlData } = adminClient
                .storage
                .from('mediation-attachments')
                .getPublicUrl(filePath);

            mediaUrl = urlData.publicUrl;
            mediaName = file.name;
            mediaSize = file.size;
        }

        // 3. Insert into mediation_messages
        // Using admin client to ensure we can insert regardless of strict RLS on profiles join if needed, 
        // though RLS should allow insert if policy is correct.
        const adminClient = createAdminClient();

        const messageData = {
            dispute_id: disputeId,
            sender_id: authUid,
            sender_role: senderRole,
            content: content || '',
            message_type: type,
            media_url: mediaUrl,
            media_name: mediaName,
            media_size: mediaSize,
            media_duration: duration,
            reply_to_id: replyToId ? replyToId : null,
            is_read: false
        };

        const { data: newMessage, error: insertError } = await adminClient
            .from('mediation_messages')
            .insert(messageData)
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Erreur enregistrement message' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: newMessage
        });

    } catch (error: any) {
        console.error('Send mediation message error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur: ' + error.message },
            { status: 500 }
        );
    }
}
