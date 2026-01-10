// ============================================================================
// COMPOSANT: ProfilesClient - Affiche le profil d'un client
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  ArrowLeft,
  Package,
  CreditCard,
  TrendingUp,
  Award,
  Shield,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface ClientProfileProps {
  profileId?: string;
  userId?: string;
  isAdmin?: boolean;
  isDark?: boolean;
  onBack?: () => void;
}

interface ClientProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
  email_verified: boolean;
  phone_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ClientStats {
  total_orders: number;
  total_spent: number;
  active_orders: number;
  completed_orders: number;
  canceled_orders: number;
}

export default function ProfilesClient({
  profileId,
  userId,
  isAdmin = false,
  isDark = false,
  onBack,
}: ClientProfileProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Charger le profil client
  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (isAdmin) {
        headers["x-is-admin"] = "true";
      }

      let url = "/api/profile";
      if (profileId) {
        url += `?profile_id=${profileId}&isAdmin=true`;
      } else if (userId) {
        url += `?user_id=${userId}&isAdmin=true`;
      } else if (isAdmin) {
        url += "?isAdmin=true";
      }

      console.log("[ProfilesClient] Loading profile with:", {
        profileId,
        userId,
        url,
      });

      const response = await fetch(url, { headers });
      const data = await response.json();

      console.log("[ProfilesClient] API response:", data);

      if (data.success) {
        setProfile(data.data.profile);

        // Charger les statistiques et commandes si admin
        if (isAdmin && data.data.profile.id) {
          loadClientStats(data.data.profile.user_id);
          loadClientOrders(data.data.profile.user_id);
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError("Erreur de chargement du profil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques du client
  const loadClientStats = async (clientUserId: string) => {
    setLoadingStats(true);
    try {
      const response = await fetch(
        `/api/admin/client-stats?user_id=${clientUserId}${
          isAdmin ? "&isAdmin=true" : ""
        }`
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

  // Charger les commandes du client
  const loadClientOrders = async (clientUserId: string) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(
        `/api/admin/client-orders?user_id=${clientUserId}${
          isAdmin ? "&isAdmin=true" : ""
        }`
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Actions admin
  const handleToggleAccount = async (action: "block" | "unblock") => {
    if (!profile || !isAdmin) return;

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${
          action === "block" ? "bloquer" : "débloquer"
        } ce compte ?`
      )
    ) {
      try {
        const response = await fetch("/api/admin/toggle-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-is-admin": "true",
          },
          body: JSON.stringify({
            user_id: profile.user_id,
            action: action,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(
            `Compte ${action === "block" ? "bloqué" : "débloqué"} avec succès`
          );
          loadProfile();
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Erreur lors de l'opération");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile || !isAdmin) return;

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ce compte ? Cette action est irréversible.`
      )
    ) {
      try {
        const response = await fetch("/api/admin/delete-account", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-is-admin": "true",
          },
          body: JSON.stringify({
            user_id: profile.user_id,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert("Compte supprimé avec succès");
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
    loadProfile();
  }, [profileId, userId, isAdmin]);

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

  if (error || !profile) {
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
              Profil introuvable {profileId}
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
            <span className="font-semibold">MODE ADMIN - VUE CLIENT</span>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Colonne de gauche - Informations du client */}
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
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name}
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
                          <User
                            className={`w-16 h-16 ${
                              isDark ? "text-purple-300" : "text-purple-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>
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
                        {profile.display_name ||
                          `${profile.first_name} ${profile.last_name}` ||
                          "Client"}
                      </h1>
                      <p
                        className={`flex items-center gap-2 ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        {profile.email}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleAccount("block")}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                          <Lock className="w-4 h-4" />
                          Bloquer
                        </button>
                        <button
                          onClick={() => handleToggleAccount("unblock")}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                        >
                          <Unlock className="w-4 h-4" />
                          Débloquer
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div
                      className={`mb-6 p-4 rounded-xl ${
                        isDark ? "bg-slate-800/50" : "bg-slate-50/80"
                      }`}
                    >
                      <p
                        className={isDark ? "text-white/80" : "text-slate-700"}
                      >
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Informations détaillées */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                      isDark ? "bg-slate-800/30" : "bg-slate-50/50"
                    } p-4 rounded-xl`}
                  >
                    {profile.phone && (
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
                            {profile.phone}
                            {profile.phone_verified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 inline-block ml-2" />
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {profile.location && (
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
                            {profile.location}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar
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
                          Membre depuis
                        </p>
                        <p
                          className={
                            isDark ? "text-white" : "text-slate-900 font-medium"
                          }
                        >
                          {new Date(profile.created_at).toLocaleDateString(
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

                    {profile.website && (
                      <div className="flex items-center gap-3">
                        <Award
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
                            Site web
                          </p>
                          <a
                            href={
                              profile.website.startsWith("http")
                                ? profile.website
                                : `https://${profile.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-medium hover:underline ${
                              isDark ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            {profile.website}
                          </a>
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
                            {profile.user_id}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-red-600"
                            }`}
                          >
                            ID Profil
                          </p>
                          <p
                            className={`font-mono text-sm ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {profile.id}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              isDark ? "text-white/60" : "text-red-600"
                            }`}
                          >
                            Dernière mise à jour
                          </p>
                          <p
                            className={`font-mono text-sm ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {new Date(profile.updated_at).toLocaleString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistiques (admin seulement) */}
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
                  <TrendingUp className="w-6 h-6" />
                  Statistiques du client
                </h2>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total dépensé */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                          : "bg-gradient-to-br from-green-50 to-emerald-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CreditCard
                          className={`w-8 h-8 ${
                            isDark ? "text-green-400" : "text-green-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stats.total_spent.toFixed(2)} €
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Total dépensé
                      </p>
                    </div>

                    {/* Total commandes */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-blue-900/30 to-cyan-900/30"
                          : "bg-gradient-to-br from-blue-50 to-cyan-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Package
                          className={`w-8 h-8 ${
                            isDark ? "text-blue-400" : "text-blue-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stats.total_orders}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Commandes totales
                      </p>
                    </div>

                    {/* Commandes complétées */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30"
                          : "bg-gradient-to-br from-purple-50 to-pink-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2
                          className={`w-8 h-8 ${
                            isDark ? "text-purple-400" : "text-purple-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stats.completed_orders}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Commandes terminées
                      </p>
                    </div>

                    {/* Commandes annulées */}
                    <div
                      className={`p-6 rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-red-900/30 to-orange-900/30"
                          : "bg-gradient-to-br from-red-50 to-orange-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <XCircle
                          className={`w-8 h-8 ${
                            isDark ? "text-red-400" : "text-red-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stats.canceled_orders}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-600"
                        }`}
                      >
                        Commandes annulées
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

            {/* Liste des commandes (admin seulement) */}
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
                    <Package className="w-6 h-6" />
                    Historique des commandes
                  </h2>
                  {orders.length > 0 && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isDark
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {orders.length} commande{orders.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                          isDark
                            ? "bg-slate-800/50 hover:bg-slate-800 border border-slate-700"
                            : "bg-slate-50/80 hover:bg-white border border-slate-200"
                        }`}
                        onClick={() => {
                          // Ouvrir la commande en mode admin
                          if (isAdmin) {
                            router.push(`/order/${order.id}?isAdmin=true`);
                          } else {
                            router.push(`/order/${order.id}`);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3
                              className={`font-semibold mb-1 ${
                                isDark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              Commande #{order.id.slice(0, 8)}
                            </h3>
                            <p
                              className={`text-sm ${
                                isDark ? "text-white/60" : "text-slate-600"
                              }`}
                            >
                              {new Date(order.created_at).toLocaleDateString(
                                "fr-FR"
                              )}{" "}
                              •{" "}
                              {(
                                (order.total_cents + (order.fees_cents || 0)) /
                                100
                              ).toFixed(2)}{" "}
                              €
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.status === "completed"
                              ? "Terminée"
                              : order.status === "cancelled"
                              ? "Annulée"
                              : "En cours"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`text-center py-8 ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  >
                    <p>Aucune commande pour ce client</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne de droite - Actions rapides */}
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
                  {profile.email_verified ? (
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

                {profile.phone && (
                  <div className="flex items-center justify-between">
                    <span
                      className={isDark ? "text-white/70" : "text-slate-600"}
                    >
                      Téléphone
                    </span>
                    {profile.phone_verified ? (
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
              </div>
            </div>

            {/* Actions rapides admin */}
            {isAdmin && (
              <div
                className={`rounded-2xl shadow-xl p-6 ${
                  isDark
                    ? "bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-200/30"
                    : "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60"
                }`}
              >
                <h3
                  className={`font-bold text-lg mb-4 flex items-center gap-2 ${
                    isDark ? "text-white" : "text-red-800"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Actions Admin
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Forcer la vérification email
                      if (
                        window.confirm("Forcer la vérification de l'email ?")
                      ) {
                        alert("Fonctionnalité à implémenter");
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isDark
                        ? "bg-red-800/30 hover:bg-red-800/50 text-white"
                        : "bg-red-100 hover:bg-red-200 text-red-800"
                    }`}
                  >
                    <div className="font-medium">Vérifier l'email</div>
                    <div className="text-sm opacity-80">
                      Forcer la vérification
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // Envoyer un message
                      if (isAdmin) {
                        // Ouvrir le chat admin avec ce client
                        // router.push(`/chat?user_id=${profile.user_id}&isAdmin=true`);
                        alert("Chat admin à implémenter");
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isDark
                        ? "bg-blue-800/30 hover:bg-blue-800/50 text-white"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="font-medium">Envoyer un message</div>
                    <div className="text-sm opacity-80">
                      Contacter le client
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // Voir l'activité
                      alert("Journal d'activité à implémenter");
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="font-medium">Journal d'activité</div>
                    <div className="text-sm opacity-80">
                      Voir les actions récentes
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
