// app/api/messages/conversations/route.ts
// API pour lister toutes les conversations de l'utilisateur
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Récupérer toutes les conversations où l'utilisateur est participant et ayant au moins un message
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [profile.id])
      .not('last_message_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Pour chaque conversation, récupérer les infos de l'autre participant
    const conversationsWithParticipants = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Trouver l'autre participant
        const otherParticipantId = conv.participants.find(
          (p: string) => p !== profile.id
        );

        if (!otherParticipantId) {
          return {
            ...conv,
            other_participant: null,
            other_participant_name: 'Inconnu',
            other_participant_avatar: null,
          };
        }

        // Récupérer les infos de l'autre participant
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url, email, role')
          .eq('id', otherParticipantId)
          .single();

        const otherName =
          otherProfile?.display_name ||
          `${otherProfile?.first_name || ''} ${otherProfile?.last_name || ''}`.trim() ||
          otherProfile?.email ||
          'Utilisateur';

        return {
          ...conv,
          other_participant: otherProfile,
          other_participant_name: otherName,
          other_participant_avatar: otherProfile?.avatar_url,
          other_participant_email: otherProfile?.email,
          other_participant_role: otherProfile?.role,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversationsWithParticipants,
        profile_id: profile.id,
      },
    });
  } catch (error: any) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}