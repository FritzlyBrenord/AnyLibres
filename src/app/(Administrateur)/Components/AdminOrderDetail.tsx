// ============================================================================
// COMPOSANT: AdminOrderDetail - Vue détaillée avec TOUTES les actions admin
// L'administrateur peut effectuer toutes les actions du client ET du prestataire
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  Loader2,
  Send,
  RefreshCw,
  Eye,
  Download,
  ExternalLink,
  AlertTriangle,
  Play,
  Upload,
  Image,
  Video,
  Music,
  Link,
  XCircle,
  RotateCcw,
  Ban,
  Star,
  Check,
  Briefcase,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/utils/lib/imageCompression";
import { compressVideo } from "@/utils/lib/videoCompression";
import { compressAudio } from "@/utils/lib/audioCompression";
import { AdminRefundSection } from "./AdminRefundSection";
import { useCurrency } from "@/hooks/useCurrency";
import DisputeDetailModal from "./DisputeDetailModal";
import { Gavel } from "lucide-react";

interface OrderDetails {
  id: string;
  client_id: string;
  provider_id: string;
  total_cents: number;
  fees_cents?: number;
  currency: string;
  status: string;
  payment_status: string;
  delivery_deadline: string;
  payment_intent_id?: string;
  payment_method?: string;
  payment_details?: any;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  revision_count?: number;
  metadata?: {
    location_type?: string;
    location_details?: any;
    requirements_answers?: Record<string, any>;
    checkout_details?: any;
  };
  order_items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
  }>;
  order_deliveries?: Array<{
    id: string;
    delivery_number: number;
    message?: string;
    file_url?: string;
    external_link?: string;
    delivered_at: string;
  }>;
  order_revisions?: Array<{
    id: string;
    revision_number: number;
    reason: string;
    details?: string;
    status: string;
    requested_at: string;
  }>;
  client?: {
    id: string;
    profile?: {
      first_name: string;
      last_name: string;
      email?: string;
      avatar_url?: string;
    };
  };
  provider?: {
    id: string;
    company_name?: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  service?: {
    id: string;
    title: { fr?: string; en?: string } | string;
    cover_image?: string;
  };
}

interface AdminOrderDetailProps {
  order: OrderDetails;
  onClose: () => void;
  onRefresh: () => void;
  isDark: boolean;
  openDeliveryModal?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de paiement",
  paid: "Payé - À démarrer",
  in_progress: "En cours",
  delivered: "Livré - En attente validation",
  revision_requested: "Révision demandée",
  completed: "Terminé",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-indigo-100 text-indigo-800 border-indigo-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AdminOrderDetail({
  order: initialOrder,
  onClose,
  onRefresh,
  isDark,
  openDeliveryModal = false,
}: AdminOrderDetailProps) {
  const [order, setOrder] = useState<OrderDetails>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<
    "client" | "provider" | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [revisionDetails, setRevisionDetails] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  const { convertFromUSD, formatAmount } = useCurrency();

  const formatPrice = (amount: number) => {
    return formatAmount(convertFromUSD(amount));
  };

  // Nouveaux états pour la livraison avec fichiers
  const [fileType, setFileType] = useState<
    "document" | "image" | "video" | "audio" | "link"
  >("document");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryLink, setDeliveryLink] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  // Charger les détails complets de la commande au mount ou si initialOrder change
  useEffect(() => {
    const loadFullOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/orders/${initialOrder.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.order) {
            console.log("Full order loaded:", data.order);
            setOrder(data.order);
          }
        }
      } catch (error) {
        console.error("Erreur chargement détails commande:", error);
        setOrder(initialOrder);
      } finally {
        setLoading(false);
      }
    };

    loadFullOrder();
  }, [initialOrder]);

  // Ouvrir le modal de livraison si demandé
  useEffect(() => {
    if (openDeliveryModal) {
      setShowDeliveryModal(true);
      console.log("📦 Modal de livraison ouvert automatiquement");
    }
  }, [openDeliveryModal]);

  // Rafraîchir les données de la commande
  const refreshOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          console.log("Order refreshed:", data.order);
          console.log("Order items:", data.order.order_items);
          console.log("Order deliveries:", data.order.order_deliveries);
          console.log("Order revisions:", data.order.order_revisions);
          setOrder(data.order);
        }
      }
    } catch (error) {
      console.error("Erreur rafraîchissement:", error);
    }
  };

  // Action admin générique
  const handleAction = async (
    action: string,
    extraData?: Record<string, any>,
  ) => {
    setActionLoading(action);
    try {
      const response = await fetch("/api/admin/orders/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          action,
          ...extraData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshOrder();
        onRefresh();
        return true;
      } else {
        alert(data.error || "Erreur lors de l'action");
        return false;
      }
    } catch (error) {
      console.error("Erreur action:", error);
      alert("Erreur lors de l'action");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Actions du PRESTATAIRE
  const handleStart = () => handleAction("start");

  const handleDeliver = async () => {
    if (!deliveryMessage.trim()) {
      alert("Veuillez ajouter un message de livraison");
      return;
    }

    setActionLoading("deliver");
    try {
      let fileUrl = null;

      // Upload du fichier si présent
      if (deliveryFile) {
        console.log("📤 Upload du fichier admin:", deliveryFile.name);
        setUploadStatus("Préparation du fichier...");
        setUploadProgress(10);

        let fileToUpload = deliveryFile;

        // Compression selon le type
        if (deliveryFile.type.startsWith("image/")) {
          setUploadStatus("Compression de l'image...");
          setUploadProgress(15);
          fileToUpload = await compressImage(deliveryFile, {
            maxSizeMB: 5,
            maxWidthOrHeight: 2560,
            onProgress: (progress) => {
              setUploadProgress(15 + Math.round(progress * 0.15));
            },
          });
        } else if (deliveryFile.type.startsWith("video/")) {
          setUploadStatus("Compression de la vidéo...");
          setUploadProgress(15);
          fileToUpload = await compressVideo(deliveryFile, {
            quality: 23,
            maxDuration: 300,
            maxSize: 200,
            onProgress: (progress) => {
              setUploadProgress(15 + Math.round(progress * 0.15));
            },
          });
        } else if (deliveryFile.type.startsWith("audio/")) {
          setUploadStatus("Compression de l'audio...");
          setUploadProgress(15);
          fileToUpload = await compressAudio(deliveryFile, {
            bitrate: "192k",
            maxDuration: 600,
            maxSize: 50,
            onProgress: (progress) => {
              setUploadProgress(15 + Math.round(progress * 0.15));
            },
          });
        }

        // Créer FormData pour l'upload
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("type", fileType); // ✅ "type" au lieu de "fileType"

        console.log(
          `📤 Upload - File type: "${fileToUpload.type}", Param type: "${fileType}", Nom: "${fileToUpload.name}"`,
        );

        setUploadStatus("Téléchargement en cours...");
        setUploadProgress(35);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          console.error(
            `❌ Upload error - Status: ${uploadResponse.status}`,
            uploadError,
          );
          throw new Error(
            uploadError.error || "Erreur lors de l'upload du fichier",
          );
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(
            uploadData.error || "Erreur lors de l'upload du fichier",
          );
        }

        fileUrl = uploadData.url;
        setUploadProgress(90);
        console.log("✅ Fichier uploadé:", fileUrl);
      }

      // Préparer les données pour l'API
      const apiData = {
        order_id: order.id,
        message: deliveryMessage,
        file_url: fileUrl,
        file_name: deliveryFile?.name || null,
        file_type: deliveryFile?.type || null,
        file_size_bytes: deliveryFile?.size || null,
        external_link: deliveryLink || null,
      };

      console.log("📨 Envoi livraison admin:", apiData);
      setUploadStatus("Enregistrement de la livraison...");
      setUploadProgress(95);

      // Appeler l'API de livraison
      const response = await fetch("/api/orders/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la livraison");
      }

      setUploadProgress(100);
      setUploadStatus("✅ Livraison réussie!");
      console.log("✅ Livraison admin réussie");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Réinitialiser et fermer
      setShowDeliveryModal(false);
      setDeliveryMessage("");
      setDeliveryFile(null);
      setDeliveryLink("");
      setFileType("document");
      setUploadProgress(0);
      setUploadStatus("");

      // Rafraîchir la commande
      await refreshOrder();
      alert("✅ Commande livrée avec succès!");
    } catch (error: any) {
      console.error("❌ Erreur livraison:", error);
      setUploadProgress(0);
      setUploadStatus("");
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Actions du CLIENT
  const handleAccept = () => handleAction("accept");

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) {
      alert("Veuillez indiquer la raison de la révision");
      return;
    }
    const success = await handleAction("revision", {
      reason: revisionReason,
      details: revisionDetails,
    });
    if (success) {
      setShowRevisionModal(false);
      setRevisionReason("");
      setRevisionDetails("");
    }
  };

  // Actions ADMIN
  const handleCancel = () => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      handleAction("cancel");
    }
  };

  const handleReactivate = () => {
    if (confirm("Réactiver cette commande ? Elle passera en statut 'paid'.")) {
      handleAction("reactivate");
    }
  };

  const handleForceComplete = () => {
    if (confirm("Forcer la complétion de cette commande ?")) {
      handleAction("force_complete");
    }
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Veuillez écrire un message");
      return;
    }

    setMessageSending(true);
    try {
      const recipientId =
        messageRecipient === "client" ? order.client_id : order.provider_id;

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          content: messageText,
          order_id: order.id,
          is_admin: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Message envoyé au ${messageRecipient === "client" ? "client" : "prestataire"}`,
        );
        setShowMessageModal(false);
        setMessageText("");
        setMessageRecipient(null);
      } else {
        alert(data.error || "Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setMessageSending(false);
    }
  };

  const openMessageModal = (recipient: "client" | "provider") => {
    setMessageRecipient(recipient);
    setMessageText("");
    setShowMessageModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getServiceTitle = () => {
    if (!order.service?.title) return "Service";
    if (typeof order.service.title === "string") return order.service.title;
    return order.service.title.fr || order.service.title.en || "Service";
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header sticky */}
      <div
        className={`sticky top-0 z-10 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Commande #{order.id?.slice(0, 8).toUpperCase()}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Mode Admin
                  </span>
                </div>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Créée le {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={refreshOrder}
              className={`p-2 rounded-lg ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Rafraîchir"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* === PANNEAU D'ACTIONS ADMIN === (Caché si refunded) */}
            {order.status !== "refunded" && (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-bold text-white">
                      Actions Administrateur
                    </h2>
                  </div>
                  <p className="text-purple-200 text-sm mt-1">
                    Vous pouvez effectuer toutes les actions du client et du
                    prestataire
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* ALERTE LITIGE (Priorité haute) */}
                  {order.status === "disputed" && (
                    <div className="p-4 rounded-xl border border-red-300 bg-red-50 mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-200 rounded-lg text-red-700">
                          <Gavel className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-900">Litige Ouvert</h3>
                          <p className="text-sm text-red-700">Un conflit a été déclaré sur cette commande.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowDisputeModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-md flex items-center gap-2"
                      >
                         <Shield className="w-4 h-4" />
                         Gérer le litige
                      </button>
                    </div>
                  )}

                  {/* Actions PRESTATAIRE */}
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-blue-50 border-blue-200"}`}
                  >
                    <h3
                      className={`font-bold mb-3 flex items-center gap-2 ${isDark ? "text-blue-400" : "text-blue-800"}`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Actions Prestataire
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Démarrer */}
                      <button
                        onClick={handleStart}
                        disabled={order.status !== "paid" || !!actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === "start" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Démarrer
                      </button>

                      {/* Livrer */}
                      <button
                        onClick={() => setShowDeliveryModal(true)}
                        disabled={
                          !["in_progress", "revision_requested"].includes(
                            order.status,
                          ) || !!actionLoading
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Livrer
                      </button>
                    </div>
                  </div>

                  {/* Actions CLIENT */}
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-green-50 border-green-200"}`}
                  >
                    <h3
                      className={`font-bold mb-3 flex items-center gap-2 ${isDark ? "text-green-400" : "text-green-800"}`}
                    >
                      <User className="w-4 h-4" />
                      Actions Client
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Accepter */}
                      <button
                        onClick={handleAccept}
                        disabled={
                          order.status !== "delivered" || !!actionLoading
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === "accept" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accepter la livraison
                      </button>

                      {/* Demander révision */}
                      <button
                        onClick={() => setShowRevisionModal(true)}
                        disabled={
                          order.status !== "delivered" || !!actionLoading
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Demander révision
                      </button>
                    </div>
                  </div>

                  {/* Actions ADMIN SPÉCIALES */}
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-red-50 border-red-200"}`}
                  >
                    <h3
                      className={`font-bold mb-3 flex items-center gap-2 ${isDark ? "text-red-400" : "text-red-800"}`}
                    >
                      <Shield className="w-4 h-4" />
                      Actions Admin Spéciales
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Réactiver (si annulée) */}
                      {order.status === "cancelled" && (
                        <button
                          onClick={handleReactivate}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === "reactivate" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Réactiver la commande
                        </button>
                      )}

                      {/* Forcer la complétion */}
                      {!["completed", "cancelled", "refunded"].includes(
                        order.status,
                      ) && (
                        <button
                          onClick={handleForceComplete}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === "force_complete" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Forcer complétion
                        </button>
                      )}

                      {/* Annuler */}
                      {!["completed", "cancelled", "refunded"].includes(
                        order.status,
                      ) && (
                        <button
                          onClick={handleCancel}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                          Annuler la commande
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION REMBOURSEMENTS */}
            <AdminRefundSection
              orderId={order.id}
              providerId={order.provider_id}
              clientId={order.client_id}
              orderTotal={order.total_cents / 100}
              isDark={isDark}
            />

            {/* Statut Commande Complétée */}
            {order.status === "completed" && (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden border-2 ${
                  isDark
                    ? "bg-gradient-to-br from-green-900 to-emerald-900 border-green-600"
                    : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-500"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-emerald-500">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          isDark ? "text-green-300" : "text-green-800"
                        }`}
                      >
                        Commande Complétée ✓
                      </h3>
                      <p
                        className={isDark ? "text-green-400" : "text-green-700"}
                      >
                        Tous les produits ont été livrés et acceptés
                      </p>
                    </div>
                  </div>

                  {/* Résumé de complétude */}
                  <div
                    className={`mt-4 p-4 rounded-xl space-y-2 ${
                      isDark ? "bg-black/20" : "bg-white/50"
                    }`}
                  >
                    {order.order_deliveries &&
                      order.order_deliveries.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-emerald-500" />
                          <span
                            className={
                              isDark ? "text-green-300" : "text-green-700"
                            }
                          >
                            <strong>{order.order_deliveries.length}</strong>{" "}
                            livraison(s) effectuée(s)
                          </span>
                        </div>
                      )}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span
                          className={
                            isDark ? "text-green-300" : "text-green-700"
                          }
                        >
                          <strong>{order.order_items.length}</strong> produit(s)
                          livrés
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span
                        className={isDark ? "text-green-300" : "text-green-700"}
                      >
                        Client satisfait - Commande validée
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statut Commande Remboursée */}
            {order.status === "refunded" && (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden border-2 ${
                  isDark
                    ? "bg-gradient-to-br from-gray-800 to-slate-800 border-gray-600"
                    : "bg-gradient-to-br from-gray-50 to-slate-100 border-gray-400"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gray-500">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Commande Remboursée 💰
                      </h3>
                      <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                        Cette commande a été remboursée au client
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-4 p-4 rounded-xl space-y-2 ${
                      isDark ? "bg-black/20" : "bg-white/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Montant déduit du solde prestataire
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Montant crédité au client
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-500" />
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Commande verrouillée - Aucune action possible
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: DETAILS TECHNIQUES & REQUIREMENTS (NEW) */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Infos Techniques & Besoins
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Tarification détaillée (Metadata) */}
                {(order.metadata as any)?.pricing && (
                  <div>
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Détail de la Tarification
                    </h3>
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-100"}`}
                    >
                      <p
                        className={`text-sm mb-3 font-mono ${isDark ? "text-blue-300" : "text-blue-700"}`}
                      >
                        {(order.metadata as any).formula ||
                          (order.metadata as any).pricing.formula}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                          <p className="text-xs text-gray-500 mb-1">
                            Prestataire reçoit
                          </p>
                          <p className="font-bold text-green-600">
                            {formatPrice(
                              (order.metadata as any).pricing
                                .provider_receives_cents / 100,
                            )}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                          <p className="text-xs text-gray-500 mb-1">
                            Commission Admin
                          </p>
                          <p className="font-bold text-purple-600">
                            {formatPrice(
                              (order.metadata as any).pricing.fees_cents / 100,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements Answers (Metadata) */}
                {(order.metadata as any)?.requirements_answers && (
                  <div>
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Réponses au formulaire de commande
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(
                        (order.metadata as any).requirements_answers,
                      ).map(([key, value]: [string, any], idx) => (
                        <div
                          key={key}
                          className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-white border-gray-100"}`}
                        >
                          <p
                            className={`text-xs font-bold mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            QUESTION #{idx + 1}
                          </p>
                          {typeof value === "string" &&
                          value.startsWith("http") ? (
                            <div className="flex items-center gap-3">
                              {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                  src={value}
                                  alt="Requirement"
                                  className="w-20 h-20 rounded-lg object-cover border"
                                />
                              ) : (
                                <div className="p-3 bg-blue-100 rounded-lg">
                                  <FileText className="text-blue-600" />
                                </div>
                              )}
                              <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                              >
                                Voir le fichier <ExternalLink size={14} />
                              </a>
                            </div>
                          ) : typeof value === "object" && value?.url ? (
                            <div className="flex items-center gap-3">
                              {value.type?.startsWith("image") ? (
                                <img
                                  src={value.url}
                                  alt="Requirement"
                                  className="w-20 h-20 rounded-lg object-cover border"
                                />
                              ) : (
                                <div className="p-3 bg-blue-100 rounded-lg">
                                  <FileText className="text-blue-600" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {value.name || "Fichier"}
                                </p>
                                <a
                                  href={value.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                                >
                                  Télécharger (
                                  {(value.size / 1024 / 1024).toFixed(2)} MB){" "}
                                  <Download size={12} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p
                              className={`text-sm ${isDark ? "text-white" : "text-gray-800"}`}
                            >
                              {String(value)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logistics (Location Metadata) */}
                {(order.metadata as any)?.location_type && (
                  <div>
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Logistique & Lieu
                    </h3>
                    <div
                      className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100"}`}
                    >
                      <div className="p-3 bg-indigo-600 rounded-xl text-white">
                        <Package size={20} />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold capitalize ${isDark ? "text-indigo-300" : "text-indigo-900"}`}
                        >
                          Type:{" "}
                          {(order.metadata as any).location_type === "remote"
                            ? "À distance (Remote)"
                            : "Sur place (On-site)"}
                        </p>
                        {(order.metadata as any).total_delivery_days && (
                          <p className="text-xs text-indigo-500">
                            Délai estimé:{" "}
                            {(order.metadata as any).total_delivery_days} jours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations du service */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div
                className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Produits & Services
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <h3
                  className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {getServiceTitle()}
                </h3>

                {order.order_items && order.order_items.length > 0 ? (
                  <>
                    {order.order_items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`mb-4 p-5 rounded-2xl border-2 transition-all ${
                          isDark
                            ? "bg-gray-700 border-gray-600 hover:border-purple-500"
                            : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-400"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-bold px-3 py-1 rounded-full bg-purple-600 text-white">
                                #{index + 1}
                              </span>
                              <h4
                                className={`font-bold text-lg ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {item.title}
                              </h4>
                            </div>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              ID: {item.service_id?.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {formatPrice(item.subtotal_cents / 100)}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex flex-wrap gap-4 p-3 rounded-xl ${
                            isDark ? "bg-gray-600" : "bg-white"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Quantité
                            </p>
                            <p
                              className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {item.quantity}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Prix unitaire
                            </p>
                            <p
                              className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {formatPrice(item.unit_price_cents / 100)}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Sous-total
                            </p>
                            <p className={`font-bold text-green-600`}>
                              {formatPrice(item.subtotal_cents / 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p
                    className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Aucun produit dans cette commande
                  </p>
                )}

                {/* Résumé financier */}
                <div
                  className={`mt-6 p-5 rounded-2xl border-2 ${
                    isDark
                      ? "bg-gray-700 border-green-600"
                      : "bg-green-50 border-green-300"
                  }`}
                >
                  <h4
                    className={`font-bold mb-4 flex items-center gap-2 ${
                      isDark ? "text-green-400" : "text-green-800"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Résumé Financier
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        Sous-total produits
                      </span>
                      <span
                        className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {formatPrice(order.total_cents / 100)}
                      </span>
                    </div>
                    {order.fees_cents ? (
                      <div className="flex justify-between items-center">
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          Frais
                        </span>
                        <span
                          className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {formatPrice(order.fees_cents / 100)}
                        </span>
                      </div>
                    ) : null}
                    <div
                      className={`pt-2 border-t ${
                        isDark ? "border-gray-600" : "border-green-200"
                      } flex justify-between items-center`}
                    >
                      <span
                        className={`font-bold ${isDark ? "text-green-400" : "text-green-800"}`}
                      >
                        Total
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          isDark ? "text-green-400" : "text-green-700"
                        }`}
                      >
                        {formatPrice(
                          (order.total_cents + (order.fees_cents || 0)) / 100,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des livraisons */}
            {order.order_deliveries && order.order_deliveries.length > 0 && (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                <div
                  className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-indigo-600" />
                      <h2
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Livraisons ({order.order_deliveries.length})
                      </h2>
                    </div>
                    {order.status === "completed" && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Complétée
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {order.order_deliveries.map((delivery, deliveryIndex) => (
                    <div
                      key={delivery.id}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        isDark
                          ? "bg-gray-700 border-indigo-600"
                          : "bg-indigo-50 border-indigo-300"
                      }`}
                    >
                      {/* Header livraison */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-200 dark:border-indigo-700">
                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                              isDark
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-600 text-white"
                            }`}
                          >
                            Livraison #{delivery.delivery_number}
                          </span>
                          <p
                            className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {formatDate(delivery.delivered_at)}
                          </p>
                        </div>
                        <div
                          className={`text-right ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          <p className="text-xs uppercase">Statut</p>
                          <p
                            className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}
                          >
                            Livrée
                          </p>
                        </div>
                      </div>

                      {/* Message de livraison */}
                      {delivery.message && (
                        <div
                          className={`mb-4 p-3 rounded-lg ${isDark ? "bg-gray-600" : "bg-white"}`}
                        >
                          <p
                            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                          >
                            <strong>Message:</strong> {delivery.message}
                          </p>
                        </div>
                      )}

                      {/* Produits livrés - TOUJOURS affichés (pas juste s'il y a des items) */}
                      <div className="mb-4">
                        <p
                          className={`text-xs font-bold mb-2 uppercase ${
                            isDark ? "text-indigo-400" : "text-indigo-700"
                          }`}
                        >
                          📦 Produits livrés ({order.order_items?.length || 0})
                        </p>
                        {order.order_items && order.order_items.length > 0 ? (
                          <div
                            className={`space-y-2 p-3 rounded-lg ${
                              isDark ? "bg-gray-600" : "bg-white"
                            }`}
                          >
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  isDark
                                    ? "bg-gray-700 hover:bg-gray-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                } transition-colors`}
                              >
                                <div className="flex-1">
                                  <p
                                    className={`text-sm font-medium ${
                                      isDark ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                  <div
                                    className={`text-xs flex items-center gap-2 mt-1 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    <span>
                                      Quantité: <strong>{item.quantity}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Prix unitaire:{" "}
                                      <strong>
                                        {formatPrice(
                                          item.unit_price_cents / 100,
                                        )}
                                      </strong>
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`font-bold text-sm ${
                                      isDark
                                        ? "text-indigo-400"
                                        : "text-indigo-700"
                                    }`}
                                  >
                                    {formatPrice(item.subtotal_cents / 100)}
                                  </p>
                                  <p
                                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                  >
                                    Sous-total
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            className={`p-3 rounded-lg text-center text-sm ${isDark ? "bg-gray-600 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                          >
                            Aucun produit
                          </div>
                        )}
                      </div>

                      {/* Fichiers et liens */}
                      {(delivery.file_url || delivery.external_link) && (
                        <div className="flex gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                          {delivery.file_url && (
                            <a
                              href={delivery.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger
                            </a>
                          )}
                          {delivery.external_link && (
                            <a
                              href={delivery.external_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Lien externe
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique des révisions */}
            {order.order_revisions && order.order_revisions.length > 0 ? (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                <div
                  className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-orange-600" />
                    <h2
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Révisions demandées ({order.order_revisions.length})
                    </h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {order.order_revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className={`p-4 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-orange-50 border-orange-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          Révision #{revision.revision_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            revision.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {revision.status === "completed"
                            ? "Terminée"
                            : "En attente"}
                        </span>
                      </div>
                      <p
                        className={`font-medium mb-2 ${isDark ? "text-orange-400" : "text-orange-800"}`}
                      >
                        Raison: {revision.reason}
                      </p>
                      {revision.details && (
                        <p
                          className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {revision.details}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Demandée le {formatDate(revision.requested_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                <div
                  className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-gray-400" />
                    <h2
                      className={`text-lg font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Révisions demandées (0)
                    </h2>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Aucune révision demandée pour cette commande
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">Client</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-violet-600">
                      {order.client?.profile?.first_name?.charAt(0) || "C"}
                    </span>
                  </div>
                  <div>
                    <h4
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {order.client?.profile?.first_name}{" "}
                      {order.client?.profile?.last_name}
                    </h4>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      ID: {order.client_id?.slice(0, 8)}
                    </p>
                    {order.client?.profile?.email && (
                      <p
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {order.client.profile.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openMessageModal("client")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message au client
                </button>
              </div>
            </div>

            {/* Prestataire */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">Prestataire</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {order.provider?.company_name ||
                        `${order.provider?.profile?.first_name} ${order.provider?.profile?.last_name}`}
                    </h4>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      ID: {order.provider_id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openMessageModal("provider")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message au prestataire
                </button>
              </div>
            </div>

            {/* Paiement */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">Paiement</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    Montant
                  </span>
                  <span
                    className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {formatPrice(order.total_cents / 100)}
                  </span>
                </div>
                {order.fees_cents && (
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Frais
                    </span>
                    <span
                      className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formatPrice(order.fees_cents / 100)}
                    </span>
                  </div>
                )}
                <div
                  className={`pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Statut
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        order.payment_status === "succeeded"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.payment_status === "succeeded"
                        ? "Payé"
                        : order.payment_status}
                    </span>
                  </div>

                  {order.payment_intent_id && (
                    <div className="flex justify-between items-start pt-2">
                      <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        ID Transaction
                      </span>
                      <span
                        className={`text-xs font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {order.payment_intent_id}
                      </span>
                    </div>
                  )}
                  {order.payment_method && (
                    <div className="flex justify-between items-center pt-2">
                      <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        Méthode
                      </span>
                      <span
                        className={`text-xs capitalize ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {order.payment_method}
                      </span>
                    </div>
                  )}
                  {order.completed_at && (
                    <div className="flex justify-between items-center pt-2">
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Terminée le
                      </span>
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {new Date(order.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Délai */}
            <div
              className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white">Délai & Dates</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Créée */}
                <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Créée
                    </p>
                    <p
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Livraisons */}
                {order.order_deliveries &&
                  order.order_deliveries.length > 0 && (
                    <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <Send className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p
                          className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        >
                          Première livraison
                        </p>
                        <p
                          className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {new Date(
                            order.order_deliveries[0].delivered_at,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p
                          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {new Date(
                            order.order_deliveries[0].delivered_at,
                          ).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Date limite */}
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <div>
                    <p
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Date limite
                    </p>
                    <p
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {new Date(order.delivery_deadline).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/* Temps restant */}
                <div
                  className={`p-4 rounded-xl text-center ${isDark ? "bg-gray-700" : "bg-gray-900"}`}
                >
                  <p className="text-gray-400 text-xs mb-1">Temps restant</p>
                  <p className="text-white font-bold">
                    {(() => {
                      const remaining = Math.ceil(
                        (new Date(order.delivery_deadline).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24),
                      );
                      if (remaining < 0) {
                        return (
                          <span className="text-red-400">
                            Retard de {Math.abs(remaining)}j
                          </span>
                        );
                      } else if (remaining === 0) {
                        return (
                          <span className="text-orange-400">Aujourd'hui !</span>
                        );
                      } else {
                        return `${remaining} jours`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de livraison */}
      <AnimatePresence>
        {showDeliveryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeliveryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-2xl w-full rounded-2xl shadow-xl p-6 ${isDark ? "bg-gray-800" : "bg-white"} max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                📦 Livrer la commande (Admin)
              </h2>

              <div className="space-y-6">
                {/* Type de livraison */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Type de livraison
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      {
                        type: "document" as const,
                        icon: FileText,
                        label: "Doc",
                      },
                      { type: "image", icon: Image, label: "Image" },
                      { type: "video", icon: Video, label: "Vidéo" },
                      { type: "audio", icon: Music, label: "Audio" },
                      { type: "link", icon: Link, label: "Lien" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => setFileType(item.type)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          fileType === item.type
                            ? isDark
                              ? "border-purple-500 bg-purple-500/20 text-purple-400"
                              : "border-purple-500 bg-purple-50 text-purple-700"
                            : isDark
                              ? "border-gray-600 hover:border-gray-500 text-gray-400"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <item.icon size={20} className="mx-auto mb-1" />
                        <span className="text-xs font-medium block text-center">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Message de livraison *
                  </label>
                  <textarea
                    value={deliveryMessage}
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    placeholder="Décrivez le travail livré..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>

                {/* Upload ou Lien */}
                {fileType !== "link" ? (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Fichier livrable
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        isDark
                          ? "border-gray-600 hover:border-purple-500 hover:bg-gray-700/50"
                          : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                      }`}
                    >
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDeliveryFile(file);

                          // Auto-détecter le type de fichier basé sur son MIME type
                          if (file) {
                            if (file.type.startsWith("image/")) {
                              setFileType("image");
                            } else if (file.type.startsWith("video/")) {
                              setFileType("video");
                            } else if (file.type.startsWith("audio/")) {
                              setFileType("audio");
                            } else {
                              setFileType("document");
                            }
                            console.log(
                              `📁 Fichier sélectionné: ${file.name}, Type détecté: ${file.type}`,
                            );
                          }
                        }}
                        className="hidden"
                        id="admin-delivery-file"
                      />
                      <label
                        htmlFor="admin-delivery-file"
                        className="cursor-pointer block"
                      >
                        <Upload
                          size={32}
                          className={`mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-400"}`}
                        />
                        <p
                          className={`text-sm ${isDark ? "text-gray-200" : "text-gray-600"}`}
                        >
                          Cliquez pour télécharger ou glissez votre fichier
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          {fileType === "image"
                            ? "JPG, PNG, GIF (max 10MB)"
                            : fileType === "video"
                              ? "MP4, MOV (max 100MB)"
                              : fileType === "audio"
                                ? "MP3, WAV (max 50MB)"
                                : "PDF, DOC, ZIP (max 50MB)"}
                        </p>
                      </label>
                    </div>
                    {deliveryFile && (
                      <div
                        className={`mt-3 flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-50"}`}
                      >
                        <div className="flex items-center">
                          <FileText
                            className={`${isDark ? "text-purple-400" : "text-purple-600"} mr-2`}
                            size={20}
                          />
                          <span
                            className={`text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                          >
                            {deliveryFile.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setDeliveryFile(null)}
                          className={`${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Lien externe
                    </label>
                    <input
                      type="url"
                      value={deliveryLink}
                      onChange={(e) => setDeliveryLink(e.target.value)}
                      placeholder="https://example.com/votre-travail"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                )}

                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}
                      >
                        {uploadStatus}
                      </span>
                      <span
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {uploadProgress}%
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2.5 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                    >
                      <div
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setDeliveryFile(null);
                    setDeliveryLink("");
                    setFileType("document");
                  }}
                  disabled={!!actionLoading}
                  className={`flex-1 px-4 py-2 rounded-xl border ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeliver}
                  disabled={!!actionLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === "deliver" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Livrer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de révision */}
      <AnimatePresence>
        {showRevisionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRevisionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-lg w-full rounded-2xl shadow-xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Demander une révision (Admin)
              </h2>
              <input
                type="text"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Raison de la révision..."
                className={`w-full px-4 py-3 rounded-xl border mb-4 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <textarea
                value={revisionDetails}
                onChange={(e) => setRevisionDetails(e.target.value)}
                placeholder="Détails et recommandations..."
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border mb-4 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className={`flex-1 px-4 py-2 rounded-xl border ${
                    isDark
                      ? "border-gray-600 text-gray-300"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestRevision}
                  disabled={!!actionLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {actionLoading === "revision" ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Demander"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de message */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMessageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-lg w-full rounded-2xl shadow-xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Message au{" "}
                {messageRecipient === "client" ? "client" : "prestataire"}
              </h2>
              <p
                className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {messageRecipient === "client"
                  ? `${order.client?.profile?.first_name} ${order.client?.profile?.last_name}`
                  : order.provider?.company_name ||
                    `${order.provider?.profile?.first_name} ${order.provider?.profile?.last_name}`}
              </p>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Écrivez votre message..."
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border mb-4 resize-none ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className={`flex-1 px-4 py-2 rounded-xl border font-medium ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={messageSending || !messageText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {messageSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal Litige */}
      {showDisputeModal && (order as any).dispute && (
        <DisputeDetailModal 
          dispute={(order as any).dispute}
          onClose={() => setShowDisputeModal(false)}
          onUpdate={() => {
            refreshOrder();
            onRefresh();
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
}
