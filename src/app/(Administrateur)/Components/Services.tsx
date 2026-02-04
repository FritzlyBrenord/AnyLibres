"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Filter,
  Search,
  Eye,
  Trash2,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";
import ServiceViewPage from "@/app/(protected)/Provider/TableauDeBord/Service/view/[id]/page";
import AnalyticsPerformance from "@/app/(protected)/Provider/TableauDeBord/Analytique/Performance/page";
import { ArrowLeft } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";
import { usePermissions } from "@/contexts/PermissionsContext";

interface ServicesProps {
  isDark: boolean;
}

interface Service {
  id: string;
  title: { fr: string; en: string };
  base_price_cents: number;
  currency: string;
  status: "draft" | "published" | "archived";
  rating: number;
  categories: string[];
  provider: {
    id: string;
    profile_id: string;
    company_name: string;
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      avatar_url: string;
    };
  };
  metrics?: {
    views: number;
    orders: number;
    revenue_cents: number;
  };
  created_at: string;
}

const Services: React.FC<ServicesProps> = ({ isDark }) => {
  const { t } = useLanguageContext();
  const { convertFromUSD, formatAmount } = useCurrency();
  const { hasPermission } = usePermissions();

  const canViewPerformance = hasPermission('services.performance.view');
  const canViewDetails = hasPermission('services.details.view'); // New permission if needed, or reuse generic view

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = t as Record<string, any>;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"list" | "performance">("list");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    providerId: "all",
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/services");
      const data = await response.json();
      if (response.ok) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return isDark
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-700";
      case "draft":
        return isDark
          ? "bg-gray-800 text-gray-300"
          : "bg-gray-100 text-gray-700";
      case "archived":
        return isDark
          ? "bg-orange-900/30 text-orange-400"
          : "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return tAny.admin?.services?.status?.published || "Publié";
      case "draft":
        return tAny.admin?.services?.status?.draft || "Brouillon";
      case "archived":
        return tAny.admin?.services?.status?.archived || "Archivé";
      default:
        return status;
    }
  };

  const uniqueProviders = Array.from(
    new Map(services.map((s) => [s.provider.id, s.provider])).values()
  );

  // Fonction pour obtenir le profile_id à partir du provider_id
  const getProfileIdFromProviderId = (providerId: string): string => {
    if (providerId === "all") return providerId;
    const provider = uniqueProviders.find((p) => p.id === providerId);
    return provider?.profile_id || providerId;
  };

  const filteredServices = services.filter((service) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      (typeof service.title === 'object' 
        ? (service.title?.fr || service.title?.en || "") 
        : (service.title || "")
      ).toLowerCase().includes(searchLower) ||
      (service.provider.company_name || "")
        .toLowerCase()
        .includes(searchLower) ||
      (service.provider.profile.email || "")
        .toLowerCase()
        .includes(searchLower);

    const matchesStatus =
      filters.status === "all" || service.status === filters.status;

    const matchesProvider =
      filters.providerId === "all" ||
      service.provider.id === filters.providerId;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  const stats = {
    total: services.length,
    active: services.filter((s) => s.status === "published").length,
    draft: services.filter((s) => s.status === "draft").length,
    archived: services.filter((s) => s.status === "archived").length,
  };

  if (viewMode === "performance" && filters.providerId !== "all") {
    return (
      <div className="relative z-10">
        <div className="mb-4">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDark
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            {tAny.admin?.services?.buttons?.backToList || "Retour à la liste"}
          </button>
        </div>
        <AnalyticsPerformance
          providerId={getProfileIdFromProviderId(filters.providerId)}
          isAdmin={true}
        />
      </div>
    );
  }

  if (selectedServiceId) {
    return (
      <div className="relative z-10">
        <ServiceViewPage
          serviceId={selectedServiceId}
          onBack={() => {
            setSelectedServiceId(null);
            loadServices(); // Refresh list on return to update any changes
          }}
          isAdmin={true}
        />
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8 ${
          isDark
            ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30"
            : "bg-gradient-to-br from-purple-50 to-pink-50"
        } border ${isDark ? "border-purple-800/30" : "border-purple-200"}`}
      >
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1
                  className={`text-2xl md:text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tAny.admin?.services?.hero?.title || "🛠 Gestion des Services"}
                </h1>
                <p
                  className={`mt-2 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {tAny.admin?.services?.hero?.subtitle || "Vue d'ensemble et administration de tous les services de la plateforme"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: tAny.admin?.services?.stats?.total || "Services totaux",
            value: stats.total,
            icon: Package,
            color: "bg-blue-500",
          },
          {
            label: tAny.admin?.services?.stats?.published || "Services publiés",
            value: stats.active,
            icon: CheckCircle,
            color: "bg-green-500",
          },
          {
            label: tAny.admin?.services?.stats?.draft || "Brouillons",
            value: stats.draft,
            icon: Clock,
            color: "bg-gray-500",
          },
          {
            label: tAny.admin?.services?.stats?.archived || "Archivés",
            value: stats.archived,
            icon: AlertCircle,
            color: "bg-orange-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl ${
              isDark ? "bg-gray-800/50" : "bg-white"
            } shadow-lg border ${
              isDark ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon
                  className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Services Table */}
      <div
        className={`rounded-2xl overflow-hidden ${
          isDark ? "bg-gray-900/50" : "bg-white"
        } shadow-xl border ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {tAny.admin?.services?.table?.title || "Liste des Services"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={tAny.admin?.services?.search?.placeholder || "Rechercher..."}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className={`bg-transparent border-none outline-none text-sm w-48 ${
                    isDark
                      ? "text-gray-300 placeholder-gray-500"
                      : "text-gray-700 placeholder-gray-400"
                  }`}
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className={`px-3 py-2 rounded-lg text-sm outline-none border ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-300"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <option value="all">{tAny.admin?.services?.filters?.allStatus || "Tous les statuts"}</option>
                <option value="published">{tAny.admin?.services?.filters?.published || "Publiés"}</option>
                <option value="draft">{tAny.admin?.services?.filters?.draft || "Brouillons"}</option>
                <option value="archived">{tAny.admin?.services?.filters?.archived || "Archivés"}</option>
              </select>

              <select
                value={filters.providerId}
                onChange={(e) => {
                  setFilters({ ...filters, providerId: e.target.value });
                  // If switching provider, reset view mode if needed
                  if (viewMode === "performance") setViewMode("list");
                }}
                className={`px-3 py-2 rounded-lg text-sm outline-none border max-w-[200px] ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-300"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <option value="all">
                  {tAny.admin?.services?.filters?.allProviders || "Tous les prestataires"} ({uniqueProviders.length})
                </option>
                {uniqueProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.company_name ||
                      provider.profile.email ||
                      "Provider"}
                  </option>
                ))}
              </select>

              {filters.providerId !== "all" && (
                <button
                  onClick={() => canViewPerformance && setViewMode("performance")}
                  disabled={!canViewPerformance}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !canViewPerformance 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  title={!canViewPerformance ? "Permission manquante" : (tAny.admin?.services?.buttons?.performance || "Performance")}
                >
                  {canViewPerformance ? <TrendingUp className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {tAny.admin?.services?.buttons?.performance || "Performance"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p
                className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {tAny.admin?.services?.table?.loading || "Chargement des services..."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-gray-800" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`text-left py-4 px-6 text-sm font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {tAny.admin?.services?.headers?.service || "Service"}
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-sm font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {tAny.admin?.services?.headers?.provider || "Prestataire"}
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-sm font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {tAny.admin?.services?.headers?.price || "Prix"}
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-sm font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {tAny.admin?.services?.headers?.status || "Statut"}
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-sm font-semibold ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {tAny.admin?.services?.headers?.actions || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`border-b last:border-0 ${
                      isDark
                        ? "border-gray-800 hover:bg-gray-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors duration-200`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                          {/* Using a placeholder or package icon if no image available (cover_image fetching logic here if needed) */}
                          <Package className="w-full h-full p-2 text-gray-500" />
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {typeof service.title === 'object'
                              ? (service.title?.fr || service.title?.en || tAny.admin?.services?.defaults?.noTitle || "Sans titre")
                              : (service.title || tAny.admin?.services?.defaults?.noTitle || "Sans titre")}
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            ID: ...{service.id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {service.provider.company_name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {service.provider.profile.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p
                        className={`font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <CurrencyConverter amount={service.base_price_cents / 100} />
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {getStatusLabel(service.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => canViewDetails && setSelectedServiceId(service.id)}
                          disabled={!canViewDetails}
                          className={`p-2 rounded-lg ${
                            !canViewDetails
                              ? "text-gray-400 cursor-not-allowed"
                              : isDark
                              ? "hover:bg-gray-800 text-blue-400"
                              : "hover:bg-gray-100 text-blue-600"
                          }`}
                          title={!canViewDetails ? "Permission manquante" : (tAny.admin?.services?.buttons?.viewDetails || "Voir les détails")}
                        >
                          {canViewDetails ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {tAny.admin?.services?.table?.empty || "Aucun service trouvé."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Services;
