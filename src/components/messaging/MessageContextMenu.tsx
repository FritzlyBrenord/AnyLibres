// components/messaging/MessageContextMenu.tsx
// Menu contextuel pour les actions sur un message
"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Trash2,
  Archive,
  Reply,
  Copy,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface MessageContextMenuProps {
  messageId: string;
  isOwn: boolean;
  messageText?: string;
  onDelete: (messageId: string) => void;
  onArchive: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

export function MessageContextMenu({
  messageId,
  isOwn,
  messageText,
  onDelete,
  onArchive,
  onReply,
}: MessageContextMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useSafeLanguage();

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleCopy = () => {
    if (messageText) {
      navigator.clipboard.writeText(messageText);
      setShowMenu(false);
    }
  };

  const handleDelete = () => {
    onDelete(messageId);
    setShowMenu(false);
  };

  const handleArchive = () => {
    onArchive(messageId);
    setShowMenu(false);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(messageId);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1 rounded-lg transition-colors ${
          showMenu
            ? "bg-slate-200 text-slate-900"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <div
          className={`absolute top-full ${
            isOwn ? "right-0" : "left-0"
          } mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px] z-10`}
        >
          {onReply && (
            <button
              onClick={handleReply}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors text-left text-sm"
            >
              <Reply className="w-4 h-4 text-purple-600" />
              <span>{t('messages.reply')}</span>
            </button>
          )}

          {messageText && (
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors text-left text-sm"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              <span>{t('messages.copyText')}</span>
            </button>
          )}

          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors text-left text-sm"
          >
            <Archive className="w-4 h-4 text-blue-600" />
            <span>{t('messages.archive')}</span>
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors text-left text-sm text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('messages.delete')}</span>
          </button>
        </div>
      )}
    </div>
  );
}