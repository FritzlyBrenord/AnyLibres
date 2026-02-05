// components/messaging/ConversationList.tsx
// Liste des conversations avec recherche - Version Premium
"use client";

import { useState } from "react";
import {
  Search,
  MessageSquare,
  User,
  Loader2,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react";
import type { Conversation } from "@/types/messaging";
import { SmartBackButton } from "../common/SmartBackButton";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
  profileId?: string | null;
  isDark?: boolean;
  isAdminMode?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading = false,
  profileId,
  isDark = false,
  isAdminMode = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useSafeLanguage();

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter((conv) => {
    const name = conv.other_participant_name?.toLowerCase() || "";
    const lastMessage = conv.last_message_text?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return name.includes(query) || lastMessage.includes(query);
  });

  // Formater la date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("messages.justNow");
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7)
      return t("messages.timeAgoDays").replace("{n}", diffDays.toString());

    return date.toLocaleDateString(
      language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US",
      {
        day: "numeric",
        month: "short",
      },
    );
  };

  if (loading) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center ${isDark ? "bg-slate-900" : "bg-white"} gap-3`}
      >
        <Loader2
          className={`w-10 h-10 animate-spin ${isDark ? "text-indigo-400 opacity-30" : "text-indigo-500 opacity-50"}`}
        />
        <p
          className={`${isDark ? "text-slate-500" : "text-slate-400"} text-xs font-bold uppercase tracking-widest`}
        >
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"} border-r w-full`}
    >
      {/* Header Premium */}
      <div
        className={`p-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} border-b`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2
                className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"} tracking-tight`}
              >
                Discutions
              </h2>
            </div>
            <div
              className={`${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider`}
            >
              {conversations.length}
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder={t("messages.searchPlaceholder") || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 ${isDark ? "bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-800/50" : "bg-slate-100 text-slate-900 placeholder-slate-400 focus:bg-white"} border-transparent border-2 focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl outline-none transition-all text-sm font-medium`}
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40 grayscale">
            <div
              className={`w-20 h-20 ${isDark ? "bg-slate-800" : "bg-slate-200"} rounded-3xl flex items-center justify-center mb-4`}
            >
              <MessageSquare
                className={`w-10 h-10 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              />
            </div>
            <p
              className={`${isDark ? "text-slate-400" : "text-slate-600"} font-bold uppercase text-[10px] tracking-widest`}
            >
              {searchQuery ? "Aucun résultat" : "Aucun message"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const unreadCount = profileId
              ? conversation.unread_count[profileId] || 0
              : 0;
            const isProvider =
              conversation.other_participant_role === "provider";

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all relative overflow-hidden group ${
                  isSelected
                    ? isDark
                      ? "bg-slate-800 shadow-xl ring-2 ring-indigo-500/20"
                      : "bg-white shadow-xl shadow-slate-200/50 ring-2 ring-indigo-500/10"
                    : isDark
                      ? "hover:bg-slate-800/40 hover:shadow-lg"
                      : "hover:bg-white hover:shadow-lg hover:shadow-slate-200/30"
                }`}
              >
                {/* Active Indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full" />
                )}

                {/* Avatar Premium (Squircle) */}
                <div className="relative flex-shrink-0">
                  {conversation.other_participant_avatar ? (
                    <img
                      src={conversation.other_participant_avatar}
                      alt={conversation.other_participant_name}
                      className={`w-14 h-14 rounded-2xl object-cover ring-4 ${isDark ? "ring-slate-800" : "ring-white"} shadow-md transition-transform duration-300 ${isSelected ? "scale-105" : "group-hover:scale-105"}`}
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 ${isSelected ? "scale-105 bg-indigo-500 text-white" : isDark ? "group-hover:scale-105 bg-slate-800 text-slate-500 shadow-slate-950/20" : "group-hover:scale-105 bg-slate-200 text-slate-500"}`}
                    >
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-lg ${isDark ? "bg-slate-900" : "bg-white"} p-0.5 shadow-sm`}
                  >
                    <div
                      className={`w-full h-full rounded-md ${isProvider ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-extrabold truncate text-sm tracking-tight ${unreadCount > 0 || isSelected ? (isDark ? "text-white" : "text-slate-900") : isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {conversation.other_participant_name || "Utilisateur"}
                    </h3>
                    <span
                      className={`text-[10px] font-black ${isDark ? "text-slate-500" : "text-slate-400"} flex items-center gap-1`}
                    >
                      {isSelected && <Clock className="w-3 h-3" />}
                      {formatDate(conversation.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                        isProvider
                          ? isDark
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : isDark
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      {conversation.other_participant_role || "client"}
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm animate-bounce">
                        Nouveau
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate italic ${unreadCount > 0 ? (isDark ? "text-slate-300 font-bold" : "text-slate-900 font-bold") : isDark ? "text-slate-500 font-medium" : "text-slate-400 font-medium"}`}
                    >
                      {conversation.last_message_text || "Aucun message"}
                    </p>
                    {unreadCount > 0 && (
                      <div className="bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-lg flex items-center justify-center shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
