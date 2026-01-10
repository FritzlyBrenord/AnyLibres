// components/orders/DeliveryGallery.tsx
"use client";

import { useState, useRef } from "react";
import {
  Play,
  Pause,
  Download,
  FileText,
  Video,
  Headphones,
  Image,
  X,
  Maximize2,
  MessageSquare,
  User,
} from "lucide-react";

interface DeliveryGalleryProps {
  images: string[];
  title: string;
}

type MediaItem = {
  url: string;
  type: "image" | "video" | "document" | "audio";
  name: string;
  extension: string;
};

export default function DeliveryGallery({
  images,
  title,
}: DeliveryGalleryProps) {
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const getAllMedia = (): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    images.forEach((url) => {
      if (!url) return;

      // Déterminer le type basé sur l'URL ou l'extension
      const urlLower = url.toLowerCase();
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) {
        mediaItems.push({
          url,
          type: "image",
          name: `Image ${
            mediaItems.filter((item) => item.type === "image").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "IMAGE",
        });
      } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/)) {
        mediaItems.push({
          url,
          type: "video",
          name: `Vidéo ${
            mediaItems.filter((item) => item.type === "video").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "VIDEO",
        });
      } else if (urlLower.match(/\.(mp3|wav|ogg|flac|aac)$/)) {
        mediaItems.push({
          url,
          type: "audio",
          name: `Audio ${
            mediaItems.filter((item) => item.type === "audio").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "AUDIO",
        });
      } else {
        // Par défaut, considérer comme document
        mediaItems.push({
          url,
          type: "document",
          name: `Document ${
            mediaItems.filter((item) => item.type === "document").length + 1
          }`,
          extension: url.split(".").pop()?.toUpperCase() || "DOC",
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
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500">Aucun fichier à afficher</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Grille responsive des médias */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mediaItems.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border border-slate-200/60"
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* IMAGES - Carte avec taille optimisée */}
              {item.type === "image" && (
                <div
                  className="relative cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 aspect-video flex items-center justify-center"
                  onClick={() => {
                    setLightboxMedia(item.url);
                    setLightboxType(item.type);
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Image className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-white/80">
                              Cliquez pour agrandir
                            </p>
                          </div>
                        </div>
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIDÉOS - Player compact et responsive */}
              {item.type === "video" && (
                <div className="relative bg-black aspect-video">
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
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Badge type */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-purple-600/90 backdrop-blur-md rounded-full text-white text-xs font-bold border border-purple-400/30">
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        VIDÉO
                      </div>
                    </div>

                    {/* Bouton play/pause central */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                      <button
                        onClick={() => toggleVideo(item.url)}
                        className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:from-purple-500 hover:to-purple-600 border-4 border-white/20"
                      >
                        {playingVideos.has(item.url) ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Info en bas */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-600/40 backdrop-blur-md rounded-xl">
                            <Video className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-white/80">
                              {item.extension}
                            </p>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-xl transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO - Carte compacte */}
              {item.type === "audio" && (
                <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 aspect-video flex items-center justify-center">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 w-full max-w-xs">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-xl">
                        <Headphones className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-white/90 text-xs flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                          {item.extension}
                        </span>
                        Fichier audio
                      </p>

                      <audio
                        src={item.url}
                        controls
                        className="w-full mb-3 rounded-xl"
                      />

                      <a
                        href={item.url}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS - Carte compacte */}
              {item.type === "document" && (
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 aspect-video flex items-center justify-center">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 w-full max-w-xs">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-xl">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-white/90 text-xs flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                          {item.extension}
                        </span>
                        Document
                      </p>

                      <div className="flex gap-2 justify-center flex-wrap">
                        <a
                          href={item.url}
                          download
                          className="flex items-center gap-1 px-4 py-2 bg-white text-blue-600 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </a>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
                        >
                          <Maximize2 className="w-4 h-4" />
                          Ouvrir
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX Premium pour images */}
      {lightboxMedia && lightboxType === "image" && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-10 group"
          >
            <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div
            className="relative w-full max-w-4xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "zoomIn 0.4s ease-out" }}
          >
            <img
              src={lightboxMedia}
              alt="Vue agrandie"
              className="w-full h-full max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <a
                href={lightboxMedia}
                download
                className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md text-gray-900 rounded-full font-semibold hover:bg-white transition-all shadow-xl text-sm"
              >
                <Download className="w-4 h-4" />
                Télécharger l'image
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
      `}</style>
    </>
  );
}
