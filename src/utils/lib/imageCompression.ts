import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    onProgress,
  } = options;

  try {
    console.log(`🖼️ Compression image - Type original: ${file.type}, Nom: ${file.name}`);
    
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      onProgress: (progress: number) => {
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
    };

    const compressedFile = await imageCompression(file, compressionOptions);
    console.log(`🖼️ Après compression - Type: ${compressedFile.type}, Nom: ${compressedFile.name}`);

    // Calculer le taux de compression
    const compressionRate = ((1 - compressedFile.size / file.size) * 100);
    console.log(`📸 Image compressée: ${compressionRate.toFixed(0)}% de réduction`);

    // Déterminer le type MIME correct
    let mimeType = file.type || 'image/jpeg';
    
    // Si le fichier compressé n'a pas de type MIME valide, utiliser le type original
    const validImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageMimes.includes(compressedFile.type)) {
      console.warn(`⚠️ Type MIME du fichier compressé invalide: "${compressedFile.type}", utilisation de: "${mimeType}"`);
    } else {
      mimeType = compressedFile.type;
    }

    // Recréer le File avec le bon type MIME
    const newFile = new File([compressedFile], file.name, { 
      type: mimeType,
      lastModified: Date.now()
    });
    
    console.log(`✅ File final créé - Type: ${newFile.type}, Nom: ${newFile.name}`);

    return newFile;
  } catch (error) {
    console.error('Erreur compression image:', error);
    throw error;
  }
};

export const getImageMetadata = async (file: File): Promise<{
  width: number;
  height: number;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
      });
    };
    img.onerror = () => {
      reject(new Error('Impossible de lire les métadonnées de l\'image'));
    };
    img.src = URL.createObjectURL(file);
  });
};