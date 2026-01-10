// ============================================================================
// Component: MessagesMenu - Menu des messages
// ============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { Conversation } from "@/types/messaging";

export function MessagesMenu() {
  const { user } = useAuth();
  const { conversations, loading, profileId } = useConversations();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculer le nombre de messages non lus
  // Si le menu a été ouvert, on considère (pour l'affichage) qu'il n'y a plus de nouveaux messages
  // jusqu'à ce que de nouveaux arrivent (ce qui rechargera le hook)
  // NOTE: Simple UX trick asked by user "reinitialise a 0 pa besoin affiche si c'est 0"
  const unreadCount =
    !hasOpened && profileId
      ? conversations.reduce((acc, conv) => {
          return acc + (conv.unread_count?.[profileId] || 0);
        }, 0)
      : 0;

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasOpened(true);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString("fr-FR");
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  // Afficher seulement les 5 conversations les plus récentes
  const recentConversations = conversations.slice(0, 5);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Messages Button */}
      <button
        onClick={handleMenuClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Messages"
      >
        <MessageSquare className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              Nouveau message
            </Link>
          </div>

          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Aucun message pour le moment</p>
                <p className="text-xs text-gray-400 mt-1">
                  Vos conversations apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentConversations.map((conversation) => {
                  const isUnread =
                    profileId &&
                    (conversation.unread_count?.[profileId] || 0) > 0;
                  return (
                    <Link
                      key={conversation.id}
                      href={`/messages?conversation=${conversation.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors group relative ${
                        isUnread ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* Indicateur non lu (point bleu à gauche) */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
                      )}

                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                          {conversation.other_participant_avatar ? (
                            <img
                              src={conversation.other_participant_avatar}
                              alt={
                                conversation.other_participant_name ||
                                "Utilisateur"
                              }
                              className="w-10 h-10 rounded-full object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {getInitials(conversation.other_participant_name)}
                            </div>
                          )}
                          {/* Status indicator (facultatif, si disponible dans l'objet conversation) */}
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p
                              className={`text-sm truncate ${
                                isUnread
                                  ? "font-bold text-gray-900"
                                  : "font-medium text-gray-700 group-hover:text-gray-900"
                              }`}
                            >
                              {conversation.other_participant_name ||
                                "Utilisateur"}
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {formatTimeAgo(conversation.last_message_at)}
                            </span>
                          </div>
                          <p
                            className={`text-xs sm:text-sm line-clamp-1 ${
                              isUnread ? "text-gray-800 font-medium" : "text-gray-500"
                            }`}
                          >
                            {conversation.last_message_sender_id === profileId
                              ? "Vous: "
                              : ""}
                            {conversation.last_message_text ||
                              "Nouvelle conversation"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 text-sm text-center text-indigo-600 font-medium hover:text-indigo-800 hover:bg-gray-100 transition-colors rounded-b-lg"
            >
              Voir toutes les conversations
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}