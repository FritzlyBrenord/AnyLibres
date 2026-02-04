// ============================================================================
// PAGE: Order Detail Premium (Client View) - VERSION AVEC GALERIE AVANCÉE
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

import {
  Package,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  User,
  ThumbsUp,
  Calendar,
  Shield,
  Award,
  ShieldCheck,
  AlertTriangle,
  X,
  Link,
  Eye,
  EyeOff,
  DollarSign,
} from "lucide-react";

// Import du composant de galerie premium
import DeliveryGallery from "@/components/order/DeliveryGallery";
import OrderMessagingModal from "@/components/message/OrderMessagingModal";
import OrderChat from "@/components/order/OrderChat";
import OrderReviewSection from "@/components/review/OrderReviewSection";
import { RefundModal } from "./../RefundComponents";
import DisputeChatWizard from "@/components/dispute/DisputeChatWizard";
import { AdminMessageRecipientModal } from "@/components/message/AdminMessageRecipientModal";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

// Interfaces existantes
interface OrderWithDetails {
  id: string;
  client_id: string;
  provider_id: string;
  total_cents: number;
  fees_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string;
  message?: string;
  delivery_deadline: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  order_items?: OrderItem[];
  order_deliveries?: OrderDelivery[];
  order_revisions?: OrderRevision[];
  provider_profile?: ProviderProfile;
  payment_info?: PaymentInfo;
  service_info?: {
    revisions_included: number;
    max_revisions: number;
  };
  metadata?: any;
}

interface PaymentInfo {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_provider: string;
  escrow_status?: string;
  escrow_released_at?: string;
  requires_3d_secure?: boolean;
  is_3d_secure_completed?: boolean;
  display_details?: any;
  created_at: string;
  succeeded_at?: string;
  failed_at?: string;
}

interface OrderItem {
  id: string;
  title: string;
  unit_price_cents: number;
  quantity: number;
  subtotal_cents: number;
  selected_extras: any[];
  service_id?: string;
}

interface OrderDelivery {
  id: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  message?: string;
  delivered_at: string;
  delivery_number: number;
  external_link?: string;
}

interface OrderRevision {
  id: string;
  reason: string;
  details?: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  revision_number: number;
}

interface ProviderProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  occupations?: string;
  rating?: number;
  completed_orders?: number;
}

// Nouveaux composants modaux
const RevisionModal = ({ open, onClose, onSubmit, loading }: any) => {
  const { t } = useSafeLanguage();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
    setMessage("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full animate-in fade-in-90 zoom-in-90">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("orders.detail.revisionTitle")}
              </h3>
              <p className="text-slate-600 text-sm">
                {t("orders.detail.revisionDesc")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("orders.detail.revisionLabel")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("orders.detail.revisionPlaceholder")}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              {t("orders.detail.back")}
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
            >
              {loading
                ? t("orders.detail.loading")
                : t("orders.detail.revision")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DisputeModal = ({ open, onClose, onSubmit, loading }: any) => {
  const { t } = useSafeLanguage();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason, details);
    setReason("");
    setDetails("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full animate-in fade-in-90 zoom-in-90">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("orders.detail.disputeTitle")}
              </h3>
              <p className="text-slate-600 text-sm">
                {t("orders.detail.disputeDesc")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("orders.detail.disputeReason")}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">
                  {t("orders.detail.disputeReasonSelect")}
                </option>
                <option value="quality_issue">
                  {t("orders.refunds.reasons.quality_issue")}
                </option>
                <option value="not_as_described">
                  {t("orders.refunds.reasons.not_as_described")}
                </option>
                <option value="missing_parts">
                  {t("orders.refunds.reasons.missing_parts")}
                </option>
                <option value="late_delivery">
                  {t("orders.refunds.reasons.late_delivery")}
                </option>
                <option value="other">
                  {t("orders.refunds.reasons.other")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("orders.detail.disputeDetails")}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("orders.detail.disputeDetailsPlaceholder")}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              {t("orders.detail.back")}
            </button>
            <button
              type="submit"
              disabled={loading || !reason || !details.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
            >
              {loading
                ? t("orders.detail.loading")
                : t("orders.detail.dispute")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Nouveau modal pour choisir le destinataire du message (admin seulement)

interface PropsAdmin {
  order_Id: string;
  isAdmin?: boolean;
  isDark?: boolean;
  onBack?: () => void;
}

export default function OrderDetailPage({
  order_Id,
  isAdmin = false,
  isDark = false,
}: PropsAdmin) {
  const { t, language } = useSafeLanguage();
  const params = useParams();
  const router = useRouter();
  const orderId = (params.id as string) || order_Id;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { user: currentUser } = useAuth(); // Use AuthContext
  // Removed manual currentUserId state

  // États pour les modals
  const [revisionModal, setRevisionModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [acceptModal, setAcceptModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [messagingModal, setMessagingModal] = useState(false);
  const [adminMessageRecipientModal, setAdminMessageRecipientModal] =
    useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<
    "client" | "provider" | null
  >(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [disputeInfo, setDisputeInfo] = useState<any>(null); // State for dispute details
  const [refundModal, setRefundModal] = useState<{
    open: boolean;
    orderId?: string;
    orderTotal?: number;
  }>({ open: false });
  const [providerEarnings, setProviderEarnings] = useState<{
    id: string;
    amount_cents: number;
  } | null>(null);
  const [existingRefund, setExistingRefund] = useState<{
    id: string;
    status: string;
    amount_cents: number;
    created_at: string;
  } | null>(null);

  // État pour afficher/cacher les IDs sensibles (admin seulement)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Fonction utilitaire pour extraire la date de réunion depuis les détails du litige
  const extractMeetingDate = (details: string): string | null => {
    if (!details) return null;
    const match = details.match(/\[DEMANDE DE RÉUNION\]:\s*(.+)/) || 
                  details.match(/📅 Demande de Médiation :\s*(.+)/);
    return match ? match[1].trim() : null;
  };

  // --- Currency Support ---
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [convertedValues, setConvertedValues] = useState<{
    total: number;
    items: Map<string, { unit: number; subtotal: number; extras: number[] }>;
  }>({
    total: 0,
    items: new Map(),
  });

  // Charger la devise et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener(
      "currencyChanged",
      handleCurrencyChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "currencyChanged",
        handleCurrencyChange as EventListener,
      );
    };
  }, []);

  // Conversion des prix
  useEffect(() => {
    const convertPrices = async () => {
      if (!order) return;

      if (selectedCurrency === "USD") {
        const itemMap = new Map();
        order.order_items?.forEach((item: any) => {
          itemMap.set(item.id, {
            unit: item.unit_price_cents / 100,
            subtotal: item.subtotal_cents / 100,
            extras:
              item.selected_extras?.map((e: any) => e.price_cents / 100) || [],
          });
        });

        setConvertedValues({
          total: (order.payment_info?.amount_cents || order.total_cents) / 100,
          items: itemMap,
        });
        return;
      }

      const baseTotalUSD =
        (order.payment_info?.amount_cents || order.total_cents) / 100;
      const convTotal = await convertFromUSD(baseTotalUSD, selectedCurrency);

      const itemMap = new Map();
      if (order.order_items) {
        for (const item of order.order_items) {
          const [convUnit, convItemSub] = await Promise.all([
            convertFromUSD(item.unit_price_cents / 100, selectedCurrency),
            convertFromUSD(item.subtotal_cents / 100, selectedCurrency),
          ]);

          const convExtras = [];
          if (item.selected_extras) {
            for (const extra of item.selected_extras) {
              const convExtra = await convertFromUSD(
                extra.price_cents / 100,
                selectedCurrency,
              );
              convExtras.push(convExtra || 0);
            }
          }

          itemMap.set(item.id, {
            unit: convUnit || 0,
            subtotal: convItemSub || 0,
            extras: convExtras,
          });
        }
      }

      setConvertedValues({
        total: convTotal || 0,
        items: itemMap,
      });
    };

    convertPrices();
  }, [order, selectedCurrency]);

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat(language || "fr-FR", {
        style: "currency",
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    console.log("📦 CHARGEMENT COMMANDE - Début", { orderId, isAdmin });
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) headers["x-is-admin"] = "true";

      const response = await fetch(`/api/orders/${orderId}/complete`, {
        headers,
      });

      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Réponse non-JSON reçue:", contentType);
        throw new Error(t("orders.detail.error"));
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ Commande chargée", { status: data.data.order.status });
        setOrder(data.data.order);

        // Fetch dispute info if disputed
        if (data.data.order.status === "disputed") {
          try {
            const disputeRes = await fetch(`/api/orders/${orderId}/dispute`);

            // Vérifier le content-type avant de parser
            const disputeContentType = disputeRes.headers.get("content-type");
            if (
              disputeContentType &&
              disputeContentType.includes("application/json")
            ) {
              const disputeData = await disputeRes.json();
              if (disputeData.success) {
                setDisputeInfo(disputeData.data);
              }
            } else {
              console.warn("⚠️ API dispute non disponible ou erreur");
            }
          } catch (e) {
            console.error("Error fetching dispute:", e);
          }
        } else {
          setDisputeInfo(null);
        }
      } else {
        console.error("❌ Erreur chargement:", data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error("❌ Erreur fetch:", err);
      setError(t("orders.detail.error"));
    } finally {
      setLoading(false);
    }
  };

  // Charger les informations de provider_earnings (si le montant a été versé au provider)
  useEffect(() => {
    if (!order?.id) return;

    const fetchProviderEarnings = async () => {
      try {
        const response = await fetch(`/api/provider-earnings/${order.id}`);
        const data = await response.json();
        if (data.success) {
          setProviderEarnings(data.earnings);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des provider_earnings:",
          err,
        );
      }
    };

    fetchProviderEarnings();
  }, [order?.id]);

  // Charger les remboursements existants pour cette commande
  useEffect(() => {
    if (!order?.id) return;

    const fetchExistingRefund = async () => {
      try {
        const response = await fetch(`/api/refunds?order_id=${order.id}`);
        const data = await response.json();
        if (data.success && data.refunds && data.refunds.length > 0) {
          // Prendre le remboursement le plus récent
          setExistingRefund(data.refunds[0]);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des remboursements:",
          err,
        );
      }
    };

    fetchExistingRefund();
  }, [order?.id]);

  // ============================================================================
  // ACTIONS PRINCIPALES - NOUVELLES FONCTIONNALITÉS
  // ============================================================================

  const handleAcceptDelivery = async () => {
    console.log("🟢 ACCEPTER LIVRAISON - Début", {
      orderId: order?.id,
      status: order?.status,
    });
    setProcessing(true);
    try {
      const response = await fetch("/api/orders/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order!.id }),
      });

      console.log("📨 Réponse API Accept:", { status: response.status });
      const data = await response.json();
      console.log("📦 Données reçues:", data);

      if (data.success) {
        console.log("✅ Succès - Commande acceptée:", data.data.order);
        setOrder(data.data.order);
        setAcceptModal(false);
        alert(t("orders.detail.acceptSuccess"));
      } else {
        console.error("❌ Erreur API:", data.error);
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de l'acceptation:", error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async (message: string) => {
    console.log("🔄 DEMANDER RÉVISION - Début", {
      orderId: order?.id,
      revisionsRemaining: "?",
    });
    setProcessing(true);
    try {
      const response = await fetch("/api/orders/request-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order!.id,
          reason: t("orders.status.revision_requested"),
          details: message,
        }),
      });

      console.log("📨 Réponse API Révision:", { status: response.status });
      const data = await response.json();
      console.log("📦 Données reçues:", data);

      if (data.success) {
        console.log("✅ Révision demandée");
        setOrder(data.data.order);
        setRevisionModal(false);
        alert(t("orders.detail.revisionSuccess"));
      } else {
        console.error("❌ Erreur API:", data.error);
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("❌ Erreur révision:", error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenDispute = async (data: {
    reason: string;
    details: string;
    meetingRequest?: string;
  }) => {
    console.log("⚖️ OUVRIR LITIGE - Début", {
      orderId: order?.id,
      reason: data.reason,
    });
    setProcessing(true);
    try {
      let finalDetails = data.details;
      if (data.meetingRequest) {
        finalDetails += `\n\n[DEMANDE DE RÉUNION]: ${data.meetingRequest}`;
      }

      const response = await fetch("/api/orders/open-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order!.id,
          reason: data.reason,
          details: finalDetails,
        }),
      });

      console.log("📨 Réponse API Litige:", { status: response.status });
      const resData = await response.json();
      console.log("📦 Données reçues:", resData);

      if (resData.success) {
        console.log("✅ Litige ouvert");
        setOrder(resData.data.order);
        setDisputeModal(false);
        alert(t("orders.detail.disputeOpenedSuccess"));
      } else {
        console.error("❌ Erreur API:", resData.error);
        throw new Error(resData.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("❌ Erreur litige:", error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDispute = async () => {
    if (!confirm(t("orders.detail.disputeCancelConfirm"))) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/orders/cancel-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order?.id }),
      });
      const data = await response.json();
      if (data.success) {
        alert(t("orders.detail.disputeCancel"));
        loadOrder(); // Reload to update status
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (e: any) {
      alert(`${t("orders.detail.error")}: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    console.log("🔴 ANNULER COMMANDE - Début", {
      orderId: order?.id,
      status: order?.status,
    });
    setProcessing(true);
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order!.id,
          status: "cancelled",
        }),
      });

      console.log("📨 Réponse API Cancel:", { status: response.status });
      const data = await response.json();
      console.log("📦 Données reçues:", data);

      if (data.success) {
        console.log("✅ Succès - Commande annulée:", data.data.order);
        setOrder(data.data.order);
        setCancelModal(false);
        alert(t("orders.detail.cancelOrderConfirm"));
      } else {
        console.error("❌ Erreur API:", data.error);
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de l'annulation:", error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRespondExtension = async (approved: boolean) => {
    if (approved && !confirm(t("orders.detail.acceptDeadline"))) return;
    if (!approved && !confirm(t("orders.detail.refuseDeadline"))) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/extension/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      const result = await response.json();
      if (result.success) {
        alert(
          approved
            ? t("orders.detail.deadlineAccepted")
            : t("orders.detail.deadlineRefused"),
        );
        loadOrder();
      } else {
        alert(result.error || "Erreur lors de la réponse");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion");
    } finally {
      setProcessing(false);
    }
  };

  // Gestion des messages admin
  const handleAdminMessageClick = () => {
    setAdminMessageRecipientModal(true);
  };

  const handleRecipientSelect = (recipient: "client" | "provider") => {
    setSelectedRecipient(recipient);
    setAdminMessageRecipientModal(false);

    // Déterminer l'ID du destinataire
    const recipientId =
      recipient === "client" ? order!.client_id : order!.provider_id;

    // Ouvrir le modal de messagerie
    setMessagingModal(true);
  };

  // ============================================================================
  // CONFIGURATION DES STATUTS
  // ============================================================================

  const STATUS_CONFIG = {
    pending: {
      label: t("orders.status.pending"),
      color: "amber",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      description: t("orders.status.pending"),
    },
    paid: {
      label: t("orders.status.paid"),
      color: "blue",
      icon: CheckCircle,
      gradient: "from-blue-500 to-cyan-500",
      description: t("orders.status.paid"),
    },
    in_progress: {
      label: t("orders.status.in_progress"),
      color: "purple",
      icon: Package,
      gradient: "from-purple-500 to-pink-500",
      description: t("orders.status.in_progress"),
    },
    delivered: {
      label: t("orders.status.delivered"),
      color: "emerald",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-500",
      description: t("orders.status.delivered"),
    },
    revision_requested: {
      label: t("orders.status.revision_requested"),
      color: "orange",
      icon: RefreshCw,
      gradient: "from-orange-500 to-red-500",
      description: t("orders.status.revision_requested"),
    },
    completed: {
      label: t("orders.status.completed"),
      color: "green",
      icon: Award,
      gradient: "from-green-500 to-emerald-500",
      description: t("orders.status.completed"),
    },
    cancelled: {
      label: t("orders.status.cancelled"),
      color: "red",
      icon: XCircle,
      gradient: "from-red-500 to-rose-500",
      description: t("orders.status.cancelled"),
    },
    refunded: {
      label: t("orders.status.refunded"),
      color: "gray",
      icon: Shield,
      gradient: "from-gray-500 to-slate-500",
      description: t("orders.status.refunded"),
    },
    disputed: {
      label: t("orders.status.processing"), // Ou une clé spécifique si ajoutée
      color: "violet",
      icon: AlertCircle,
      gradient: "from-violet-500 to-purple-500",
      description: t("orders.status.processing"),
    },
  };

  // ============================================================================
  // AFFICHAGE DES ÉTATS DE CHARGEMENT ET D'ERREUR
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-600 font-medium">
            {t("orders.detail.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/20">
        {!isAdmin && <Header variant="solid" />}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <AlertCircle className="w-10 h-10 text-red-600" />
              <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-20"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {t("orders.detail.error")}
            </h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() =>
                isAdmin ? router.push("/admin") : router.push("/orders")
              }
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
            >
              {isAdmin ? t("orders.detail.back") : t("orders.tabs.orders")}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStatus =
    STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.pending;
  const StatusIcon = currentStatus.icon;

  // Préparer les URLs pour la galerie
  const deliveryImages: string[] =
    order.order_deliveries
      ?.map((delivery) => delivery.file_url)
      .filter((url): url is string => Boolean(url)) || [];

  // ============================================================================
  // RENDU PRINCIPAL AMÉLIORÉ
  // ============================================================================

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
      {!isAdmin && <Header variant="solid" />}
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header Premium avec badge admin */}
          <div className="mb-8">
            <button
              onClick={() =>
                isAdmin ? router.push("/admin") : router.push("/orders")
              }
              className="group flex items-center gap-3 text-slate-600 hover:text-slate-900 mb-6 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/50 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">{t("orders.detail.back")}</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Commande #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    {isAdmin && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold rounded-full">
                        {t("orders.detail.modeAdmin")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-slate-600 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t("orders.refunds.requestedOn")!}{" "}
                    {new Date(order.created_at).toLocaleDateString(
                      language || "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>

                  {/* Badge pour afficher/masquer les IDs sensibles (admin seulement) */}
                  {isAdmin && (
                    <button
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                      className="flex items-center gap-2 px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      {showSensitiveInfo ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          {t("orders.detail.hideIds")}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          {t("orders.detail.showIds")}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Affichage des IDs sensibles (admin seulement) */}
                {isAdmin && showSensitiveInfo && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl">
                      <p className="text-xs text-slate-600 mb-1">
                        {t("orders.detail.clientId")}
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        {order.client_id}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-xl">
                      <p className="text-xs text-slate-600 mb-1">
                        {t("orders.detail.providerId")}
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        {order.provider_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${currentStatus.gradient} text-white shadow-lg`}
              >
                <StatusIcon className="w-6 h-6" />
                <div>
                  <span className="font-semibold text-lg block">
                    {currentStatus.label}
                  </span>
                  <span className="text-sm opacity-90">
                    {currentStatus.description}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bannière de médiation active */}
          {!isAdmin &&
            order.status === "disputed" &&
            disputeInfo &&
            (disputeInfo.session_status === "active" || 
             disputeInfo.details?.includes("[DEMANDE DE RÉUNION]") ||
             disputeInfo.details?.includes("📅 Demande de Médiation :")) && (
              <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-3xl shadow-xl p-6 animate-in fade-in-50 slide-in-from-top-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-900 mb-1 flex items-center gap-2">
                        🎯 {t("orders.detail.disputeTitle")}
                      </h3>
                      <p className="text-purple-700 mb-2">
                        {t("orders.detail.disputeDesc")}
                      </p>
                      {(() => {
                        const meetingDate = extractMeetingDate(
                          disputeInfo.details || "",
                        );
                        if (meetingDate) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-purple-600 bg-white/60 px-3 py-2 rounded-lg inline-flex">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">
                                {t("orders.detail.meetingPlanned")}{" "}
                                {meetingDate}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/litige/${disputeInfo.id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-purple-200 whitespace-nowrap"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {t("orders.detail.joinMediation")}
                  </button>
                </div>
              </div>
            )}

          <div className="grid xl:grid-cols-4 gap-8">
            {/* Contenu Principal */}
            <div className="xl:col-span-3 space-y-8">
              {/* Bannière Demande de Délai (Extension) */}
              {!isAdmin && order.extension_status === "pending" && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl shadow-xl p-6 animate-in slide-in-from-top-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-amber-900 mb-1 flex items-center gap-2">
                          ⏳ {t("orders.detail.acceptConfirm")}
                        </h3>
                        <p className="text-amber-800 font-medium mb-3">
                          {t("orders.detail.acceptConfirm")}
                        </p>
                        <div className="bg-white/60 border border-amber-200 rounded-xl p-4 italic text-amber-700 text-sm">
                          "{order.extension_reason}"
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleRespondExtension(false)}
                        disabled={processing}
                        className="flex-1 px-6 py-3 bg-white border-2 border-amber-200 text-amber-700 rounded-2xl font-bold hover:bg-amber-100 transition-all shadow-sm disabled:opacity-50"
                      >
                        {t("orders.detail.back")}
                      </button>
                      <button
                        onClick={() => handleRespondExtension(true)}
                        disabled={processing}
                        className="flex-1 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        {t("orders.detail.accept")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bannière statut PAID - En attente du prestataire */}
              {!isAdmin && order.status === "paid" && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/80 backdrop-blur-sm rounded-3xl border border-blue-200/60 shadow-xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {t("orders.status.paid")}
                    </h2>
                    <p className="text-slate-600 mb-4">
                      {t("orders.detail.waitForProvider")}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {t("orders.detail.deliveryDeadline")}{" "}
                        {new Date(order.delivery_deadline).toLocaleDateString(
                          language || "fr-FR",
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={() => setCancelModal(true)}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("orders.detail.cancelOrder")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bannière statut IN_PROGRESS - Travail en cours */}
              {(order.status === "in_progress" ||
                (order.status === "disputed" &&
                  (!order.order_deliveries ||
                    order.order_deliveries.length === 0))) && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50/80 backdrop-blur-sm rounded-3xl border border-purple-200/60 shadow-xl p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {order.status === "disputed"
                        ? t("orders.status.processing")
                        : t("orders.status.in_progress")}
                    </h2>
                    <p className="text-slate-600 mb-4">
                      {order.status === "disputed"
                        ? t("orders.detail.disputeBannerText")
                        : t("orders.detail.eventStarted")}
                    </p>
                  </div>

                  {/* Barre de progression estimée */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {t("orders.detail.estimatedProgress")}
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {(() => {
                          const start = new Date(order.created_at).getTime();
                          const end = new Date(
                            order.delivery_deadline,
                          ).getTime();
                          const now = Date.now();
                          const progress = Math.min(
                            Math.max(((now - start) / (end - start)) * 100, 5),
                            95,
                          );
                          return Math.round(progress);
                        })()}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${(() => {
                            const start = new Date(order.created_at).getTime();
                            const end = new Date(
                              order.delivery_deadline,
                            ).getTime();
                            const now = Date.now();
                            const progress = Math.min(
                              Math.max(
                                ((now - start) / (end - start)) * 100,
                                5,
                                10,
                              ),
                              95,
                            );
                            return progress;
                          })()}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Infos délai */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white/60 rounded-xl border border-purple-200/40">
                      <div className="text-xs text-slate-600 mb-1">
                        {t("orders.detail.deliveryDate")}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(order.delivery_deadline).toLocaleDateString(
                          language || "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-white/60 rounded-xl border border-purple-200/40">
                      <div className="text-xs text-slate-600 mb-1">
                        {t("orders.detail.timeLeft")}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {(() => {
                          const remaining = Math.max(
                            0,
                            Math.ceil(
                              (new Date(order.delivery_deadline).getTime() -
                                Date.now()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          );
                          return remaining > 0
                            ? `${remaining} jour${remaining > 1 ? "s" : ""}`
                            : t("orders.detail.soon");
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {!isAdmin && (
                      <button
                        onClick={() => setCancelModal(true)}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("orders.detail.cancelOrder")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bannière statut CANCELLED - Commande annulée */}
              {order.status === "cancelled" && (
                <div className={`bg-gradient-to-br ${
                  existingRefund?.status === "rejected" || existingRefund?.status === "failed"
                    ? "from-red-100 to-rose-100/80 border-red-300/60 shadow-red-100"
                    : existingRefund?.status === "pending" || existingRefund?.status === "processing"
                      ? "from-amber-50 to-orange-50/80 border-amber-200/60 shadow-amber-100"
                      : "from-red-50 to-rose-50/80 border-red-200/60 shadow-xl"
                } backdrop-blur-sm rounded-3xl border p-8 transition-all duration-500`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${
                      existingRefund?.status === "rejected" || existingRefund?.status === "failed"
                        ? "from-red-600 to-rose-700"
                        : existingRefund?.status === "pending" || existingRefund?.status === "processing"
                          ? "from-amber-500 to-orange-600"
                          : "from-red-500 to-rose-600"
                    } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      {existingRefund?.status === "pending" || existingRefund?.status === "processing" ? (
                        <Clock className="w-8 h-8 text-white animate-pulse" />
                      ) : (
                        <XCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {existingRefund 
                        ? (existingRefund.status === "rejected" || existingRefund.status === "failed" 
                            ? t("orders.status.refund_rejected")
                            : (existingRefund.status === "pending" || existingRefund.status === "processing"
                                ? t("orders.status.refund_pending")
                                : t("orders.status.cancelled")))
                        : t("orders.status.cancelled")}
                    </h2>
                    <p className="text-slate-600 mb-6 font-medium">
                      {existingRefund?.status === "rejected" || existingRefund?.status === "failed"
                        ? t("orders.detail.refundRejectedDetails")
                        : (existingRefund?.status === "pending" || existingRefund?.status === "processing"
                            ? t("orders.detail.refundPendingDetails")
                            : t("orders.detail.cancelWarningText"))}
                    </p>

                    {/* Détails du remboursement si présent */}
                    {existingRefund && (
                      <div className="mb-6 animate-in fade-in zoom-in duration-500">
                        <div className={`inline-flex flex-col items-center p-4 rounded-2xl border ${
                          existingRefund.status === "rejected" || existingRefund.status === "failed"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          <span className="text-sm font-bold uppercase tracking-wider mb-1">
                            {formatAmount(existingRefund.amount_cents / 100)}
                          </span>
                          <span className="text-xs opacity-80">
                            {t("orders.refunds.labels.requestedAt")} {new Date(existingRefund.created_at).toLocaleDateString(language || "fr-FR")}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isAdmin && order.payment_info?.status === "succeeded" && !existingRefund && (
                      <button
                        onClick={() => {
                          const totalAmount =
                            convertedValues.total > 0
                              ? convertedValues.total
                              : (order.payment_info?.amount_cents ||
                                  order.total_cents) / 100;
                          setRefundModal({
                            open: true,
                            orderId: order.id,
                            orderTotal: totalAmount,
                          });
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-200 transform hover:scale-105 active:scale-95"
                      >
                        {t("orders.detail.refundRequestBtn")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bannière statut REVISION_REQUESTED - Révision en cours */}
              {!isAdmin && order.status === "revision_requested" && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50/80 backdrop-blur-sm rounded-3xl border border-orange-200/60 shadow-xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {t("orders.status.revision_requested")}
                    </h2>
                    <p className="text-slate-600 mb-6">
                      {t("orders.detail.eventStarted")}
                    </p>

                    {/* Afficher les révisions */}
                    {order.order_revisions &&
                      order.order_revisions.length > 0 && (
                        <div className="text-left space-y-4 mb-6">
                          {order.order_revisions.map((revision) => (
                            <div
                              key={revision.id}
                              className="p-4 bg-white/80 rounded-xl border border-orange-200/40"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {t("orders.detail.revisionNumber")}
                                  {revision.revision_number}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                    revision.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {revision.status === "completed"
                                    ? t("orders.status.completed")
                                    : t("orders.status.in_progress")}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 mb-1">
                                <strong>{t("orders.detail.reason")}</strong>{" "}
                                {revision.reason}
                              </p>
                              {revision.details && (
                                <p className="text-sm text-slate-600">
                                  <strong>{t("orders.detail.details")}</strong>{" "}
                                  {revision.details}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                Demandée le{" "}
                                {new Date(
                                  revision.requested_at,
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Bannière statut REFUNDED - Commande remboursée */}
              {order.status === "refunded" && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 backdrop-blur-sm rounded-3xl border border-green-200/60 shadow-xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {t("orders.status.refunded")}
                    </h2>
                    <p className="text-slate-600 mb-4 font-medium">
                      {t("orders.detail.refundInfo")}
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-2xl font-bold shadow-sm">
                      <CheckCircle className="w-5 h-5" />
                      <span>{t("orders.detail.refundSuccess")}</span>
                    </div>
                    {existingRefund && (
                      <p className="text-sm text-slate-500 mt-6 font-medium">
                        {t("orders.detail.refundAmountOn", {
                          amount: formatAmount(existingRefund.amount_cents / 100),
                          date: new Date(
                            existingRefund.created_at,
                          ).toLocaleDateString(language || "fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          }),
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* BANNER LITIGE */}
              {order.status === "disputed" && disputeInfo && (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 mb-8 animate-in slide-in-from-top-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-6 h-6" />
                        {t("orders.status.processing")}
                      </h3>
                      <p className="text-red-600 mb-4">
                        {t("orders.detail.disputeBannerText")}
                      </p>

                      <div className="space-y-2 bg-white/50 p-4 rounded-xl border border-red-100">
                        <p className="text-sm text-red-800">
                          <strong>{t("orders.detail.reason")}</strong>{" "}
                          {disputeInfo.reason}
                        </p>
                        <div className="text-sm text-red-800 whitespace-pre-wrap">
                          <strong>{t("orders.detail.details")}</strong>{" "}
                          {disputeInfo.details}
                        </div>
                        {disputeInfo.resolved_at && (
                          <p className="text-sm text-green-700 mt-2">
                            Résolu le{" "}
                            {new Date(
                              disputeInfo.resolved_at,
                            ).toLocaleDateString(language || "fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Actions de Litige */}
                    <div className="flex flex-col gap-3">
                      {/* Bouton Annulation Litige (pour l'auteur ou admin) */}
                      {(disputeInfo.opened_by_id === currentUser?.user_id ||
                        isAdmin) && (
                        <button
                          onClick={handleCancelDispute}
                          disabled={processing}
                          className="w-full px-4 py-3 bg-white border border-red-300 text-red-700 rounded-xl hover:bg-red-100 transition-colors shadow-sm font-bold text-sm"
                        >
                          {processing
                            ? t("orders.detail.loading")
                            : t("orders.detail.disputeCancel")}
                        </button>
                      )}

                      {/* Bouton Médiation */}
                      {disputeInfo.details?.includes(
                        "📅 Demande de Médiation :",
                      ) && (
                        <button
                          onClick={() =>
                            router.push(`/litige/${disputeInfo.id}`)
                          }
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold text-sm flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {t("orders.detail.joinMediation")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bannière d'actions pour livraison reçue */}
              {!isAdmin &&
                (order.status === "delivered" ||
                  (order.status === "disputed" &&
                    order.order_deliveries &&
                    order.order_deliveries.length > 0)) &&
                (() => {
                  // Calculer les révisions restantes
                  const revisionsUsed = order.order_revisions?.length || 0;
                  const revisionsIncluded =
                    order.service_info?.revisions_included || 0;
                  const maxRevisions =
                    order.service_info?.max_revisions || revisionsIncluded;
                  const revisionsRemaining = Math.max(
                    0,
                    maxRevisions - revisionsUsed,
                  );
                  const canRequestRevision = revisionsRemaining > 0;

                  return (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 backdrop-blur-sm rounded-3xl border border-green-200/60 shadow-xl p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          {order.status === "disputed"
                            ? t("orders.status.delivered")
                            : t("orders.status.delivered")}
                        </h2>
                        <p className="text-slate-600 mb-4">
                          {order.status === "disputed"
                            ? t("orders.detail.disputeBannerText")
                            : t("orders.detail.acceptSubheading")}
                        </p>

                        {/* Indicateur de révisions restantes */}
                        {maxRevisions > 0 && order.status !== "disputed" && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-green-200 mb-6">
                            <RefreshCw
                              className={`w-4 h-4 ${
                                canRequestRevision
                                  ? "text-orange-500"
                                  : "text-slate-400"
                              }`}
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {canRequestRevision ? (
                                <>
                                  <span className="text-orange-600 font-bold">
                                    {revisionsRemaining}
                                  </span>{" "}
                                  {revisionsRemaining === 1
                                    ? t(
                                        "orders.detail.revisionRemaining",
                                      ).split(" ")[1]
                                    : t("orders.detail.revisionsRemaining", {
                                        count: revisionsRemaining,
                                      }).split(" ")[1]}
                                </>
                              ) : (
                                <span className="text-slate-500">
                                  {t("orders.detail.revisionsUsed")}
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Actions principales (Cachées si litige) */}
                        {order.status !== "disputed" && (
                          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                              onClick={() => setAcceptModal(true)}
                              disabled={processing}
                              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              <ThumbsUp className="w-5 h-5" />
                              {t("orders.detail.accept")}
                            </button>

                            <div className="flex gap-3">
                              {canRequestRevision ? (
                                <button
                                  onClick={() => setRevisionModal(true)}
                                  disabled={processing}
                                  className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  {t("orders.detail.revision")}
                                </button>
                              ) : (
                                <div className="px-4 py-3 bg-slate-200 text-slate-500 rounded-xl font-medium cursor-not-allowed flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4" />
                                  <span>
                                    {t("orders.detail.revisionsUsed")}
                                  </span>
                                </div>
                              )}

                              <button
                                onClick={() => setDisputeModal(true)}
                                disabled={processing}
                                className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                {t("orders.detail.dispute")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              {/* GALERIE DE LIVRAISON AVEC PRÉVISUALISATION AVANCÉE */}
              {order.order_deliveries && order.order_deliveries.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {t("orders.detail.deliveryGallery")}
                        </h2>
                        <p className="text-slate-600">
                          {t("orders.detail.filesProvided", {
                            count: order.order_deliveries.length,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Utilisation du composant de galerie premium avec données enrichies */}
                  <div className="space-y-12">
                    {order.order_deliveries.map((delivery, idx) => (
                      <div
                        key={delivery.id}
                        className="pb-8 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            {t("orders.detail.deliveryNumber")}
                            {delivery.delivery_number}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(delivery.delivered_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        {delivery.file_url && (
                          <div className="mb-6">
                            <DeliveryGallery
                              media={[
                                {
                                  url: delivery.file_url,
                                  type: (delivery.file_type?.startsWith(
                                    "image/",
                                  )
                                    ? "image"
                                    : delivery.file_type?.startsWith("video/")
                                      ? "video"
                                      : delivery.file_type?.startsWith("audio/")
                                        ? "audio"
                                        : "document") as any,
                                  name: delivery.file_name,
                                  extension: delivery.file_name
                                    ?.split(".")
                                    .pop(),
                                },
                              ]}
                              title={`${t("orders.list.orderNumber")} #${delivery.delivery_number}`}
                            />
                          </div>
                        )}

                        {delivery.external_link && (
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-xl">
                                <Link className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {t("orders.detail.externalLink")}
                                </p>
                                <a
                                  href={delivery.external_link}
                                  target="_blank"
                                  className="text-xs text-blue-600 hover:underline break-all"
                                >
                                  {delivery.external_link}
                                </a>
                              </div>
                            </div>
                            <a
                              href={delivery.external_link}
                              target="_blank"
                              className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-white/80 transition-colors"
                            >
                              {t("orders.detail.openLink")}
                            </a>
                          </div>
                        )}

                        {delivery.message && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                            <div className="flex gap-2">
                              <MessageSquare className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                                "{delivery.message}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Détails de la commande */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {t("orders.detail.historyHeading")}
                </h2>

                <div className="space-y-6">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 hover:border-slate-300 transition-all duration-300"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg mb-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 mb-3">
                          {t("orders.detail.quantity")} {item.quantity}
                        </p>
                        {item.selected_extras &&
                          item.selected_extras.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-slate-700">
                                {t("orders.detail.optionsIncluded")}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.selected_extras.map(
                                  (extra: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
                                    >
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      {typeof extra.name === "object"
                                        ? extra.name.fr
                                        : extra.name}
                                      <span className="text-green-600 font-semibold ml-1">
                                        +
                                        {formatAmount(
                                          convertedValues.items.get(item.id)
                                            ?.extras[idx] || 0,
                                        )}
                                      </span>
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatAmount(
                            convertedValues.items.get(item.id)?.subtotal || 0,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Avis et Évaluations */}
              {!isAdmin &&
                (order.status === "delivered" ||
                  order.status === "completed") && (
                  <div className="mt-8">
                    <OrderReviewSection
                      orderId={order.id}
                      orderStatus={order.status}
                      isClient={true}
                    />
                  </div>
                )}
            </div>

            {/* Sidebar Premium */}
            <div className="space-y-8">
              {/* Informations de paiement */}
              {order.payment_info && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/60 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {t("orders.detail.paymentHeading")}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Statut du paiement */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        {t("orders.detail.paymentStatusLabel")}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          order.payment_info.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : order.payment_info.status === "processing" ||
                                order.payment_info.status === "requires_action"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.payment_info.status === "succeeded"
                          ? t("orders.status.paid")
                          : order.payment_info.status === "processing"
                            ? t("orders.status.processing")
                            : order.payment_info.status === "requires_action"
                              ? t("orders.detail.threeDSecureRequired")
                              : t("orders.status.failed")}
                      </span>
                    </div>

                    {/* Méthode de paiement */}
                    {order.payment_info.display_details && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          {t("orders.detail.paymentMethodLabel")}
                        </span>
                        <div className="flex items-center gap-2">
                          {order.payment_info.display_details.method ===
                          "card" ? (
                            <>
                              <span className="text-sm font-medium text-slate-900 capitalize">
                                {order.payment_info.display_details
                                  .card_brand || t("orders.detail.paymentCard")}
                              </span>
                              <span className="text-sm text-slate-600">
                                ••••{" "}
                                {order.payment_info.display_details.card_last4}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-slate-900 capitalize">
                              {order.payment_info.payment_method}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Montant */}
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-sm text-slate-600">
                        {t("orders.detail.amountPaidLabel")}
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatAmount(convertedValues.total)}
                      </span>
                    </div>

                    {/* Escrow status */}
                    {order.payment_info.escrow_status && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            {t("orders.detail.escrowProtection")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">
                            {t("orders.detail.escrowStatusLabel")}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.payment_info.escrow_status === "held"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.payment_info.escrow_status === "held"
                              ? t("orders.detail.escrowHeld")
                              : t("orders.detail.escrowReleased")}
                          </span>
                        </div>
                        {order.payment_info.escrow_status === "held" && (
                          <p className="text-xs text-slate-500 mt-2">
                            {t("orders.detail.escrowHeldInfo")}
                          </p>
                        )}
                        {order.payment_info.escrow_released_at && (
                          <p className="text-xs text-slate-500 mt-2">
                            {t("orders.detail.escrowReleasedAt")}{" "}
                            {new Date(
                              order.payment_info.escrow_released_at,
                            ).toLocaleDateString(language || "fr-FR")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 3D Secure */}
                    {order.payment_info.requires_3d_secure && (
                      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-100/50 rounded-xl">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-800">
                          {order.payment_info.is_3d_secure_completed
                            ? t("orders.detail.secure3DVerified")
                            : t("orders.detail.secure3DRequired")}
                        </span>
                      </div>
                    )}

                    {/* Date de paiement */}
                    {order.payment_info.succeeded_at && (
                      <div className="text-xs text-slate-500 text-center pt-3 border-t border-blue-200">
                        {t("orders.detail.paidAt")}{" "}
                        {new Date(
                          order.payment_info.succeeded_at,
                        ).toLocaleDateString(language || "fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}

                    {/* Bouton Demander remboursement ou Statut remboursement */}
                    {!isAdmin && 
                     order.payment_info?.status === "succeeded" && 
                     order.status === "cancelled" && (
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        {existingRefund ? (
                          // Afficher le statut du remboursement existant
                          <div className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                            existingRefund.status === "rejected" || existingRefund.status === "failed"
                              ? "bg-red-50 border-red-200"
                              : existingRefund.status === "pending" || existingRefund.status === "processing"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-green-50 border-green-200"
                          }`}>
                            <div className={`flex items-center justify-center gap-2 font-bold ${
                              existingRefund.status === "rejected" || existingRefund.status === "failed"
                                ? "text-red-700"
                                : existingRefund.status === "pending" || existingRefund.status === "processing"
                                  ? "text-amber-700"
                                  : "text-green-700"
                            }`}>
                              {existingRefund.status === "rejected" || existingRefund.status === "failed" ? (
                                <XCircle className="w-5 h-5" />
                              ) : existingRefund.status === "pending" || existingRefund.status === "processing" ? (
                                <Clock className="w-5 h-5 animate-pulse" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                              <span>
                                {existingRefund.status === "pending" && t("orders.status.refund_pending")}
                                {existingRefund.status === "approved" && t("orders.status.refund_approved")}
                                {existingRefund.status === "processing" && t("orders.status.refund_processing")}
                                {existingRefund.status === "completed" && t("orders.status.refund_completed")}
                                {existingRefund.status === "rejected" && t("orders.status.refund_rejected")}
                                {existingRefund.status === "failed" && t("orders.status.refund_failed")}
                                {existingRefund.status === "cancelled" && t("orders.status.refund_cancelled")}
                                {!["pending", "approved", "processing", "completed", "rejected", "failed", "cancelled"].includes(existingRefund.status) && existingRefund.status}
                              </span>
                            </div>
                            <p className={`text-xs text-center mt-2 font-medium ${
                              existingRefund.status === "rejected" || existingRefund.status === "failed"
                                ? "text-red-600"
                                : existingRefund.status === "pending" || existingRefund.status === "processing"
                                  ? "text-amber-600"
                                  : "text-green-600"
                            }`}>
                              {formatAmount(existingRefund.amount_cents / 100)}
                              • {t("orders.refunds.labels.requestedAt")}{" "}
                              {new Date(existingRefund.created_at).toLocaleDateString(language || "fr-FR")}
                            </p>
                          </div>
                        ) : (
                          // Afficher le bouton pour demander un remboursement
                          <>
                            <button
                              onClick={() => {
                                const totalAmount =
                                  convertedValues.total > 0
                                    ? convertedValues.total
                                    : (order.payment_info?.amount_cents ||
                                        order.total_cents) / 100;
                                setRefundModal({
                                  open: true,
                                  orderId: order.id,
                                  orderTotal: totalAmount,
                                });
                              }}
                              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              {t("orders.detail.refundRequestBtn")}
                            </button>
                            <p className="text-xs text-slate-500 text-center mt-2">
                              {providerEarnings
                                ? t("orders.detail.refundVersedToProvider")
                                : t("orders.detail.refundCanRequest")}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations du prestataire */}
              {order.provider_profile && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200/60 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      {order.provider_profile.avatar_url ? (
                        <img
                          src={order.provider_profile.avatar_url}
                          alt={order.provider_profile.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {order.provider_profile.first_name}{" "}
                        {order.provider_profile.last_name}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {t("orders.detail.providerRole")}
                      </p>
                    </div>
                  </div>

                  {order.provider_profile.occupations && (
                    <p className="text-slate-700 text-sm mb-3">
                      {order.provider_profile.occupations}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      ⭐{" "}
                      {order.provider_profile.rating ||
                        t("orders.detail.newRating")}
                    </span>
                    <span>
                      📊 {order.provider_profile.completed_orders || 0}{" "}
                      {t("orders.detail.ordersCount")}
                    </span>
                  </div>

                  {!isAdmin && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setContactModalOpen(true)}
                        className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 ${
                          isAdmin
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-red-500/50"
                            : "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-purple-500/50"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          router.push(`/providers/${order.provider_id}`)
                        }
                        className="flex-1 px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors text-sm font-medium"
                      >
                        {t("orders.detail.viewProfile")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline de la commande */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  {t("orders.detail.historyHeading")}
                </h3>

                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-200 to-slate-200"></div>

                  <div className="space-y-6 relative">
                    {(() => {
                      // Créer un tableau d'événements chronologiques
                      const timelineEvents: Array<{
                        type: string;
                        date: string;
                        label: string;
                        color: string;
                        icon?: "check" | "x";
                        data?: any;
                      }> = [];

                      // Événement: Commande créée
                      timelineEvents.push({
                        type: "created",
                        date: order.created_at,
                        label: t("orders.detail.eventCreated"),
                        color: "from-purple-500 to-pink-600",
                      });

                      // Événement: Paiement confirmé
                      if (order.payment_info?.succeeded_at) {
                        timelineEvents.push({
                          type: "paid",
                          date: order.payment_info.succeeded_at,
                          label: t("orders.detail.eventPaid"),
                          color: "from-green-500 to-emerald-600",
                        });
                      }

                      // Événement: Travail commencé
                      if (
                        order.status === "in_progress" ||
                        order.status === "revision_requested"
                      ) {
                        timelineEvents.push({
                          type: "started",
                          date: order.updated_at,
                          label: t("orders.detail.eventStarted"),
                          color: "from-blue-500 to-cyan-600",
                        });
                      }

                      // Événements: Révisions
                      if (
                        order.order_revisions &&
                        order.order_revisions.length > 0
                      ) {
                        order.order_revisions.forEach((revision) => {
                          timelineEvents.push({
                            type: "revision",
                            date: revision.requested_at,
                            label: t("orders.detail.eventRevisionRequested", {
                              number: revision.revision_number,
                            }),
                            color: "from-orange-500 to-amber-600",
                            data: revision,
                          });
                        });
                      }

                      // Événements: Livraisons
                      if (
                        order.order_deliveries &&
                        order.order_deliveries.length > 0
                      ) {
                        order.order_deliveries.forEach((delivery) => {
                          timelineEvents.push({
                            type: "delivery",
                            date: delivery.delivered_at,
                            label: t("orders.detail.eventDelivery", {
                              number: delivery.delivery_number,
                            }),
                            color: "from-indigo-500 to-purple-600",
                            data: delivery,
                          });
                        });
                      }

                      // Événement: Commande complétée
                      if (order.completed_at) {
                        timelineEvents.push({
                          type: "completed",
                          date: order.completed_at,
                          label: t("orders.detail.eventCompleted"),
                          color: "from-emerald-500 to-green-600",
                          icon: "check",
                        });
                      }

                      // Événement: Commande annulée
                      if (order.cancelled_at) {
                        timelineEvents.push({
                          type: "cancelled",
                          date: order.cancelled_at,
                          label: t("orders.detail.eventCancelled"),
                          color: "from-red-500 to-rose-600",
                          icon: "x",
                        });
                      }

                      // Trier par date chronologique
                      timelineEvents.sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime(),
                      );

                      // Afficher les événements triés
                      return (
                        <>
                          {timelineEvents.map((event, index) => (
                            <div
                              key={`${event.type}-${index}`}
                              className="flex gap-4 relative"
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-gradient-to-r ${event.color} flex-shrink-0 ring-4 ring-white z-10 flex items-center justify-center`}
                              >
                                {event.icon === "check" && (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                )}
                                {event.icon === "x" && (
                                  <XCircle className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 pb-2">
                                <p className="font-semibold text-slate-900 text-sm">
                                  {event.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(event.date).toLocaleDateString(
                                    language || "fr-FR",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Statut actuel (si en cours) */}
                          {!order.completed_at && !order.cancelled_at && (
                            <div className="flex gap-4 relative">
                              <div className="w-5 h-5 rounded-full border-2 border-purple-500 bg-white flex-shrink-0 ring-4 ring-white z-10 animate-pulse"></div>
                              <div className="flex-1">
                                <p className="font-semibold text-purple-600 text-sm">
                                  {currentStatus.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {t("orders.detail.eventInProgress")}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {!isAdmin && <Footer />}
      {/* Modals pour les actions de livraison (cachés en mode admin) */}
      {!isAdmin && (
        <>
          <RevisionModal
            open={revisionModal}
            onClose={() => setRevisionModal(false)}
            onSubmit={handleRequestRevision}
            loading={processing}
          />

          <DisputeChatWizard
            isOpen={disputeModal}
            onClose={() => setDisputeModal(false)}
            onSubmit={handleOpenDispute}
            isLoading={processing}
          />
        </>
      )}
      {/* Modal d'acceptation simple (caché en mode admin) */}
      {!isAdmin && acceptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full animate-in fade-in-90 zoom-in-90">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t("orders.detail.acceptHeading")}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {t("orders.detail.acceptSubheading")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAcceptModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-700 mb-6">
                {t("orders.detail.acceptLongText")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setAcceptModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                >
                  {t("orders.detail.back")}
                </button>
                <button
                  onClick={handleAcceptDelivery}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                >
                  {processing
                    ? t("orders.detail.processingBtn")
                    : t("orders.detail.confirmBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal d'annulation de commande (caché en mode admin) */}
      {!isAdmin && cancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full animate-in fade-in-90 zoom-in-90">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t("orders.detail.cancelOrder")}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {t("orders.detail.cancelIrreversible")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">
                      {t("orders.detail.attention")}
                    </p>
                    <p>{t("orders.detail.cancelWarningText")}</p>
                  </div>
                </div>
              </div>

              <p className="text-slate-700 mb-6">
                {t("orders.detail.cancelConfirmationPrompt")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                >
                  {t("orders.detail.back")}
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
                >
                  {processing
                    ? t("orders.detail.cancellingBtn")
                    : t("orders.detail.yesCancelBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de messagerie avec le prestataire */}
      <OrderMessagingModal
        open={messagingModal}
        onClose={() => {
          setMessagingModal(false);
          setSelectedRecipient(null);
        }}
        orderId={order?.id}
        providerId={
          selectedRecipient === "provider" ? order?.provider_id || "" : ""
        }
        clientId={selectedRecipient === "client" ? order?.client_id || "" : ""}
        serviceId={order?.order_items?.[0]?.service_id}
        serviceTitle={order?.order_items?.[0]?.title || "cette commande"}
        messageType={isAdmin ? "admin" : "simple"}
        isAdmin={isAdmin}
        onMessageSent={() => {
          setMessagingModal(false);
          setSelectedRecipient(null);
          loadOrder();
        }}
      />

      {/* Modal pour choisir le destinataire du message (admin seulement) */}
      <AdminMessageRecipientModal
        open={adminMessageRecipientModal}
        onClose={() => setAdminMessageRecipientModal(false)}
        onSelect={handleRecipientSelect}
        order={order}
        loading={processing}
      />

      {/* Refund Modal */}
      <RefundModal
        orderId={refundModal.orderId || ""}
        orderTotal={refundModal.orderTotal || 0}
        isOpen={refundModal.open}
        onClose={() => setRefundModal({ open: false })}
        onSuccess={async () => {
          setRefundModal({ open: false });
          loadOrder();
          // Rafraîchir l'état du remboursement existant
          try {
            const response = await fetch(`/api/refunds?order_id=${order?.id}`);
            const data = await response.json();
            if (data.success && data.refunds && data.refunds.length > 0) {
              setExistingRefund(data.refunds[0]);
            }
          } catch (err) {
            console.error(
              "Erreur lors du rafraîchissement du remboursement:",
              err,
            );
          }
        }}
      />

      {/* Modal de contact client dédié (Style Service Page) */}
      <OrderMessagingModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        providerId={order?.provider_id || ""}
        orderId={order?.id}
        messageType="simple"
        onMessageSent={() => {
          setContactModalOpen(false);
          // Optionnel: rafraîchir l'ordre ou les messages si nécessaire
          loadOrder();
        }}
        serviceId={order?.order_items?.[0]?.service_id}
        serviceTitle={order?.order_items?.[0]?.title || "cette commande"}
      />
    </div>
  );
}
