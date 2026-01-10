// components/messaging/ConversationList.tsx
// Liste des conversations avec recherche
"use client";

import { useState } from "react";
import { Search, MessageCircle, User, Loader2 } from "lucide-react";
import type { Conversation } from "@/types/messaging";
import { SmartBackButton } from "../common/SmartBackButton";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
  profileId?: string | null;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading = false,
  profileId,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter((conv) => {
    const name = conv.other_participant_name?.toLowerCase() || "";
    const lastMessage = conv.last_message_text?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return name.includes(query) || lastMessage.includes(query);
  });

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className=" fixed h-full w-sm flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex flex-col space-y-7">
          <SmartBackButton label="Retour" />
          <h2 className="text-xl font-bold text-slate-900 mb-3">Messages</h2>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {searchQuery
                ? "Aucune conversation trouvée"
                : "Aucune conversation"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery
                ? "Essayez un autre terme de recherche"
                : "Commencez une nouvelle conversation"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const unreadCount = profileId
              ? conversation.unread_count[profileId] || 0
              : 0;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                  isSelected ? "bg-purple-50" : ""
                }`}
              >
                {/* Avatar */}
                {conversation.other_participant_avatar ? (
                  <img
                    src={conversation.other_participant_avatar}
                    alt={conversation.other_participant_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold truncate ${
                        unreadCount > 0 ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {conversation.other_participant_name || "Utilisateur"}
                    </h3>
                    {conversation.last_message_at && (
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        unreadCount > 0
                          ? "text-slate-700 font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      {conversation.last_message_text || "Aucun message"}
                    </p>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
