"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Search, 
  ChevronLeft,
  User,
  MoreVertical,
  ShieldCheck,
  Info
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { NewConversationModal } from "./NewConversationModal";
import { SmartBackButton } from "../common/SmartBackButton";
import type { Conversation, Message } from "@/types/messaging";
import type { Profile } from "@/types/auth";

interface MessagingInterfaceProps {
  isAdminMode?: boolean;
  showUserSearch?: boolean;
  initialConversationId?: string;
  isDark?: boolean;
}

export function MessagingInterface({
  isAdminMode = false,
  showUserSearch = false,
  initialConversationId = undefined,
  isDark = false,
}: MessagingInterfaceProps) {
  const { t } = useSafeLanguage();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  const {
    conversations,
    loading: loadingConversations,
    profileId,
    reload: reloadConversations,
  } = useConversations({ adminMode: isAdminMode });

  const {
    messages,
    loading: loadingMessages,
    sending,
    sendMessage,
    messagesEndRef,
  } = useMessages(selectedConversation?.id || null);

  // Gérer la sélection initiale ou automatique
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === initialConversationId);
      if (conv) {
        setSelectedConversation(conv);
        setIsMobileListVisible(false);
      }
    }
  }, [initialConversationId, conversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileListVisible(false);
  };

  const handleSendMessage = async (text: string, attachments?: any[]) => {
    if (!selectedConversation && !isNewConversationModalOpen) return;

    try {
      const convId = selectedConversation?.id;
      const isTemp = convId?.startsWith('temp_');

      await sendMessage({
        conversation_id: isTemp ? undefined : convId,
        receiver_id: selectedConversation?.participants.find(p => p !== profileId) || "",
        text,
        attachments: attachments as any,
      });
      
      // Recharger les conversations pour mettre à jour le dernier message
      reloadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStartNewConversation = async (user: Profile) => {
    setIsNewConversationModalOpen(false);
    
    // Vérifier si une conversation existe déjà avec cet utilisateur
    const existingConv = conversations.find(c => 
      c.participants.includes(user.id) && c.participants.length === 2
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      setIsMobileListVisible(false);
    } else {
      // Pour une nouvelle conversation, on attend le premier message pour la créer réellement côté serveur
      // Ou on peut créer un objet "conversation factice" en attendant
      const dummyConv: any = {
        id: `temp_${user.id}`,
        participants: [profileId, user.id],
        other_participant_name: user.display_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Utilisateur",
        other_participant_avatar: user.avatar_url,
        other_participant_email: user.email,
        other_participant_role: user.role,
        unread_count: {},
        last_message_text: "Nouvelle conversation",
        created_at: new Date().toISOString(),
      };
      
      setSelectedConversation(dummyConv);
      setIsMobileListVisible(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-900 border-slate-800 shadow-indigo-500/10' : 'bg-white border-slate-200 shadow-xl'} rounded-2xl border overflow-hidden transition-all duration-300 ${
      isFullscreen ? "fixed inset-0 z-[60] rounded-none" : "h-[800px]"
    }`}>
      {/* Header Centralisé / Actions Globales */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-xl z-50">
        <div className="flex items-center gap-4">
          {/* Version mobile : Retour à la liste */}
          {!isMobileListVisible && (
            <button 
              onClick={() => setIsMobileListVisible(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Version Desktop ou Mobile (si liste visible) : Retour à l'application */}
          <div className={`${isMobileListVisible ? "flex" : "hidden lg:flex"} items-center`}>
            {!isAdminMode && (
              <SmartBackButton 
                variant="minimal" 
                className="text-white hover:text-indigo-300 transition-colors p-0 h-auto" 
                label={t('navigation.back') || "Retour"}
              />
            )}
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none">Messagerie</h1>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">AnyLibre Live</p>
            </div>
            {isAdminMode && (
              <span className="flex items-center gap-1.5 bg-indigo-400/10 text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-indigo-400/20 ml-4 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5" />
                Administration
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdminMode && (
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
              title={isFullscreen ? "Réduire" : "Plein écran"}
            >
              {isFullscreen ? 
                <Minimize2 className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" /> : 
                <Maximize2 className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
              }
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-1 overflow-hidden relative ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {/* Sidebar - Liste des conversations */}
        <div className={`w-full lg:w-[400px] border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} flex flex-col transition-all duration-500 ease-in-out ${
          isMobileListVisible ? "translate-x-0" : "-translate-x-full lg:translate-x-0 absolute lg:relative z-20"
        }`}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            loading={loadingConversations}
            profileId={profileId}
            isDark={isDark}
            isAdminMode={isAdminMode}
          />

          {/* New Conversation Button - Floating Premium */}
          {(isAdminMode || showUserSearch) && (
            <button
              onClick={() => setIsNewConversationModalOpen(true)}
              className={`absolute bottom-8 right-8 w-16 h-16 ${isDark ? 'bg-indigo-600' : 'bg-slate-900'} text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-slate-700 dark:hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all z-40 group border-4 ${isDark ? 'border-slate-900' : 'border-white'}`}
              title="Nouvelle conversation"
            >
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Content - Zone de chat */}
        <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'} transition-all duration-500 ease-in-out ${
          !isMobileListVisible ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header Premium */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-white/80'} backdrop-blur-md sticky top-0 z-30 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {selectedConversation.other_participant_avatar ? (
                      <img
                        src={selectedConversation.other_participant_avatar}
                        alt={selectedConversation.other_participant_name}
                        className={`w-12 h-12 rounded-2xl object-cover ring-4 ${isDark ? 'ring-slate-800' : 'ring-slate-50'} shadow-md group-hover:scale-105 transition-transform`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-800 text-slate-500 ring-slate-800' : 'bg-slate-100 text-slate-400 ring-slate-50'} flex items-center justify-center ring-4 group-hover:scale-105 transition-transform`}>
                        <User className="w-7 h-7" />
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-emerald-500 border-2 ${isDark ? 'border-slate-900' : 'border-white'}`} />
                  </div>
                  <div>
                    <h2 className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
                      {selectedConversation.other_participant_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        selectedConversation.other_participant_role === 'provider' 
                          ? isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600' 
                          : isDark ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {selectedConversation.other_participant_role}
                      </span>
                      {selectedConversation.other_participant_email && (
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          • {selectedConversation.other_participant_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className={`w-10 h-10 flex items-center justify-center ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} rounded-xl hover:text-indigo-600 transition-all`}>
                    <Info className="w-5 h-5" />
                  </button>
                  <button className={`w-10 h-10 flex items-center justify-center ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} rounded-xl hover:text-indigo-600 transition-all`}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <MessageList
                messages={messages}
                profileId={profileId}
                loading={loadingMessages}
                messagesEndRef={messagesEndRef as any}
                isDark={isDark}
              />

              {/* Input Area */}
              <MessageInput
                onSendMessage={handleSendMessage}
                sending={sending}
                disabled={!selectedConversation}
                isDark={isDark}
              />
            </>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center p-12 ${isDark ? 'bg-slate-900' : 'bg-slate-50/50'} text-center relative overflow-hidden`}>
              {/* Decorative backgrounds */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 animate-in fade-in zoom-in duration-700">
                <div className={`w-24 h-24 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2rem] shadow-2xl border flex items-center justify-center mb-8 mx-auto hover:rotate-6 transition-transform`}>
                  <MessageCircle className={`w-12 h-12 ${isDark ? 'text-indigo-400' : 'text-indigo-200'}`} />
                </div>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-3 tracking-tight`}>Vos Messages Privés</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">
                  Sélectionnez une discussion ou commencez-en une nouvelle avec un membre de la communauté.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onSelectUser={handleStartNewConversation}
        isDark={isDark}
      />
    </div>
  );
}

export default MessagingInterface;
