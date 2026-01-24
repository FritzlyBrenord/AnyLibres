// ============================================================================
// COMPOSANT: ProfilesProvider - Affiche le profil détaillé d'un prestataire
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  Unlock,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Award,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Building,
  Briefcase,
  Clock,
  ArrowDownToLine,
  Wallet,
  History,
  CreditCard,
  BanknoteIcon,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";

interface ProviderProfileProps {
  providerId?: string;
  isAdmin?: boolean;
  isDark?: boolean;
  onBack?: () => void;
}

interface ProviderProfile {
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
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    email_verified: boolean;
    phone_verified: boolean;
    created_at: string;
  };
}

interface ProviderStats {
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_total: number;
  completed_orders: number;
  active_orders: number;
  cancelled_orders: number;
  total_orders: number;
  completed_orders_revenue: number; // Revenue from completed orders only
  pending_orders_revenue: number; // Revenue from orders in progress
}

interface WithdrawalHistory {
  id: string;
  amount_cents: number;
  fee_cents: number;
  net_amount_cents: number;
  currency: string;
  payment_method_type: string;
  payment_method_details: string;
  external_reference: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  completed_at: string | null;
}

export default function ProfilesProvider({
  providerId,
  isAdmin = false,
  isDark = false,
  onBack,
}: ProviderProfileProps) {
  const router = useRouter();
  const { defaultCurrency, convertFromUSD, formatAmount } = useCurrency();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Charger le profil provider
  const loadProvider = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) {
        headers["x-is-admin"] = "true";
      }

      const url = `/api/admin/providers?provider_id=${providerId}&isAdmin=true`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.success && data.data.providers && data.data.providers.length > 0) {
        const providerData = data.data.providers[0];
        setProvider(providerData);

        // Charger les statistiques et historique si admin
        if (isAdmin && providerData.profile_id) {
          loadProviderStats(providerData.profile_id);
          loadWithdrawalHistory(providerData.profile_id);
        }
      } else {
        setError(data.error || "Provider introuvable");
      }
    } catch (err) {
      setError("Erreur de chargement du profil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques du provider
  const loadProviderStats = async (profileId: string) => {
    setLoadingStats(true);
    try {
      const response = await fetch(
        `/api/admin/provider-stats?profile_id=${profileId}&isAdmin=true`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Charger l'historique des retraits
  const loadWithdrawalHistory = async (profileId: string) => {
    setLoadingWithdrawals(true);
    try {
      const response = await fetch(
        `/api/admin/provider-withdrawals?profile_id=${profileId}&isAdmin=true`
      );
      const data = await response.json();

      if (data.success) {
        setWithdrawals(data.data.withdrawals || []);
      }
    } catch (error) {
      console.error("Erreur chargement retraits:", error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Actions admin
  const handleToggleProvider = async (action: "block" | "unblock") => {
    if (!provider || !isAdmin) return;

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${
          action === "block" ? "bloquer" : "débloquer"
        } ce prestataire ?`
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
            user_id: provider.profile.user_id,
            action: action,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(
            `Prestataire ${action === "block" ? "bloqué" : "débloqué"} avec succès`
          );
          loadProvider();
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Erreur lors de l'opération");
      }
    }
  };

  const handleDeleteProvider = async () => {
    if (!provider || !isAdmin) return;

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ce prestataire ? Cette action est irréversible.`
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
            user_id: provider.profile.user_id,
            type: "provider",
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert("Prestataire supprimé avec succès");
          if (onBack) onBack();
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  useEffect(() => {
    if (providerId) {
      loadProvider();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, isAdmin]);

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
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className={isDark ? "text-white/80" : "text-slate-600"}>
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div
        className={`min-h-screen flex flex-col ${
          isDark
            ? "bg-slate-900"
            : "bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20"
        }`}
      >
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1
              className={`text-2xl font-bold mb-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Profil introuvable
            </h1>
            <p
              className={isDark ? "text-white/60 mb-6" : "text-slate-600 mb-6"}
            >
              {error}
            </p>
            <button
              onClick={onBack || (() => router.push(isAdmin ? "/admin" : "/"))}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              }`}
            >
              {isAdmin ? "Retour à l'admin" : "Retour"}
            </button>
          </div>
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
      {/* Header avec bouton retour */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack || (() => router.push(isAdmin ? "/admin" : "/"))}
            className={`group flex items-center gap-3 transition-all duration-300 px-4 py-2 rounded-xl ${
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {isAdmin ? "Retour à l'admin" : "Retour"}
            </span>
          </button>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-slate-800 text-white/70 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {showSensitiveInfo ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Masquer les infos
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Afficher les infos
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Badge admin */}
        {isAdmin && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">MODE ADMIN - VUE PRESTATAIRE</span>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Colonne de gauche - Informations du provider */}
          <div className="lg:col-span-3 space-y-8">
            {/* Carte profil */}
            <div
              className={`rounded-2xl shadow-xl p-8 ${
                isDark
                  ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                  : "bg-white/80 backdrop-blur-sm border border-white/20"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                {/* Photo de profil */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div
                      className={`w-32 h-32 rounded-2xl overflow-hidden ${
                        isDark
                          ? "border-2 border-slate-700"
                          : "border-2 border-white shadow-lg"
                      }`}
                    >
                      {provider.profile.avatar_url ? (
                        <img
                          src={provider.profile.avatar_url}
                          alt={provider.company_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            isDark
                              ? "bg-gradient-to-br from-purple-900 to-indigo-900"
                              : "bg-gradient-to-br from-purple-100 to-pink-100"
                          }`}
                        >
                          <Building
                            className={`w-16 h-16 ${
                              isDark ? "text-purple-300" : "text-purple-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    {provider.is_verified && (
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                      <h1
                        className={`text-3xl font-bold mb-2 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {provider.company_name ||
                          provider.profile.display_name ||
                          `${provider.profile.first_name} ${provider.profile.last_name}`}
                      </h1>
                      <div className="flex items-center gap-3 mb-2">
                        <p
                          className={`text-lg font-medium ${
                            isDark ? "text-purple-400" : "text-purple-600"
                          }`}
                        >
                          {provider.profession}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
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
                      </div>
                      <p
                        className={`flex items-center gap-2 ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        {provider.profile.email}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleToggleProvider(
                              provider.is_active ? "block" : "unblock"
                            )
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                            provider.is_active
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                          }`}
                        >
                          {provider.is_active ? (
                            <>
                              <Lock className="w-4 h-4" />
                              Bloquer
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              Débloquer
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDeleteProvider}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tagline */}
                  {provider.tagline && (
                    <div
                      className={`mb-6 p-4 rounded-xl ${
                        isDark ? "bg-slate-800/50" : "bg-slate-50/80"
                      }`}
                    >
                      <p
                        className={`italic ${
                          isDark ? "text-white/80" : "text-slate-700"
                        }`}
                      >
                        &quot;{provider.tagline}&quot;
                      </p>
                    </div>
                  )}

                  {/* Informations détaillées */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                      isDark ? "bg-slate-800/30" : "bg-slate-50/50"
                    } p-4 rounded-xl`}
                  >
                    {provider.profile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone
                          className={`w-5 h-5 ${
                            isDark ? "text-blue-400" : "text-blue-500"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            Téléphone
                          </p>
                          <p
                            className={
                              isDark
                                ? "text-white"
                                : "text-slate-900 font-medium"
                            }
                          >
                            {provider.profile.phone}
                            {provider.profile.phone_verified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 inline-block ml-2" />
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {provider.profile.location && (
                      <div className="flex items-center gap-3">
                        <MapPin
                          className={`w-5 h-5 ${
                            isDark ? "text-green-400" : "text-green-500"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            Localisation
                          </p>
                          <p
                            className={
                              isDark
                                ? "text-white"
                                : "text-slate-900 font-medium"
                            }
                          >
                            {provider.profile.location}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Briefcase
                        className={`w-5 h-5 ${
                          isDark ? "text-purple-400" : "text-purple-500"
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm ${
                            isDark ? "text-white/60" : "text-slate-500"
                          }`}
                        >
                          Expérience
                        </p>
                        <p
                          className={
                            isDark ? "text-white" : "text-slate-900 font-medium"
                          }
                        >
                          {provider.experience_years} an
                          {provider.experience_years > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar
                        className={`w-5 h-5 ${
                          isDark ? "text-orange-400" : "text-orange-500"
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm ${
                            isDark ? "text-white/60" : "text-slate-500"
                          }`}
                        >
                          Membre depuis
                        </p>
                        <p
                          className={
                            isDark ? "text-white" : "text-slate-900 font-medium"
                          }
                        >
                          {new Date(provider.profile.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {provider.hourly_rate && (
                      <div className="flex items-center gap-3">
                        <Clock
                          className={`w-5 h-5 ${
                            isDark ? "text-emerald-400" : "text-emerald-500"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            Tarif horaire
                          </p>
                          <p
                            className={`font-semibold ${
                              isDark ? "text-emerald-400" : "text-emerald-600"
                            }`}
                          >
                            {formatAmount(convertFromUSD(provider.hourly_rate))} / heure
                          </p>
                        </div>
                      </div>
                    )}

                    {provider.starting_price && (
                      <div className="flex items-center gap-3">
                        <DollarSign
                          className={`w-5 h-5 ${
                            isDark ? "text-cyan-400" : "text-cyan-500"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            Prix de départ
                          </p>
                          <p
                            className={`font-semibold ${
                              isDark ? "text-cyan-400" : "text-cyan-600"
                            }`}
                          >
                            {formatAmount(convertFromUSD(provider.starting_price))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Infos sensibles (admin seulement) */}
                  {isAdmin && showSensitiveInfo && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-200/30">
                      <h3
                        className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                          isDark ? "text-white" : "text-red-800"
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        Informations sensibles
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-red-600"
                            }`}
                          >
                            ID Utilisateur
                          </p>
                          <p
                            className={`font-mono text-sm ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {provider.profile.user_id}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-red-600"
                            }`}
                          >
                            ID Provider
                          </p>
                          <p
                            className={`font-mono text-sm ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {provider.id}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-red-600"
                            }`}
                          >
                            ID Profile
                          </p>
                          <p
                            className={`font-mono text-sm ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {provider.profile_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistiques financières (admin seulement) */}
            {isAdmin && (
              <div
                className={`rounded-2xl shadow-xl p-8 ${
                  isDark
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                    : "bg-white/80 backdrop-blur-sm border border-white/20"
                }`}
              >
                <h2
                  className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <Wallet className="w-6 h-6" />
                  Statistiques financières
                </h2>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Revenue total (terminées + en cours) */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                          : "bg-gradient-to-br from-green-50 to-emerald-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp
                          className={`w-8 h-8 ${
                            isDark ? "text-green-400" : "text-green-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          <CurrencyConverter amount={stats.completed_orders_revenue + stats.pending_orders_revenue} />
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Revenue total (terminées + en cours)
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-white/40" : "text-slate-500"
                        }`}
                      >
                        {stats.total_orders} commande(s)
                      </p>
                    </div>

                    {/* Revenue commandes en cours */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-blue-900/30 to-cyan-900/30"
                          : "bg-gradient-to-br from-blue-50 to-cyan-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Clock
                          className={`w-8 h-8 ${
                            isDark ? "text-blue-400" : "text-blue-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          <CurrencyConverter amount={stats.pending_orders_revenue} />
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Revenue en cours
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-white/40" : "text-slate-500"
                        }`}
                      >
                        {stats.active_orders} commande(s) active(s)
                      </p>
                    </div>

                    {/* Montant cumulé total */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30"
                          : "bg-gradient-to-br from-purple-50 to-pink-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp
                          className={`w-8 h-8 ${
                            isDark ? "text-purple-400" : "text-purple-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          <CurrencyConverter amount={stats.total_earned} />
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Montant cumulé total
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-white/40" : "text-slate-500"
                        }`}
                      >
                        Disponible: <CurrencyConverter amount={stats.available_balance} />
                      </p>
                    </div>

                    {/* Montant déjà retiré */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                          : "bg-gradient-to-br from-amber-50 to-orange-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <ArrowDownToLine
                          className={`w-8 h-8 ${
                            isDark ? "text-amber-400" : "text-amber-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          <CurrencyConverter amount={stats.withdrawn_total} />
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Montant déjà retiré
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-white/40" : "text-slate-500"
                        }`}
                      >
                        {withdrawals.length} retrait(s)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-center py-8 ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  >
                    <p>Aucune statistique disponible</p>
                  </div>
                )}
              </div>
            )}

            {/* Historique des retraits (admin seulement) */}
            {isAdmin && (
              <div
                className={`rounded-2xl shadow-xl p-8 ${
                  isDark
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                    : "bg-white/80 backdrop-blur-sm border border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className={`text-2xl font-bold flex items-center gap-3 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    <History className="w-6 h-6" />
                    Historique des retraits
                  </h2>
                  {withdrawals.length > 0 && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isDark
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {withdrawals.length} retrait{withdrawals.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loadingWithdrawals ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : withdrawals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b ${
                            isDark ? "border-slate-700" : "border-slate-200"
                          }`}
                        >
                          <th
                            className={`p-4 text-left text-sm ${
                              isDark ? "text-white/70" : "text-slate-600"
                            }`}
                          >
                            Date & Heure
                          </th>
                          <th
                            className={`p-4 text-left text-sm ${
                              isDark ? "text-white/70" : "text-slate-600"
                            }`}
                          >
                            Montant
                          </th>
                          <th
                            className={`p-4 text-left text-sm ${
                              isDark ? "text-white/70" : "text-slate-600"
                            }`}
                          >
                            Mode de paiement
                          </th>
                          <th
                            className={`p-4 text-left text-sm ${
                              isDark ? "text-white/70" : "text-slate-600"
                            }`}
                          >
                            Référence
                          </th>
                          <th
                            className={`p-4 text-left text-sm ${
                              isDark ? "text-white/70" : "text-slate-600"
                            }`}
                          >
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((withdrawal) => (
                          <tr
                            key={withdrawal.id}
                            className={`border-b last:border-b-0 hover:bg-opacity-10 ${
                              isDark
                                ? "border-slate-700 hover:bg-white/5"
                                : "border-slate-100 hover:bg-slate-50/80"
                            } transition-colors`}
                          >
                            <td className="p-4">
                              <div>
                                <p
                                  className={`font-medium ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {new Date(
                                    withdrawal.created_at
                                  ).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <p
                                  className={`text-sm ${
                                    isDark ? "text-white/60" : "text-slate-600"
                                  }`}
                                >
                                  {new Date(
                                    withdrawal.created_at
                                  ).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <span
                                  className={`font-semibold text-lg ${
                                    isDark ? "text-emerald-400" : "text-emerald-600"
                                  }`}
                                >
                                  <CurrencyConverter amount={withdrawal.net_amount_cents / 100} />
                                </span>
                                {withdrawal.fee_cents > 0 && (
                                  <p
                                    className={`text-xs mt-1 ${
                                      isDark ? "text-white/50" : "text-slate-500"
                                    }`}
                                  >
                                    Montant demandé: <CurrencyConverter amount={withdrawal.amount_cents / 100} /> · Frais: <CurrencyConverter amount={withdrawal.fee_cents / 100} />
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {withdrawal.payment_method_type === "bank" && (
                                  <BanknoteIcon className="w-5 h-5 text-blue-500" />
                                )}
                                {withdrawal.payment_method_type === "paypal" && (
                                  <CreditCard className="w-5 h-5 text-purple-500" />
                                )}
                                {withdrawal.payment_method_type === "moncash" && (
                                  <Wallet className="w-5 h-5 text-green-500" />
                                )}
                                {withdrawal.payment_method_type === "payoneer" && (
                                  <DollarSign className="w-5 h-5 text-orange-500" />
                                )}
                                <span
                                  className={
                                    isDark ? "text-white" : "text-slate-900"
                                  }
                                >
                                  {withdrawal.payment_method_type === "bank"
                                    ? "Virement bancaire"
                                    : withdrawal.payment_method_type === "paypal"
                                    ? "PayPal"
                                    : withdrawal.payment_method_type === "moncash"
                                    ? "MonCash"
                                    : withdrawal.payment_method_type === "payoneer"
                                    ? "Payoneer"
                                    : withdrawal.payment_method_type}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`font-mono text-sm ${
                                  isDark ? "text-white/80" : "text-slate-700"
                                }`}
                              >
                                {withdrawal.external_reference || "N/A"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                                  withdrawal.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : withdrawal.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : withdrawal.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {withdrawal.status === "completed"
                                  ? "Complété"
                                  : withdrawal.status === "processing"
                                  ? "En traitement"
                                  : withdrawal.status === "failed"
                                  ? "Échoué"
                                  : "En attente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className={`text-center py-12 ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  >
                    <ArrowDownToLine className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Aucun historique de retrait disponible</p>
                    {stats && stats.withdrawn_total > 0 && (
                      <div className={`mt-4 p-4 rounded-xl ${
                        isDark ? "bg-amber-900/20 border border-amber-500/30" : "bg-amber-50 border border-amber-200"
                      }`}>
                        <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                          ℹ️ Un montant de <CurrencyConverter amount={stats.withdrawn_total} /> a été retiré, mais l&apos;historique détaillé n&apos;est pas disponible.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne de droite - Informations supplémentaires */}
          <div className="space-y-6">
            {/* Statut de vérification */}
            <div
              className={`rounded-2xl shadow-xl p-6 ${
                isDark
                  ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                  : "bg-white/80 backdrop-blur-sm border border-white/20"
              }`}
            >
              <h3
                className={`font-bold text-lg mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Vérifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-white/70" : "text-slate-600"}>
                    Email
                  </span>
                  {provider.profile.email_verified ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Vérifié</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-500">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Non vérifié</span>
                    </div>
                  )}
                </div>

                {provider.profile.phone && (
                  <div className="flex items-center justify-between">
                    <span
                      className={isDark ? "text-white/70" : "text-slate-600"}
                    >
                      Téléphone
                    </span>
                    {provider.profile.phone_verified ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Vérifié</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-500">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Non vérifié</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-white/70" : "text-slate-600"}>
                    Compte prestataire
                  </span>
                  {provider.is_verified ? (
                    <div className="flex items-center gap-2 text-blue-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Vérifié</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-500">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Non vérifié</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-white/70" : "text-slate-600"}>
                    Statut compte
                  </span>
                  {provider.is_active ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Actif</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-500">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Inactif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div
              className={`rounded-2xl shadow-xl p-6 ${
                isDark
                  ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
                  : "bg-white/80 backdrop-blur-sm border border-white/20"
              }`}
            >
              <h3
                className={`font-bold text-lg mb-4 flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Award className="w-5 h-5" />
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      Note moyenne
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {provider.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(provider.rating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      Commandes terminées
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {provider.completed_orders_count}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      Avis clients
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {provider.total_reviews}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
