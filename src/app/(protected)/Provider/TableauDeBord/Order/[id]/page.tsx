// ============================================================================
// PAGE: Provider Order Detail - Vue détaillée AMÉLIORÉE avec UX optimale
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/utils/lib/imageCompression";
import { compressVideo } from "@/utils/lib/videoCompression";
import { compressAudio } from "@/utils/lib/audioCompression";
import OrderChat from "@/components/order/OrderChat";
import OrderMessagingModal from "@/components/message/OrderMessagingModal";
import ProviderOrderReviewSection from "@/components/review/ProviderOrderReviewSection";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface OrderDetails {
  id: string;
  client_id: string;
  provider_id: string;
  total_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  delivery_deadline: string;
  message?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    location_type?: string;
    location_details?: {
      type: string;
      on_site_confirmed: boolean;
      contact_choice: string | null;
      confirmed_at: string | null;
    };
    requirements_answers?: Record<string, any>;
    checkout_details?: {
      selected_extras_indices: number[];
      selected_extras: any[];
      client_message: string | null;
    };
    pricing?: any;
  };
  order_items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
    selected_extras?: any[];
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
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  service?: {
    id: string;
    title: { fr: string; en: string };
    cover_image?: string;
    requirements?: Array<{
      id: string;
      type: "text" | "file" | "url";
      description: { fr: string; en: string };
      required: boolean;
    }>;
  };
  dispute?: {
    id: string;
    reason: string;
    details: string;
    status: string;
    session_status?: string;
    created_at: string;
    resolved_at?: string;
  };
}

const getStatusLabels = (t: any) => ({
  pending: t.ordersPage.status.pending,
  paid: t.ordersPage.status.paid, // Or "Payé - À démarrer"
  in_progress: t.ordersPage.status.in_progress,
  delivered: t.ordersPage.status.delivered,
  revision_requested: t.ordersPage.status.revision_requested,
  completed: t.ordersPage.status.completed,
  cancelled: t.ordersPage.status.cancelled,
  refunded: t.ordersPage.status.refunded,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-indigo-100 text-indigo-800 border-indigo-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

// ============================================================================
// COMPONENT: DeliveryModal
// ============================================================================

const DeliveryModal = ({
  isOpen,
  onClose,
  order,
  isRevision,
  onDeliver,
  uploadProgress: externalUploadProgress,
  uploadStatus: externalUploadStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  isRevision: boolean;
  onDeliver: (data: any) => void;
  uploadProgress: number;
  uploadStatus: string;
}) => {
  const { t } = useSafeLanguage();
  const [fileType, setFileType] = useState<
    "document" | "image" | "video" | "audio" | "link"
  >("document");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");

  const isUploading =
    externalUploadProgress > 0 && externalUploadProgress < 100;
  const uploadProgress = externalUploadProgress;
  const uploadStatus = externalUploadStatus;

  const handleSubmit = () => {
    if (!message.trim()) {
      alert(t.ordersPage.deliveryModal.errorRequiredMessage);
      return;
    }
    onDeliver({ message, file, link, fileType });
  };

  useEffect(() => {
    if (isRevision && !message) {
      setMessage(t.ordersPage.deliveryModal.revisionDefaultMessage);
    }
  }, [isRevision]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isRevision
                  ? t.ordersPage.deliveryModal.titleRevision
                  : t.ordersPage.deliveryModal.titleDeliver}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.ordersPage.deliveryModal.subtitle
                  .replace("{id}", order?.id?.split("-")[0] || "???")
                  .replace(
                    "{client}",
                    order?.client?.full_name || t.ordersPage.list.unknownClient,
                  )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="sr-only">Fermer</span>
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Type de livraison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t.ordersPage.deliveryModal.typeLabel}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  {
                    type: "document" as const,
                    icon: FileText,
                    label: t.ordersPage.deliveryModal.types.document,
                  },
                  {
                    type: "image",
                    icon: Image,
                    label: t.ordersPage.deliveryModal.types.image,
                  },
                  {
                    type: "video",
                    icon: Video,
                    label: t.ordersPage.deliveryModal.types.video,
                  },
                  {
                    type: "audio",
                    icon: Music,
                    label: t.ordersPage.deliveryModal.types.audio,
                  },
                  {
                    type: "link",
                    icon: Link,
                    label: t.ordersPage.deliveryModal.types.link,
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setFileType(item.type as any)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      fileType === item.type
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <item.icon size={20} className="mx-auto mb-2" />
                    <span className="text-xs font-medium block text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.ordersPage.deliveryModal.messageLabel}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  isRevision
                    ? t.ordersPage.deliveryModal.messagePlaceholderRevision
                    : t.ordersPage.deliveryModal.messagePlaceholder
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Upload ou Lien */}
            {fileType !== "link" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.ordersPage.deliveryModal.fileLabel}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="delivery-file"
                  />
                  <label htmlFor="delivery-file" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600">
                      {t.ordersPage.deliveryModal.fileHint}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {fileType === "image"
                        ? t.ordersPage.deliveryModal.fileTypes.image
                        : fileType === "video"
                          ? t.ordersPage.deliveryModal.fileTypes.video
                          : fileType === "audio"
                            ? t.ordersPage.deliveryModal.fileTypes.audio
                            : t.ordersPage.deliveryModal.fileTypes.generic}
                    </p>
                  </label>
                </div>
                {file && (
                  <div className="mt-3 flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="text-blue-600 mr-2" size={20} />
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.ordersPage.deliveryModal.externalLinkLabel}
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={
                    t.ordersPage.deliveryModal.externalLinkPlaceholder
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* Progress Bar */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {uploadStatus}
                  </span>
                  <span className="text-sm text-gray-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.ordersPage.deliveryModal.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t.ordersPage.deliveryModal.uploading}
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    {isRevision
                      ? t.ordersPage.deliveryModal.submitRevision
                      : t.ordersPage.deliveryModal.submitDeliver}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProviderOrderDetailPage() {
  const { t, language } = useSafeLanguage();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  // État pour le modal de livraison
  const [deliveryModal, setDeliveryModal] = useState<{
    isOpen: boolean;
    isRevision: boolean;
    uploadProgress: number;
    uploadStatus: string;
  }>({
    isOpen: false,
    isRevision: false,
    uploadProgress: 0,
    uploadStatus: "",
  });

  // État pour le modal de contact client
  const [contactClientModalOpen, setContactClientModalOpen] = useState(false);

  const STATUS_LABELS = getStatusLabels(t);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/providers/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        console.log("🔍 DEBUG: Order data received:", {
          status: data.data.order.status,
          hasDispute: !!data.data.order.dispute,
          disputeDetails: data.data.order.dispute?.details,
          disputeSessionStatus: data.data.order.dispute?.session_status,
          fullDispute: data.data.order.dispute
        });
        setOrder(data.data.order);
        if (data.data.order.provider_id) {
          setCurrentUserId(data.data.order.provider_id);
        }
      } else {
        console.error("❌ Error loading order:", data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Erreur lors du chargement de la commande");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrder = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/orders/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const data = await response.json();
      if (data.success) {
        alert(t.ordersPage.detail.successStart);
        loadOrder();
      } else {
        alert(`${t.common?.error || "Error"}: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Erreur lors du démarrage");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliver = async (deliveryData: {
    message: string;
    file: File | null;
    link: string;
    fileType: "document" | "image" | "video" | "audio" | "link";
  }) => {
    if (!order) return;

    try {
      setDeliveryModal((prev) => ({
        ...prev,
        uploadProgress: 1,
        uploadStatus: "Préparation...",
      }));

      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSizeBytes = null;

      // Upload du fichier si présent
      if (deliveryData.file) {
        setDeliveryModal((prev) => ({
          ...prev,
          uploadStatus: "Compression du fichier...",
        }));

        let fileToUpload = deliveryData.file;

        // Compression selon le type
        if (deliveryData.file.type.startsWith("image/")) {
          fileToUpload = await compressImage(deliveryData.file, {
            maxSizeMB: 5,
            maxWidthOrHeight: 2560,
            onProgress: (progress) =>
              setDeliveryModal((prev) => ({
                ...prev,
                uploadProgress: Math.round(progress * 0.5),
                uploadStatus: `Compression image: ${progress}%`,
              })),
          });
        } else if (deliveryData.file.type.startsWith("video/")) {
          fileToUpload = await compressVideo(deliveryData.file, {
            quality: 23,
            maxDuration: 300,
            maxSize: 200,
            onProgress: (progress) =>
              setDeliveryModal((prev) => ({
                ...prev,
                uploadProgress: Math.round(progress * 0.5),
                uploadStatus: `Compression vidéo: ${progress}%`,
              })),
          });
        } else if (deliveryData.file.type.startsWith("audio/")) {
          fileToUpload = await compressAudio(deliveryData.file, {
            bitrate: "192k",
            maxDuration: 600,
            maxSize: 50,
            onProgress: (progress) =>
              setDeliveryModal((prev) => ({
                ...prev,
                uploadProgress: Math.round(progress * 0.5),
                uploadStatus: `Compression audio: ${progress}%`,
              })),
          });
        }

        // Upload vers Supabase
        setDeliveryModal((prev) => ({
          ...prev,
          uploadProgress: 50,
          uploadStatus: "Téléchargement...",
        }));

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("type", deliveryData.fileType);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || "Erreur lors de l'upload");
        }

        fileUrl = uploadData.url;
        fileName = deliveryData.file.name;
        fileType = deliveryData.file.type;
        fileSizeBytes = fileToUpload.size;
      }

      // Envoi de la livraison
      setDeliveryModal((prev) => ({
        ...prev,
        uploadProgress: 75,
        uploadStatus: "Enregistrement de la livraison...",
      }));

      const response = await fetch("/api/orders/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          message: deliveryData.message,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          file_size_bytes: fileSizeBytes,
          external_link: deliveryData.link || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeliveryModal((prev) => ({
          ...prev,
          uploadProgress: 100,
          uploadStatus: "Livraison réussie !",
        }));

        setTimeout(() => {
          setDeliveryModal({
            isOpen: false,
            isRevision: false,
            uploadProgress: 0,
            uploadStatus: "",
          });
          loadOrder();
          alert("✅ Commande livrée avec succès !");
        }, 1000);
      } else {
        throw new Error(data.error || "Erreur lors de la livraison");
      }
    } catch (error: any) {
      console.error("Erreur lors de la livraison:", error);
      alert(`❌ Erreur: ${error.message}`);
      setDeliveryModal((prev) => ({
        ...prev,
        uploadProgress: 0,
        uploadStatus: "",
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US",
      {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t.ordersPage.detail.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t.common?.error || "Erreur"}
          </h2>
          <p className="text-slate-600 mb-6">
            {error || t.ordersPage.detail.notFound}
          </p>
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Order")}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            {t.ordersPage.detail.backToList}
          </button>
        </div>
      </div>
    );
  }

  // Calculer les révisions en attente
  const pendingRevisions =
    order.order_revisions?.filter((r) => r.status === "pending") || [];
  const hasRevisionRequested =
    order.status === "revision_requested" && pendingRevisions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Order")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {t.ordersPage.detail.backToList}
            </span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Commande #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ||
                    "bg-slate-100 text-slate-800 border-slate-200"
                  }`}
                >
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ||
                    order.status}
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                {t.ordersPage.detail.createdOn.replace(
                  "{date}",
                  formatDate(order.created_at),
                )}
              </p>
            </div>

            {/* Actions rapides - Cachées si commande remboursée ou annulée */}
            {order.status !== "refunded" && order.status !== "cancelled" && (
              <div className="flex gap-3">
                {order.status === "paid" && (
                  <button
                    onClick={handleStartOrder}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {t.ordersPage.detail.startOrder}
                  </button>
                )}
                {/* Bouton Contact Client */}
                <button
                  onClick={() => setContactClientModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  {t.common?.contact || "Contacter le client"}
                </button>

                {(order.status === "in_progress" ||
                  order.status === "revision_requested" ||
                  order.status === "delivery_delayed") && (
                  <button
                    onClick={() =>
                      setDeliveryModal({
                        isOpen: true,
                        isRevision: order.status === "revision_requested",
                        uploadProgress: 0,
                        uploadStatus: "",
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-4 h-4" />
                    {order.status === "revision_requested"
                      ? t.ordersPage.detail.deliverRevision
                      : t.ordersPage.detail.deliverWork}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bannière d'alerte pour commande remboursée */}
      {order.status === "refunded" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gradient-to-r from-gray-600 to-slate-700 text-white rounded-2xl shadow-2xl p-6 border-2 border-gray-400">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  {t.ordersPage.detail.refundedBanner.title}
                </h3>
                <p className="text-white/90 mb-2">
                  {t.ordersPage.detail.refundedBanner.text}
                </p>
                <p className="text-white/70 text-sm">
                  {t.ordersPage.detail.refundedBanner.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de contact client */}
      <OrderMessagingModal
        open={contactClientModalOpen}
        onClose={() => setContactClientModalOpen(false)}
        providerId={currentUserId} // L'ID de l'expéditeur (le prestataire) n'est pas utilisé comme ID de fetch ici pour le destinataire, mais on peut le passer
        clientId={order.client_id} // ID du client destinataire
        orderId={order.id}
        messageType="simple"
        recipientType="client" // IMPORTANT: on contacte le CLIENT
        initialRecipientData={order.client}
        onMessageSent={() => {
          setContactClientModalOpen(false);
          // Optionnel refetch
        }}
        serviceId={order.service?.id}
        serviceTitle={order.service?.title?.fr || "votre commande"}
      />

      {/* Bannière d'alerte pour révisions */}
      {hasRevisionRequested && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-2xl p-6 border-2 border-orange-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  {t.ordersPage.detail.revisionsBanner.title}
                </h3>
                <p className="text-white/90 mb-4">
                  {t.ordersPage.detail.revisionsBanner.text.replace(
                    "{count}",
                    pendingRevisions.length.toString(),
                  )}
                </p>
                <button
                  onClick={() => {
                    const revisionsSection =
                      document.getElementById("revisions-section");
                    revisionsSection?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  {t.ordersPage.detail.viewRevisions}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bannière de Litige pour le Prestataire */}
      {order.status === "disputed" && order.dispute && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div
            className={`rounded-2xl shadow-2xl overflow-hidden border-2 ${
              order.dispute.details?.includes("📅 Demande de Médiation :")
                ? "bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-400"
                : "bg-gradient-to-r from-red-600 to-rose-700 border-red-400"
            } text-white p-6`}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0">
                {order.dispute.details?.includes(
                  "📅 Demande de Médiation :",
                ) ? (
                  <Calendar className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold">
                    {order.dispute.details?.includes("📅 Demande de Médiation :") || 
                     order.dispute.details?.includes("[DEMANDE DE RÉUNION]") ||
                     order.dispute.session_status === 'active'
                      ? t.ordersPage.detail.mediationPending
                      : t.ordersPage.detail.disputedTitle}
                  </h3>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                    {t.common?.arbitration || "Arbitrage Anylibre"}
                  </span>
                </div>

                {order.dispute.details?.includes("📅 Demande de Médiation :") ||
                 order.dispute.details?.includes("[DEMANDE DE RÉUNION]") ||
                 order.dispute.session_status === 'active' ? (
                  <>
                    <p className="text-blue-50/90 mb-4 max-w-2xl">
                      {t.ordersPage.detail.mediationDescLine1}
                      {t.ordersPage.detail.mediationDescLine2}
                    </p>

                    {/* Extraction de la date/heure si possible */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                        <p className="text-xs text-blue-200 uppercase font-bold mb-1">
                          {t.ordersPage.detail.clientAvailability}
                        </p>
                        <p className="font-semibold text-lg">
                          {order.dispute.details.includes("📅 Demande de Médiation :") 
                            ? order.dispute.details.split("📅 Demande de Médiation :")[1]?.trim() 
                            : order.dispute.details.includes("[DEMANDE DE RÉUNION]:")
                              ? order.dispute.details.split("[DEMANDE DE RÉUNION]:")[1]?.trim()
                              : t.ordersPage.detail.checkChat}
                        </p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                        <p className="text-xs text-blue-200 uppercase font-bold mb-1">
                          {t.ordersPage.detail.clientReason}
                        </p>
                        <p className="font-semibold">{order.dispute.reason}</p>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 italic text-sm mb-4">
                      <p className="text-blue-100 font-bold mb-1 uppercase text-[10px]">
                        {t.ordersPage.detail.requestDetails}
                      </p>
                      {order.dispute.details
                        .split("📅 Demande de Médiation :")[0]
                        .split("[DEMANDE DE RÉUNION]")[0]
                        ?.trim()}
                    </div>

                    {/* Mediation Access Button */}
                    <button
                      onClick={() =>
                        order.dispute &&
                        router.push(`/litige/${order.dispute.id}`)
                      }
                      className="w-full sm:w-auto px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      {t.ordersPage.detail.joinMediation}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-red-50/90 mb-4 max-w-2xl">
                      {t.ordersPage.detail.disputeDesc}
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-black/20 rounded-xl border border-white/10">
                      <Loader2 className="w-5 h-5 animate-spin text-red-200" />
                      <p className="text-sm font-medium">
                        {t.ordersPage.detail.adminAnalysis}
                      </p>
                    </div>
                    <p className="mt-4 text-xs text-red-200 italic">
                      {t.ordersPage.detail.disputeNote}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* TIMELINE COMPLÈTE - TOUS LES ÉVÉNEMENTS */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t.ordersPage.detail.timelineTitle}
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {t.ordersPage.detail.timelineSubtitle}
                  </p>
                </div>
              </div>

              <div className="relative">
                {/* Ligne verticale */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-slate-200"></div>

                <div className="space-y-6 relative">
                  {/* Événement: Commande créée */}
                  <div className="flex gap-4 relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900">
                          {t.ordersPage.detail.timeline.created}
                        </h3>
                        <span className="text-sm text-slate-600">
                          {formatShortDate(order.created_at)}
                        </span>
                      </div>
                      {order.message && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                          <p className="text-xs font-semibold text-purple-900 mb-1">
                            {t.ordersPage.detail.timeline.clientInitialMessage}
                          </p>
                          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {order.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Événements: Livraisons */}
                  {order.order_deliveries &&
                    order.order_deliveries.length > 0 &&
                    order.order_deliveries.map((delivery) => (
                      <div key={delivery.id} className="flex gap-4 relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-900">
                              {t.ordersPage.detail.timeline.deliveryTitle.replace(
                                "{number}",
                                delivery.delivery_number.toString(),
                              )}
                            </h3>
                            <span className="text-sm text-slate-600">
                              {formatShortDate(delivery.delivered_at)}
                            </span>
                          </div>
                          {delivery.message && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                              <p className="text-xs font-semibold text-indigo-900 mb-1">
                                {t.ordersPage.detail.timeline.providerMessage}
                              </p>
                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {delivery.message}
                              </p>
                            </div>
                          )}
                          {(delivery.file_url || delivery.external_link) && (
                            <div className="mt-2 flex gap-2">
                              {delivery.file_url && (
                                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                                  {t.ordersPage.detail.timeline.attachment}
                                </span>
                              )}
                              {delivery.external_link && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {t.ordersPage.detail.timeline.externalLink}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Événements: Révisions */}
                  {order.order_revisions &&
                    order.order_revisions.length > 0 &&
                    order.order_revisions.map((revision) => (
                      <div key={revision.id} className="flex gap-4 relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg animate-pulse">
                          <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 bg-orange-50 rounded-xl p-4 border-2 border-orange-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900">
                                {t.ordersPage.detail.timeline.revisionRequested.replace(
                                  "{number}",
                                  revision.revision_number.toString(),
                                )}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  revision.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : revision.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {revision.status === "completed"
                                  ? t.ordersPage.detail.timeline.completed
                                  : revision.status === "in_progress"
                                    ? t.ordersPage.detail.timeline.inProgress
                                    : t.ordersPage.detail.timeline.pending}
                              </span>
                            </div>
                            <span className="text-sm text-slate-600">
                              {formatShortDate(revision.requested_at)}
                            </span>
                          </div>

                          {/* RAISON */}
                          <div className="mt-3 p-3 bg-orange-100 rounded-lg border-2 border-orange-300">
                            <p className="text-xs font-bold text-orange-900 mb-2 uppercase">
                              {t.ordersPage.detail.timeline.revisionReason}
                            </p>
                            <p className="text-slate-900 font-semibold text-base leading-relaxed">
                              {revision.reason || t.ordersPage.detail.noReason}
                            </p>
                          </div>

                          {/* DÉTAILS / RECOMMANDATIONS */}
                          {revision.details && revision.details.trim() && (
                            <div className="mt-3 p-3 bg-white rounded-lg border-2 border-orange-200">
                              <p className="text-xs font-bold text-slate-900 mb-2 uppercase">
                                {t.ordersPage.detail.timeline.clientMessage}
                              </p>
                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {revision.details}
                              </p>
                            </div>
                          )}

                          {/* Warning si pas de détails */}
                          {(!revision.details || !revision.details.trim()) && (
                            <div className="mt-3 p-3 bg-slate-100 rounded-lg border border-slate-300">
                              <p className="text-xs text-slate-600 italic">
                                {t.ordersPage.detail.noDetails}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Statut actuel */}
                  <div className="flex gap-4 relative">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-500 bg-white flex items-center justify-center flex-shrink-0 z-10 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 border-2 border-purple-300">
                      <h3 className="font-bold text-purple-700 text-lg">
                        {t.ordersPage.detail.currentStatus}{" "}
                        {STATUS_LABELS[
                          order.status as keyof typeof STATUS_LABELS
                        ] || order.status}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {t.ordersPage.detail.waitingAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION RÉVISIONS - PRIORITAIRE */}
            {order.order_revisions && order.order_revisions.length > 0 && (
              <div
                id="revisions-section"
                className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-6 border-2 border-orange-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {t.ordersPage.detail.revisionsTitle.replace(
                        "{count}",
                        order.order_revisions.length.toString(),
                      )}
                    </h2>
                    <p className="text-slate-600 text-sm">
                      {t.ordersPage.detail.revisionsSubtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.order_revisions.map((revision, index) => (
                    <div
                      key={revision.id}
                      className="bg-white rounded-xl border-2 border-orange-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      {/* Header de la révision */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-orange-600">
                              {revision.revision_number}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {t.ordersPage.detail.revisionPrefix}#
                              {revision.revision_number}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {formatShortDate(revision.requested_at)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            revision.status === "completed"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : revision.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-orange-100 text-orange-800 border border-orange-200"
                          }`}
                        >
                          {revision.status === "completed"
                            ? t.ordersPage.detail.timeline.completed
                            : revision.status === "in_progress"
                              ? t.ordersPage.detail.timeline.inProgress
                              : t.ordersPage.detail.timeline.pending}
                        </span>
                      </div>

                      {/* Raison de la révision */}
                      <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-semibold text-orange-900 mb-2">
                          {t.ordersPage.detail.timeline.revisionReason}
                        </p>
                        <p className="text-slate-800 font-medium text-base leading-relaxed">
                          {revision.reason}
                        </p>
                      </div>

                      {/* Détails / Recommandations */}
                      {revision.details && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-sm font-semibold text-slate-700 mb-2">
                            {t.ordersPage.detail.timeline.clientMessage}
                          </p>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {revision.details}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {revision.status === "pending" && (
                        <div className="mt-4 pt-4 border-t border-orange-200 flex gap-3">
                          <button
                            onClick={() =>
                              router.push(
                                `/Provider/TableauDeBord/Order?deliver=${order.id}&revision=${revision.id}`,
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
                          >
                            <Send className="w-4 h-4" />
                            {t.ordersPage.detail.deliverRevision}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informations client - PREMIUM DESIGN */}
            {order.client && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {t.ordersPage.detail.client}
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                        {order.client.avatar_url ? (
                          <img
                            src={order.client.avatar_url}
                            alt={order.client.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-violet-600">
                            {order.client.first_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                        title={t.ordersPage.detail.online}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 truncate">
                        {order.client.first_name} {order.client.last_name}
                      </h3>
                      <p className="text-slate-500 text-sm truncate mb-2">
                        {order.client.email}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-md border border-violet-100">
                          {t.ordersPage.detail.premiumClient}
                        </span>
                        <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                          {t.ordersPage.detail.sinceYear.replace(
                            "{year}",
                            "2024",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">
                      {t.ordersPage.detail.viewProfile}
                    </button>
                    <button className="flex-1 px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                      {t.ordersPage.detail.contact}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message du client */}
            {order.message && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t.ordersPage.list.clientMessage}
                  </h2>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {order.message}
                  </p>
                </div>
              </div>
            )}

            {/* NOUVELLE SECTION: Informations de commande détaillées */}
            {order.metadata && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {t.ordersPage.detail.detailedInfo}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Type de prestation */}
                  {order.metadata.location_type && (
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📍</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {t.ordersPage.detail.prestationType}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {t.ordersPage.detail.locationExec}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {order.metadata.location_type === "remote"
                              ? "💻"
                              : "🏠"}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-base">
                              {order.metadata.location_type === "remote"
                                ? t.ordersPage.detail.remote
                                : t.ordersPage.detail.onSite}
                            </p>
                            <p className="text-sm text-slate-600">
                              {order.metadata.location_type === "remote"
                                ? t.ordersPage.detail.remoteDesc
                                : t.ordersPage.detail.onSiteDesc}
                            </p>
                          </div>
                        </div>

                        {/* Détails pour services sur place */}
                        {order.metadata.location_details &&
                          order.metadata.location_type === "on-site" && (
                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">
                                  {t.ordersPage.detail.priorContact}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    order.metadata.location_details
                                      .on_site_confirmed
                                      ? "bg-green-100 text-green-800 border border-green-200"
                                      : "bg-orange-100 text-orange-800 border border-orange-200"
                                  }`}
                                >
                                  {order.metadata.location_details
                                    .on_site_confirmed
                                    ? t.ordersPage.detail.confirmed
                                    : t.ordersPage.detail.notConfirmed}
                                </span>
                              </div>
                              {order.metadata.location_details
                                .contact_choice && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-600">
                                    {t.ordersPage.detail.clientResponse}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-900">
                                    {order.metadata.location_details
                                      .contact_choice === "yes"
                                      ? t.ordersPage.detail.contactYes
                                      : t.ordersPage.detail.contactNo}
                                  </span>
                                </div>
                              )}
                              {order.metadata.location_details.confirmed_at && (
                                <div className="text-xs text-slate-500 mt-2">
                                  {t.ordersPage.detail.confirmedOn.replace(
                                    "{date}",
                                    new Date(
                                      order.metadata.location_details
                                        .confirmed_at,
                                    ).toLocaleString(
                                      language === "fr"
                                        ? "fr-FR"
                                        : language === "es"
                                          ? "es-ES"
                                          : "en-US",
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Réponses aux instructions du prestataire */}
                  {order.metadata.requirements_answers &&
                    Object.keys(order.metadata.requirements_answers).length >
                      0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">✍️</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {t.ordersPage.detail.requirementAnswers}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {t.ordersPage.detail.requirementAnswersDesc}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(
                            order.metadata.requirements_answers,
                          ).map(([reqId, answer], index) => {
                            // Extract index from reqId (format: "req-0", "req-1", etc.)
                            const reqIndex = parseInt(
                              reqId.replace("req-", ""),
                            );

                            // Get the requirement from service using the index
                            const requirement =
                              order.service?.requirements?.[reqIndex];

                            const questionLabel =
                              requirement?.description?.fr ||
                              requirement?.description?.en ||
                              `Question ${index + 1}`;

                            return (
                              <div
                                key={reqId}
                                className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm"
                              >
                                <div className="mb-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                                      {t.ordersPage.detail.question.replace(
                                        "{number}",
                                        (index + 1).toString(),
                                      )}
                                    </span>
                                    {requirement?.required && (
                                      <span className="text-red-600 text-xs font-bold">
                                        {t.ordersPage.detail.required}
                                      </span>
                                    )}
                                    {requirement?.type && (
                                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                                        {requirement.type === "text" &&
                                          t.ordersPage.detail.textType}
                                        {requirement.type === "url" &&
                                          t.ordersPage.detail.urlType}
                                        {requirement.type === "file" &&
                                          t.ordersPage.detail.fileType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-slate-900">
                                    {questionLabel}
                                  </p>
                                </div>

                                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  {/* Affichage selon le type de réponse */}
                                  {typeof answer === "string" ? (
                                    // Type TEXT ou URL
                                    answer.match(/^https?:\/\/.+/) ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600 text-sm">
                                          🔗
                                        </span>
                                        <a
                                          href={answer}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 text-sm hover:underline truncate"
                                        >
                                          {answer}
                                        </a>
                                      </div>
                                    ) : (
                                      <p className="text-slate-800 text-sm whitespace-pre-wrap">
                                        {answer}
                                      </p>
                                    )
                                  ) : answer && typeof answer === "object" ? (
                                    // Type FILE - Fichier uploadé
                                    answer.url ? (
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                              {answer.name ||
                                                t.ordersPage.detail
                                                  .attachedFile}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              {answer.type && (
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                  {answer.type.split("/")[0]}
                                                </span>
                                              )}
                                              {answer.compressed && (
                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                                                  {
                                                    t.ordersPage.detail
                                                      .compressed
                                                  }
                                                </span>
                                              )}
                                            </div>
                                            {answer.compressed &&
                                              answer.originalSize &&
                                              answer.size && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                  {(
                                                    answer.originalSize /
                                                    1024 /
                                                    1024
                                                  ).toFixed(2)}
                                                  MB →{" "}
                                                  {(
                                                    answer.size /
                                                    1024 /
                                                    1024
                                                  ).toFixed(2)}
                                                  MB (
                                                  {(
                                                    ((answer.originalSize -
                                                      answer.size) /
                                                      answer.originalSize) *
                                                    100
                                                  ).toFixed(0)}
                                                  % réduit)
                                                </p>
                                              )}
                                          </div>
                                          <a
                                            href={answer.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                                          >
                                            <Download className="w-4 h-4" />
                                            {t.ordersPage.detail.download}
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-slate-600 text-sm">
                                        {JSON.stringify(answer)}
                                      </p>
                                    )
                                  ) : (
                                    <p className="text-slate-400 italic text-sm">
                                      {t.ordersPage.detail.noResponse}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Extras sélectionnés */}
                  {order.metadata.checkout_details?.selected_extras &&
                    order.metadata.checkout_details.selected_extras.length >
                      0 && (
                      <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                              {t.ordersPage.detail.extraOptions}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {t.ordersPage.detail.extrasOrdered}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {order.metadata.checkout_details.selected_extras.map(
                            (extra: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-3 border border-indigo-200 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <span className="text-indigo-600 font-bold text-sm">
                                      +
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 text-sm">
                                      {extra.name?.fr ||
                                        extra.name ||
                                        extra.title}
                                    </p>
                                    {extra.delivery_time_days > 0 && (
                                      <p className="text-xs text-slate-500">
                                        {t.ordersPage.detail.extraDays.replace(
                                          "{count}",
                                          extra.delivery_time_days.toString(),
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">
                                  +{(extra.price_cents / 100).toFixed(2)} €
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Service / Commande - PREMIUM DESIGN */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {t.ordersPage.detail.serviceDetails}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  ID: {order.id.slice(0, 8)}
                </span>
              </div>

              {order.service && order.service.cover_image && (
                <div className="h-48 w-full bg-slate-100 relative overflow-hidden group">
                  <img
                    src={order.service.cover_image}
                    alt={order.service.title.fr}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-6">
                    <h3 className="text-white text-xl font-bold shadow-sm">
                      {order.service.title.fr}
                    </h3>
                  </div>
                </div>
              )}

              <div className="p-6">
                {!order.service?.cover_image && (
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {t.ordersPage.detail.includedItems}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {t.ordersPage.detail.itemsList}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all duration-300"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-lg font-bold text-slate-700 group-hover:scale-110 transition-transform">
                        {item.quantity}x
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-base">
                          {item.title}
                        </h3>
                        {item.selected_extras &&
                          item.selected_extras.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selected_extras.map(
                                (ex: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-md"
                                  >
                                    + {ex.name}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {(item.subtotal_cents / 100).toFixed(2)} €
                        </p>
                        <p className="text-xs text-slate-500">
                          {(
                            (item.unit_price_cents || item.subtotal_cents) / 100
                          ).toFixed(2)}{" "}
                          € / {t.ordersPage.detail.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      {t.ordersPage.detail.orderTotal}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.ordersPage.detail.taxesIncluded}
                    </p>
                  </div>
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                    {(order.total_cents / 100).toFixed(2)} €
                  </div>
                </div>
              </div>
            </div>

            {/* Livraisons */}
            {order.order_deliveries && order.order_deliveries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Historique des livraisons ({order.order_deliveries.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {order.order_deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-900">
                          {t.ordersPage.detail.deliveriesSection.deliveryNumber.replace(
                            "{number}",
                            delivery.delivery_number.toString(),
                          )}
                        </span>
                        <span className="text-sm text-slate-600">
                          {formatShortDate(delivery.delivered_at)}
                        </span>
                      </div>
                      {delivery.message && (
                        <p className="text-slate-700 text-sm mb-3 bg-white p-3 rounded-lg">
                          {delivery.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {delivery.file_url && (
                          <a
                            href={delivery.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            {t.ordersPage.detail.download}
                          </a>
                        )}
                        {delivery.external_link && (
                          <a
                            href={delivery.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t.ordersPage.detail.timeline.externalLink}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Résumé financier - PREMIUM */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">
                  {t.ordersPage.detail.payment}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center py-2 border-t border-slate-100 mt-2 pt-4">
                  <p className="text-sm text-slate-500 font-medium mb-1 uppercase tracking-wider">
                    {t.ordersPage.detail.netEarnings}
                  </p>
                  <p className="text-3xl font-bold text-emerald-600 tracking-tight">
                    {(() => {
                      const total = order.total_cents / 100;
                      const globalFeePercentage = 5.0; // Retrieve from settings if possible, or use default
                      const minFeeCents = 50;

                      let fee = (order.total_cents * globalFeePercentage) / 100;

                      // Condition speciale: si la commission >= montant total (ou proche), appliquer min_fee
                      if (fee >= order.total_cents) {
                        fee = minFeeCents;
                      }

                      // Assurer que le min_fee est appliqué si le calcul est trop bas ?
                      // Non, la demande est: si commission >= frais (amount?), on applique min_fee.

                      // Let's refine based on user request "si commision est superrieur ou egale au frais la montant gagner par le prestaire ne applique pas cette methode applique le methode montant minimum"
                      // Interpretation: If calculated_fee >= order_amount (provider gets 0 or negative), THEN use min_fee_cents as the fee.

                      // However, we should also ensure we don't take MORE than the order amount even with min_fee (unlikely for 50 cents but possible for 10 cent order).
                      // Assuming order > 50 cents.

                      const earningsCents = Math.max(
                        0,
                        order.total_cents - fee,
                      );

                      // Correction logic based on specific request:
                      // "si on on fais 10-10 ou plus sa donne 0 ... on applique methode min_fee_cents, on fais seulment 10$-min_fee_cents"

                      let finalFeeCents = fee;
                      if (finalFeeCents >= order.total_cents) {
                        finalFeeCents = minFeeCents;
                      }

                      const earnings =
                        (order.total_cents - finalFeeCents) / 100;
                      return earnings.toFixed(2);
                    })()}
                    €
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800">
                    {t.ordersPage.detail.paymentStatus}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-emerald-600 shadow-sm">
                    {order.payment_status === "succeeded" ? (
                      <>
                        <CheckCircle className="w-3 h-3" />{" "}
                        {t.ordersPage.detail.paid}
                      </>
                    ) : (
                      order.payment_status.toUpperCase()
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Délai de livraison - PREMIUM */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">
                  {t.ordersPage.detail.deadline}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">
                      {t.ordersPage.detail.limitDate}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(order.delivery_deadline).toLocaleDateString(
                        language === "fr"
                          ? "fr-FR"
                          : language === "es"
                            ? "es-ES"
                            : "en-US",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 text-center shadow-inner">
                  <p className="text-slate-400 text-xs font-medium uppercase mb-1">
                    {t.ordersPage.detail.timeRemaining}
                  </p>
                  <p className="text-white font-bold text-lg">
                    {(() => {
                      const remaining = Math.ceil(
                        (new Date(order.delivery_deadline).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24),
                      );
                      if (remaining < 0) {
                        return (
                          <span className="text-red-400">
                            {t.ordersPage.detail.delayDays.replace(
                              "{count}",
                              Math.abs(remaining).toString(),
                            )}
                          </span>
                        );
                      } else if (remaining === 0) {
                        return (
                          <span className="text-orange-400 animate-pulse">
                            {t.ordersPage.detail.deliverToday}
                          </span>
                        );
                      } else if (remaining <= 2) {
                        return (
                          <span className="text-orange-400">
                            {t.ordersPage.detail.daysLeft.replace(
                              "{count}",
                              remaining.toString(),
                            )}
                          </span>
                        );
                      } else {
                        return (
                          <span>
                            {remaining} {t.ordersPage.detail.days}
                          </span>
                        );
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Avis et Évaluations */}
          {(order.status === "delivered" || order.status === "completed") && (
            <div className="max-w-7xl mx-auto px-4 py-8">
              <ProviderOrderReviewSection
                orderId={order.id}
                orderStatus={order.status}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
