// components/OrderMessagingModal.tsx
// Modal de messagerie unifié pour tous les types de messages
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

interface OrderMessagingModalProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  providerId: string;
  messageType: "simple" | "revision" | "accept" | "reject";
  onMessageSent: () => void;
  serviceId?: string;
  serviceTitle?: string; // Titre du service pour afficher dans l'objet
}

interface ProviderProfile {
  id: string;
  profile_id: string; // ID du profile pour les messages
  first_name: string;
  last_name: string;
  avatar_url?: string;
  occupations?: string;
}

const OrderMessagingModal: React.FC<OrderMessagingModalProps> = ({
  open,
  onClose,
  orderId,
  providerId,
  messageType,
  onMessageSent,
  serviceId,
  serviceTitle = "ce service",
}) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    first_name?: string;
    last_name?: string;
    display_name?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Configuration selon le type de message
  const messageConfig = {
    simple: {
      title: "Contacter le Prestataire",
      placeholder:
        "Décrivez votre projet, posez vos questions, discutez des détails...",
      buttonText: "Envoyer le Message",
      buttonColor: "from-purple-600 to-pink-600",
      getSubject: (userName: string) =>
        `${userName} est intéressé par "${serviceTitle}"`,
      predefinedMessages: [
        "👋 Bonjour, je suis intéressé par votre service. Pourriez-vous me donner plus de détails ?",
        "💼 J'ai un projet similaire. Pouvons-nous discuter de mes besoins spécifiques ?",
        "📅 Quels sont vos délais de livraison actuels ?",
        "💰 Est-il possible d'avoir un devis personnalisé pour mon projet ?",
      ],
    },
    revision: {
      title: "Demander une Révision",
      placeholder:
        "Décrivez précisément les modifications nécessaires, les éléments à corriger...",
      buttonText: "Envoyer la Demande",
      buttonColor: "from-orange-500 to-red-500",
      getSubject: (userName: string) =>
        `${userName} demande une révision - ${serviceTitle}${orderId ? ` (Commande #${orderId.slice(0, 8)})` : ""}`,
      predefinedMessages: [
        "🔧 Bonjour, je souhaiterais quelques modifications sur le travail livré...",
        "📝 Il y a certains éléments qui ne correspondent pas à mes attentes...",
        "🎨 Pourriez-vous ajuster les couleurs/le design sur les parties suivantes...",
      ],
    },
    accept: {
      title: "Accepter la Livraison",
      placeholder: "Exprimez votre satisfaction, laissez un commentaire positif...",
      buttonText: "Accepter et Terminer",
      buttonColor: "from-green-500 to-emerald-600",
      getSubject: (userName: string) =>
        `${userName} accepte la livraison - ${serviceTitle}${orderId ? ` (Commande #${orderId.slice(0, 8)})` : ""}`,
      predefinedMessages: [
        "✅ Excellent travail ! Tout correspond parfaitement à mes attentes.",
        "👍 Je suis très satisfait du résultat, merci pour votre professionnalisme.",
        "🎉 Livraison parfaite, je valide sans modification nécessaire.",
      ],
    },
    reject: {
      title: "Refuser la Livraison",
      placeholder:
        "Expliquez clairement les raisons du refus, les problèmes identifiés...",
      buttonText: "Confirmer le Refus",
      buttonColor: "from-red-500 to-rose-600",
      getSubject: (userName: string) =>
        `${userName} refuse la livraison - ${serviceTitle}${orderId ? ` (Commande #${orderId.slice(0, 8)})` : ""}`,
      predefinedMessages: [
        "❌ Malheureusement, le travail livré ne correspond pas à mes attentes...",
        "⚠️ Je ne peux pas accepter cette livraison pour les raisons suivantes...",
        "🔍 Il y a des incohérences importantes avec la commande initiale...",
      ],
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
    if (open && providerId) {
      loadProviderInfo();
      loadUserProfile();
    }
  }, [open, providerId]);

  const loadProviderInfo = async () => {
    try {
      setLoadingProvider(true);
      const response = await fetch(`/api/providers/${providerId}`);
      const data = await response.json();

      if (data.success && data.data.provider) {
        setProvider({
          ...data.data.provider,
          profile_id: data.data.provider.profile_id || data.data.provider.id,
        });
      } else {
        setError("Impossible de charger les informations du prestataire");
      }
    } catch (err) {
      console.error("Error loading provider:", err);
      setError("Erreur lors du chargement du prestataire");
    } finally {
      setLoadingProvider(false);
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

    if (!provider?.profile_id) {
      setError("Impossible de trouver le prestataire");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Nom complet de l'utilisateur
      const userName = userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() ||
          userProfile.display_name ||
          "Un client"
        : "Un client";

      // Créer l'objet du message
      const subject = config.getSubject(userName);

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
          receiver_id: provider.profile_id,
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
        {/* Header avec infos du prestataire */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-200">
          {/* Photo de profil du prestataire */}
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
            {provider?.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={`${provider.first_name} ${provider.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : provider ? (
              <span className="text-white text-xl font-bold">
                {provider.first_name?.charAt(0).toUpperCase() || ''}
                {provider.last_name?.charAt(0).toUpperCase() || ''}
              </span>
            ) : (
              <User className="w-7 h-7 text-white" />
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex-1">
            {loadingProvider ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900">
                  {config.title}
                </h2>
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement...</span>
                </div>
              </>
            ) : provider ? (
              <>
                <h2 className="text-xl font-bold text-slate-900">
                  {provider.first_name} {provider.last_name}
                </h2>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <span>Prestataire</span>
                  {provider.occupations && (
                    <>
                      <span>•</span>
                      <span>{provider.occupations}</span>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900">
                  {config.title}
                </h2>
                <p className="text-slate-600">Prestataire</p>
              </>
            )}
          </div>

          {/* Indicateur de type de message */}
          {messageType !== "simple" && (
            <div
              className={`px-4 py-2 rounded-xl ${
                messageType === "accept"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : messageType === "revision"
                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              <span className="font-semibold text-sm">
                {messageType === "accept"
                  ? "Acceptation"
                  : messageType === "revision"
                  ? "Révision"
                  : "Refus"}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            disabled={isSending}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Objet du message */}
          {userProfile && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Objet du message :
                  </p>
                  <p className="text-slate-900 font-medium leading-relaxed">
                    {config.getSubject(
                      `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() ||
                        userProfile.display_name ||
                        "Un client"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-600 font-semibold mb-2">❌ Erreur</div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Message de succès */}
          {sentSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-600 font-semibold mb-1">
                ✅ Message envoyé !
              </div>
              <p className="text-green-700 text-sm">
                Votre message a été envoyé à {provider?.first_name}.
                Redirection vers la messagerie...
              </p>
            </div>
          )}

          {/* Messages prédéfinis */}
          {!isSending && !sentSuccess && !error && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                Messages prédéfinis :
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
                  À envoyer à {provider?.first_name}
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
                    <span>Message sécurisé et chiffré</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {message.length}/2500
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
                      <span>{isSending ? "Envoi..." : config.buttonText}</span>
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