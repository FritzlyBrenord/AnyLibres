"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Users,
  Globe,
  TrendingUp,
  Clock,
  User,
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  Calendar,
  ChevronRight,
  Download,
  RefreshCw,
  Filter,
  Search,
  X,
  MoreVertical,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  MapPin,
  Briefcase,
} from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";

interface AnalyticsLiveProps {
  isDark: boolean;
  onClose: () => void;
}

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider" | "admin";
  connectedAt: string;
  lastActivity: string;
  avatar?: string;
  status: "online" | "idle" | "away";
}

interface LiveOrder {
  id: string;
  clientName: string;
  providerName: string;
  service: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Visitor {
  id: string;
  device: string;
  location: string;
  currentPage: string;
  sessionDuration: number;
  entryTime: string;
}

interface AnalyticsData {
  onlineUsers: OnlineUser[];
  visitors: Visitor[];
  liveOrders: LiveOrder[];
  stats: {
    totalOnline: number;
    clientsOnline: number;
    providersOnline: number;
    adminsOnline: number;
    totalVisitors: number;
    activeOrders: number;
    completedToday: number;
    revenueToday: number;
  };
  periodStats: {
    period: "week" | "month" | "year" | "day";
    totalOrders: number;
    totalRevenue: number;
    newSignups: number;
    activeUsers: number;
    activeProviders: number;
    uniqueVisitors: number;
  };
}

type TimePeriod = "today" | "week" | "month" | "year";

const AnalyticsLive: React.FC<AnalyticsLiveProps> = ({ isDark, onClose }) => {
  const { language, t } = useLanguageContext();
  const { convertFromUSD, formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>(
    new Date().toLocaleTimeString()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics-live?period=${timePeriod}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 1000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  if (!data) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isDark ? "bg-gray-900/50" : "bg-white/50"
        }`}
      >
        <div
          className={`w-full h-full overflow-y-auto ${
            isDark ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p
                className={`text-lg font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Chargement des données...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = data.onlineUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "away":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "En ligne";
      case "idle":
        return "Inactif";
      case "away":
        return "Absent";
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "accepted":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "in_progress":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Zap className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      accepted: "Acceptée",
      in_progress: "En cours",
      completed: "Complétée",
      cancelled: "Annulée",
    };
    return labels[status] || status;
  };

  const getDurationMinutes = (connectedAt: string) => {
    const now = new Date();
    const connected = new Date(connectedAt);
    const diff = Math.floor((now.getTime() - connected.getTime()) / 60000);
    return diff;
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${
        isDark ? "bg-gray-900/30" : "bg-white/30"
      } backdrop-blur-sm`}
    >
      {/* Modal Container */}
      <div
        className={`absolute inset-0 md:inset-8 lg:inset-12 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-40 border-b ${
            isDark
              ? "border-gray-800 bg-gray-900/95"
              : "border-gray-200 bg-white/95"
          } backdrop-blur-lg px-6 py-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-75"></div>
                <div
                  className={`relative p-3 rounded-lg ${
                    isDark ? "bg-gray-900" : "bg-white"
                  }`}
                >
                  <Activity className="w-6 h-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent" />
                </div>
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Analytics Live
                </h1>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Mise à jour: {lastUpdate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAnalyticsData}
                className={`p-2 rounded-lg transition-all ${
                  isDark
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all ${
                  isDark
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("live")}
              className={`pb-2 px-4 font-medium transition-all ${
                activeTab === "live"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : isDark
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🔴 Live
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-2 px-4 font-medium transition-all ${
                activeTab === "history"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : isDark
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📊 Historique
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "live" ? (
            <div className="p-6 space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Utilisateurs En ligne",
                    value: data.stats.totalOnline,
                    icon: Users,
                    color: "blue",
                  },
                  {
                    label: "Visiteurs",
                    value: data.stats.totalVisitors,
                    icon: Globe,
                    color: "cyan",
                  },
                  {
                    label: "Commandes Actives",
                    value: data.stats.activeOrders,
                    icon: Package,
                    color: "purple",
                  },
                  {
                    label: "Revenus Aujourd'hui",
                    value: <CurrencyConverter amount={data.stats.revenueToday} />,
                    icon: DollarSign,
                    color: "emerald",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark
                        ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {stat.label}
                        </p>
                        <p
                          className={`text-2xl font-bold mt-1 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-400/10`}
                      >
                        <stat.icon
                          className={`w-6 h-6 text-${stat.color}-500`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Roles Breakdown */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-gray-800/30 border-gray-700/50"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h3
                  className={`font-semibold mb-3 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Répartition des Rôles
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      role: "Clients",
                      count: data.stats.clientsOnline,
                      color: "from-blue-500 to-blue-600",
                    },
                    {
                      role: "Prestataires",
                      count: data.stats.providersOnline,
                      color: "from-purple-500 to-purple-600",
                    },
                    {
                      role: "Admins",
                      count: data.stats.adminsOnline,
                      color: "from-amber-500 to-amber-600",
                    },
                  ].map((role, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-center ${
                        isDark
                          ? "bg-gray-900/50"
                          : "bg-gradient-to-br from-white to-gray-50"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {role.role}
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 bg-gradient-to-r ${role.color} bg-clip-text text-transparent`}
                      >
                        {role.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Users */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    👥 Utilisateurs En Ligne ({filteredUsers.length})
                  </h3>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      isDark ? "bg-gray-800/50" : "bg-gray-100"
                    }`}
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`bg-transparent border-none outline-none text-sm w-40 ${
                        isDark
                          ? "text-white placeholder-gray-500"
                          : "text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${getStatusColor(
                                user.status
                              )} ${
                                isDark ? "border-gray-800" : "border-white"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-semibold truncate ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {user.name}
                            </p>
                            <p
                              className={`text-sm truncate ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {user.email}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  user.role === "provider"
                                    ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                    : user.role === "admin"
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {user.role}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  getStatusColor(user.status)
                                    .replace("bg-", "bg-")
                                    .split(" ")[0]
                                }/20 ${getStatusColor(user.status).replace(
                                  "bg-",
                                  "text-"
                                )}`}
                              >
                                {getStatusLabel(user.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <p
                          className={`text-xs ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Connecté depuis {getDurationMinutes(user.connectedAt)}{" "}
                          min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Orders */}
              <div className="space-y-3">
                <h3
                  className={`font-semibold text-lg ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  📦 Commandes En Temps Réel ({data.liveOrders.length})
                </h3>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.liveOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700/50"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className={`font-semibold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {order.service}
                            </h4>
                            <div
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(
                                order.status
                              )}`}
                            >
                              {getOrderStatusIcon(order.status)}
                              {getOrderStatusLabel(order.status)}
                            </div>
                          </div>
                          <div
                            className={`grid grid-cols-2 gap-3 text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <div>
                              <span className="font-medium">Client:</span>{" "}
                              {order.clientName}
                            </div>
                            <div>
                              <span className="font-medium">Prestataire:</span>{" "}
                              {order.providerName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent`}
                          >
                            <CurrencyConverter amount={order.amount} />
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {new Date(order.updatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitors Section */}
              <div className="space-y-3">
                <h3
                  className={`font-semibold text-lg ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  🌍 Visiteurs En Ligne ({data.visitors.length})
                </h3>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.visitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className={`p-3 rounded-lg border ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700/50"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Globe className="w-4 h-4 text-cyan-500" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {visitor.location}
                            </p>
                            <p
                              className={`text-xs truncate ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {visitor.currentPage}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {visitor.sessionDuration}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // History Tab
            <div className="p-6 space-y-6">
              {/* Period Selector */}
              <div className="flex gap-2">
                {(["today", "week", "month", "year"] as TimePeriod[]).map(
                  (period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        timePeriod === period
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                          : isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {period === "today"
                        ? "Aujourd'hui"
                        : period === "week"
                        ? "Semaine"
                        : period === "month"
                        ? "Mois"
                        : "Année"}
                    </button>
                  )
                )}
              </div>

              {/* History Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Commandes Total",
                    value: data.periodStats.totalOrders,
                    icon: Package,
                    color: "blue",
                  },
                  {
                    label: "Revenus Totaux",
                    value: <CurrencyConverter amount={data.periodStats.totalRevenue} />,
                    icon: DollarSign,
                    color: "emerald",
                  },
                  {
                    label: "Nouvelles Inscriptions",
                    value: data.periodStats.newSignups,
                    icon: Users,
                    color: "purple",
                  },
                  {
                    label: "Utilisateurs Actifs",
                    value: data.periodStats.activeUsers,
                    icon: Activity,
                    color: "cyan",
                  },
                  {
                    label: "Prestataires Actifs",
                    value: data.periodStats.activeProviders,
                    icon: Briefcase,
                    color: "amber",
                  },
                  {
                    label: "Visiteurs Uniques",
                    value: data.periodStats.uniqueVisitors,
                    icon: Globe,
                    color: "pink",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark
                        ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {stat.label}
                        </p>
                        <p
                          className={`text-2xl font-bold mt-1 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg`}>
                        <stat.icon className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export Button */}
              <button
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-400/50"
                }`}
              >
                <Download className="w-4 h-4" />
                Télécharger le Rapport
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsLive;
