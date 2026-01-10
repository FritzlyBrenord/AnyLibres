"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Filter,
  MoreVertical,
  TrendingUp,
  Star,
  ShoppingCart,
  DollarSign,
  Copy,
  Archive,
  ArchiveRestore,
  Play,
  BarChart3,
  Grid,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/HeaderProvider";
import {
  Service,
  ServiceStatus,
  ServiceStats,
  ServiceFilters,
} from "@/types/service";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

const getStatusBadge = (status: ServiceStatus) => {
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
  const { label, color } = config[status];
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Hook pour obtenir la devise sélectionnée
const useSelectedCurrency = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  useEffect(() => {
    // Charger la devise depuis localStorage
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    // Écouter les changements de devise
    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  return selectedCurrency;
};

const getServiceMetrics = (service: Service) => {
  const metrics = (service as any).metrics || {};
  const views = service.views_count || metrics.views || 0;
  const orders = service.orders_count || metrics.orders || 0;

  // Calculate conversion
  const conversion =
    views > 0 ? parseFloat(((orders / views) * 100).toFixed(2)) : 0;

  return {
    views,
    orders,
    revenue: metrics?.revenue_cents ? metrics.revenue_cents / 100 : 0,
    conversion,
    rating: service.rating || 0,
  };
};

export default function ServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const selectedCurrency = useSelectedCurrency();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<ServiceFilters>({
    status: "all",
    category: "all",
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  // Calculate total views from services
  useEffect(() => {
    if (services.length > 0) {
      const totalViews = services.reduce(
        (acc, curr) => acc + (curr.views_count || 0),
        0
      );
      setStats((prev) => ({ ...prev, totalViews }));
    }
  }, [services]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    serviceId: string;
    serviceName: string;
    currentStatus: ServiceStatus;
    newStatus: ServiceStatus;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadServices();
      loadStats();
    }
  }, [user, authLoading, filters]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);

      const response = await fetch(`/api/services?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setServices(data.services || []);
      } else {
        console.error("Error loading services:", data.error);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/services/stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const requestStatusChange = (serviceId: string, newStatus: ServiceStatus) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setStatusChange({
      serviceId,
      serviceName: service.title.fr || service.title.en || "Sans titre",
      currentStatus: service.status,
      newStatus,
    });
    setShowStatusModal(true);
    setActionMenu(null);
  };

  const confirmStatusChange = async () => {
    if (!statusChange) return;

    try {
      const response = await fetch(`/api/services/${statusChange.serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusChange.newStatus }),
      });

      if (response.ok) {
        setServices(
          services.map((service) =>
            service.id === statusChange.serviceId
              ? { ...service, status: statusChange.newStatus }
              : service
          )
        );
        loadStats(); // Refresh stats
        setShowStatusModal(false);
        setStatusChange(null);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  const getStatusChangeMessage = () => {
    if (!statusChange) return null;

    const messages = {
      published: {
        title: "Publier le service",
        message: `Voulez-vous vraiment publier "${statusChange.serviceName}" ? Le service sera visible par tous les utilisateurs.`,
        confirmButton: "Publier",
        confirmColor: "bg-green-600 hover:bg-green-700",
      },
      draft: {
        title: "Mettre en brouillon",
        message: `Voulez-vous vraiment mettre "${statusChange.serviceName}" en brouillon ? Le service ne sera plus visible publiquement.`,
        confirmButton: "Mettre en brouillon",
        confirmColor: "bg-gray-600 hover:bg-gray-700",
      },
      archived: {
        title: "Archiver le service",
        message: `Voulez-vous vraiment archiver "${statusChange.serviceName}" ? Le service sera masqué mais pourra être restauré.`,
        confirmButton: "Archiver",
        confirmColor: "bg-orange-600 hover:bg-orange-700",
      },
    };

    return messages[statusChange.newStatus];
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices(services.filter((s) => s.id !== serviceToDelete.id));
        setShowDeleteModal(false);
        setServiceToDelete(null);
        loadStats(); // Refresh stats
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/provider/TableauDeBord/Service/edit/${data.service.id}`);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Error duplicating service:", error);
      alert("Erreur lors de la duplication");
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header avec statistiques */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mes Services
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez et suivez vos services
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {viewMode === "grid" ? (
                    <List size={20} />
                  ) : (
                    <Grid size={20} />
                  )}
                </button>
                <button
                  onClick={() =>
                    router.push("/Provider/TableauDeBord/Service/Add")
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center font-semibold transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  Nouveau Service
                </button>
              </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Publiés
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {stats.published}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Brouillons
                    </p>
                    <p className="text-2xl font-bold text-gray-700">
                      {stats.draft}
                    </p>
                  </div>
                  <Edit className="h-8 w-8 text-gray-600" />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Archivés
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stats.archived}
                    </p>
                  </div>
                  <Archive className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Barre de filtres et recherche */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  onKeyPress={(e) => e.key === "Enter" && loadServices()}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                  }))
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
                <option value="archived">Archivés</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as any,
                  }))
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="created_at">Date de création</option>
                <option value="base_price_cents">Prix</option>
                <option value="views">Vues</option>
                <option value="orders">Commandes</option>
                <option value="rating">Note</option>
              </select>

              <button
                onClick={loadServices}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                <Filter size={20} className="inline mr-2" />
                Filtrer
              </button>
            </div>
          </div>

          {/* Liste des services */}
          {services.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <Package className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun service trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre premier service
              </p>
              <button
                onClick={() => router.push("/provider/services/add")}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Créer un service
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onStatusChange={requestStatusChange}
                  onEdit={() =>
                    router.push(
                      `/Provider/TableauDeBord/Service/edit/${service.id}`
                    )
                  }
                  onDelete={(id) => {
                    setServiceToDelete(service);
                    setShowDeleteModal(true);
                  }}
                  onView={() =>
                    router.push(
                      `/Provider/TableauDeBord/Service/view/${service.id}`
                    )
                  }
                  onDuplicate={handleDuplicate}
                  actionMenu={actionMenu}
                  setActionMenu={setActionMenu}
                  selectedCurrency={selectedCurrency}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                        Prix
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {services.map((service) => (
                      <ServiceTableRow
                        key={service.id}
                        service={service}
                        onStatusChange={requestStatusChange}
                        onEdit={() =>
                          router.push(
                            `/Provider/TableauDeBord/Service/edit/${service.id}`
                          )
                        }
                        onDelete={(id) => {
                          setServiceToDelete(service);
                          setShowDeleteModal(true);
                        }}
                        onView={() =>
                          router.push(
                            `/Provider/TableauDeBord/Service/view/${service.id}`
                          )
                        }
                        onDuplicate={handleDuplicate}
                        actionMenu={actionMenu}
                        setActionMenu={setActionMenu}
                        selectedCurrency={selectedCurrency}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Indicateur de défilement pour mobile */}
              <div className="lg:hidden px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 mr-2 animate-bounce-horizontal"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer le service "
                {serviceToDelete?.title.fr}" ?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible et supprimera toutes les données
                associées.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de changement de statut */}
        {showStatusModal && statusChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              {(() => {
                const message = getStatusChangeMessage();
                if (!message) return null;
                return (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {message.title}
                    </h3>
                    <p className="text-gray-600 mb-6">{message.message}</p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          setStatusChange(null);
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={confirmStatusChange}
                        className={`px-6 py-2 text-white rounded-lg font-medium ${message.confirmColor}`}
                      >
                        {message.confirmButton}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Composant Carte de Service
interface ServiceCardProps {
  service: Service;
  onStatusChange: (id: string, status: ServiceStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  actionMenu: string | null;
  setActionMenu: (id: string | null) => void;
  selectedCurrency: string;
}

function ServiceCard({
  service,
  onStatusChange,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  actionMenu,
  setActionMenu,
  selectedCurrency,
}: ServiceCardProps) {
  const { views, orders, conversion } = getServiceMetrics(service);
  const averageRating = service.rating || 0;
  const [displayPrice, setDisplayPrice] = useState<number>(service.base_price_cents / 100);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    const convertPrice = async () => {
      if (selectedCurrency === 'USD') {
        setDisplayPrice(service.base_price_cents / 100);
        return;
      }

      setPriceLoading(true);
      const converted = await convertFromUSD(service.base_price_cents / 100, selectedCurrency);
      if (converted !== null) {
        setDisplayPrice(converted);
      }
      setPriceLoading(false);
    };

    convertPrice();
  }, [service.base_price_cents, selectedCurrency]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image et statut */}
      <div className="relative h-48 bg-gray-100">
        {service.cover_image ? (
          <img
            src={service.cover_image}
            alt={service.title.fr}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-linear-to-br from-gray-100 to-gray-200">
            <Package size={48} className="text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge(service.status)}
        </div>
        <div className="absolute top-3 left-3">
          <button
            onClick={() =>
              setActionMenu(actionMenu === service.id ? null : service.id)
            }
            className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <MoreVertical size={16} />
          </button>

          {actionMenu === service.id && (
            <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-40">
              <button
                onClick={() => onView(service.id)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Eye size={16} className="mr-2" />
                Voir
              </button>
              <button
                onClick={() => onEdit(service.id)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Modifier
              </button>

              {service.status === "draft" && (
                <button
                  onClick={() => onStatusChange(service.id, "published")}
                  className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center"
                >
                  <Play size={16} className="mr-2" />
                  Publier
                </button>
              )}
              {service.status === "archived" ? (
                <button
                  onClick={() => onStatusChange(service.id, "draft")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ArchiveRestore size={16} className="mr-2" />
                  Désarchiver
                </button>
              ) : (
                <button
                  onClick={() => onStatusChange(service.id, "archived")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Archive size={16} className="mr-2" />
                  Archiver
                </button>
              )}
              <button
                onClick={() => onDelete(service.id)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {service.title.fr || service.title.en || "Sans titre"}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {service.short_description.fr ||
            service.short_description.en ||
            "Aucune description"}
        </p>

        {/* Prix */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {priceLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              formatCurrency(displayPrice, selectedCurrency)
            )}
          </span>
          {averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center"></div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(service.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit size={16} className="inline mr-1" />
            Modifier
          </button>
          <button
            onClick={() => onView(service.id)}
            className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Ligne de Tableau
function ServiceTableRow({
  service,
  onStatusChange,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  actionMenu,
  setActionMenu,
  selectedCurrency,
}: ServiceCardProps) {
  const { views, orders, conversion } = getServiceMetrics(service);
  const averageRating = service.rating || 0;
  const [displayPrice, setDisplayPrice] = useState<number>(service.base_price_cents / 100);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    const convertPrice = async () => {
      if (selectedCurrency === 'USD') {
        setDisplayPrice(service.base_price_cents / 100);
        return;
      }

      setPriceLoading(true);
      const converted = await convertFromUSD(service.base_price_cents / 100, selectedCurrency);
      if (converted !== null) {
        setDisplayPrice(converted);
      }
      setPriceLoading(false);
    };

    convertPrice();
  }, [service.base_price_cents, selectedCurrency]);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
            {service.cover_image ? (
              <img
                src={service.cover_image}
                alt=""
                className="w-12 h-12 object-cover rounded-lg"
              />
            ) : (
              <Package size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 line-clamp-1">
              {service.title.fr || service.title.en || "Sans titre"}
            </div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {service.short_description.fr ||
                service.short_description.en ||
                "Aucune description"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">{getStatusBadge(service.status)}</td>
      <td className="px-6 py-4">
        <div className="text-lg font-bold text-gray-900">
          {priceLoading ? (
            <span className="text-gray-400">...</span>
          ) : (
            formatCurrency(displayPrice, selectedCurrency)
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onView(service.id)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Voir"
          >
            <Eye size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() =>
                setActionMenu(actionMenu === service.id ? null : service.id)
              }
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {actionMenu === service.id && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-40">
                {service.status === "draft" && (
                  <button
                    onClick={() => onStatusChange(service.id, "published")}
                    className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center"
                  >
                    <Play size={16} className="mr-2" />
                    Publier
                  </button>
                )}
                {service.status === "archived" ? (
                  <button
                    onClick={() => onStatusChange(service.id, "draft")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <ArchiveRestore size={16} className="mr-2" />
                    Désarchiver
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange(service.id, "archived")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Archive size={16} className="mr-2" />
                    Archiver
                  </button>
                )}
                <button
                  onClick={() => onDelete(service.id)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
