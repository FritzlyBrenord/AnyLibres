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

  // Filter only service images (exclude videos/docs/audio)
  const filtered = (images || []).filter(
    (img) =>
      img.includes("service-images") &&
      !img.includes("service-videos") &&
      !img.includes("service-documents") &&
      !img.includes("service-audio")
  );

  // Build display array preferring coverImage first (if provided)
  const displayImages = coverImage
    ? [coverImage, ...filtered.filter((img) => img !== coverImage)]
    : filtered;

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Aucune image disponible</p>
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
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={displayImages[selectedImage]}
          alt={`${title} - Image ${selectedImage + 1}`}
          fill
          className="object-cover"
          priority
        />
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
                src={image}
                alt={`${title} - Miniature ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
