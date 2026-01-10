// components/messaging/MessageList.tsx
// Liste des messages avec support des pièces jointes
"use client";

import {
  User,
  Check,
  CheckCheck,
  Image,
  Video,
  FileText,
  Music,
  Download,
} from "lucide-react";
import type { Message } from "@/types/messaging";
import { MessageContextMenu } from "./MessageContextMenu";

interface MessageListProps {
  messages: Message[];
  profileId?: string | null;
  loading?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  onDeleteMessage?: (messageId: string) => void;
  onArchiveMessage?: (messageId: string) => void;
  onReplyMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  profileId,
  loading = false,
  messagesEndRef,
  onDeleteMessage,
  onArchiveMessage,
  onReplyMessage,
}: MessageListProps) {
  // Formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Rendre une pièce jointe
  const renderAttachment = (attachment: any) => {
    const { type, url, name, thumbnail_url } = attachment;

    switch (type) {
      case "image":
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={url}
              alt={name}
              className="max-w-xs rounded-lg hover:opacity-90 transition-opacity"
            />
          </a>
        );

      case "video":
        return (
          <video
            src={url}
            controls
            poster={thumbnail_url}
            className="max-w-xs rounded-lg"
          >
            Votre navigateur ne supporte pas la vidéo.
          </video>
        );

      case "audio":
        return (
          <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-3 max-w-xs">
            <Music className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <audio src={url} controls className="flex-1 min-w-0" />
          </div>
        );

      case "document":
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 rounded-lg p-3 max-w-xs transition-colors"
          >
            <FileText className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-900 truncate">
                {name}
              </p>
              <p className="text-xs text-slate-500">Document</p>
            </div>
            <Download className="w-5 h-5 text-slate-400 flex-shrink-0" />
          </a>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">
            Aucun message pour le moment
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Envoyez un message pour commencer la conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32 px-5  space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === profileId;
        const senderName =
          message.sender?.display_name ||
          `${message.sender?.first_name || ""} ${
            message.sender?.last_name || ""
          }`.trim() ||
          "Utilisateur";

        return (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${
              isOwn ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            {!isOwn && (
              <div className="flex-shrink-0">
                {message.sender?.avatar_url ? (
                  <img
                    src={message.sender.avatar_url}
                    alt={senderName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
            >
              {/* Sender Name (pour les messages des autres) */}
              {!isOwn && (
                <p className="text-xs text-slate-600 mb-1 px-1">{senderName}</p>
              )}

              {/* Message Content */}
              <div className="flex items-start gap-1 group">
                <div
                  className={`rounded-2xl p-3 flex-1 ${
                    isOwn
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index}>{renderAttachment(attachment)}</div>
                      ))}
                    </div>
                  )}

                  {/* Text */}
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  )}

                  {/* Time + Read Status */}
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isOwn ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </span>

                    {/* Read Status (pour les messages envoyés) */}
                    {isOwn && (
                      <>
                        {message.is_read ? (
                          <CheckCheck className="w-4 h-4 text-white/90" />
                        ) : message.is_delivered ? (
                          <CheckCheck className="w-4 h-4 text-white/70" />
                        ) : (
                          <Check className="w-4 h-4 text-white/70" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Edited indicator */}
                  {message.is_edited && (
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-white/60" : "text-slate-400"
                      }`}
                    >
                      modifié
                    </p>
                  )}
                </div>

                {/* Context Menu */}
                {(onDeleteMessage || onArchiveMessage || onReplyMessage) && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageContextMenu
                      messageId={message.id}
                      isOwn={isOwn}
                      messageText={message.text}
                      onDelete={
                        onDeleteMessage
                          ? onDeleteMessage
                          : () => console.log("Delete not implemented")
                      }
                      onArchive={
                        onArchiveMessage
                          ? onArchiveMessage
                          : () => console.log("Archive not implemented")
                      }
                      onReply={onReplyMessage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
