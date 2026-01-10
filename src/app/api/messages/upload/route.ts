// app/api/messages/upload/route.ts
// API pour uploader des fichiers (images, vidéos, audio, documents)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET_MAP: Record<string, string> = {
  image: 'message-images',
  video: 'message-videos',
  audio: 'message-audio',
  document: 'message-documents',
};

export async function POST(request: NextRequest) {
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

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parser le FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string; // 'image', 'video', 'audio', 'document'
    const conversationId = formData.get('conversation_id') as string;
    const messageId = formData.get('message_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fileType || !BUCKET_MAP[fileType]) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be: image, video, audio, or document' },
        { status: 400 }
      );
    }

    // Obtenir le bucket approprié
    const bucket = BUCKET_MAP[fileType];

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${conversationId}/${messageId}/${timestamp}-${randomString}.${extension}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique (signée pour 1 heure)
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: fileName,
        bucket: bucket,
        type: fileType,
        name: file.name,
        size: file.size,
        mime_type: file.type,
      },
    });
  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}