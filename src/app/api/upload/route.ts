// ============================================================================
// API Route: /api/upload
// POST - Upload media files (images, videos, audio, documents) to Supabase Storage
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    // Get provider
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!provider) {
      return NextResponse.json({ error: 'Provider introuvable' }, { status: 404 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' | 'video' | 'audio' | 'document'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Type de fichier non spécifié' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/x-matroska', 'video/mkv'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed']
    };

    if (!allowedTypes[type as keyof typeof allowedTypes]?.includes(file.type)) {
      console.error('Type de fichier refusé:', file.type, 'pour le type:', type);
      return NextResponse.json({ error: `Type de fichier non autorisé: ${file.type}` }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `${provider.id}/${timestamp}-${randomString}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine the bucket name based on type
    const bucketMap = {
      image: 'service-images',
      video: 'service-videos',
      audio: 'service-audio',
      document: 'service-documents'
    };
    const bucketName = bucketMap[type as keyof typeof bucketMap];

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filename,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error in POST /api/upload:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Remove a file from storage
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { path, bucket } = await req.json();

    if (!path || !bucket) {
      return NextResponse.json({ error: 'Chemin du fichier et bucket non fournis' }, { status: 400 });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      console.error('Error deleting file:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Fichier supprimé' });
  } catch (error) {
    console.error('Error in DELETE /api/upload:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
