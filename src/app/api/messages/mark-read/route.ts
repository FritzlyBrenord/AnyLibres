// app/api/messages/mark-read/route.ts
// API pour marquer un message (ou tous les messages d'une conversation) comme lu
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { message_id, conversation_id } = body;

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

    // Cas 1: Marquer un message spécifique comme lu
    if (message_id) {
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', message_id)
        .eq('receiver_id', profile.id) // Seul le receiver peut marquer comme lu
        .select()
        .single();

      if (messageError) {
        console.error('Error marking message as read:', messageError);
        return NextResponse.json(
          { error: 'Failed to mark message as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { message },
      });
    }

    // Cas 2: Marquer tous les messages d'une conversation comme lus
    if (conversation_id) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversation_id)
        .eq('receiver_id', profile.id)
        .eq('is_read', false) // Seulement les non lus
        .select();

      if (messagesError) {
        console.error('Error marking messages as read:', messagesError);
        return NextResponse.json(
          { error: 'Failed to mark messages as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          messages,
          count: messages?.length || 0,
        },
      });
    }

    return NextResponse.json(
      { error: 'Either message_id or conversation_id is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in mark-read API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}