import { compressImage } from './imageCompression';
import { compressVideo } from './videoCompression';
import { compressAudio } from './audioCompression';

export interface DeliveryHelperCallbacks {
  onProgress: (progress: number) => void;
  onStatusChange: (status: string) => void;
}

export async function prepareFileForUpload(
  file: File,
  fileType: 'image' | 'video' | 'audio' | 'document',
  callbacks: DeliveryHelperCallbacks
): Promise<File> {
  const { onProgress, onStatusChange } = callbacks;

  const originalSizeMB = file.size / (1024 * 1024);

  // Compression selon le type de fichier
  if (fileType === 'image') {
    onStatusChange('Compression de l\'image...');
    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        onProgress: (p) => onProgress(10 + (p * 0.3)), // 10-40%
      });
      onProgress(40);
      return compressed;
    } catch (err) {
      console.warn('Compression image échouée, utilisation du fichier original', err);
      onProgress(40);
      return file;
    }
  }

  if (fileType === 'video') {
    onStatusChange('Compression de la vidéo...');

    // Si la vidéo est déjà petite, pas besoin de compresser
    if (originalSizeMB < 10) {
      onProgress(40);
      return file;
    }

    try {
      const compressed = await compressVideo(file, {
        quality: 28,
        maxSize: 100,
        maxDuration: 180, // 3 minutes max
        onProgress: (p) => onProgress(10 + (p * 0.5)), // 10-60%
      });
      onProgress(60);
      return compressed;
    } catch (err) {
      console.warn('Compression vidéo échouée, utilisation du fichier original', err);
      onProgress(60);
      return file;
    }
  }

  if (fileType === 'audio') {
    onStatusChange('Compression de l\'audio...');

    // Si l'audio est déjà petit, pas besoin de compresser
    if (originalSizeMB < 5) {
      onProgress(40);
      return file;
    }

    try {
      const compressed = await compressAudio(file, {
        bitrate: '128k',
        maxSize: 10,
        maxDuration: 300, // 5 minutes max
        onProgress: (p) => onProgress(10 + (p * 0.3)), // 10-40%
      });
      onProgress(40);
      return compressed;
    } catch (err) {
      console.warn('Compression audio échouée, utilisation du fichier original', err);
      onProgress(40);
      return file;
    }
  }

  // Document: pas de compression
  onProgress(40);
  return file;
}

export async function uploadFile(
  file: File,
  fileType: string,
  callbacks: DeliveryHelperCallbacks
): Promise<string> {
  const { onProgress, onStatusChange } = callbacks;

  onStatusChange('Envoi du fichier...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', fileType);

  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  // Simuler la progression de l'upload (60-90%)
  onProgress(70);

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(uploadData.error || 'Erreur lors de l\'upload');
  }

  if (!uploadData.success) {
    throw new Error(uploadData.error || 'Échec de l\'upload');
  }

  onProgress(90);
  return uploadData.url;
}
