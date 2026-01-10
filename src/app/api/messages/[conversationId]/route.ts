// app/api/messages/[conversationId]/route.ts
// API pour récupérer tous les messages d'une conversation
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { conversationId } = await params;

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', {
        conversationId,
        error: convError,
        message: convError?.message,
        details: convError?.details,
        hint: convError?.hint,
      });
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(profile.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Récupérer tous les messages (filtrer ceux supprimés par cet utilisateur)
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Filtrer les messages supprimés par cet utilisateur
    const messages = (allMessages || []).filter((msg: any) => {
      const deletedByUsers = msg.deleted_by_users || [];
      return !deletedByUsers.includes(profile.id);
    });

    // Pour chaque message, récupérer les infos du sender
    const messagesWithSender = await Promise.all(
      (messages || []).map(async (msg) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url')
          .eq('id', msg.sender_id)
          .single();

        return {
          ...msg,
          sender,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        messages: messagesWithSender,
        conversation,
        profile_id: profile.id,
      },
    });
  } catch (error: any) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}