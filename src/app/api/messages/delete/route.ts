// app/api/messages/delete/route.ts
// API pour supprimer des messages (soft delete par utilisateur)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { message_ids } = body; // Array of message IDs

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

    // Pour chaque message, ajouter le profile_id à deleted_by_users
    const updates = await Promise.all(
      message_ids.map(async (messageId) => {
        // Récupérer le message actuel
        const { data: message, error: fetchError } = await supabase
          .from('messages')
          .select('deleted_by_users')
          .eq('id', messageId)
          .single();

        if (fetchError || !message) {
          console.error(`Message ${messageId} not found`);
          return { success: false, messageId };
        }

        // Ajouter le profile_id à l'array deleted_by_users
        const deletedByUsers = message.deleted_by_users || [];
        if (!deletedByUsers.includes(profile.id)) {
          deletedByUsers.push(profile.id);
        }

        // Mettre à jour le message
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            deleted_by_users: deletedByUsers,
            deleted_at: new Date().toISOString(),
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
        deleted: successCount,
        failed: failedCount,
        results: updates,
      },
    });
  } catch (error: any) {
    console.error('Error in delete messages API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}