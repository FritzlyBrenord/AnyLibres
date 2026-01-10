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
      <div className="space-y-8 lg:space-y-10 px-4 sm:px-6 lg:px-8 max-w-7xl mb-20 mx-auto">
        {/* En-tête de la galerie */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Galerie {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les visuels, vidéos et documents relatifs à ce service
          </p>
        </div>

        {/* Grille responsive des médias */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {mediaItems.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white"
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Image className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm lg:text-base">
                              {item.name}
                            </p>
                            <p className="text-xs text-white/80">
                              Cliquez pour agrandir
                            </p>
                          </div>
                        </div>
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                          <Maximize2 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
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
                        className="p-4 lg:p-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:from-purple-500 hover:to-purple-600 border-4 border-white/20"
                      >
                        {playingVideos.has(item.url) ? (
                          <Pause className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                        ) : (
                          <Play className="w-6 h-6 lg:w-8 lg:h-8 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Info en bas */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="p-1.5 lg:p-2 bg-purple-600/40 backdrop-blur-md rounded-xl">
                            <Video className="w-3 h-3 lg:w-4 lg:h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm lg:text-base">
                              {item.name}
                            </p>
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
                          <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO - Carte compacte */}
              {item.type === "audio" && (
                <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 lg:p-8 aspect-video flex items-center justify-center">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-white/10 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 w-full max-w-sm">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 lg:p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-3 lg:mb-4 shadow-xl">
                        <Headphones className="w-8 h-8 lg:w-12 lg:h-12 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-white/90 text-xs lg:text-sm flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                          {item.extension}
                        </span>
                        Fichier audio
                      </p>

                      <audio
                        src={item.url}
                        controls
                        className="w-full mb-4 rounded-xl"
                      />

                      <a
                        href={item.url}
                        download
                        className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm lg:text-base"
                      >
                        <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                        Télécharger
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS - Carte compacte */}
              {item.type === "document" && (
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 lg:p-8 aspect-video flex items-center justify-center">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-white/10 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 w-full max-w-sm">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 lg:p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-3 lg:mb-4 shadow-xl">
                        <FileText className="w-8 h-8 lg:w-12 lg:h-12 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-white/90 text-xs lg:text-sm flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                          {item.extension}
                        </span>
                        Document
                      </p>

                      <div className="flex gap-2 lg:gap-3 justify-center flex-wrap">
                        <a
                          href={item.url}
                          download
                          className="flex items-center gap-1 lg:gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
                        >
                          <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                          Télécharger
                        </a>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
                        >
                          <Maximize2 className="w-4 h-4 lg:w-5 lg:h-5" />
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
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8"
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
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-10 group"
          >
            <X className="w-5 h-5 lg:w-6 lg:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div
            className="relative w-full max-w-6xl max-h-[85vh] lg:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "zoomIn 0.4s ease-out" }}
          >
            <img
              src={lightboxMedia}
              alt="Vue agrandie"
              className="w-full h-full max-w-full max-h-[85vh] lg:max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-3">
              <a
                href={lightboxMedia}
                download
                className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white/95 backdrop-blur-md text-gray-900 rounded-full font-semibold hover:bg-white transition-all shadow-xl text-sm lg:text-base"
              >
                <Download className="w-4 h-4 lg:w-5 lg:h-5" />
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
