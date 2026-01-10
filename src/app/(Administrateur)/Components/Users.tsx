// ============================================================================
// PAGE: Users - Administration des utilisateurs
// ============================================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  Shield,
  Star,
  Package,
  CreditCard,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  X,
  CheckCircle,
  AlertCircle,
  Edit2,
  Lock,
  Unlock,
  Download,
  Upload,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  BarChart3,
  RefreshCw,
  Filter as FilterIcon,
  Settings,
  ShieldAlert,
} from "lucide-react";

import ProfilesClient from "./ProfilesClient";
import ProfilesProvider from "./ProfilesProvider";

interface UserProps {
  isDark?: boolean;
}

interface Client {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  avatar_url: string;
  location: string;
  email_verified: boolean;
  phone_verified: boolean;
  role: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
  is_active: boolean;
  last_login?: string;
}

interface Provider {
  id: string;
  profile_id: string;
  company_name: string;
  profession: string;
  tagline: string;
  hourly_rate: number | null;
  starting_price: number | null;
  experience_years: number;
  rating: number;
  total_reviews: number;
  completed_orders_count: number;
  is_verified: boolean;
  is_active: boolean;
  profile: {
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url: string;
    email: string;
    phone: string;
    location: string;
  };
  total_earned?: number;
  available_balance?: number;
  total_withdrawn?: number;
}

interface Stats {
  total_clients: number;
  total_providers: number;
  active_clients: number;
  active_providers: number;
  new_clients_today: number;
  new_providers_today: number;
  total_revenue: number;
  pending_withdrawals: number;
}

export default function Userss({ isDark = false }: UserProps) {
  // États pour la navigation
  const [selectedTab, setSelectedTab] = useState<"clients" | "providers">(
    "clients"
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );

  // États pour les données
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et le filtrage
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "most_orders" | "most_spent"
  >("newest");

  // États pour les actions en masse
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<
    "none" | "block" | "unblock" | "delete" | "export"
  >("none");
  const [processingBulk, setProcessingBulk] = useState(false);

  // États pour les modals
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger les statistiques
      await loadStats();

      // Charger les clients et prestataires en parallèle
      await Promise.all([loadClients(), loadProviders()]);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch("/api/admin/users-stats", {
        headers: { "x-is-admin": "true" },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadClients = async () => {
    try {
      const params = new URLSearchParams({
        isAdmin: "true",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange !== "all" && { date_range: dateRange }),
        sort_by: sortBy,
      });

      console.log(
        "[USERS] Loading clients with URL:",
        `/api/admin/clients?${params}`
      );

      const response = await fetch(`/api/admin/clients?${params}`, {
        headers: { "x-is-admin": "true" },
      });

      console.log("[USERS] Response status:", response.status);

      const data = await response.json();

      console.log("[USERS] Response data:", data);

      if (data.success) {
        console.log(
          "[USERS] Setting clients:",
          data.data.clients.length,
          "clients"
        );
        setClients(data.data.clients);
      } else {
        console.error("[USERS] Error in response:", data.error);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("[USERS] Erreur chargement clients:", error);
      throw error;
    }
  };

  const loadProviders = async () => {
    try {
      const params = new URLSearchParams({
        isAdmin: "true",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(verificationFilter !== "all" && {
          verification: verificationFilter,
        }),
        ...(dateRange !== "all" && { date_range: dateRange }),
        sort_by: sortBy,
      });

      console.log(
        "[USERS] Loading providers with URL:",
        `/api/admin/providers?${params}`
      );

      const response = await fetch(`/api/admin/providers?${params}`, {
        headers: { "x-is-admin": "true" },
      });

      console.log("[USERS] Providers response status:", response.status);

      const data = await response.json();

      console.log("[USERS] Providers response data:", data);

      if (data.success) {
        console.log(
          "[USERS] Setting providers:",
          data.data.providers.length,
          "providers"
        );
        setProviders(data.data.providers);
      } else {
        console.error("[USERS] Error in providers response:", data.error);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("[USERS] Erreur chargement providers:", error);
      throw error;
    }
  };

  // Actions sur les utilisateurs
  const handleToggleUser = async (
    userId: string,
    action: "block" | "unblock"
  ) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${
          action === "block" ? "bloquer" : "débloquer"
        } cet utilisateur ?`
      )
    ) {
      try {
        const response = await fetch("/api/admin/toggle-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-is-admin": "true",
          },
          body: JSON.stringify({
            user_id: userId,
            action: action,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(
            `Utilisateur ${
              action === "block" ? "bloqué" : "débloqué"
            } avec succès`
          );
          loadData(); // Recharger les données
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Erreur lors de l'opération");
      }
    }
  };

  const handleDeleteUser = async (
    userId: string,
    type: "client" | "provider"
  ) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement cet ${
          type === "client" ? "utilisateur" : "prestataire"
        } ? Cette action est irréversible.`
      )
    ) {
      try {
        const response = await fetch("/api/admin/delete-user", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-is-admin": "true",
          },
          body: JSON.stringify({
            user_id: userId,
            type: type,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(
            `${
              type === "client" ? "Utilisateur" : "Prestataire"
            } supprimé avec succès`
          );
          loadData(); // Recharger les données
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  // Actions en masse
  const handleBulkAction = async () => {
    if (selectedIds.length === 0 || bulkAction === "none") return;

    setProcessingBulk(true);

    try {
      const response = await fetch("/api/admin/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-is-admin": "true",
        },
        body: JSON.stringify({
          action: bulkAction,
          user_ids: selectedIds,
          user_type: selectedTab,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`${selectedIds.length} utilisateur(s) mis à jour avec succès`);
        setSelectedIds([]);
        setBulkAction("none");
        setShowBulkActions(false);
        loadData(); // Recharger les données
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'action en masse");
    } finally {
      setProcessingBulk(false);
    }
  };

  // Export des données
  const handleExport = async (type: "clients" | "providers") => {
    try {
      const response = await fetch(`/api/admin/export-${type}?isAdmin=true`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur export:", error);
      alert("Erreur lors de l'export");
    }
  };

  // Filtrer les données selon les critères
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Filtre par statut
      if (statusFilter === "active" && !client.is_active) return false;
      if (statusFilter === "inactive" && client.is_active) return false;

      // Filtre par date
      if (dateRange !== "all") {
        const clientDate = new Date(client.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - clientDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange === "today" && diffDays > 1) return false;
        if (dateRange === "week" && diffDays > 7) return false;
        if (dateRange === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [clients, statusFilter, dateRange]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      // Filtre par statut
      if (statusFilter === "active" && !provider.is_active) return false;
      if (statusFilter === "inactive" && provider.is_active) return false;

      // Filtre par vérification
      if (verificationFilter === "verified" && !provider.is_verified)
        return false;
      if (verificationFilter === "unverified" && provider.is_verified)
        return false;

      // Filtre par date
      if (dateRange !== "all") {
        const providerDate = new Date(
          provider.profile?.created_at || new Date()
        );
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - providerDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange === "today" && diffDays > 1) return false;
        if (dateRange === "week" && diffDays > 7) return false;
        if (dateRange === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [providers, statusFilter, verificationFilter, dateRange]);

  // Calculer les statistiques de la vue
  const currentData =
    selectedTab === "clients" ? filteredClients : filteredProviders;
  const selectedCount = selectedIds.length;

  // Charger les données au montage
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!loading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, verificationFilter, dateRange, sortBy]);

  // Si un client est sélectionné
  if (selectedClientId) {
    return (
      <ProfilesClient
        profileId={selectedClientId}
        isAdmin={true}
        isDark={isDark}
        onBack={() => {
          setSelectedClientId(null);
          loadData(); // Recharger les données après retour
        }}
      />
    );
  }

  // Si un prestataire est sélectionné
  if (selectedProviderId) {
    return (
      <ProfilesProvider
        providerId={selectedProviderId}
        isAdmin={true}
        isDark={isDark}
        onBack={() => {
          setSelectedProviderId(null);
          loadData(); // Recharger les données après retour
        }}
      />
    );
  }

  // Écran de chargement
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-900"
            : "bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20"
        }`}
      >
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          </div>
          <p
            className={
              isDark
                ? "text-white/80 font-medium"
                : "text-slate-600 font-medium"
            }
          >
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20"
      }`}
    >
      {/* En-tête principal */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Administration des utilisateurs
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold rounded-full">
                  MODE ADMIN
                </span>
              </div>
            </div>
            <p
              className={`text-lg ${
                isDark ? "text-white/60" : "text-slate-600"
              }`}
            >
              Gérez les clients et prestataires de la plateforme
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </button>

            <button
              onClick={() => handleExport(selectedTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                  : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700"
              }`}
            >
              <Download className="w-5 h-5" />
              Exporter
            </button>

            <button
              onClick={loadData}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Onglets de navigation rapide */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`flex rounded-xl p-1 ${
              isDark ? "bg-slate-800" : "bg-white shadow-sm"
            }`}
          >
            <button
              onClick={() => setSelectedTab("clients")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedTab === "clients"
                  ? isDark
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                  : isDark
                  ? "text-white/60 hover:text-white hover:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-5 h-5" />
              Clients
              {stats && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedTab === "clients"
                      ? "bg-white/20"
                      : isDark
                      ? "bg-slate-700 text-white/80"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {stats.total_clients}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedTab("providers")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedTab === "providers"
                  ? isDark
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                  : isDark
                  ? "text-white/60 hover:text-white hover:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Building className="w-5 h-5" />
              Prestataires
              {stats && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedTab === "providers"
                      ? "bg-white/20"
                      : isDark
                      ? "bg-slate-700 text-white/80"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {stats.total_providers}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div
          className={`mb-8 p-6 rounded-2xl ${
            isDark
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              : "bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDark ? "text-white/40" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Rechercher un ${
                    selectedTab === "clients" ? "client" : "prestataire"
                  }...`}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl ${
                    isDark
                      ? "bg-slate-800 border border-slate-700 text-white placeholder-white/40 focus:border-slate-600"
                      : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-300"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Bouton filtres */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  showFilters
                    ? isDark
                      ? "bg-purple-600 text-white"
                      : "bg-purple-500 text-white"
                    : isDark
                    ? "bg-slate-800 text-white/80 hover:bg-slate-700 border border-slate-700"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                }`}
              >
                <FilterIcon className="w-5 h-5" />
                Filtres
              </button>

              {selectedCount > 0 && (
                <button
                  onClick={() => setShowBulkActions(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    isDark
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                      : "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  {selectedCount} sélectionné(s)
                </button>
              )}
            </div>
          </div>

          {/* Panneau des filtres */}
          {showFilters && (
            <div
              className={`mt-6 pt-6 border-t ${
                isDark ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtre par statut */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-white/70" : "text-slate-700"
                    }`}
                  >
                    Statut
                  </label>
                  <div className="flex gap-2">
                    {["all", "active", "inactive"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          statusFilter === status
                            ? isDark
                              ? "bg-purple-600 text-white"
                              : "bg-purple-500 text-white"
                            : isDark
                            ? "bg-slate-800 text-white/60 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {status === "all" && "Tous"}
                        {status === "active" && "Actifs"}
                        {status === "inactive" && "Inactifs"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtre par vérification (prestataires seulement) */}
                {selectedTab === "providers" && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? "text-white/70" : "text-slate-700"
                      }`}
                    >
                      Vérification
                    </label>
                    <div className="flex gap-2">
                      {["all", "verified", "unverified"].map((verification) => (
                        <button
                          key={verification}
                          onClick={() =>
                            setVerificationFilter(verification as any)
                          }
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                            verificationFilter === verification
                              ? isDark
                                ? "bg-purple-600 text-white"
                                : "bg-purple-500 text-white"
                              : isDark
                              ? "bg-slate-800 text-white/60 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {verification === "all" && "Tous"}
                          {verification === "verified" && "Vérifiés"}
                          {verification === "unverified" && "Non vérifiés"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtre par date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-white/70" : "text-slate-700"
                    }`}
                  >
                    Date d&apos;inscription
                  </label>
                  <div className="flex gap-2">
                    {["all", "today", "week", "month"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setDateRange(range as any)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          dateRange === range
                            ? isDark
                              ? "bg-purple-600 text-white"
                              : "bg-purple-500 text-white"
                            : isDark
                            ? "bg-slate-800 text-white/60 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {range === "all" && "Tous"}
                        {range === "today" && "Aujourd'hui"}
                        {range === "week" && "7 jours"}
                        {range === "month" && "30 jours"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tri */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-white/70" : "text-slate-700"
                    }`}
                  >
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-slate-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="newest">Plus récent</option>
                    <option value="oldest">Plus ancien</option>
                    {selectedTab === "clients" ? (
                      <>
                        <option value="most_orders">Plus de commandes</option>
                        <option value="most_spent">Plus dépensé</option>
                      </>
                    ) : (
                      <>
                        <option value="most_orders">Plus de commandes</option>
                        <option value="highest_rating">Meilleure note</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Boutons d'action des filtres */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setVerificationFilter("all");
                    setDateRange("all");
                    setSortBy("newest");
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-slate-800 text-white/80 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 pb-16">
        {/* En-tête de la liste */}
        <div
          className={`mb-6 p-4 rounded-xl ${
            isDark ? "bg-slate-800/50" : "bg-white/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-xl font-bold mb-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {selectedTab === "clients"
                  ? "Liste des clients"
                  : "Liste des prestataires"}
              </h2>
              <p className={isDark ? "text-white/60" : "text-slate-600"}>
                {currentData.length}{" "}
                {selectedTab === "clients" ? "client(s)" : "prestataire(s)"}{" "}
                trouvé(s)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                className={`flex items-center gap-2 text-sm ${
                  isDark ? "text-white/70" : "text-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === currentData.length &&
                    currentData.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(
                        currentData.map((item) =>
                          selectedTab === "clients"
                            ? (item as Client).user_id
                            : (item as Provider).id
                        )
                      );
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Tout sélectionner
              </label>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div
          className={`rounded-2xl shadow-xl overflow-hidden ${
            isDark
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
              : "bg-white/80 backdrop-blur-sm border border-white/20"
          }`}
        >
          {currentData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {selectedTab === "clients" ? (
                  <Users className="w-10 h-10 text-slate-400" />
                ) : (
                  <Building className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h3
                className={`text-lg font-bold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Aucun {selectedTab === "clients" ? "client" : "prestataire"}{" "}
                trouvé
              </h3>
              <p className={isDark ? "text-white/60" : "text-slate-600"}>
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        Utilisateur
                      </span>
                    </th>
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        Contact
                      </span>
                    </th>
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        {selectedTab === "clients" ? "Commandes" : "Note"}
                      </span>
                    </th>
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        {selectedTab === "clients"
                          ? "Total dépensé"
                          : "Revenus"}
                      </span>
                    </th>
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        Statut
                      </span>
                    </th>
                    <th className="p-4 text-left">
                      <span
                        className={isDark ? "text-white/70" : "text-slate-600"}
                      >
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTab === "clients"
                    ? filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          className={`border-b last:border-b-0 hover:bg-opacity-10 ${
                            isDark
                              ? "border-slate-700 hover:bg-white/5"
                              : "border-slate-100 hover:bg-slate-50/80"
                          } transition-colors`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(client.user_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds([
                                      ...selectedIds,
                                      client.user_id,
                                    ]);
                                  } else {
                                    setSelectedIds(
                                      selectedIds.filter(
                                        (id) => id !== client.user_id
                                      )
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                              />
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                                {client.avatar_url ? (
                                  <img
                                    src={client.avatar_url}
                                    alt={client.display_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-blue-500 mx-auto mt-2" />
                                )}
                              </div>
                              <div>
                                <h4
                                  className={`font-semibold ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {client.display_name ||
                                    `${client.first_name} ${client.last_name}`}
                                </h4>
                                <p
                                  className={`text-sm ${
                                    isDark ? "text-white/60" : "text-slate-600"
                                  }`}
                                >
                                  Membre depuis{" "}
                                  {new Date(
                                    client.created_at
                                  ).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span
                                  className={
                                    isDark ? "text-white/80" : "text-slate-700"
                                  }
                                >
                                  {client.email}
                                </span>
                                {client.email_verified && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              {client.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-slate-400" />
                                  <span
                                    className={
                                      isDark
                                        ? "text-white/80"
                                        : "text-slate-700"
                                    }
                                  >
                                    {client.phone}
                                  </span>
                                  {client.phone_verified && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Package
                                className={`w-5 h-5 ${
                                  isDark ? "text-blue-400" : "text-blue-500"
                                }`}
                              />
                              <span
                                className={`font-semibold ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {client.order_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CreditCard
                                className={`w-5 h-5 ${
                                  isDark ? "text-green-400" : "text-green-500"
                                }`}
                              />
                              <span
                                className={`font-semibold ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {client.total_spent
                                  ? `${client.total_spent.toFixed(2)} €`
                                  : "0 €"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  client.is_active
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <span
                                className={`font-medium ${
                                  client.is_active
                                    ? isDark
                                      ? "text-green-400"
                                      : "text-green-600"
                                    : isDark
                                    ? "text-red-400"
                                    : "text-red-600"
                                }`}
                              >
                                {client.is_active ? "Actif" : "Inactif"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  console.log(
                                    "[USERS] Viewing client profile:",
                                    client.id,
                                    "Full client:",
                                    client
                                  );
                                  setSelectedClientId(client.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                title="Voir le profil"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleUser(
                                    client.user_id,
                                    client.is_active ? "block" : "unblock"
                                  )
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  client.is_active
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                }`}
                                title={
                                  client.is_active ? "Bloquer" : "Débloquer"
                                }
                              >
                                {client.is_active ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Unlock className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteUser(client.user_id, "client")
                                }
                                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : filteredProviders.map((provider) => (
                        <tr
                          key={provider.id}
                          className={`border-b last:border-b-0 hover:bg-opacity-10 ${
                            isDark
                              ? "border-slate-700 hover:bg-white/5"
                              : "border-slate-100 hover:bg-slate-50/80"
                          } transition-colors`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(provider.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds([
                                      ...selectedIds,
                                      provider.id,
                                    ]);
                                  } else {
                                    setSelectedIds(
                                      selectedIds.filter(
                                        (id) => id !== provider.id
                                      )
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                              />
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                                {provider.profile?.avatar_url ? (
                                  <img
                                    src={provider.profile.avatar_url}
                                    alt={provider.profile.display_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building className="w-6 h-6 text-purple-500 mx-auto mt-2" />
                                )}
                              </div>
                              <div>
                                <h4
                                  className={`font-semibold ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {provider.company_name ||
                                    provider.profile?.display_name ||
                                    `${provider.profile?.first_name} ${provider.profile?.last_name}`}
                                </h4>
                                <p
                                  className={`text-sm ${
                                    isDark ? "text-white/60" : "text-slate-600"
                                  }`}
                                >
                                  {provider.profession}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span
                                  className={
                                    isDark ? "text-white/80" : "text-slate-700"
                                  }
                                >
                                  {provider.profile?.email}
                                </span>
                              </div>
                              {provider.profile?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-slate-400" />
                                  <span
                                    className={
                                      isDark
                                        ? "text-white/80"
                                        : "text-slate-700"
                                    }
                                  >
                                    {provider.profile.phone}
                                  </span>
                                </div>
                              )}
                              {provider.profile?.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  <span
                                    className={
                                      isDark
                                        ? "text-white/80"
                                        : "text-slate-700"
                                    }
                                  >
                                    {provider.profile.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Star
                                className={`w-5 h-5 ${
                                  isDark ? "text-yellow-400" : "text-yellow-500"
                                }`}
                              />
                              <span
                                className={`font-semibold ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {provider.rating.toFixed(1)}
                              </span>
                              <span
                                className={
                                  isDark ? "text-white/60" : "text-slate-600"
                                }
                              >
                                ({provider.total_reviews})
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <TrendingUp
                                  className={`w-4 h-4 ${
                                    isDark ? "text-green-400" : "text-green-500"
                                  }`}
                                />
                                <span
                                  className={`font-semibold ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {provider.total_earned
                                    ? `${provider.total_earned.toFixed(2)} €`
                                    : "0 €"}
                                </span>
                              </div>
                              <div
                                className={`text-xs ${
                                  isDark ? "text-white/60" : "text-slate-600"
                                }`}
                              >
                                {provider.completed_orders_count} commandes
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  provider.is_verified
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-amber-500/20 text-amber-500"
                                }`}
                              >
                                {provider.is_verified
                                  ? "Vérifié"
                                  : "Non vérifié"}
                              </div>
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  provider.is_active
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {provider.is_active ? "Actif" : "Inactif"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setSelectedProviderId(provider.id)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark
                                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                title="Voir le profil"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const userId = provider.profile?.user_id;
                                  if (userId) {
                                    handleToggleUser(
                                      userId,
                                      provider.is_active ? "block" : "unblock"
                                    );
                                  }
                                }}
                                disabled={!provider.profile?.user_id}
                                className={`p-2 rounded-lg transition-colors ${
                                  provider.is_active
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                }`}
                                title={
                                  provider.is_active ? "Bloquer" : "Débloquer"
                                }
                              >
                                {provider.is_active ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Unlock className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const userId = provider.profile?.user_id;
                                  if (userId) {
                                    handleDeleteUser(userId, "provider");
                                  }
                                }}
                                disabled={!provider.profile?.user_id}
                                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination (optionnelle) */}
        {currentData.length > 0 && (
          <div
            className={`mt-6 flex items-center justify-between p-4 rounded-xl ${
              isDark ? "bg-slate-800/50" : "bg-white/50"
            }`}
          >
            <div className={isDark ? "text-white/60" : "text-slate-600"}>
              Affichage de 1 à {Math.min(currentData.length, 20)} sur{" "}
              {currentData.length} résultats
            </div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 rounded-lg ${
                  isDark
                    ? "bg-slate-700 text-white/80 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Précédent
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg ${
                  isDark
                    ? "bg-slate-700 text-white/80 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                1
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg ${
                  isDark
                    ? "bg-purple-600 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                2
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg ${
                  isDark
                    ? "bg-slate-700 text-white/80 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'actions en masse */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-md w-full ${
              isDark
                ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            } shadow-2xl`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Actions en masse
                  </h3>
                  <p className="text-sm text-white/60">
                    {selectedCount} utilisateur(s) sélectionné(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkActions(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Action à appliquer
                  </label>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                  >
                    <option value="none">Sélectionner une action</option>
                    <option value="block">Bloquer les comptes</option>
                    <option value="unblock">Débloquer les comptes</option>
                    <option value="delete">Supprimer les comptes</option>
                    <option value="export">Exporter les données</option>
                  </select>
                </div>

                {bulkAction === "delete" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Attention !</span>
                    </div>
                    <p className="text-sm text-white/80">
                      Cette action est irréversible et supprimera définitivement{" "}
                      {selectedCount} compte(s). Cette action ne peut pas être
                      annulée.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="flex-1 px-4 py-3 border border-slate-600 text-white/80 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={processingBulk || bulkAction === "none"}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingBulk ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Appliquer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des statistiques */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-2xl w-full ${
              isDark
                ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            } shadow-2xl`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Statistiques générales
                  </h3>
                  <p className="text-sm text-white/60">
                    Aperçu global de la plateforme
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-blue-900/30" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Users
                      className={`w-8 h-8 ${
                        isDark ? "text-blue-400" : "text-blue-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Clients
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {stats.total_clients}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-500"
                    }`}
                  >
                    +{stats.new_clients_today} aujourd'hui
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-purple-900/30" : "bg-purple-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Building
                      className={`w-8 h-8 ${
                        isDark ? "text-purple-400" : "text-purple-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Prestataires
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {stats.total_providers}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-500"
                    }`}
                  >
                    +{stats.new_providers_today} aujourd'hui
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-green-900/30" : "bg-green-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp
                      className={`w-8 h-8 ${
                        isDark ? "text-green-400" : "text-green-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Chiffre d'affaires
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {stats.total_revenue.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-500"
                    }`}
                  >
                    Total généré
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-amber-900/30" : "bg-amber-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard
                      className={`w-8 h-8 ${
                        isDark ? "text-amber-400" : "text-amber-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Retraits en attente
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {stats.pending_withdrawals.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-500"
                    }`}
                  >
                    À traiter
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className={`px-6 py-2.5 rounded-xl font-medium ${
                    isDark
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
