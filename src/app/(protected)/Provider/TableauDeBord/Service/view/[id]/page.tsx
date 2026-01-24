// src/app/(protected)/Provider/TableauDeBord/Service/view/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Archive,
  Eye,
  Share2,
  Download,
  Clock,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Image as ImageIcon,
  FileText,
  Video,
  Headphones,
  Tag,
  MapPin,
  Globe,
  Package,
  ArchiveRestore,
  Play,
  Copy,
} from "lucide-react";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import EditServicePage from "../../edit/[id]/page";

interface Service {
  id: string;
  title: {
    fr: string;
    en: string;
  };
  short_description: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  base_price_cents: number;
  price_min_cents?: number;
  price_max_cents?: number;
  currency: string;
  delivery_time_days: number;
  revisions_included: number;
  max_revisions?: number;
  extras: Array<{
    title: string;
    price_cents: number;
    delivery_additional_days: number;
  }>;
  cover_image: string;
  images: string[];
  categories: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  location_type?: string[];
  faq: Array<{
    question: { fr: string };
    answer: { fr: string };
  }>;
  requirements: Array<{
    description: { fr: string };
    required: boolean;
    type: string;
  }>;
  created_at: string;
  updated_at: string;
  views_count?: number;
}

interface Category {
  id: string;
  name: string;
}

interface ServiceViewProps {
  searchParams?: { [key: string]: string | string[] | undefined };
  serviceId?: string;
  onBack?: () => void;
  isAdmin?: boolean;
  isDark?: boolean;
}

// Component to display individual extra item with currency conversion
interface ExtraItemProps {
  extra: {
    title: string;
    price_cents: number;
    delivery_additional_days: number;
  };
  selectedCurrency: string;
  isDark: boolean;
  formatCurrency: (amount: number, currency: string) => string;
}

function ExtraItem({
  extra,
  selectedCurrency,
  isDark,
  formatCurrency,
}: ExtraItemProps) {
  const [extraDisplayPrice, setExtraDisplayPrice] = useState<number>(
    extra.price_cents / 100
  );

  useEffect(() => {
    const convertExtraPrice = async () => {
      if (selectedCurrency === "USD") {
        setExtraDisplayPrice(extra.price_cents / 100);
        return;
      }
      const converted = await convertFromUSD(
        extra.price_cents / 100,
        selectedCurrency
      );
      if (converted !== null) {
        setExtraDisplayPrice(converted);
      }
    };
    convertExtraPrice();
  }, [selectedCurrency, extra.price_cents]);

  return (
    <div
      className={`border rounded-lg p-3 md:p-4 transition-colors ${
        isDark
          ? "border-gray-600 hover:border-gray-500"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div
          className={`font-medium text-sm md:text-base ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {(() => {
            const t = extra.title;
            if (typeof t === 'string') return t;
            if (typeof t === 'object' && t) {
              const fr = t.fr;
              if (typeof fr === 'string') return fr;
              if (typeof fr === 'object' && fr?.fr) return fr.fr;
              if (t.en) return typeof t.en === 'string' ? t.en : '';
            }
            return '';
          })()}
        </div>
        <div
          className={`text-xs md:text-sm font-semibold ${
            isDark ? "text-green-400" : "text-green-600"
          }`}
        >
          +{formatCurrency(extraDisplayPrice, selectedCurrency)}
        </div>
      </div>
      <div
        className={`text-xs md:text-sm ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Délai supplémentaire : +{extra.delivery_additional_days} jour(s)
      </div>
    </div>
  );
}

export default function ServiceViewPage({
  serviceId: propServiceId,
  onBack,
  isAdmin = false,
  isDark = false,
}: ServiceViewProps = {}) {
  const router = useRouter();
  const routeParams = useParams();
  const { user } = useAuth();

  // Use prop ID if provided, otherwise fall back to route params
  const serviceId = propServiceId || (routeParams?.id as string);
  const apiBase = isAdmin ? "/api/admin/services" : "/api/services";

  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    newStatus: "published" | "draft" | "archived";
    title: string;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (user && serviceId) {
      loadService();
      loadCategories();
    }
  }, [user, serviceId]);

  // Charger la devise sélectionnée et écouter les changements
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
      handleCurrencyChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "currencyChanged",
        handleCurrencyChange as EventListener
      );
    };
  }, []);

  // Convertir le prix quand la devise ou le service change
  useEffect(() => {
    const convertPrice = async () => {
      if (!service) return;

      if (selectedCurrency === "USD") {
        setDisplayPrice(service.base_price_cents / 100);
        return;
      }

      setPriceLoading(true);
      const converted = await convertFromUSD(
        service.base_price_cents / 100,
        selectedCurrency
      );
      if (converted !== null) {
        setDisplayPrice(converted);
      } else {
        setDisplayPrice(service.base_price_cents / 100);
      }
      setPriceLoading(false);
    };

    convertPrice();
  }, [service, selectedCurrency]);

  const loadService = async () => {
    try {
      setLoading(true);
      // For Admin, we use the regular GET endpoint (it's open), or the admin one if we made one specific.
      // The GET /api/services/[id] is open, so we can use that for fetch even if Admin.
      // But for actions, we need admin endpoint.
      // However, usually GET /api/admin/services/[id] doesn't exist yet, we only made PATCH/DELETE.
      // Let's stick to /api/services/[id] for GET, but use apiBase for actions.
      // Actually, wait, if I use apiBase for everything, I need GET on admin/services/[id] too if I want it consistent.
      // I didn't create GET on admin/services/[id].
      // So let's keep fetch using standard if GET is open.
      const response = await fetch(`/api/services/${serviceId}`);

      if (!response.ok) {
        throw new Error("Service non trouvé");
      }

      const data = await response.json();
      setService(data.service);
    } catch (error) {
      console.error("Error loading service:", error);
      alert("Erreur lors du chargement du service");
      router.push("/Provider/TableauDeBord/Service");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const requestStatusChange = (
    newStatus: "published" | "draft" | "archived"
  ) => {
    const messages = {
      published: {
        title: "Publier le service",
        message: `Voulez-vous vraiment publier "${
          service?.title.fr || service?.title.en || "ce service"
        }" ? Le service sera visible par tous les utilisateurs.`,
      },
      draft: {
        title: "Mettre en brouillon",
        message: `Voulez-vous vraiment mettre "${
          service?.title.fr || service?.title.en || "ce service"
        }" en brouillon ? Le service ne sera plus visible publiquement.`,
      },
      archived: {
        title: "Archiver le service",
        message: `Voulez-vous vraiment archiver "${
          service?.title.fr || service?.title.en || "ce service"
        }" ? Le service sera masqué mais pourra être restauré.`,
      },
    };

    setStatusChange({
      newStatus,
      ...messages[newStatus],
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!statusChange) return;

    try {
      setActionLoading(statusChange.newStatus);
      const response = await fetch(`${apiBase}/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusChange.newStatus }),
      });

      if (response.ok) {
        setService((prev) =>
          prev ? { ...prev, status: statusChange.newStatus } : null
        );
        setShowStatusModal(false);
        setStatusChange(null);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors du changement de statut");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      const response = await fetch(`${apiBase}/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Service supprimé avec succès");
        router.push("/Provider/TableauDeBord/Service");
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: {
        label: "Brouillon",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
      published: {
        label: "Publié",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      archived: {
        label: "Archivé",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };
    const { label, color } =
      config[status as keyof typeof config] || config.draft;
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${color}`}
      >
        {label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Catégorie inconnue";
  };

  // Gestion du bouton Modifier : inline pour admin, redirection sinon
  const handleEditClick = () => {
    if (isAdmin) {
      setIsEditMode(true);
    } else {
      router.push(`/Provider/TableauDeBord/Service/edit/${serviceId}`);
    }
  };

  // Callback quand l'édition est terminée - retour à la vue
  const handleEditClose = () => {
    setIsEditMode(false);
    // Recharger les données du service après édition
    loadService();
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p
            className={`mt-4 text-sm md:text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Chargement du service...
          </p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <XCircle className="h-12 w-12 md:h-16 md:w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            Service non trouvé
          </h2>
          <p className="text-gray-600 text-sm md:text-base mb-6">
            Le service que vous recherchez n'existe pas ou vous n'y avez pas
            accès.
          </p>
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Service")}
            className="bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-green-700 text-sm md:text-base w-full md:w-auto"
          >
            Retour aux services
          </button>
        </div>
      </div>
    );
  }

  // Mode édition inline pour admin
  if (isEditMode && isAdmin) {
    return (
      <EditServicePage
        serviceId={serviceId}
        onClose={handleEditClose}
        isModal={true}
        isAdmin={true}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b sticky top-0 z-20`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          {/* Ligne 1: Retour + Titre + Badge + Bouton Modifier */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    router.push("/Provider/TableauDeBord/Service");
                  }
                }}
                className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h1
                    className={`text-base md:text-lg lg:text-xl font-bold leading-tight line-clamp-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(() => {
                      const t = service.title;
                      if (typeof t === 'string') return t || "Sans titre";
                      if (typeof t === 'object' && t) {
                        const fr = t.fr;
                        if (typeof fr === 'string' && fr) return fr;
                        if (t.en && typeof t.en === 'string') return t.en;
                      }
                      return "Sans titre";
                    })()}
                  </h1>
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              </div>

              {/* Bouton Modifier - toujours visible */}
              <button
                onClick={handleEditClick}
                className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex-shrink-0"
              >
                <Edit className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Modifier</span>
              </button>
            </div>
          </div>

          {/* Ligne 2: Actions secondaires */}
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs md:text-sm truncate ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Aperçu du service
            </p>

            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* Voir public */}
              <button
                onClick={() => router.push(`/service/${serviceId}`)}
                className={`flex items-center px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Voir la page publique"
              >
                <Eye className="h-4 w-4 md:mr-1.5" />
                <span className="hidden sm:inline">Voir</span>
              </button>

              {/* Publier (si brouillon) */}
              {service.status === "draft" && (
                <button
                  onClick={() => requestStatusChange("published")}
                  disabled={actionLoading === "published"}
                  className="flex items-center px-2 py-1.5 md:px-3 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs md:text-sm font-medium disabled:opacity-50"
                  title="Publier le service"
                >
                  <Play className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden sm:inline">
                    {actionLoading === "published" ? "..." : "Publier"}
                  </span>
                </button>
              )}

              {/* Mettre en brouillon (si publié) */}
              {service.status === "published" && (
                <button
                  onClick={() => requestStatusChange("draft")}
                  disabled={actionLoading === "draft"}
                  className={`flex items-center px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm disabled:opacity-50 ${
                    isDark
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Mettre en brouillon"
                >
                  <Edit className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden sm:inline">
                    {actionLoading === "draft" ? "..." : "Brouillon"}
                  </span>
                </button>
              )}

              {/* Restaurer ou Archiver */}
              {service.status === "archived" ? (
                <button
                  onClick={() => requestStatusChange("draft")}
                  disabled={actionLoading === "draft"}
                  className="flex items-center px-2 py-1.5 md:px-3 md:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs md:text-sm font-medium disabled:opacity-50"
                  title="Restaurer le service"
                >
                  <ArchiveRestore className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden sm:inline">
                    {actionLoading === "draft" ? "..." : "Restaurer"}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => requestStatusChange("archived")}
                  disabled={actionLoading === "archived"}
                  className={`flex items-center px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm disabled:opacity-50 ${
                    isDark
                      ? "text-orange-400 hover:bg-gray-700"
                      : "text-orange-600 hover:bg-orange-50"
                  }`}
                  title="Archiver le service"
                >
                  <Archive className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden md:inline">
                    {actionLoading === "archived" ? "..." : "Archiver"}
                  </span>
                </button>
              )}

              {/* Supprimer */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className={`flex items-center p-1.5 md:p-2 rounded-lg ${
                  isDark
                    ? "text-red-400 hover:bg-gray-700"
                    : "text-red-600 hover:bg-red-50"
                }`}
                title="Supprimer le service"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`border-b overflow-x-auto ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <nav className="flex space-x-4 md:space-x-8 min-w-max">
              {[
                { id: "overview", name: "Aperçu", icon: Eye },
                { id: "content", name: "Contenu", icon: FileText },
                { id: "media", name: "Médias", icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm flex items-center ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : isDark
                        ? "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Sidebar - Mobile: au-dessus, Desktop: à gauche */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6 order-2 lg:order-1">
            {/* Carte Informations */}
            <div
              className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold mb-3 md:mb-4 text-sm md:text-base ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Informations
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Prix
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {priceLoading ? (
                      <span className="text-gray-400">...</span>
                    ) : displayPrice !== null ? (
                      formatCurrency(displayPrice, selectedCurrency)
                    ) : (
                      formatCurrency(service.base_price_cents / 100, "USD")
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Délai
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium flex items-center ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {service.delivery_time_days} jour(s)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Révisions
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {service.revisions_included} incluses
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Localisation
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium flex items-center ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {service.location_type
                      ?.map((t) =>
                        t === "remote" ? "À distance" : "Sur place"
                      )
                      .join(", ") || "À distance"}
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Catégories & Tags */}
            <div
              className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold mb-3 md:mb-4 text-sm md:text-base ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Classification
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <div
                    className={`text-xs md:text-sm mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Catégories
                  </div>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {service.categories.slice(0, 3).map((catId) => (
                      <span
                        key={catId}
                        className={`inline-block text-xs px-2 py-1 rounded ${
                          isDark
                            ? "bg-blue-900/30 text-blue-300"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {getCategoryName(catId)}
                      </span>
                    ))}
                    {service.categories.length > 3 && (
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded ${
                          isDark
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        +{service.categories.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-xs md:text-sm mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {service.tags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-block text-xs px-2 py-1 rounded border ${
                          isDark
                            ? "bg-gray-700 text-gray-300 border-gray-600"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {service.tags.length > 4 && (
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded ${
                          isDark
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        +{service.tags.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Dates */}
            <div
              className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold mb-3 md:mb-4 text-sm md:text-base ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Dates
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Créé le
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {new Date(service.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Modifié le
                  </span>
                  <span
                    className={`text-xs md:text-sm font-medium ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {new Date(service.updated_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action mobile */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleEditClick}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center"
                >
                  <Edit size={14} className="mr-1" />
                  Modifier
                </button>
                {service.status === "draft" && (
                  <button
                    onClick={() => requestStatusChange("published")}
                    disabled={actionLoading === "published"}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    <Play size={14} className="mr-1" />
                    {actionLoading === "published" ? "..." : "Publier"}
                  </button>
                )}
                {service.status === "published" && (
                  <button
                    onClick={() => requestStatusChange("draft")}
                    disabled={actionLoading === "draft"}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium disabled:opacity-50"
                  >
                    {actionLoading === "draft" ? "..." : "Brouillon"}
                  </button>
                )}
                {service.status === "archived" ? (
                  <button
                    onClick={() => requestStatusChange("draft")}
                    disabled={actionLoading === "draft"}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    <ArchiveRestore size={14} className="mr-1" />
                    {actionLoading === "draft" ? "..." : "Restaurer"}
                  </button>
                ) : (
                  <button
                    onClick={() => requestStatusChange("archived")}
                    disabled={actionLoading === "archived"}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    <Archive size={14} className="mr-1" />
                    {actionLoading === "archived" ? "..." : "Archiver"}
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium flex items-center justify-center"
                >
                  <Trash2 size={14} className="mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {activeTab === "overview" && (
              <div className="space-y-4 md:space-y-6">
                {/* Image de couverture */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {service.cover_image ? (
                    <img
                      src={service.cover_image}
                      alt="Cover"
                      className="w-full h-48 md:h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 md:h-64 bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div
                  className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Description
                  </h2>
                  <p
                    className={`text-sm md:text-base whitespace-pre-line ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {service.description.fr ||
                      service.description.en ||
                      "Aucune description"}
                  </p>
                </div>

                {/* Détails du service */}
                <div
                  className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Détails du service
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <h3
                        className={`font-semibold mb-2 md:mb-3 text-sm md:text-base ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Informations de base
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Prix de base
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm ${
                              isDark ? "text-gray-200 text-right" : "text-right"
                            }`}
                          >
                            {priceLoading ? (
                              <span className="text-gray-400">...</span>
                            ) : displayPrice !== null ? (
                              formatCurrency(displayPrice, selectedCurrency)
                            ) : (
                              formatCurrency(
                                service.base_price_cents / 100,
                                "USD"
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Délai de livraison
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm ${
                              isDark ? "text-gray-200 text-right" : "text-right"
                            }`}
                          >
                            {service.delivery_time_days} jours
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Révisions incluses
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm ${
                              isDark ? "text-gray-200 text-right" : "text-right"
                            }`}
                          >
                            {service.revisions_included}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Visibilité
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm capitalize ${
                              isDark ? "text-gray-200 text-right" : "text-right"
                            }`}
                          >
                            {service.visibility}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`font-semibold mb-2 md:mb-3 text-sm md:text-base ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Configuration
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Type de service
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm text-right ${
                              isDark ? "text-gray-200" : ""
                            }`}
                          >
                            {service.location_type
                              ?.map((t) =>
                                t === "remote" ? "À distance" : "Sur place"
                              )
                              .join(", ") || "À distance"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Révisions max
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm text-right ${
                              isDark ? "text-gray-200" : ""
                            }`}
                          >
                            {service.max_revisions || "Illimité"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs md:text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Devise affichée
                          </span>
                          <span
                            className={`font-medium text-xs md:text-sm text-right ${
                              isDark ? "text-gray-200" : ""
                            }`}
                          >
                            {selectedCurrency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extras */}
                {service.extras && service.extras.length > 0 && (
                  <div
                    className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <h2
                      className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Options supplémentaires ({service.extras.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {service.extras.map((extra, index) => (
                        <ExtraItem
                          key={index}
                          extra={extra}
                          selectedCurrency={selectedCurrency}
                          isDark={isDark}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "content" && (
              <div className="space-y-4 md:space-y-6">
                {/* FAQ */}
                <div
                  className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Questions fréquentes ({service.faq?.length || 0})
                  </h2>
                  {service.faq && service.faq.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {service.faq.map((faq, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 md:p-4 transition-colors ${
                            isDark
                              ? "border-gray-600 hover:border-gray-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <h3
                            className={`font-semibold mb-2 text-sm md:text-base ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Q: {(() => {
                              const q = faq.question;
                              if (typeof q === 'string') return q;
                              if (typeof q === 'object' && q) {
                                const fr = q.fr;
                                if (typeof fr === 'string') return fr;
                                if (typeof fr === 'object' && fr?.fr) return fr.fr;
                                if (q.en) return typeof q.en === 'string' ? q.en : '';
                              }
                              return '';
                            })()}
                          </h3>
                          <p
                            className={`text-sm md:text-base ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            R: {(() => {
                              const a = faq.answer;
                              if (typeof a === 'string') return a;
                              if (typeof a === 'object' && a) {
                                const fr = a.fr;
                                if (typeof fr === 'string') return fr;
                                if (typeof fr === 'object' && fr?.fr) return fr.fr;
                                if (a.en) return typeof a.en === 'string' ? a.en : '';
                              }
                              return '';
                            })()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <FileText
                        className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 ${
                          isDark ? "text-gray-600" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`text-sm md:text-base ${
                          isDark ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Aucune FAQ définie
                      </p>
                    </div>
                  )}
                </div>

                {/* Exigences */}
                <div
                  className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Exigences client ({service.requirements?.length || 0})
                  </h2>
                  {service.requirements && service.requirements.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {service.requirements.map((req, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 md:p-4 border rounded-lg transition-colors ${
                            isDark
                              ? "border-gray-600 hover:border-gray-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm md:text-base truncate ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {(() => {
                                const d = req.description;
                                if (typeof d === 'string') return d;
                                if (typeof d === 'object' && d) {
                                  const fr = d.fr;
                                  if (typeof fr === 'string') return fr;
                                  if (typeof fr === 'object' && fr?.fr) return fr.fr;
                                  if (d.en) return typeof d.en === 'string' ? d.en : '';
                                }
                                return '';
                              })()}
                            </div>
                            <div
                              className={`text-xs md:text-sm capitalize ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Type: {req.type}
                            </div>
                          </div>
                          {req.required && (
                            <span
                              className={`ml-2 md:ml-4 px-2 md:px-3 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                                isDark
                                  ? "bg-red-900/40 text-red-300"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              Obligatoire
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <User
                        className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 ${
                          isDark ? "text-gray-600" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`text-sm md:text-base ${
                          isDark ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Aucune exigence définie
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "media" && (
              <div className="space-y-4 md:space-y-6">
                {/* Image de couverture */}
                <div
                  className={`rounded-lg md:rounded-xl shadow-sm border p-4 md:p-6 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Image de couverture
                  </h2>
                  {service.cover_image ? (
                    <div className="relative">
                      <img
                        src={service.cover_image}
                        alt="Cover"
                        className="w-full h-48 md:h-64 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Couverture
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`text-center py-8 md:py-12 border-2 border-dashed rounded-lg ${
                        isDark ? "border-gray-600" : "border-gray-300"
                      }`}
                    >
                      <ImageIcon
                        className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 ${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-sm md:text-base ${
                          isDark ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Aucune image de couverture
                      </p>
                    </div>
                  )}
                </div>

                {/* Galerie d'images */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    Galerie d'images (
                    {
                      service.images.filter((img) => !img.includes("service-"))
                        .length
                    }
                    )
                  </h3>
                  {service.images.filter((img) => !img.includes("service-"))
                    .length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                      {service.images
                        .filter((img) => !img.includes("service-"))
                        .map((image, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square"
                          >
                            <img
                              src={image}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg"></div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                      <p className="text-gray-500 text-sm md:text-base">
                        Aucune image dans la galerie
                      </p>
                    </div>
                  )}
                </div>

                {/* Contenu multimédia par type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Vidéos */}
                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center mb-3 md:mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg mr-2 md:mr-3">
                        <Video className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          Vidéos
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm">
                          {
                            service.images.filter((img) =>
                              img.includes("service-videos")
                            ).length
                          }{" "}
                          fichier(s)
                        </p>
                      </div>
                    </div>
                    {service.images.filter((img) =>
                      img.includes("service-videos")
                    ).length > 0 ? (
                      <div className="space-y-2">
                        {service.images
                          .filter((img) => img.includes("service-videos"))
                          .slice(0, 2)
                          .map((video, index) => (
                            <a
                              key={index}
                              href={video}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 md:p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 text-xs md:text-sm truncate">
                                  Vidéo {index + 1}
                                </span>
                                <Download className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                              </div>
                            </a>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs md:text-sm">
                        Aucune vidéo
                      </p>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center mb-3 md:mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-2 md:mr-3">
                        <FileText className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          Documents
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm">
                          {
                            service.images.filter((img) =>
                              img.includes("service-documents")
                            ).length
                          }{" "}
                          fichier(s)
                        </p>
                      </div>
                    </div>
                    {service.images.filter((img) =>
                      img.includes("service-documents")
                    ).length > 0 ? (
                      <div className="space-y-2">
                        {service.images
                          .filter((img) => img.includes("service-documents"))
                          .slice(0, 2)
                          .map((doc, index) => (
                            <a
                              key={index}
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 md:p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 text-xs md:text-sm truncate">
                                  Document {index + 1}
                                </span>
                                <Download className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                              </div>
                            </a>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs md:text-sm">
                        Aucun document
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl max-w-md w-full p-4 md:p-6">
            <div className="text-center mb-4 md:mb-6">
              <Trash2 className="h-10 w-10 md:h-12 md:w-12 text-red-600 mx-auto mb-3" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 text-sm md:text-base mb-4">
                Êtes-vous sûr de vouloir supprimer le service "
                {service.title.fr}" ?
              </p>
              <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
                Cette action est irréversible et supprimera toutes les données
                associées.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === "delete"}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm md:text-base disabled:opacity-50"
              >
                {actionLoading === "delete" ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de changement de statut */}
      {showStatusModal && statusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl max-w-md w-full p-4 md:p-6">
            <div className="text-center mb-4 md:mb-6">
              {statusChange.newStatus === "published" && (
                <Play className="h-10 w-10 md:h-12 md:w-12 text-green-600 mx-auto mb-3" />
              )}
              {statusChange.newStatus === "draft" && (
                <Edit className="h-10 w-10 md:h-12 md:w-12 text-gray-600 mx-auto mb-3" />
              )}
              {statusChange.newStatus === "archived" && (
                <Archive className="h-10 w-10 md:h-12 md:w-12 text-orange-600 mx-auto mb-3" />
              )}
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                {statusChange.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base mb-4">
                {statusChange.message}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusChange(null);
                }}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={!!actionLoading}
                className={`flex-1 px-4 py-2 md:px-6 md:py-3 text-white rounded-lg font-medium text-sm md:text-base disabled:opacity-50 ${
                  statusChange.newStatus === "published"
                    ? "bg-green-600 hover:bg-green-700"
                    : statusChange.newStatus === "draft"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {actionLoading ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
