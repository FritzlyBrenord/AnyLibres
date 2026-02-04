import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient();

        // Get all conversations (admin can see everything)
        // Get current admin user/profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

        // Get only conversations where admin is a participant
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                id,
                participants,
                created_at,
                updated_at,
                last_message_at,
                last_message_text,
                last_message_sender_id
            `)
            .contains('participants', [profile.id]) // Security: only own conversations
            .not('last_message_at', 'is', null)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch conversations' }, { status: 500 });
        }

        // Get profiles for all participants
        const allParticipantIds = new Set<string>();
        conversations?.forEach(conv => {
            conv.participants?.forEach((id: string) => allParticipantIds.add(id));
        });

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar, role')
            .in('id', Array.from(allParticipantIds));

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Format conversations with participant info
        const formattedConversations = conversations?.map(conv => {
            const participants = conv.participants || [];
            const users = participants.map((id: string) => profilesMap.get(id)).filter(Boolean);

            // For admin view, we want to know who is in the conversation.
            // If it's a 1:1, it's just the other person.
            // For now, let's pick the first participant (or the one that isn't the admin if we can identify them)
            // But since this is a general list, let's just provide the first non-admin profile found, 
            // or just the first profile if no role is found.
            const otherP = users.find((p: any) => p.role !== 'admin') || users[0];

            return {
                id: conv.id,
                participants: conv.participants,
                created_at: conv.created_at,
                updated_at: conv.updated_at,
                last_message_at: conv.last_message_at,
                last_message_text: conv.last_message_text,
                last_message_sender_id: conv.last_message_sender_id,
                unread_count: {}, // Admin sees all

                // Specific fields for display
                other_participant_name: otherP
                    ? (`${otherP.first_name || ''} ${otherP.last_name || ''}`.trim() || otherP.email)
                    : 'Utilisateur Inconnu',
                other_participant_email: otherP?.email,
                other_participant_role: otherP?.role,
                other_participant_avatar: otherP?.avatar
            };
        }) || [];

        return NextResponse.json({
            success: true,
            data: {
                conversations: formattedConversations,
                profile_id: profile.id
            }
        });

    } catch (error) {
        console.error('Admin conversations error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
