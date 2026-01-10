// components/messaging/MessageInput.tsx
// Zone de saisie de message avec upload de fichiers, compression et prévisualisation
"use client";

import { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { compressImage } from "@/utils/lib/imageCompression";
import { compressVideo } from "@/utils/lib/videoCompression";
import { compressAudio } from "@/utils/lib/audioCompression";

interface FileWithPreview extends File {
  preview?: string;
  compressed?: boolean;
  originalSize?: number;
  compressing?: boolean;
  compressionError?: string;
  cancelled?: boolean;
}

interface MessageInputProps {
  onSendMessage: (
    text: string,
    attachments?: FileWithPreview[]
  ) => Promise<void>;
  sending?: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  sending = false,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<
    Record<string, number>
  >({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const compressionAbortControllers = useRef<Map<string, AbortController>>(new Map());

  // Emojis populaires
  const popularEmojis = ["👍", "❤️", "😊", "😂", "🎉", "🔥", "👏", "🙏"];

  // Envoyer le message
  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || sending || disabled) {
      return;
    }

    // Vérifier si des fichiers sont en cours de compression
    const isCompressing = attachments.some((file) => file.compressing);
    if (isCompressing) {
      setError("Veuillez attendre la fin de la compression ou annuler les fichiers en cours");
      return;
    }

    // Filtrer les fichiers annulés ou en erreur
    const validAttachments = attachments.filter(
      (file) => !file.cancelled && !file.compressionError
    );

    try {
      setError(null);
      await onSendMessage(text, validAttachments);
      setText("");
      setAttachments([]);
      setCompressionProgress({});
      setShowFileMenu(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi du message";
      setError(errorMessage);
    }
  };

  // Annuler la compression d'un fichier
  const cancelCompression = (index: number, fileName: string) => {
    const fileId = `${fileName}-${index}`;
    const controller = compressionAbortControllers.current.get(fileId);

    if (controller) {
      controller.abort();
      compressionAbortControllers.current.delete(fileId);
    }

    // Marquer le fichier comme annulé
    setAttachments((prev) => {
      const newAttachments = [...prev];
      if (newAttachments[index]) {
        newAttachments[index] = Object.assign(newAttachments[index], {
          compressing: false,
          cancelled: true,
        });
      }
      return newAttachments;
    });

    // Nettoyer le progrès
    setCompressionProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Compresser un fichier
  const compressFile = async (
    file: File,
    index: number
  ): Promise<FileWithPreview> => {
    const fileType = file.type;
    const originalSize = file.size;
    const fileId = `${file.name}-${index}`;

    // Créer un AbortController pour ce fichier
    const abortController = new AbortController();
    compressionAbortControllers.current.set(fileId, abortController);

    try {
      let compressedFile: File = file;

      // Vérifier si la compression a été annulée
      if (abortController.signal.aborted) {
        throw new Error("Compression annulée");
      }

      if (fileType.startsWith("image/")) {
        compressedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          onProgress: (progress) => {
            if (!abortController.signal.aborted) {
              setCompressionProgress((prev) => ({ ...prev, [fileId]: progress }));
            }
          },
        });
      } else if (fileType.startsWith("video/")) {
        compressedFile = await compressVideo(file, {
          quality: 28,
          maxDuration: 75,
          maxSize: 50,
          onProgress: (progress) => {
            if (!abortController.signal.aborted) {
              setCompressionProgress((prev) => ({ ...prev, [fileId]: progress }));
            }
          },
        });
      } else if (fileType.startsWith("audio/")) {
        compressedFile = await compressAudio(file, {
          bitrate: "128k",
          maxDuration: 300,
          maxSize: 10,
          onProgress: (progress) => {
            if (!abortController.signal.aborted) {
              setCompressionProgress((prev) => ({ ...prev, [fileId]: progress }));
            }
          },
        });
      }

      // Vérifier à nouveau si annulé
      if (abortController.signal.aborted) {
        throw new Error("Compression annulée");
      }

      // Créer une prévisualisation pour les images et vidéos
      let preview: string | undefined;
      if (fileType.startsWith("image/")) {
        preview = URL.createObjectURL(compressedFile);
      } else if (fileType.startsWith("video/")) {
        preview = URL.createObjectURL(compressedFile);
      }

      const fileWithPreview: FileWithPreview = Object.assign(compressedFile, {
        preview,
        compressed: compressedFile !== file,
        originalSize,
        compressing: false,
        compressionError: undefined,
        cancelled: false,
      });

      // Nettoyer
      compressionAbortControllers.current.delete(fileId);
      setCompressionProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });

      return fileWithPreview;
    } catch (error) {
      console.error("Erreur compression:", error);

      // Nettoyer
      compressionAbortControllers.current.delete(fileId);
      setCompressionProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });

      // Retourner le fichier avec l'erreur
      const errorMessage = error instanceof Error ? error.message : "Erreur de compression";
      return Object.assign(file, {
        compressed: false,
        originalSize,
        compressing: false,
        compressionError: errorMessage,
        cancelled: errorMessage.includes("annulée"),
      });
    }
  };

  // Gérer l'upload de fichiers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setShowFileMenu(false);
    setError(null);

    if (files.length === 0) return;

    // Marquer les fichiers comme "en compression"
    const filesWithStatus: FileWithPreview[] = files.map((file) =>
      Object.assign(file, { compressing: true })
    );
    setAttachments((prev) => [...prev, ...filesWithStatus]);

    // Compresser les fichiers en parallèle avec leur index
    const startIndex = attachments.length;
    const compressedFiles = await Promise.all(
      files.map((file, i) => compressFile(file, startIndex + i))
    );

    // Remplacer les fichiers en compression par les fichiers compressés
    setAttachments((prev) => {
      const newAttachments = [...prev];
      files.forEach((originalFile, i) => {
        const indexInAttachments = newAttachments.findIndex(
          (f) => f.name === originalFile.name && f.compressing
        );
        if (indexInAttachments !== -1) {
          newAttachments[indexInAttachments] = compressedFiles[i];
        }
      });
      return newAttachments;
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Supprimer une pièce jointe
  const removeAttachment = (index: number) => {
    const file = attachments[index];

    // Si en compression, annuler d'abord
    if (file.compressing) {
      cancelCompression(index, file.name);
    }

    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }

    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Insérer un emoji
  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Obtenir l'icône du fichier
  const getFileIcon = (file: File) => {
    const type = file.type;

    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith("video/")) return <Video className="w-5 h-5" />;
    if (type.startsWith("audio/")) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {/* Error Message */}
      {error && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => {
            const fileId = `${file.name}-${index}`;
            const progress = compressionProgress[fileId];

            return (
              <div
                key={index}
                className={`relative flex items-center gap-2 rounded-lg p-2 ${
                  file.compressionError
                    ? "bg-red-50 border border-red-200"
                    : file.cancelled
                    ? "bg-gray-50 border border-gray-200 opacity-50"
                    : "bg-slate-100"
                }`}
              >
                {/* Prévisualisation pour images et vidéos */}
                {file.preview && file.type.startsWith("image/") && !file.cancelled && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                {file.preview && file.type.startsWith("video/") && !file.cancelled && (
                  <video
                    src={file.preview}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}

                {/* Icône pour audio et documents */}
                {(!file.preview || file.cancelled) && (
                  <div className="w-16 h-16 flex items-center justify-center bg-slate-200 rounded-lg">
                    {getFileIcon(file)}
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-medium text-slate-900 truncate max-w-[150px] text-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                    {file.compressed && file.originalSize && (
                      <span className="text-green-600 ml-1">
                        (-
                        {Math.round(
                          ((file.originalSize - file.size) /
                            file.originalSize) *
                            100
                        )}
                        %)
                      </span>
                    )}
                  </p>

                  {/* Barre de progression */}
                  {file.compressing && (
                    <div className="mt-1">
                      <div className="w-full bg-slate-300 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Compression... {progress || 0}%
                      </p>
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {file.compressionError && (
                    <p className="text-xs text-red-600 mt-1">
                      {file.compressionError}
                    </p>
                  )}

                  {/* Message annulé */}
                  {file.cancelled && (
                    <p className="text-xs text-gray-600 mt-1">Annulé</p>
                  )}
                </div>

                {/* Bouton d'action */}
                {file.compressing ? (
                  <button
                    onClick={() => cancelCompression(index, file.name)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                    title="Annuler la compression"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Emojis */}
      <div className="mb-2 flex items-center gap-1">
        {popularEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => insertEmoji(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors text-lg"
            disabled={disabled || sending}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Upload Button */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            disabled={disabled || sending}
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* File Menu */}
          {showFileMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[200px] z-10">
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("accept", "image/*");
                    fileInputRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Image</span>
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("accept", "video/*");
                    fileInputRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <Video className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Vidéo</span>
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("accept", "audio/*");
                    fileInputRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <Music className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Audio</span>
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute(
                      "accept",
                      ".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    );
                    fileInputRef.current.click();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Document</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Tapez votre message..."
          disabled={disabled || sending}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            (!text.trim() && attachments.length === 0) || sending || disabled
          }
          className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-slate-500 mt-2">
        Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
      </p>
    </div>
  );
}