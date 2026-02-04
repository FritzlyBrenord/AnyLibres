import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Paperclip,
  Smile,
  Send,
  Image,
  Video,
  File,
  FileText,
  Music,
  Loader2,
  User,
  Shield,
  MessageCircle,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface OrderMessagingModalProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  providerId?: string; // Optionnel si on contacte un client
  clientId?: string;   // Optionnel si on contacte un prestataire
  recipientType?: "client" | "provider"; // Nouveau prop
  messageType: "simple" | "revision" | "accept" | "reject";
  onMessageSent: () => void;
  serviceId?: string;
  serviceTitle?: string; // Titre du service pour afficher dans l'objet
  initialRecipientData?: any; // Données du destinataire déjà disponibles
}

interface ProviderProfile {
  id: string;
  profile_id: string; // ID du profile pour les messages
  first_name: string;
  last_name: string;
  display_name?: string;
  avatar_url?: string;
  occupations?: string;
}

const OrderMessagingModal: React.FC<OrderMessagingModalProps> = ({
  open,
  onClose,
  orderId,
  providerId,
  clientId,
  recipientType = "provider", // Par défaut contact prestataire
  messageType,
  onMessageSent,
  serviceId,
  serviceTitle,
  initialRecipientData,
}) => {
  const { t } = useSafeLanguage();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État unifié pour le destinataire (peut être provider ou client)
  const [recipient, setRecipient] = useState<ProviderProfile | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  
  const [userProfile, setUserProfile] = useState<{
    first_name?: string;
    last_name?: string;
    display_name?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const displayServiceTitle = serviceTitle || t("orders.detail.fallbackServiceTitle");

  // Configuration selon le type de message
  const messageConfig = {
    simple: {
      title: recipientType === "provider" 
        ? t("orders.messaging.contactProvider") 
        : t("orders.messaging.contactClient"),
      placeholder: t("orders.messaging.placeholder"),
      buttonText: t("orders.messaging.buttonSend"),
      buttonColor: "from-purple-600 to-pink-600",
      getSubject: (userName: string) => {
        if (orderId) {
          const shortId = orderId.slice(0, 8);
          return recipientType === "provider"
            ? t("orders.messaging.subjects.providerQuestion", { name: userName, id: shortId })
            : t("orders.messaging.subjects.clientMessage", { name: userName, id: shortId });
        }
        return t("orders.messaging.subjects.interest", { name: userName, title: displayServiceTitle });
      },
      predefinedMessages: (() => {
        if (orderId) {
          if (recipientType === "provider") {
            return [
              t("orders.messaging.predefined.client.progress"),
              t("orders.messaging.predefined.client.deadline"),
              t("orders.messaging.predefined.client.question"),
              t("orders.messaging.predefined.client.thanks")
            ];
          } else {
             return [
               t("orders.messaging.predefined.provider.clarification"),
               t("orders.messaging.predefined.provider.onTime"),
               t("orders.messaging.predefined.provider.received"),
               t("orders.messaging.predefined.provider.missing")
             ];
          }
        }
        return [
          t("orders.messaging.predefined.service.details"),
          t("orders.messaging.predefined.service.specific"),
          t("orders.messaging.predefined.service.delay"),
          t("orders.messaging.predefined.service.quote")
        ];
      })(),
    },
    revision: {
      title: t("orders.messaging.types.revision.title"),
      placeholder: t("orders.messaging.types.revision.placeholder"),
      buttonText: t("orders.messaging.buttonSend"),
      buttonColor: "from-orange-500 to-red-500",
      getSubject: (userName: string) =>
        t("orders.messaging.types.revision.subject", { 
          name: userName, 
          title: displayServiceTitle, 
          id: orderId?.slice(0, 8) || "" 
        }),
      predefinedMessages: t("orders.messaging.types.revision.predefined", { returnObjects: true }) as string[],
    },
    accept: {
      title: t("orders.messaging.types.accept.title"),
      placeholder: t("orders.messaging.types.accept.placeholder"),
      buttonText: t("orders.messaging.buttonSend"),
      buttonColor: "from-green-500 to-emerald-600",
      getSubject: (userName: string) =>
        t("orders.messaging.types.accept.subject", { 
          name: userName, 
          title: displayServiceTitle, 
          id: orderId?.slice(0, 8) || "" 
        }),
      predefinedMessages: t("orders.messaging.types.accept.predefined", { returnObjects: true }) as string[],
    },
    accept_simple: { // Fallback for some internal logic if needed
       title: t("orders.detail.acceptHeading"),
       placeholder: t("orders.messaging.types.accept.placeholder"),
       buttonText: t("orders.detail.confirmBtn"),
       buttonColor: "from-green-500 to-emerald-600",
       getSubject: (userName: string) =>
        t("orders.messaging.types.accept.subject", { 
          name: userName, 
          title: displayServiceTitle, 
          id: orderId?.slice(0, 8) || "" 
        }),
      predefinedMessages: t("orders.messaging.types.accept.predefined", { returnObjects: true }) as string[],
    },
    reject: {
      title: t("orders.messaging.types.reject.title"),
      placeholder: t("orders.messaging.types.reject.placeholder"),
      buttonText: t("orders.messaging.buttonSend"),
      buttonColor: "from-red-500 to-rose-600",
      getSubject: (userName: string) =>
        t("orders.messaging.types.reject.subject", { 
          name: userName, 
          title: displayServiceTitle, 
          id: orderId?.slice(0, 8) || "" 
        }),
      predefinedMessages: t("orders.messaging.types.reject.predefined", { returnObjects: true }) as string[],
    },
  };

  const config = messageConfig[messageType];

  // Emojis communs
  const commonEmojis = [
    "😊", "😄", "😍", "😂", "🥰", "😎", "🤔", "👏",
    "🙌", "🔥", "⭐", "🎉", "💯", "❤️", "👍", "👎",
    "🙏", "😢", "😡", "🤯", "🔧", "📝", "🎨", "✅",
    "❌", "⚠️", "🔍", "💡", "📌", "👋", "💼", "📅", "💰",
  ];

  // Charger les informations du prestataire ET de l'utilisateur
  useEffect(() => {
    if (open) {
      if (initialRecipientData) {
        // Si on a déjà les données, on les utilise directement
        setRecipient({
          id: clientId || initialRecipientData.id || "",
          profile_id: initialRecipientData.id || clientId || "",
          first_name: initialRecipientData.first_name || "",
          last_name: initialRecipientData.last_name || "",
          display_name: initialRecipientData.display_name,
          avatar_url: initialRecipientData.avatar_url,
          occupations: recipientType === "client" ? "Client" : initialRecipientData.occupations
        });
        setLoadingRecipient(false);
      } else {
        loadRecipientInfo();
      }
      loadUserProfile();
    }
  }, [open, providerId, clientId, recipientType, initialRecipientData]);

  const loadRecipientInfo = async () => {
    try {
      setLoadingRecipient(true);
      setError(null);

      let targetId = recipientType === "provider" ? providerId : clientId;
      if (!targetId) {
        // Fallback or error if ID missing
        setLoadingRecipient(false);
        return;
      }

      // Si c'est un prestataire, on utilise l'API provider existante
      if (recipientType === "provider") {
        const response = await fetch(`/api/providers/${targetId}`);
        const data = await response.json();

        if (data.success && data.data.provider) {
          const p = data.data.provider;
          const profileData = p.profile;
          
          setRecipient({
            id: p.id,
            profile_id: p.profile_id || profileData?.id || p.id,
            first_name: profileData?.first_name || p.first_name || "",
            last_name: profileData?.last_name || p.last_name || "",
            display_name: profileData?.display_name || p.display_name || "",
            avatar_url: profileData?.avatar_url || p.avatar_url || p.logo_url,
            occupations: p.profession || p.occupations || profileData?.occupations,
          });
        }
      } 
      // Si c'est un client, on utilise la nouvelle API public user
      else {
        try {
            const response = await fetch(`/api/users/${targetId}/public`);
            
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
            data = await response.json();
            }

            if (response.ok && data) {
            setRecipient({
                id: data.id, 
                profile_id: data.id, 
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                display_name: data.display_name,
                avatar_url: data.avatar_url,
                occupations: "Client"
            });
            } else {
                console.error("Client fetch error:", data?.error || response.statusText);
                throw new Error("Impossible de charger le profil client");
            }
        } catch (e) {
             console.error("Client fetch exception:", e);
             // Fallback minimal
             setRecipient({
                 id: targetId,
                 profile_id: targetId,
                 first_name: "Client",
                 last_name: "",
                 avatar_url: undefined,
                 occupations: "Client"
             });
        }

      }
    } catch (err) {
      console.error("Error loading recipient:", err);
      setError("Erreur lors du chargement du destinataire");
    } finally {
      setLoadingRecipient(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (data.success && data.data) {
        setUserProfile(data.data);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  // Fermer le sélecteur d'emojis quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojis(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Réinitialiser l'état quand le modal s'ouvre/ferme
  useEffect(() => {
    if (open) {
      setMessage("");
      setAttachments([]);
      setSentSuccess(false);
      setIsSending(false);
      setError(null);
    }
  }, [open, messageType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Ajouter un emoji au message
  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  // Envoyer le message via la nouvelle API de messagerie
  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) {
      setError("Veuillez saisir un message ou sélectionner un fichier");
      return;
    }

    if (!recipient?.profile_id) {
      setError("Impossible de trouver le destinataire");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Nom complet de l'utilisateur
      const formattedUserName = userProfile?.first_name || userProfile?.last_name
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
        : userProfile?.display_name 
          ? `@${userProfile.display_name}` 
          : (userProfile as any)?.email || "Un utilisateur";

      // Créer l'objet du message
      const subject = config.getSubject(formattedUserName);

      // Préparer le message avec l'objet
      const fullMessage = `**${subject}**\n\n${message.trim()}`;

      // Préparer les métadonnées
      const metadata: Record<string, string> = {
        message_type: messageType,
      };

      if (orderId) metadata.order_id = orderId;
      if (serviceId) metadata.service_id = serviceId;
      if (serviceTitle) metadata.service_title = serviceTitle;

      // Envoyer le message
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: recipient.profile_id,
          text: fullMessage,
          message_type: messageType === "simple" ? "text" : messageType,
          metadata,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSentSuccess(true);
        setMessage("");
        setAttachments([]);

        // Notifier le parent
        onMessageSent();

        // Récupérer l'ID de la conversation créée
        const conversationId = data.data?.conversation_id;

        // Rediriger vers la page de messagerie avec la conversation sélectionnée
        setTimeout(() => {
          window.location.href = conversationId
            ? `/messages?conversation=${conversationId}`
            : `/messages`;
        }, 2000);
      } else {
        throw new Error(data.error || "Erreur lors de l'envoi du message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handlePredefinedMessage = (text: string) => {
    setMessage(text);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`Le fichier ${file.name} est trop volumineux (max 50MB)`);
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (file.type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (file.type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (file.type.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
        {/* Header avec infos du prestataire uniquement */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Photo de profil du destinataire */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-lg border-2 border-white">
                {recipient?.avatar_url ? (
                  <img
                    src={recipient.avatar_url}
                    alt={`${recipient.first_name} ${recipient.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : recipient ? (
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {(recipient.first_name || recipient.display_name || "U").charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="flex-1 min-w-0">
                {loadingRecipient ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    <span className="text-slate-600 font-medium">{t("orders.detail.loading")}</span>
                  </div>
                ) : recipient ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {recipient.first_name || recipient.last_name 
                        ? `${recipient.first_name} ${recipient.last_name}`.trim() 
                        : recipient.display_name || "Contact"}
                    </h2>
                    {recipient.occupations && (
                      <div className="flex items-center gap-2 text-slate-600 mt-0.5">
                        <span className="text-sm truncate">{recipient.occupations}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <h2 className="text-xl font-bold text-slate-900">Contact</h2>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicateur de type de message (si non simple) */}
              {messageType !== "simple" && (
                <div
                  className={`hidden sm:flex px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                    messageType === "accept"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : messageType === "revision"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {messageType === "accept"
                    ? "Acceptation"
                    : messageType === "revision"
                    ? "Révision"
                    : "Refus"}
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors flex-shrink-0"
                disabled={isSending}
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Message d'erreur */}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-600 font-semibold mb-2">❌ {t("orders.messaging.errorTitle")}</div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Message de succès */}
          {sentSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-600 font-semibold mb-1">
                ✅ {t("orders.messaging.success")}
              </div>
              <p className="text-green-700 text-sm">
                {t("orders.messaging.successDesc", { name: recipient?.first_name || "" })}
              </p>
            </div>
          )}

          {/* Messages prédéfinis */}
          {!isSending && !sentSuccess && !error && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                {t("orders.messaging.predefinedTitle")}
              </p>
              {config.predefinedMessages.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handlePredefinedMessage(text)}
                  className="w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-700 transition-colors border border-slate-200"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* Aperçu du message */}
          {message.trim() && !sentSuccess && (
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <p className="text-sm whitespace-pre-wrap">{message}</p>
                <p className="text-xs mt-1 text-purple-100">
                  À envoyer à {recipient?.first_name}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pièces jointes */}
        {attachments.length > 0 && !sentSuccess && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                >
                  {getFileIcon(file)}
                  <span className="max-w-32 truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                    disabled={isSending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sélecteur d'emojis */}
        {showEmojis && !sentSuccess && !error && (
          <div
            ref={emojiPickerRef}
            className="border-t border-slate-200 px-6 py-4 bg-white"
          >
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded transition-colors"
                  disabled={isSending}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        {!sentSuccess && !error && (
          <div className="border-t border-slate-200 p-6 bg-slate-50/50">
            <div className="flex items-end space-x-3">
              <div className="flex space-x-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                  disabled={isSending}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  disabled={isSending}
                />

                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-2 transition-colors disabled:opacity-50 ${
                    showEmojis
                      ? "text-purple-500"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  disabled={isSending}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={config.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm disabled:opacity-50 placeholder-slate-400"
                  maxLength={2500}
                  disabled={isSending}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-3 h-3" />
                    <span>{t("orders.messaging.secureNote")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {t("orders.messaging.charCount", { current: message.length })}
                    </span>
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        (!message.trim() && attachments.length === 0) ||
                        isSending
                      }
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                        (message.trim() || attachments.length > 0) && !isSending
                          ? `bg-gradient-to-r ${config.buttonColor} text-white shadow-lg hover:shadow-xl`
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSending ? t("orders.messaging.sending") : config.buttonText}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderMessagingModal;