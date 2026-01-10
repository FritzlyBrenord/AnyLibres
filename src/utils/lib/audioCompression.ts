import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

// Charger FFmpeg une seule fois (réutiliser l'instance de videoCompression)
export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export interface AudioCompressionOptions {
  bitrate?: string; // '128k', '64k', etc.
  maxDuration?: number; // en secondes
  maxSize?: number; // en MB
  onProgress?: (progress: number) => void;
}

export const compressAudio = async (
  file: File,
  options: AudioCompressionOptions = {}
): Promise<File> => {
  const {
    bitrate = '128k',
    maxDuration = 300, // 5 minutes max
    maxSize = 10,
    onProgress,
  } = options;

  try {
    const ffmpeg = await loadFFmpeg();

    // Déterminer l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const outputFormat = fileExtension === 'wav' ? 'mp3' : fileExtension;

    // Nettoyer les fichiers précédents
    try {
      await ffmpeg.deleteFile(`input.${fileExtension}`);
      await ffmpeg.deleteFile(`output.${outputFormat}`);
    } catch (e) {
      // Ignorer si les fichiers n'existent pas
    }

    // Écrire le fichier d'entrée
    await ffmpeg.writeFile(`input.${fileExtension}`, await fetchFile(file));

    // Configurer le callback de progression
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        onProgress(Math.round(progress * 100));
      }
    });

    // Commande FFmpeg pour compression audio
    await ffmpeg.exec([
      '-i', `input.${fileExtension}`,
      '-codec:a', 'libmp3lame',
      '-b:a', bitrate,
      '-ar', '44100', // Sample rate 44.1kHz
      '-ac', '2', // Stereo
      '-t', maxDuration.toString(),
      `output.${outputFormat}`
    ]);

    // Lire le fichier compressé
    const data = await ffmpeg.readFile(`output.${outputFormat}`);

    let compressedBlob: Blob;

    // Vérifier le type de données retourné et convertir en ArrayBuffer standard
    if (typeof data === 'string') {
      compressedBlob = new Blob([new TextEncoder().encode(data)], { type: `audio/${outputFormat}` });
    } else {
      const standardArrayBuffer = new ArrayBuffer(data.length);
      const standardUint8Array = new Uint8Array(standardArrayBuffer);
      standardUint8Array.set(data);
      compressedBlob = new Blob([standardArrayBuffer], { type: `audio/${outputFormat}` });
    }

    // Vérifier la taille finale
    const compressedSizeMB = compressedBlob.size / (1024 * 1024);
    if (compressedSizeMB > maxSize) {
      throw new Error(
        `L'audio compressé (${compressedSizeMB.toFixed(2)}MB) dépasse la limite de ${maxSize}MB`
      );
    }

    // Créer un nouveau File object
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '') + `_compressed.${outputFormat}`,
      { type: `audio/${outputFormat}` }
    );

    // Calculer le taux de compression
    const originalSizeMB = file.size / (1024 * 1024);
    const compressionRate = ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(0);

    console.log(`🎵 Audio compressé: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${compressionRate}% de réduction)`);

    return compressedFile;
  } catch (error) {
    console.error('Erreur lors de la compression audio:', error);
    throw error;
  }
};

// Fonction pour obtenir les métadonnées de l'audio
export const getAudioMetadata = async (file: File): Promise<{
  duration: number;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve({
        duration: audio.duration,
        size: file.size,
      });
    };

    audio.onerror = () => {
      reject(new Error('Impossible de lire les métadonnées de l\'audio'));
    };

    audio.src = URL.createObjectURL(file);
  });
};