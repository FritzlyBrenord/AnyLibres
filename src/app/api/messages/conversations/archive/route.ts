// app/api/messages/conversations/archive/route.ts
// API pour archiver une conversation
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { conversation_id, unarchive = false } = body;

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

    // Vérifier que l'utilisateur est participant et récupérer archived_by
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participants, archived_by')
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

    // Modifier l'array archived_by
    let archivedBy = conversation.archived_by || [];

    if (unarchive) {
      // Retirer le profile_id
      archivedBy = archivedBy.filter((id: string) => id !== profile.id);
    } else {
      // Ajouter le profile_id
      if (!archivedBy.includes(profile.id)) {
        archivedBy.push(profile.id);
      }
    }

    // Mettre à jour la conversation
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        archived_by: archivedBy,
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: 'Failed to archive conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation_id,
        archived: !unarchive,
      },
    });
  } catch (error: any) {
    console.error('Error in archive conversation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}