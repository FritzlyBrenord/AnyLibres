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
  Info,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Languages,
  Check,
  ChevronDown,
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
  const { t, language } = useSafeLanguage();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(!isAdminMode);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
    useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-translation states
  const [isAutoTranslateActive, setIsAutoTranslateActive] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(language);
  const [isTranslationMenuOpen, setIsTranslationMenuOpen] = useState(false);

  const translationLanguages = [
    { code: "fr", name: t("languages.fr") || "Français", flag: "🇫🇷" },
    { code: "en", name: t("languages.en") || "English", flag: "🇬🇧" },
    { code: "es", name: t("languages.es") || "Español", flag: "🇪🇸" },
  ];

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

  // Détection scroll pour effet header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Gérer la sélection initiale ou automatique
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === initialConversationId);
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
      const isTemp = convId?.startsWith("temp_");

      await sendMessage({
        conversation_id: isTemp ? undefined : convId,
        receiver_id:
          selectedConversation?.participants.find((p) => p !== profileId) || "",
        text,
        attachments: attachments as any,
      });

      reloadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStartNewConversation = async (user: Profile) => {
    setIsNewConversationModalOpen(false);

    const existingConv = conversations.find(
      (c) => c.participants.includes(user.id) && c.participants.length === 2,
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
      setIsMobileListVisible(false);
    } else {
      const dummyConv: any = {
        id: `temp_${user.id}`,
        participants: [profileId, user.id],
        other_participant_name:
          user.display_name ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.email ||
          "Utilisateur",
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

  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 overflow-hidden ${
        isAdminMode && !isFullscreen ? "p-4 sm:p-8" : ""
      }`}
    >
      {/* Container principal - Fullscreen pour users, windowed pour admin */}
      <div
        className={`flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-500 shadow-2xl ${
          isAdminMode && !isFullscreen
            ? "rounded-3xl h-[85vh] max-w-7xl mx-auto shadow-indigo-500/10"
            : "fixed inset-0 rounded-none"
        }`}
      >
        {/* Header Premium */}
        <div
          className={`relative px-6 py-4 flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? "bg-slate-950/80 backdrop-blur-md border-b border-white/5"
              : "bg-transparent"
          }`}
        >
          {/* Partie gauche : Navigation et Titre */}
          <div className="flex items-center gap-4">
            {/* Bouton Retour - UNIQUEMENT pour utilisateurs normaux */}
            {!isAdminMode && (
              <SmartBackButton
                variant="minimal"
                className="text-white/70 hover:text-white transition-colors p-0 h-auto flex items-center gap-2 text-sm font-medium"
                label={t("navigation.back") || "Retour"}
              />
            )}

            {/* Séparateur vertical - visible uniquement si bouton retour présent */}
            {!isAdminMode && (
              <div className="w-px h-6 bg-white/10 hidden sm:block" />
            )}

            {/* Logo et Titre */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                {/* Badge admin */}
                {isAdminMode && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <ShieldCheck className="w-2.5 h-2.5 text-slate-900" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-white text-lg tracking-tight">
                  {isAdminMode
                    ? t("messaging.adminTitle") || "Admin Messages"
                    : t("messaging.title") || "Messages"}
                </h1>
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest flex items-center gap-1">
                  {isAdminMode && (
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  )}
                  {isAdminMode ? "Mode Administration" : "AnyLibre Secure Chat"}
                </p>
              </div>
            </div>
          </div>

          {/* Partie droite : Contrôles Admin uniquement */}
          <div className="flex items-center gap-3">
            {/* Indicateur Online */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                Online
              </span>
            </div>

            {/* Bouton Maximiser/Minimiser - UNIQUEMENT Admin */}
            {isAdminMode && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
                title={isFullscreen ? "Minimiser" : "Maximiser"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Layout Principal */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar Conversations - Glassmorphism */}
          <div
            className={`
            absolute lg:relative z-20 w-full lg:w-[380px] xl:w-[420px] 
            bg-slate-900/80 lg:bg-slate-900/40 backdrop-blur-xl 
            border-r border-white/5 flex flex-col
            transition-transform duration-500 ease-out
            ${isMobileListVisible ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          >
            {/* Search Bar Premium */}
            <div className="p-4 border-b border-white/5">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder={t("messaging.search") || "Rechercher..."}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                loading={loadingConversations}
                profileId={profileId}
                isDark={true}
                isAdminMode={isAdminMode}
              />
            </div>

            {/* Bouton Nouvelle Conversation - UNIQUEMENT Admin */}
            {isAdminMode && (
              <div className="p-4 border-t border-white/5">
                <button
                  onClick={() => setIsNewConversationModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>
                    {t("messaging.newConversation") || "Nouvelle conversation"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Zone de Chat */}
          <div
            className={`
            flex-1 flex flex-col bg-slate-950/30
            transition-transform duration-500 ease-out
            ${!isMobileListVisible ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
          >
            {selectedConversation ? (
              <>
                {/* Header Conversation */}
                <div className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    {/* Bouton retour mobile (vers liste) */}
                    <button
                      onClick={() => setIsMobileListVisible(true)}
                      className="lg:hidden w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>

                    {/* Avatar avec indicateur */}
                    <div className="relative">
                      {selectedConversation.other_participant_avatar ? (
                        <img
                          src={selectedConversation.other_participant_avatar}
                          alt={selectedConversation.other_participant_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-white/10">
                          <User className="w-5 h-5 text-white/50" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    </div>

                    <div>
                      <h2 className="font-bold text-white text-sm sm:text-base">
                        {selectedConversation.other_participant_name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">
                          {selectedConversation.other_participant_email}
                        </span>
                        {selectedConversation.other_participant_role ===
                          "admin" && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-400 uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Translation Selector */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsTranslationMenuOpen(!isTranslationMenuOpen)
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          isAutoTranslateActive
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "hover:bg-white/10 text-white/40 hover:text-white"
                        }`}
                        title="Traduction automatique"
                      >
                        <Languages className="w-4 h-4" />
                      </button>

                      {isTranslationMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsTranslationMenuOpen(false)}
                          />
                          <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-white/5 mb-2">
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                Traduction
                              </p>
                            </div>

                            {/* Toggle Auto-Translate */}
                            <button
                              onClick={() => {
                                setIsAutoTranslateActive(!isAutoTranslateActive);
                                if (!isAutoTranslateActive) setTargetLanguage(language);
                              }}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAutoTranslateActive ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                  <Sparkles className={`w-4 h-4 ${isAutoTranslateActive ? 'text-indigo-400' : 'text-white/40'}`} />
                                </div>
                                <span className="text-sm font-medium text-white/80">Auto-traduction</span>
                              </div>
                              <div className={`w-8 h-4 rounded-full relative transition-colors ${isAutoTranslateActive ? 'bg-indigo-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${isAutoTranslateActive ? 'left-5' : 'left-1'}`} />
                              </div>
                            </button>

                            <div className="h-px bg-white/5 my-2 mx-4" />

                            {/* Language List */}
                            {translationLanguages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setTargetLanguage(lang.code);
                                  setIsTranslationMenuOpen(false);
                                  setIsAutoTranslateActive(true);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${
                                  targetLanguage === lang.code
                                    ? "bg-indigo-500/10"
                                    : ""
                                }`}
                              >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="flex-1 text-left text-sm font-medium text-white/70">
                                  {lang.name}
                                </span>
                                {targetLanguage === lang.code && (
                                  <Check className="w-4 h-4 text-indigo-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-4 space-y-4">
                  <MessageList
                    messages={messages}
                    profileId={profileId}
                    loading={loadingMessages}
                    messagesEndRef={messagesEndRef as any}
                    isAutoTranslateActive={isAutoTranslateActive}
                    targetLanguage={targetLanguage}
                    isDark={true}
                  />
                </div>

                {/* Input Area Premium */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    sending={sending}
                    disabled={!selectedConversation}
                    isDark={true}
                  />
                </div>
              </>
            ) : (
              /* État Vide Premium */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Background décoratif */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto hover:scale-105 transition-transform">
                    <MessageSquare className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isAdminMode
                      ? "Sélectionnez une conversation"
                      : "Vos Messages"}
                  </h3>
                  <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                    {isAdminMode
                      ? "Choisissez une discussion dans la liste ou créez-en une nouvelle pour commencer."
                      : "Sélectionnez une discussion pour voir vos messages ou attendez qu'un administrateur vous contacte."}
                  </p>

                  {/* Indicateur pour users normaux */}
                  {!isAdminMode && conversations.length === 0 && (
                    <div className="mt-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-amber-400 text-xs font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Aucune conversation active
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale Nouvelle Conversation - Admin uniquement */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen && isAdminMode} // Double sécurité
        onClose={() => setIsNewConversationModalOpen(false)}
        onSelectUser={handleStartNewConversation}
        isDark={true}
      />
    </div>
  );
}

export default MessagingInterface;
