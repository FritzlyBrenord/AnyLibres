// app/(protected)/messages/page.tsx
// Page principale de messagerie
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageList } from "@/components/messaging/MessageList";
import { MessageInput } from "@/components/messaging/MessageInput";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { MessageCircle, User, Loader2, Menu, X } from "lucide-react";
import type { Conversation } from "@/types/messaging";
import { SmartBackButton } from "@/components/common/SmartBackButton";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showMobileConversations, setShowMobileConversations] = useState(true);

  // Load conversations
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    profileId,
  } = useConversations();

  // Load messages for selected conversation
  const {
    messages,
    loading: messagesLoading,
    sending,
    sendMessage,
    messagesEndRef,
    profileId: messagesProfileId,
  } = useMessages(selectedConversation?.id || null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationIdFromUrl = searchParams.get("conversation");

    if (
      conversationIdFromUrl &&
      conversations.length > 0 &&
      !selectedConversation
    ) {
      const conv = conversations.find((c) => c.id === conversationIdFromUrl);
      if (conv) {
        setSelectedConversation(conv);
        setShowMobileConversations(false);
      }
    }
  }, [searchParams, conversations, selectedConversation]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileConversations(false); // Sur mobile, masquer la liste
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;

    try {
      const response = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: [messageId] }),
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les messages
        window.location.reload();
      } else {
        alert("Erreur lors de la suppression du message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Erreur lors de la suppression du message");
    }
  };

  // Handle archive message
  const handleArchiveMessage = async (messageId: string) => {
    try {
      const response = await fetch("/api/messages/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: [messageId], unarchive: false }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Message archivé");
      } else {
        alert("Erreur lors de l'archivage du message");
      }
    } catch (error) {
      console.error("Error archiving message:", error);
      alert("Erreur lors de l'archivage du message");
    }
  };

  // Handle send message
  const handleSendMessage = async (text: string, attachments?: File[]) => {
    if (!selectedConversation) return;

    const receiverId =
      selectedConversation.participants.find((p) => p !== profileId) || "";

    await sendMessage({
      receiver_id: receiverId,
      text,
      attachments,
    });
  };

  if (authLoading || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <main className="flex-1 h-full   px-0 sm:px-4 max-w-[1600px] mx-auto w-full">
        <div className="min-h-screen bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden flex">
          {/* Conversations List - Desktop & Mobile */}
          <div
            className={`${
              showMobileConversations ? "flex" : "hidden"
            } lg:flex lg:w-80 xl:w-96 flex-col border-r border-slate-200`}
          >
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              loading={conversationsLoading}
              profileId={profileId}
            />
          </div>

          {/* Messages Area - Desktop & Mobile */}
          <div
            className={`${
              showMobileConversations ? "hidden" : "flex"
            } lg:flex flex-1 flex-col`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileConversations(true)}
                    className="lg:hidden text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* Avatar */}
                  {selectedConversation.other_participant_avatar ? (
                    <img
                      src={selectedConversation.other_participant_avatar}
                      alt={selectedConversation.other_participant_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1">
                    <h2 className="font-bold text-slate-900">
                      {selectedConversation.other_participant_name ||
                        "Utilisateur"}
                    </h2>
                    <p className="text-xs text-slate-500">En ligne</p>
                  </div>
                </div>

                {/* Messages */}
                <MessageList
                  messages={messages}
                  profileId={messagesProfileId || profileId}
                  loading={messagesLoading}
                  messagesEndRef={messagesEndRef}
                  onDeleteMessage={handleDeleteMessage}
                  onArchiveMessage={handleArchiveMessage}
                />

                {/* Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  sending={sending}
                />
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-12 h-12 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    Sélectionnez une conversation
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Choisissez une conversation dans la liste pour commencer à
                    échanger des messages
                  </p>

                  {/* Mobile: Show conversations button */}
                  <button
                    onClick={() => setShowMobileConversations(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                  >
                    <Menu className="w-5 h-5" />
                    Voir les conversations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
