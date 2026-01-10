// app/api/messages/conversations/delete/route.ts
// API pour supprimer une conversation (supprime tous les messages pour cet utilisateur)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { conversation_id } = body;

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

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est participant
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participants')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(profile.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Récupérer tous les messages de la conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, deleted_by_users')
      .eq('conversation_id', conversation_id);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Marquer tous les messages comme supprimés pour cet utilisateur
    const updates = await Promise.all(
      (messages || []).map(async (message) => {
        const deletedByUsers = message.deleted_by_users || [];
        if (!deletedByUsers.includes(profile.id)) {
          deletedByUsers.push(profile.id);
        }

        const { error: updateError } = await supabase
          .from('messages')
          .update({
            deleted_by_users: deletedByUsers,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', message.id);

        return updateError ? false : true;
      })
    );

    const successCount = updates.filter((u) => u).length;

    return NextResponse.json({
      success: true,
      data: {
        conversation_id,
        messages_deleted: successCount,
      },
    });
  } catch (error: any) {
    console.error('Error in delete conversation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}