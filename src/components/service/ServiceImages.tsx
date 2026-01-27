// ============================================================================
// Component: ServiceImages - Galerie d'images du service
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ServiceImagesProps {
  images: string[];
  title: string;
  coverImage?: string;
}

export default function ServiceImages({
  images,
  title,
  coverImage,
}: ServiceImagesProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [allFailed, setAllFailed] = useState(false);

  // Filter only service images (exclude videos/docs/audio)
  const filtered = (images || []).filter(
    (img) =>
      img.includes("service-images") &&
      !img.includes("service-videos") &&
      !img.includes("service-documents") &&
      !img.includes("service-audio"),
  );

  // Build display array preferring coverImage first (if provided)
  const displayImages = coverImage
    ? [coverImage, ...filtered.filter((img) => img !== coverImage)]
    : filtered;

  // Image par défaut avec meilleure qualité
  const defaultCoverImage =
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop";

  // Fonction pour gérer les erreurs de chargement d'image
  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => new Set(prev).add(imageUrl));
    setAllFailed(true);
  };

  // Déterminer l'image à afficher (fallback si erreur)
  const getDisplayImage = (img: string) => {
    return imageErrors.has(img) ? defaultCoverImage : img;
  };

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
          <Image
            src={defaultCoverImage}
            alt={`${title} - Image par défaut`}
            fill
            className="object-cover opacity-80"
            priority
            onError={() => setAllFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col items-center justify-center">
            <div className="text-center text-white">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium">Aucune image disponible</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auto-rotate every 5 minutes
  useEffect(() => {
    if (displayImages.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % displayImages.length);
    }, 300000); // 300000ms = 5 minutes
    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
        <Image
          src={getDisplayImage(displayImages[selectedImage])}
          alt={`${title} - Image ${selectedImage + 1}`}
          fill
          className="object-cover"
          priority
          onError={() => handleImageError(displayImages[selectedImage])}
        />
        {allFailed && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center">
            <div className="text-center text-white">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs opacity-75">Image indisponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Miniatures */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image
                src={getDisplayImage(image)}
                alt={`${title} - Miniature ${index + 1}`}
                fill
                className="object-cover"
                onError={() => handleImageError(image)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
