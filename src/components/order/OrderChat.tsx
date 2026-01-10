// ============================================================================
// COMPONENT: OrderChat - Messagerie intégrée dans la page de commande
// ============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Check,
  CheckCheck,
  Loader2,
  User,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  attachments?: any[];
  message_type?: string;
  is_read: boolean;
  is_delivered: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    is_admin?: boolean;
  };
}

interface OrderChatProps {
  orderId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  userRole: "client" | "provider" | "admin";
  isAdmin?: boolean;
  clientId?: string;
  providerId?: string;
  clientName?: string;
  providerName?: string;
}

export default function OrderChat({
  orderId,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  userRole = "client",
  isAdmin = false,
  clientId,
  providerId,
  clientName,
  providerName,
}: OrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [emailAlert, setEmailAlert] = useState<string | null>(null);
  const [adminRecipient, setAdminRecipient] = useState<
    "client" | "provider" | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Déterminer le destinataire actuel pour l'admin
  const getCurrentRecipient = () => {
    if (!isAdmin) return otherUserId;

    if (adminRecipient === "client" && clientId) return clientId;
    if (adminRecipient === "provider" && providerId) return providerId;

    return null;
  };

  // Charger les messages
  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/messages${isAdmin ? "?isAdmin=true" : ""}`
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        // Calculer les messages non lus
        const unread = data.data.messages.filter(
          (msg: Message) => !msg.is_read && msg.receiver_id === currentUserId
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Marquer les messages comme lus
  const markAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.receiver_id === currentUserId
      );

      for (const msg of unreadMessages) {
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: msg.id }),
        });
      }

      setUnreadCount(0);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver_id === currentUserId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error("Erreur marquage lu:", error);
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    const currentRecipient = getCurrentRecipient();
    if (!currentRecipient || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAdmin ? { "x-is-admin": "true" } : {}),
        },
        body: JSON.stringify({
          receiver_id: currentRecipient,
          text: newMessage,
          metadata: {
            order_id: orderId,
            context: "order_discussion",
            is_admin_message: isAdmin,
            admin_recipient: isAdmin ? adminRecipient : null,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage("");
        loadMessages();
        scrollToBottom();

        // Afficher l'alerte d'email
        if (data.debug?.alert) {
          setEmailAlert(data.debug.alert);
          // Cacher l'alerte après 5 secondes
          setTimeout(() => setEmailAlert(null), 5000);
        }

        // Aussi afficher dans la console pour debug
        if (data.debug?.notification) {
          console.log("📧 DEBUG Email:", data.debug.notification);
        }
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `metadata->order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Nouveau message:", payload);
          loadMessages();
          scrollToBottom();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `metadata->order_id=eq.${orderId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Marquer comme lu quand on ouvre le chat
  useEffect(() => {
    if (isExpanded && unreadCount > 0) {
      markAsRead();
    }
  }, [isExpanded]);

  // Auto-scroll quand nouveaux messages
  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  // Quand admin ouvre le chat, lui demander de choisir un destinataire
  useEffect(() => {
    if (isAdmin && isExpanded && !adminRecipient) {
      // Sélection automatique du client par défaut
      setAdminRecipient("client");
    }
  }, [isAdmin, isExpanded, adminRecipient]);

  // Format de la date
  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour changer le destinataire (admin seulement)
  const handleRecipientChange = (recipient: "client" | "provider") => {
    setAdminRecipient(recipient);
    setNewMessage(""); // Réinitialiser le message en cours
  };

  // Obtenir le nom affiché pour l'admin
  const getDisplayName = () => {
    if (isAdmin && adminRecipient) {
      return adminRecipient === "client"
        ? clientName || "Client"
        : providerName || "Prestataire";
    }
    return otherUserName;
  };

  // Obtenir le rôle affiché
  const getDisplayRole = () => {
    if (isAdmin && adminRecipient) {
      return adminRecipient === "client" ? "Client" : "Prestataire";
    }
    return userRole === "client" ? "Prestataire" : "Client";
  };

  // Filtrer les messages pour l'admin (voir tous les messages)
  const getDisplayMessages = () => {
    if (!isAdmin) return messages;

    // Admin voit tous les messages, mais on peut filtrer par destinataire si souhaité
    return messages.filter((msg) => {
      if (!adminRecipient) return true;

      // Si admin parle au client, montrer tous les messages avec le client
      if (adminRecipient === "client") {
        return (
          msg.sender_id === clientId ||
          msg.receiver_id === clientId ||
          (msg.sender?.is_admin && msg.metadata?.admin_recipient === "client")
        );
      }

      // Si admin parle au prestataire, montrer tous les messages avec le prestataire
      if (adminRecipient === "provider") {
        return (
          msg.sender_id === providerId ||
          msg.receiver_id === providerId ||
          (msg.sender?.is_admin && msg.metadata?.admin_recipient === "provider")
        );
      }

      return true;
    });
  };

  const displayMessages = getDisplayMessages();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bouton flottant quand fermé */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 ${
            isAdmin
              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-red-500/50"
              : "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-purple-500/50"
          }`}
        >
          {isAdmin ? (
            <Shield className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}

          {/* Badge de messages non lus */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isAdmin
              ? "Chat Admin - Discuter avec client/prestataire"
              : unreadCount > 0
              ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} message${
                  unreadCount > 1 ? "s" : ""
                }`
              : `Discuter avec  ${
                  userRole === "client" ? "le prestataire" : "le client"
                }`}
          </div>
        </button>
      )}

      {/* Alerte Email */}
      {emailAlert && (
        <div className="fixed top-4 right-4 z-60 max-w-md animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3">
            <div className="mt-0.5">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{emailAlert}</p>
            </div>
            <button
              onClick={() => setEmailAlert(null)}
              className="ml-2 hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fenêtre de chat expandée */}
      {isExpanded && (
        <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div
            className={`p-4 flex items-center justify-between ${
              isAdmin
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                : "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {!isAdmin && otherUserAvatar ? (
                  <img
                    src={otherUserAvatar}
                    alt={getDisplayName()}
                    className="w-full h-full object-cover"
                  />
                ) : isAdmin ? (
                  <Shield className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-bold">
                    {getDisplayName().charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{getDisplayName()}</h3>
                <p className="text-xs text-white/80">
                  {isAdmin ? "Administrateur" : getDisplayRole()}
                  {isAdmin &&
                    adminRecipient &&
                    ` → ${
                      adminRecipient === "client" ? "Client" : "Prestataire"
                    }`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sélecteur de destinataire (admin seulement) */}
          {isAdmin && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Parler à :
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecipientChange("client")}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      adminRecipient === "client"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Client
                  </button>
                  <button
                    onClick={() => handleRecipientChange("provider")}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      adminRecipient === "provider"
                        ? "bg-purple-500 text-white"
                        : "bg-white border border-purple-300 text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    Prestataire
                  </button>
                </div>
              </div>
              {adminRecipient && (
                <p className="text-xs text-slate-500 mt-1">
                  Vous discutez avec le{" "}
                  {adminRecipient === "client" ? "client" : "prestataire"}
                </p>
              )}
            </div>
          )}

          {/* Zone de messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-sm">Aucun message pour le moment</p>
                <p className="text-xs mt-2">Commencez la conversation !</p>
              </div>
            ) : (
              <>
                {displayMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const isAdminMessage =
                    msg.sender?.is_admin || msg.metadata?.is_admin_message;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? isAdmin
                              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                              : "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                            : isAdminMessage
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                            : "bg-white border border-slate-200 text-slate-900"
                        }`}
                      >
                        {/* En-tête du message */}
                        <div
                          className={`flex items-center gap-2 mb-1 text-xs ${
                            isMe ? "text-white/90" : "text-slate-700"
                          }`}
                        >
                          {isAdminMessage && (
                            <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {msg.sender?.first_name && (
                            <span className="font-medium">
                              {msg.sender.first_name} {msg.sender.last_name}
                            </span>
                          )}
                        </div>

                        {/* Contexte du message */}
                        {msg.message_type && msg.message_type !== "text" && (
                          <div
                            className={`text-xs mb-2 pb-2 ${
                              isMe || isAdminMessage
                                ? "border-white/30"
                                : "border-slate-200"
                            } border-b`}
                          >
                            {msg.message_type === "revision_request" &&
                              "🔄 Demande de révision"}
                            {msg.message_type === "delivery" && "📦 Livraison"}
                            {msg.message_type === "order_request" &&
                              "📋 Demande de commande"}
                          </div>
                        )}

                        <p className="text-sm break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                            isMe || isAdminMessage
                              ? "text-white/70"
                              : "text-slate-500"
                          }`}
                        >
                          <span>{formatTime(msg.created_at)}</span>
                          {isMe &&
                            (msg.is_read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : msg.is_delivered ? (
                              <CheckCheck className="w-3 h-3 opacity-50" />
                            ) : (
                              <Check className="w-3 h-3 opacity-50" />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Zone de saisie */}
          <div className="p-4 bg-white border-t border-slate-200">
            {isAdmin && !adminRecipient ? (
              <div className="text-center py-4 text-slate-500">
                <p className="text-sm">Veuillez sélectionner un destinataire</p>
                <p className="text-xs mt-1">(Client ou Prestataire)</p>
              </div>
            ) : (
              <>
                {isAdmin && adminRecipient && (
                  <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Destinataire : </span>
                      {adminRecipient === "client"
                        ? `Client ${clientName ? `(${clientName})` : ""}`
                        : `Prestataire ${
                            providerName ? `(${providerName})` : ""
                          }`}
                    </p>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      isAdmin
                        ? `Écrivez un message au ${
                            adminRecipient === "client"
                              ? "client"
                              : "prestataire"
                          }...`
                        : "Écrivez votre message..."
                    }
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    rows={2}
                    disabled={sending || (isAdmin && !adminRecipient)}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={
                      !newMessage.trim() ||
                      sending ||
                      (isAdmin && !adminRecipient)
                    }
                    className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                      isAdmin
                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700"
                        : "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Appuyez sur Entrée pour envoyer, Shift+Entrée pour une
                  nouvelle ligne
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
