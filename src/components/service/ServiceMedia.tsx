"use client";

import { useState, useRef } from "react";
import {
  Play,
  Pause,
  FileText,
  Video,
  Headphones,
  Image as ImageIcon,
  X,
  Maximize2,
} from "lucide-react";

interface ServiceGalleryProps {
  images: string[];
  title: string;
}

type MediaItem = {
  url: string;
  type: "image" | "video" | "document" | "audio";
  name: string;
  extension: string;
};

export default function ServiceGallery({ images, title }: ServiceGalleryProps) {
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const getAllMedia = (): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    images.forEach((url) => {
      if (
        url.includes("service-images") &&
        !url.includes("service-videos") &&
        !url.includes("service-documents") &&
        !url.includes("service-audio")
      ) {
        mediaItems.push({
          url,
          type: "image",
          name: `Image ${
            mediaItems.filter((item) => item.type === "image").length + 1
          }`,
          extension: "IMAGE",
        });
      } else if (url.includes("service-videos")) {
        mediaItems.push({
          url,
          type: "video",
          name: `Vidéo ${
            mediaItems.filter((item) => item.type === "video").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "MP4",
        });
      } else if (url.includes("service-documents")) {
        mediaItems.push({
          url,
          type: "document",
          name: `Document ${
            mediaItems.filter((item) => item.type === "document").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "PDF",
        });
      } else if (url.includes("service-audio")) {
        mediaItems.push({
          url,
          type: "audio",
          name: `Audio ${
            mediaItems.filter((item) => item.type === "audio").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "MP3",
        });
      }
    });

    return mediaItems;
  };

  const mediaItems = getAllMedia();

  const toggleVideo = (url: string) => {
    const video = videoRefs.current[url];
    if (!video) return;

    if (playingVideos.has(url)) {
      video.pause();
      setPlayingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    } else {
      video.play();
      setPlayingVideos((prev) => new Set(prev).add(url));
    }
  };

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-8 lg:space-y-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        {/* En-tête élégante */}
        <div className="text-center mb-10 lg:mb-16">
          <div className="relative inline-block">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Galerie {title}
            </h2>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-8">
            Parcourez les médias associés à ce service
          </p>
        </div>

        {/* Grille empilée avec animations fluides */}
        <div className="relative">
          {/* Ligne décorative d'accent */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-y-1/2 hidden xl:block"></div>

          {/* Conteneur principal avec effet d'empilement */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {mediaItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                style={{
                  transform: `translateY(${index * 8}px)`,
                  transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `slideUp 0.8s ease-out ${index * 0.1}s both`,
                }}
                onMouseEnter={() => setHoveredMedia(item.url)}
                onMouseLeave={() => setHoveredMedia(null)}
              >
                {/* Effet de soulèvement au hover */}
                <div
                  className={`
                  absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900/5 to-gray-900/10
                  transform transition-all duration-500 ease-out
                  ${hoveredMedia === item.url ? "scale-105 opacity-100" : "scale-100 opacity-0"}
                `}
                ></div>

                {/* Carte principale */}
                <div
                  className={`
                  relative rounded-2xl overflow-hidden shadow-xl
                  transition-all duration-500 ease-out
                  ${
                    hoveredMedia === item.url
                      ? "shadow-2xl transform -translate-y-4"
                      : "shadow-lg"
                  }
                  backdrop-blur-sm bg-white
                `}
                >
                  {/* IMAGES */}
                  {item.type === "image" && (
                    <div
                      className="relative cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 aspect-[4/3]"
                      onClick={() => {
                        setLightboxMedia(item.url);
                        setLightboxType(item.type);
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-all duration-700"
                        style={{
                          transform:
                            hoveredMedia === item.url
                              ? "scale(1.05)"
                              : "scale(1)",
                        }}
                      />

                      {/* Overlay au hover */}
                      <div
                        className={`
                        absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                        flex flex-col justify-end p-6
                        transition-all duration-500
                        ${hoveredMedia === item.url ? "opacity-100" : "opacity-0"}
                      `}
                      >
                        <div
                          className="transform transition-transform duration-500 delay-100"
                          style={{
                            transform:
                              hoveredMedia === item.url
                                ? "translateY(0)"
                                : "translateY(20px)",
                          }}
                        >
                          <div className="flex items-center gap-3 text-white mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                {item.name}
                              </p>
                              <p className="text-sm text-white/80">
                                Cliquez pour agrandir
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Badge type */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 text-sm font-medium">
                        Image
                      </div>
                    </div>
                  )}

                  {/* VIDÉOS */}
                  {item.type === "video" && (
                    <div className="relative bg-black aspect-[4/3]">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[item.url] = el;
                        }}
                        src={item.url}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        onClick={() => toggleVideo(item.url)}
                      />

                      {/* Overlay de contrôle */}
                      <div
                        className={`
                        absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent
                        transition-all duration-500
                        ${hoveredMedia === item.url ? "opacity-100" : "opacity-0"}
                      `}
                      >
                        {/* Bouton play/pause */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={() => toggleVideo(item.url)}
                            className={`
                              p-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full
                              transition-all duration-300 transform
                              ${
                                hoveredMedia === item.url
                                  ? "scale-110 opacity-100"
                                  : "scale-100 opacity-90"
                              }
                              border-4 border-white/20 backdrop-blur-sm
                            `}
                          >
                            {playingVideos.has(item.url) ? (
                              <Pause className="w-6 h-6 text-white" />
                            ) : (
                              <Play className="w-6 h-6 text-white ml-1" />
                            )}
                          </button>
                        </div>

                        {/* Info en bas */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div
                            className="transform transition-all duration-500 delay-150"
                            style={{
                              transform:
                                hoveredMedia === item.url
                                  ? "translateY(0)"
                                  : "translateY(20px)",
                              opacity: hoveredMedia === item.url ? 1 : 0,
                            }}
                          >
                            <div className="flex items-center justify-between text-white">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-600/40 rounded-lg backdrop-blur-sm">
                                  <Video className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold">{item.name}</p>
                                  <p className="text-sm text-white/80">
                                    {item.extension}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badge type */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-purple-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        Vidéo
                      </div>
                    </div>
                  )}

                  {/* AUDIO */}
                  {item.type === "audio" && (
                    <div className="relative bg-gradient-to-br from-emerald-600 to-teal-500 aspect-[4/3] p-8 flex items-center justify-center">
                      {/* Effet de vague animé */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full animate-pulse"></div>
                      </div>

                      <div className="relative z-10 w-full max-w-xs">
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`
                            p-4 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm
                            transition-all duration-500 transform
                            ${hoveredMedia === item.url ? "scale-110 rotate-12" : "scale-100 rotate-0"}
                          `}
                          >
                            <Headphones className="w-12 h-12 text-white" />
                          </div>

                          <h3 className="text-xl font-bold text-white mb-2">
                            {item.name}
                          </h3>
                          <p className="text-white/90 text-sm mb-6">
                            Fichier audio • {item.extension}
                          </p>

                          {/* Contrôle audio stylisé */}
                          <div
                            className={`
                            w-full bg-white/20 rounded-xl p-4 backdrop-blur-sm
                            transition-all duration-500
                            ${hoveredMedia === item.url ? "opacity-100 scale-105" : "opacity-90 scale-100"}
                          `}
                          >
                            <audio src={item.url} controls className="w-full" />
                          </div>
                        </div>
                      </div>

                      {/* Badge type */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        Audio
                      </div>
                    </div>
                  )}

                  {/* DOCUMENTS */}
                  {item.type === "document" && (
                    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 aspect-[4/3] p-8 flex items-center justify-center">
                      {/* Effet de particules */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                      </div>

                      <div className="relative z-10 w-full max-w-xs">
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`
                            p-4 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm
                            transition-all duration-500 transform
                            ${hoveredMedia === item.url ? "scale-110 -rotate-12" : "scale-100 rotate-0"}
                          `}
                          >
                            <FileText className="w-12 h-12 text-white" />
                          </div>

                          <h3 className="text-xl font-bold text-white mb-2">
                            {item.name}
                          </h3>
                          <p className="text-white/90 text-sm mb-6">
                            Document • {item.extension}
                          </p>

                          {/* Bouton pour visualiser */}
                          <button
                            onClick={() => window.open(item.url, "_blank")}
                            className={`
                              flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold
                              transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                              ${hoveredMedia === item.url ? "scale-105" : "scale-100"}
                            `}
                          >
                            <Maximize2 className="w-5 h-5" />
                            Visualiser
                          </button>
                        </div>
                      </div>

                      {/* Badge type */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        Document
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIGHTBOX Premium pour images */}
      {lightboxMedia && lightboxType === "image" && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            setLightboxMedia(null);
            setLightboxType(null);
          }}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <button
            onClick={() => {
              setLightboxMedia(null);
              setLightboxType(null);
            }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all z-10 group"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div
            className="relative w-full max-w-6xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "zoomIn 0.4s ease-out" }}
          >
            <img
              src={lightboxMedia}
              alt="Vue agrandie"
              className="w-full h-full max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(var(--translate-y, 0)) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Effet de parallaxe pour les cartes */
        .relative:nth-child(odd) {
          --translate-y: 0px;
        }

        .relative:nth-child(even) {
          --translate-y: 16px;
        }

        @media (min-width: 1280px) {
          .relative:nth-child(3n + 1) {
            --translate-y: 0px;
          }

          .relative:nth-child(3n + 2) {
            --translate-y: 24px;
          }

          .relative:nth-child(3n + 3) {
            --translate-y: 8px;
          }
        }
      `}</style>
    </>
  );
}
