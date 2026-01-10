// app/api/messages/archive/route.ts
// API pour archiver des messages
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { message_ids, unarchive = false } = body; // Array of message IDs

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

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json(
        { error: 'message_ids is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Pour chaque message, ajouter/retirer le profile_id à/de archived_by_users
    const updates = await Promise.all(
      message_ids.map(async (messageId) => {
        // Récupérer le message actuel
        const { data: message, error: fetchError } = await supabase
          .from('messages')
          .select('archived_by_users')
          .eq('id', messageId)
          .single();

        if (fetchError || !message) {
          console.error(`Message ${messageId} not found`);
          return { success: false, messageId };
        }

        // Modifier l'array archived_by_users
        let archivedByUsers = message.archived_by_users || [];

        if (unarchive) {
          // Retirer le profile_id
          archivedByUsers = archivedByUsers.filter((id: string) => id !== profile.id);
        } else {
          // Ajouter le profile_id
          if (!archivedByUsers.includes(profile.id)) {
            archivedByUsers.push(profile.id);
          }
        }

        // Mettre à jour le message
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            archived_by_users: archivedByUsers,
          })
          .eq('id', messageId);

        if (updateError) {
          console.error(`Error updating message ${messageId}:`, updateError);
          return { success: false, messageId };
        }

        return { success: true, messageId };
      })
    );

    const successCount = updates.filter((u) => u.success).length;
    const failedCount = updates.length - successCount;

    return NextResponse.json({
      success: true,
      data: {
        total: updates.length,
        archived: successCount,
        failed: failedCount,
        results: updates,
      },
    });
  } catch (error: any) {
    console.error('Error in archive messages API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}