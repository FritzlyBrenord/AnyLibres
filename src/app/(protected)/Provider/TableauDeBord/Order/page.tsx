"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Send,
  DollarSign,
  Eye,
  RefreshCw,
  PlayCircle,
  Calendar,
  User,
  FileText,
  Image,
  Video,
  Music,
  Link,
  Download,
  ChevronDown,
  Zap,
  BarChart3,
  X,
  Loader2,
} from "lucide-react";
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types/order";
import { prepareFileForUpload, uploadFile } from "@/utils/lib/deliveryHelper";
import DeliveryGallery, { MediaItem } from "@/components/order/DeliveryGallery";
import Header from "@/components/layout/HeaderProvider";
import ProviderOrderReviewSection from "@/components/review/ProviderOrderReviewSection";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

// Hook pour obtenir la devise sélectionnée
const useSelectedCurrency = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  useEffect(() => {
    // Charger la devise depuis localStorage
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    // Écouter les changements de devise
    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener(
      "currencyChanged",
      handleCurrencyChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "currencyChanged",
        handleCurrencyChange as EventListener
      );
    };
  }, []);

  return selectedCurrency;
};

// Fonction pour formater les montants avec devise
const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// Composant pour afficher un prix avec conversion
interface PriceDisplayProps {
  amountCents: number;
  selectedCurrency: string;
  className?: string;
  showLoading?: boolean;
}

function PriceDisplay({
  amountCents,
  selectedCurrency,
  className = "",
  showLoading = true,
}: PriceDisplayProps) {
  const [displayAmount, setDisplayAmount] = useState<number>(amountCents / 100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const convertPrice = async () => {
      if (selectedCurrency === "USD") {
        setDisplayAmount(amountCents / 100);
        return;
      }

      if (showLoading) setLoading(true);
      const converted = await convertFromUSD(
        amountCents / 100,
        selectedCurrency
      );
      if (converted !== null) {
        setDisplayAmount(converted);
      }
      if (showLoading) setLoading(false);
    };

    convertPrice();
  }, [amountCents, selectedCurrency, showLoading]);

  if (loading && showLoading) {
    return <span className={`text-gray-400 ${className}`}>...</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(displayAmount, selectedCurrency)}
    </span>
  );
}

// Composants modulaires
const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusIcons = {
    pending: "⏳",
    paid: "✅",
    in_progress: "🔄",
    delivery_delayed: "⏰",
    delivered: "📦",
    revision_requested: "🔁",
    completed: "🎉",
    cancelled: "❌",
    refunded: "💰",
    disputed: "⚠️",
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[status]} border transition-all duration-200`}
    >
      <span className="mr-1.5">{statusIcons[status]}</span>
      {ORDER_STATUS_LABELS[status]}
    </motion.span>
  );
};

const PriorityBadge = () => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white"
  >
    <Zap size={10} className="mr-1" />
    Prioritaire
  </motion.span>
);

const DeliveryTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadline));
    }, 60000);

    return () => clearInterval(timer);
  }, [deadline]);

  const progress = Math.max(0, Math.min(100, (timeLeft.days * 100) / 7));

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          Délai de livraison
        </span>
        <span
          className={`text-sm font-semibold ${
            timeLeft.days <= 2 ? "text-red-600" : "text-gray-600"
          }`}
        >
          {timeLeft.days}j {timeLeft.hours}h
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-2 rounded-full transition-all duration-500 ${
            timeLeft.days <= 2
              ? "bg-red-500"
              : timeLeft.days <= 4
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        />
      </div>
    </div>
  );
};

const OrderActions = ({
  order,
  onStart,
  onDeliver,
  onViewDetails,
  onExtend,
}: {
  order: any;
  onStart: (id: string) => void;
  onDeliver: (order: any, isRevision: boolean) => void;
  onViewDetails: (order: any) => void;
  onExtend: (order: any) => void;
}) => {
  const getActions = () => {
    // Si une demande est en attente, on ne peut pas en refaire une
    const isExtensionPending = order.extension_status === "pending";

    switch (order.status) {
      case "paid":
        return [
          {
            label: "Démarrer le service",
            icon: PlayCircle,
            onClick: () => onStart(order.id),
            variant: "primary" as const,
          },
        ];
      case "in_progress":
      case "delivery_delayed":
        return [
          {
            label: "Livrer le travail",
            icon: Send,
            onClick: () => onDeliver(order, false),
            variant: "primary" as const,
          },
          {
            label: isExtensionPending ? "⏳ Délai en attente" : "Demander un délai",
            icon: Clock,
            onClick: () => !isExtensionPending && onExtend(order),
            variant: "secondary" as const,
            disabled: isExtensionPending,
          },
        ];
      case "revision_requested":
        return [
          {
            label: "Voir les détails",
            icon: Eye,
            onClick: () => onViewDetails(order),
            variant: "secondary" as const,
          },
          {
            label: "Livrer la révision",
            icon: RefreshCw,
            onClick: () => onDeliver(order, true),
            variant: "primary" as const,
          },
          {
            label: isExtensionPending ? "⏳ Délai en attente" : "Demander un délai",
            icon: Clock,
            onClick: () => !isExtensionPending && onExtend(order),
            variant: "secondary" as const,
            disabled: isExtensionPending,
          },
        ];
      case "delivered":
      case "completed":
        return [
          {
            label: "Voir les détails",
            icon: Eye,
            onClick: () => onViewDetails(order),
            variant: "secondary" as const,
          },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const isDisabled = (action as any).disabled;
        const baseClasses =
          "inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

        const variants = {
          primary:
            "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm",
          secondary:
            "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 border border-gray-300",
        };

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.onClick}
            disabled={isDisabled}
            className={`${baseClasses} ${variants[action.variant]} ${isDisabled ? "opacity-60 cursor-not-allowed grayscale" : ""}`}
          >
            <Icon size={16} className="mr-2" />
            {action.label}
          </motion.button>
        );
      })}
    </div>
  );
};

const OrderCard = ({
  order,
  onStart,
  onDeliver,
  onViewDetails,
  onViewClientProfile,
  onExtend,
  selectedCurrency,
}: {
  order: any;
  onStart: (id: string) => void;
  onDeliver: (order: any, isRevision: boolean) => void;
  onViewDetails: (order: any) => void;
  onViewClientProfile: (clientId: string) => void;
  onExtend: (order: any) => void;
  selectedCurrency: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {order.client?.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => order.client?.id && onViewClientProfile?.(order.client.id)}
                  className="text-left hover:underline focus:outline-none"
                  disabled={!order.client}
                >
                  <h3 className="font-semibold text-gray-900">
                    {order.client?.full_name || "Client Inconnu"}
                  </h3>
                </button>
                <button
                  onClick={() => order.client?.id && onViewClientProfile?.(order.client.id)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                  title="Voir le profil"
                  disabled={!order.client}
                >
                  <User size={16} />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">
                  {order.service?.title?.fr || "Service"}
                </p>
                <button
                  onClick={() => onViewDetails?.(order)}
                  className="text-sm text-blue-600 hover:underline flex items-center font-semibold"
                  title="Voir tous les détails de la commande"
                >
                  <Eye size={14} className="mr-1" />
                  Voir la commande complète
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {order.is_priority && <PriorityBadge />}
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Vous recevrez</p>
            <p className="text-lg font-semibold text-gray-900">
              <PriceDisplay
                amountCents={(() => {
                  const total = order.total_cents;
                  let fee = order.fees_cents || 0;
                  if (fee >= total) fee = 50;
                  const paidBy = order.metadata?.pricing?.fee_config?.paid_by;
                  if (paidBy === "provider") return Math.max(0, total - fee);
                  else if (paidBy === "split") return Math.max(0, total - fee / 2);
                  return total;
                })()}
                selectedCurrency={selectedCurrency}
              />
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Date limite</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(order.delivery_deadline).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Révisions</p>
            <p className="text-sm font-medium text-gray-900">
              {order.revision_count || 0}/{order.service_info?.max_revisions || order.service_info?.revisions_included || 0}
            </p>
          </div>
        </div>

        {/* Extension Request Alert */}
        {order.extension_status === "pending" && (
           <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 animate-pulse">
             <div className="flex items-start">
               <div className="flex-shrink-0 mt-0.5">
                 <Clock className="h-5 w-5 text-amber-600" />
               </div>
               <div className="ml-3">
                 <h3 className="text-sm font-bold text-amber-800">
                   Demande de délai en cours
                 </h3>
                 <p className="text-sm text-amber-700 mt-1">
                   Vous avez demandé un délai supplémentaire de <strong>{order.extension_requested_days} jours</strong>. 
                   Le client n'a pas encore répondu.
                 </p>
                 <div className="mt-2 text-xs italic text-amber-600 bg-white/50 p-2 rounded">
                   "{order.extension_reason}"
                 </div>
               </div>
             </div>
           </div>
        )}

        {order.extension_status === "rejected" && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  Votre dernière demande de délai a été <strong>refusée</strong> par le client.
                </p>
              </div>
            </div>
        )}

        {/* Deliveries Section */}
        {order.order_deliveries && order.order_deliveries.length > 0 && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-sm font-bold text-green-800 mb-2">
                  Livraisons ({order.order_deliveries.length})
                </h3>
                <div className="space-y-4">
                  {order.order_deliveries.map((delivery: any, idx: number) => (
                    <div key={delivery.id} className="bg-white/50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-green-700">
                          Livraison #{delivery.delivery_number}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(delivery.delivered_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      
                      {delivery.message && (
                        <p className="text-xs text-gray-600 mb-3 italic">
                          "{delivery.message}"
                        </p>
                      )}

                      {delivery.file_url ? (
                        <DeliveryGallery 
                          media={[{
                            url: delivery.file_url,
                            type: (delivery.file_type?.startsWith('image/') ? 'image' : 
                                   delivery.file_type?.startsWith('video/') ? 'video' :
                                   delivery.file_type?.startsWith('audio/') ? 'audio' : 'document') as any,
                            name: delivery.file_name,
                            extension: delivery.file_name?.split('.').pop()
                          }]}
                          title={`Livraison ${delivery.delivery_number}`}
                        />
                      ) : delivery.external_link && (
                        <a 
                          href={delivery.external_link} 
                          target="_blank" 
                          className="flex items-center gap-2 text-blue-600 text-xs font-semibold hover:underline"
                        >
                          <Link size={12} />
                          Voir le lien externe
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <OrderActions
            order={order}
            onStart={onStart}
            onDeliver={onDeliver}
            onViewDetails={onViewDetails}
            onExtend={onExtend}
          />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">ID Commande</p>
                  <p className="font-medium">{"#" + (order?.id?.split("-")[0] || "???")}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date de création</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {order.message && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600">Message du client</p>
                    <p className="font-medium">{order.message}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

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
      alert("Veuillez ajouter un message de livraison");
      return;
    }
    onDeliver({ message, file, link, fileType });
  };

  useEffect(() => {
    if (isRevision && !message) {
      setMessage(
        "Voici les modifications demandées. N'hésitez pas si vous avez d'autres retours."
      );
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
                {isRevision ? "Livrer la révision" : "Livrer la commande"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Commande #{order?.id?.split("-")[0] || "???"} • {order?.client?.full_name || "Client Inconnu"}
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
                Type de livraison
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  {
                    type: "document" as const,
                    icon: FileText,
                    label: "Document",
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
                Message de livraison *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  isRevision
                    ? "Décrivez les corrections apportées..."
                    : "Décrivez le travail livré..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Upload ou Lien */}
            {fileType !== "link" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier livrable
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
                      Cliquez pour télécharger ou glissez votre fichier
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
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
                  Lien externe
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/votre-travail"
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
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    {isRevision ? "Envoyer la révision" : "Livrer la commande"}
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

// Fonction utilitaire
function calculateTimeLeft(deadline: string) {
  const difference = new Date(deadline).getTime() - new Date().getTime();
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
  };
}

const ExtensionRequestModal = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSubmit: (days: number, reason: string) => void;
}) => {
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

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
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-blue-600" size={24} />
                Demander un délai
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jours supplémentaires demandés
              </label>
              <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="w-16 text-center font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {days}j
                  </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison de la demande *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm"
                placeholder="Expliquez brièvement pourquoi vous avez besoin de plus de temps..."
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
                <AlertTriangle className="text-blue-600 shrink-0" size={18} />
                <p className="text-xs text-blue-800 leading-relaxed">
                    Votre demande sera soumise au client. La date limite ne sera mise à jour qu'après son acceptation.
                </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                    if (!reason.trim()) {
                        alert("Veuillez fournir une raison");
                        return;
                    }
                    setLoading(true);
                    await onSubmit(days, reason);
                    setLoading(false);
                }}
                disabled={loading}
                className="flex-[2] px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Envoyer la demande"}
              </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Composant principal refondu
const OrderManagement = () => {
  const router = useRouter();
  const selectedCurrency = useSelectedCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | "priority" | "all">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deliveryModal, setDeliveryModal] = useState<{
    isOpen: boolean;
    order: any;
    isRevision: boolean;
    uploadProgress?: number;
    uploadStatus?: string;
  }>({
    isOpen: false,
    order: null,
    isRevision: false,
    uploadProgress: 0,
    uploadStatus: "",
  });

  const [extensionModal, setExtensionModal] = useState<{
    isOpen: boolean;
    order: any;
  }>({
      isOpen: false,
      order: null
  });

  const [clientProfileModal, setClientProfileModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    profile: any | null;
  }>({ isOpen: false, loading: false, profile: null });

  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    service: any | null;
  }>({ isOpen: false, loading: false, service: null });

  // Tabs configuration
  const tabs = [
    { id: "all" as any, label: "Toutes", icon: Package, count: 0 },
    { id: "priority" as any, label: "Priorité", icon: Zap, count: 0 },
    { id: "paid" as any, label: "Payées", icon: DollarSign, count: 0 },
    { id: "in_progress" as any, label: "En cours", icon: PlayCircle, count: 0 },
    { id: "delivered" as any, label: "Livrées", icon: Send, count: 0 },
    { id: "revision_requested" as any, label: "Révision", icon: RefreshCw, count: 0 },
    { id: "completed" as any, label: "Terminées", icon: CheckCircle, count: 0 },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/providers/orders");
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcul des compteurs
  const counts = {
    all: orders.length,
    priority: orders.filter((o) => o.is_priority).length,
    paid: orders.filter((o) => o.status === "paid").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revision_requested: orders.filter((o) => o.status === "revision_requested")
      .length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  // Filtrage
  useEffect(() => {
    let filtered = orders;

    if (activeTab === "priority") {
      filtered = filtered.filter((order) => order.is_priority);
    } else if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.client?.full_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.service?.title?.fr || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.id || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, activeTab, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handlers
  const onViewDetails = (order: any) => {
    router.push(`/Provider/TableauDeBord/Order/${order.id}`);
  };

  const handleStartOrder = async (orderId: string) => {
    try {
      await fetch("/api/orders/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      await fetchOrders();
    } catch (error) {
      console.error("Error starting order:", error);
    }
  };

  const handleDeliver = async (deliveryData: any) => {
    try {
      console.log("🔄 Début de la livraison...", deliveryData);

      const { message, file, link, fileType } = deliveryData;

      let fileUrl = null;

      // Upload du fichier si présent
      if (file) {
        console.log("📤 Upload du fichier:", file.name, "Type:", fileType);

        // Callbacks pour la progression
        const callbacks = {
          onProgress: (progress: number) => {
            setDeliveryModal((prev) => ({
              ...prev,
              uploadProgress: progress,
            }));
          },
          onStatusChange: (status: string) => {
            setDeliveryModal((prev) => ({
              ...prev,
              uploadStatus: status,
            }));
          },
        };

        // Préparer et compresser le fichier si nécessaire
        callbacks.onStatusChange("Préparation du fichier...");
        callbacks.onProgress(5);

        const preparedFile = await prepareFileForUpload(
          file,
          fileType,
          callbacks
        );

        console.log(
          "📦 Fichier préparé:",
          preparedFile.name,
          `(${(preparedFile.size / 1024 / 1024).toFixed(2)}MB)`
        );

        // Upload du fichier
        fileUrl = await uploadFile(preparedFile, fileType, callbacks);

        console.log("✅ Fichier uploadé:", fileUrl);
        callbacks.onProgress(95);
      }

      // Préparer les données pour l'API de livraison
      const apiData = {
        order_id: deliveryModal.order.id,
        message: message,
        file_url: fileUrl,
        file_name: file?.name || null,
        file_type: file?.type || null,
        file_size_bytes: file?.size || null,
        external_link: link || null,
      };

      console.log("📨 Envoi à l'API delivery:", apiData);

      // Mise à jour du statut
      setDeliveryModal((prev) => ({
        ...prev,
        uploadStatus: "Finalisation de la livraison...",
        uploadProgress: 98,
      }));

      const response = await fetch("/api/orders/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      console.log("📩 Réponse API delivery:", result);

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la livraison");
      }

      if (result.success) {
        setDeliveryModal((prev) => ({
          ...prev,
          uploadProgress: 100,
          uploadStatus: "Livraison réussie !",
        }));

        // Attendre un peu pour que l'utilisateur voie le succès
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Fermer la modale
        setDeliveryModal({
          isOpen: false,
          order: null,
          isRevision: false,
          uploadProgress: 0,
          uploadStatus: "",
        });

        // Recharger les commandes pour voir la mise à jour
        await fetchOrders();

        // Basculer vers l'onglet "Livrées" pour voir la commande
        setActiveTab("delivered" as any);

        alert(
          "✅ Commande livrée avec succès ! Elle apparaît maintenant dans l'onglet 'Livrées'."
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("❌ Erreur livraison:", error);

      // Réinitialiser l'état de l'upload
      setDeliveryModal((prev) => ({
        ...prev,
        uploadProgress: 0,
        uploadStatus: "",
      }));

      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const handleRequestExtension = async (days: number, reason: string) => {
    const orderId = extensionModal.order?.id;
    if (!orderId) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/extension/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, reason }),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Votre demande a été envoyée au client.");
        setExtensionModal({ isOpen: false, order: null });
        await fetchOrders();
      } else {
        alert(result.error || "Erreur lors de l'envoi");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion");
    }
  };

  const handleViewClientProfile = async (clientId: string) => {
    if (!clientId) {
      console.error("Client ID is missing");
      alert("ID du client introuvable");
      return;
    }

    try {
      setClientProfileModal({ isOpen: true, loading: true, profile: null });

      const url = `/api/profile/${encodeURIComponent(clientId)}`;
      console.log("Fetching client profile URL:", url, "Client ID:", clientId);
      const res = await fetch(url);

      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
        } catch (e) {
          errorText = "Unable to read error response";
        }

        console.error("Error fetching client profile", {
          status: res.status,
          statusText: res.statusText,
          body: errorText,
        });

        setClientProfileModal({ isOpen: true, loading: false, profile: null });
        alert(`Impossible de charger le profil du client (${res.status})`);
        return;
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("Non-JSON response from profile API", {
          status: res.status,
          error: parseErr,
        });
        setClientProfileModal({ isOpen: true, loading: false, profile: null });
        alert("Erreur: réponse invalide du serveur");
        return;
      }

      if (data && data.success && data.profile) {
        setClientProfileModal({
          isOpen: true,
          loading: false,
          profile: data.profile,
        });
      } else {
        console.error("Invalid profile data received", {
          success: data?.success,
          hasProfile: !!data?.profile,
          error: data?.error,
        });
        setClientProfileModal({ isOpen: true, loading: false, profile: null });
        alert(data?.error || "Profil introuvable");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setClientProfileModal({ isOpen: true, loading: false, profile: null });
      alert(`Erreur: ${err.message || "Erreur inconnue"}`);
    }
  };

  const handleViewDetails = async (order: any) => {
    try {
      setServiceModal({ isOpen: true, loading: true, service: null });

      // Attempt to find a real service id from order items or service object
      const serviceId =
        order?.order_items?.[0]?.service_id || order?.service?.id || null;

      if (!serviceId || String(serviceId).startsWith("service-")) {
        // No real service id available: build details from order_items fallback
        const item = order?.order_items?.[0] || null;
        const fallback = {
          id: null,
          title:
            item?.title || order?.service?.title?.fr || `Commande ${order.id}`,
          description:
            item?.description || order?.service?.short_description || null,
          base_price_cents:
            item?.unit_price_cents || order?.total_cents || null,
          cover_image: order?.service?.cover_image || null,
        };

        setServiceModal({ isOpen: true, loading: false, service: fallback });
        return;
      }

      const url = `/api/services/${encodeURIComponent(serviceId)}`;
      console.log("Fetching service URL:", url);
      const res = await fetch(url);
      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        const text = await res.text();
        console.error("Non-JSON response from service API", {
          status: res.status,
          text,
        });
      }

      if (res.ok && data && (data.service || data.success)) {
        const service = data.service || data.service || data;
        setServiceModal({ isOpen: true, loading: false, service });
      } else {
        console.error("Error fetching service", {
          status: res.status,
          body: data,
        });
        setServiceModal({ isOpen: true, loading: false, service: null });
      }
    } catch (err) {
      console.error("Error fetching service details:", err);
      setServiceModal({ isOpen: true, loading: false, service: null });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header existant - à garder tel quel */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et Recherche */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Stats rapides */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {orders.length}
                </div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {counts.in_progress}
                </div>
                <div className="text-gray-600">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {counts.paid}
                </div>
                <div className="text-gray-600">Nouvelles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par statut */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = counts[tab.id as keyof typeof counts] || 0;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                        isActive ? "bg-blue-500" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grille des commandes */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm
                ? "Aucune commande ne correspond à votre recherche."
                : "Vous n'avez pas de commandes pour le moment."}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 xl:grid-cols-1 gap-6"
            >
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStart={handleStartOrder}
                  onDeliver={(order, isRevision) =>
                    setDeliveryModal({ isOpen: true, order, isRevision })
                  }
                  onViewDetails={onViewDetails}
                  onViewClientProfile={handleViewClientProfile}
                  onExtend={(order) => setExtensionModal({ isOpen: true, order })}
                  selectedCurrency={selectedCurrency}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex items-center text-sm text-gray-700">
                  Affichage de {startIndex + 1} à{" "}
                  {Math.min(endIndex, filteredOrders.length)} sur{" "}
                  {filteredOrders.length} commandes
                </div>

                <div className="flex items-center space-x-2">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Show first page, last page, current page and adjacent pages
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white border-blue-600 font-medium"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modale profil client */}
      {clientProfileModal.isOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-auto"
            >
              <div className="p-6 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Profil du client
                  </h3>
                  <p className="text-sm text-gray-600">
                    Informations publiques
                  </p>
                </div>
                <button
                  onClick={() =>
                    setClientProfileModal({
                      isOpen: false,
                      loading: false,
                      profile: null,
                    })
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {clientProfileModal.loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du profil...</p>
                  </div>
                ) : clientProfileModal.profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center text-xl text-white font-semibold">
                        {clientProfileModal.profile.avatar_url ? (
                          <img
                            src={clientProfileModal.profile.avatar_url}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (
                            clientProfileModal.profile.display_name ||
                            clientProfileModal.profile.first_name ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {clientProfileModal.profile.display_name ||
                            `${clientProfileModal.profile.first_name || ""} ${
                              clientProfileModal.profile.last_name || ""
                            }`.trim() ||
                            "Utilisateur"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Membre depuis{" "}
                          {new Date(
                            clientProfileModal.profile.created_at
                          ).toLocaleDateString("fr-FR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    {clientProfileModal.profile.bio && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">
                          {clientProfileModal.profile.bio}
                        </p>
                      </div>
                    )}

                    {(clientProfileModal.profile.location ||
                      clientProfileModal.profile.website) && (
                      <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                        {clientProfileModal.profile.location && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium mr-2">📍</span>
                            {clientProfileModal.profile.location}
                          </div>
                        )}
                        {clientProfileModal.profile.website && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium mr-2">🌐</span>
                            <a
                              href={clientProfileModal.profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {clientProfileModal.profile.website}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😕</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Profil introuvable
                    </h4>
                    <p className="text-gray-600 max-w-sm mx-auto">
                      Le profil de ce client n'est pas disponible ou n'existe
                      pas encore.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modale de livraison */}
      {deliveryModal.isOpen && (
        <DeliveryModal
          isOpen={deliveryModal.isOpen}
          onClose={() =>
            setDeliveryModal({
              isOpen: false,
              order: null,
              isRevision: false,
              uploadProgress: 0,
              uploadStatus: "",
            })
          }
          order={deliveryModal.order}
          isRevision={deliveryModal.isRevision}
          onDeliver={handleDeliver}
          uploadProgress={deliveryModal.uploadProgress || 0}
          uploadStatus={deliveryModal.uploadStatus || ""}
        />
      )}

      {/* Modale demande de délai */}
      <ExtensionRequestModal
        isOpen={extensionModal.isOpen}
        onClose={() => setExtensionModal({ ...extensionModal, isOpen: false })}
        order={extensionModal.order}
        onSubmit={handleRequestExtension}
      />

      {/* Modale Détails du service */}
      {serviceModal.isOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-auto"
            >
              <div className="p-6 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Détails du service
                  </h3>
                  <p className="text-sm text-gray-600">
                    Informations sur le service commandé
                  </p>
                </div>
                <button
                  onClick={() =>
                    setServiceModal({
                      isOpen: false,
                      loading: false,
                      service: null,
                    })
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {serviceModal.loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du service...</p>
                  </div>
                ) : serviceModal.service ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {serviceModal.service.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={serviceModal.service.cover_image}
                            alt="cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400">Aucune image</div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {serviceModal.service.title?.fr ||
                          serviceModal.service.title ||
                          "Service"}
                      </h4>
                      {serviceModal.service.description && (
                        <div className="mt-4 text-gray-700">
                          {typeof serviceModal.service.description === "string"
                            ? serviceModal.service.description
                            : serviceModal.service.description?.fr ||
                              JSON.stringify(serviceModal.service.description)}
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Prix</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {serviceModal.service.base_price_cents ? (
                              <PriceDisplay
                                amountCents={
                                  serviceModal.service.base_price_cents
                                }
                                selectedCurrency={selectedCurrency}
                              />
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-600">
                          {serviceModal.service.id && (
                            <a
                              href={`/service/${serviceModal.service.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Voir la page du service
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Extras / autres infos */}
                      {serviceModal.service.extras &&
                        serviceModal.service.extras.length > 0 && (
                          <div className="mt-6">
                            <div className="text-sm text-gray-600 mb-2">
                              Extras
                            </div>
                            <ul className="space-y-2">
                              {serviceModal.service.extras.map(
                                (ex: any, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {ex.name}
                                      </div>
                                      {ex.description && (
                                        <div className="text-sm text-gray-600">
                                          {ex.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-gray-900">
                                      {ex.price_cents ? (
                                        <PriceDisplay
                                          amountCents={ex.price_cents}
                                          selectedCurrency={selectedCurrency}
                                          showLoading={false}
                                        />
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Détails non disponibles pour ce service.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default OrderManagement;
