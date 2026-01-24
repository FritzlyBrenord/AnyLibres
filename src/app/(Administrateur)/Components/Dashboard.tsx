"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Star,
  Eye,
  Share2,
  BarChart3,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  Filter,
  Search,
  ChevronRight,
  Bell,
  Settings,
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  UserCheck,
  Briefcase,
  Loader2,
} from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";

interface DashboardProps {
  isDark: boolean;
}

interface DashboardStats {
  revenue: {
    total: number;
    change: number;
    trend: string;
    history: number[];
  };
  users: {
    total: number;
    new: number;
    active: number;
    trend: string;
    change: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
    change: number;
  };
  performance: {
    score: number;
    level: string;
    metrics: {
      responseTime: number;
      satisfaction: number;
      growth: number;
    };
  };
}

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: string;
  color: string;
  status: string;
}

interface Service {
  id: number;
  name: string;
  revenue: number;
  orders: number;
  rating: number;
  status: string;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark }) => {
  const { t } = useLanguageContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("7j");
  const [searchQuery, setSearchQuery] = useState("");

  // États pour les données API
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { convertFromUSD, formatAmount } = useCurrency();

  const timeframes = [
    { label: "24h", value: "24h" },
    { label: "7j", value: "7j" },
    { label: "30j", value: "30j" },
    { label: "90j", value: "90j" },
  ];

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toString().includes(searchQuery)
  );

  // Charger les données depuis les API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Charger toutes les données en parallèle
        const [statsRes, activitiesRes, servicesRes] = await Promise.all([
          fetch("/api/admin/dashboard-stats?isAdmin=true"),
          fetch("/api/admin/recent-activities?isAdmin=true&limit=5"),
          fetch("/api/admin/top-services?isAdmin=true&limit=5"),
        ]);

        const [statsData, activitiesData, servicesData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json(),
          servicesRes.json(),
        ]);

        console.log('[DASHBOARD] Stats data:', statsData);
        console.log('[DASHBOARD] Activities data:', activitiesData);
        console.log('[DASHBOARD] Services data:', servicesData);

        if (statsData.success) {
          setStats(statsData.data.stats);
        }

        if (activitiesData.success) {
          setActivities(activitiesData.data.activities);
        }

        if (servicesData.success) {
          console.log('[DASHBOARD] Setting services:', servicesData.data.services);
          setServices(servicesData.data.services);
        } else {
          console.error('[DASHBOARD] Services API error:', servicesData.error);
        }
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fonction pour obtenir l'icône d'une activité
  const getActivityIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      award: <Award className="w-4 h-4 lg:w-5 lg:h-5" />,
      package: <Package className="w-4 h-4 lg:w-5 lg:h-5" />,
      "user-check": <UserCheck className="w-4 h-4 lg:w-5 lg:h-5" />,
      briefcase: <Briefcase className="w-4 h-4 lg:w-5 lg:h-5" />,
      zap: <Zap className="w-4 h-4 lg:w-5 lg:h-5" />,
      target: <Target className="w-4 h-4 lg:w-5 lg:h-5" />,
    };
    return icons[iconName] || <Activity className="w-4 h-4 lg:w-5 lg:h-5" />;
  };

  // Afficher un loader pendant le chargement
  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            {t.admin?.dashboard?.loading || "Chargement du dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div
        className={`lg:hidden sticky top-0 z-50 p-4 border-b ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <h1
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {t.admin?.sidebar?.menus?.dashboard || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg relative ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
        {/* Welcome Hero Card - Improved */}
        <div
          className={`relative overflow-hidden rounded-2xl lg:rounded-3xl p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8 ${
            isDark
              ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800"
              : "bg-gradient-to-br from-white via-gray-50 to-blue-50"
          } shadow-lg lg:shadow-2xl border ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 lg:gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg">
                      <Award className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm lg:text-base font-medium px-3 py-1 rounded-full ${
                            isDark
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {t.admin?.header?.premium || "Premium"}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">
                            {t.admin?.dashboard?.online || "En ligne"}
                          </span>
                        </div>
                      </div>
                      <h1
                        className={`text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight mb-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {t.admin?.dashboard?.welcome || "Bienvenue Admin 👋"}
                      </h1>
                      <p
                        className={`text-base lg:text-lg ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {t.admin?.dashboard?.welcomeSubtitle || "Gérez votre plateforme Anylibre avec des insights en temps réel"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    {
                      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: t.admin?.dashboard?.stats?.totalUsers || "Utilisateurs totaux",
                      value: stats.users.total,
                      change: "+12.3%",
                      color: "text-blue-500",
                      bgColor: isDark ? "bg-blue-900/20" : "bg-blue-50",
                    },
                    {
                      icon: <Activity className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: t.admin?.dashboard?.stats?.performance || "Performance",
                      value: `${stats.performance.score}%`,
                      change: "+5.2%",
                      color: "text-emerald-500",
                      bgColor: isDark ? "bg-emerald-900/20" : "bg-emerald-50",
                    },
                    {
                      icon: <Package className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: t.admin?.dashboard?.stats?.orders || "Commandes",
                      value: stats.orders.total,
                      change: "+8.7%",
                      color: "text-purple-500",
                      bgColor: isDark ? "bg-purple-900/20" : "bg-purple-50",
                    },
                    {
                      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: t.admin?.dashboard?.stats?.averageSession || "Session moyenne",
                      value: "24m",
                      change: "+3.1%",
                      color: "text-amber-500",
                      bgColor: isDark ? "bg-amber-900/20" : "bg-amber-50",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 lg:p-4 rounded-xl ${
                        item.bgColor
                      } border ${
                        isDark ? "border-gray-800" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${item.bgColor}`}>
                          <div className={item.color}>{item.icon}</div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isDark
                              ? "bg-gray-800 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.change}
                        </span>
                      </div>
                      <p className="text-lg lg:text-xl font-bold mb-1">
                        {item.value}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-auto lg:self-end">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                  <button
                    className={`group px-6 py-3 lg:py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg w-full lg:w-auto ${
                      isDark
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/25"
                        : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-blue-400/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="text-sm lg:text-base">
                        {t.admin?.dashboard?.detailedAnalytics || "Analytics détaillés"}
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <button
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      isDark
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {t.admin?.dashboard?.generateReport || "Générer rapport"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2">
            {/* Stats Cards Grid - Improved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {[
                {
                  title: t.admin?.dashboard?.stats?.totalRevenue || "Revenus totaux",
                  value: <CurrencyConverter amount={stats.revenue.total} />,
                  change: "+23.5%",
                  trend: "up",
                  icon: <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-emerald-500 to-teal-500",
                  detail: t.admin?.dashboard?.stats?.targetExceeded || "Objectif dépassé de 15%",
                  progress: 85,
                },
                {
                  title: t.admin?.dashboard?.stats?.activeUsers || "Utilisateurs actifs",
                  value: stats.users.active.toLocaleString(),
                  change: "+12.3%",
                  trend: "up",
                  icon: <Users className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-blue-500 to-cyan-500",
                  detail: `${stats.users.new} ${t.admin?.dashboard?.stats?.newToday || "nouveaux aujourd'hui"}`,
                  progress: 72,
                },
                {
                  title: t.admin?.sidebar?.menus?.orders || "Commandes",
                  value: stats.orders.total,
                  change: "+8.7%",
                  trend: "up",
                  icon: <Package className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-purple-500 to-pink-500",
                  detail: `${stats.orders.pending} ${t.admin?.dashboard?.stats?.pending || "en attente"}`,
                  progress: 64,
                },
                {
                  title: t.admin?.dashboard?.stats?.conversionRate || "Taux de conversion",
                  value: `${stats.performance.score}%`,
                  change: "+5.2%",
                  trend: "up",
                  icon: <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-orange-500 to-yellow-500",
                  detail: t.admin?.dashboard?.stats?.bestPerformance || "Meilleure performance",
                  progress: 92,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-2xl p-5 lg:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 border ${
                    isDark
                      ? "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  } shadow-lg hover:shadow-xl`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-md`}
                      >
                        <div className="text-white">{stat.icon}</div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          stat.trend === "up"
                            ? isDark
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                            : isDark
                            ? "bg-red-900/30 text-red-400"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4" />
                        )}
                        {stat.change}
                      </div>
                    </div>

                    <h3
                      className={`text-2xl lg:text-3xl font-bold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {stat.value}
                    </h3>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={`text-xs mb-3 ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {stat.detail}
                    </p>

                    {/* Progress bar */}
                    <div className="relative pt-1">
                      <div
                        className={`overflow-hidden h-1.5 rounded-full ${
                          isDark ? "bg-gray-800" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                          style={{ width: `${stat.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {t.admin?.dashboard?.progression || "Progression"}
                        </span>
                        <span className="text-xs font-medium">
                          {stat.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Chart - Improved */}
            <div
              className={`rounded-2xl p-5 lg:p-6 mb-6 lg:mb-8 border ${
                isDark
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white border-gray-200"
              } shadow-lg`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h3
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t.admin?.dashboard?.revenue?.title || "Performance des revenus"}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t.admin?.dashboard?.revenue?.subtitle || "Analyse détaillée de l'évolution des revenus"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center rounded-xl p-1 ${
                      isDark ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    {timeframes.map((timeframe) => (
                      <button
                        key={timeframe.value}
                        onClick={() => setActiveTimeframe(timeframe.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          activeTimeframe === timeframe.value
                            ? isDark
                              ? "bg-gray-700 text-white"
                              : "bg-white text-gray-900 shadow"
                            : isDark
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {timeframe.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className={`p-2 rounded-lg ${
                        isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Filter className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${
                        isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Visualization - Nouveau graphique */}
              <div className="relative h-64 lg:h-72">
                {(() => {
                  // Normaliser l'historique des revenus en nombres (supporte strings '6.1K', '6,100', '5m', etc.)
                  const parseRevenue = (v: number | string) => {
                    if (typeof v === "number") return v;
                    if (typeof v === "string") {
                      // Remove currency symbols, spaces and thousands separators
                      let s = v
                        .replace(/\s+/g, "")
                        .replace(/\$/g, "")
                        .replace(/,/g, "")
                        .toLowerCase();
                      // Keep only digits, dot and k/m suffix
                      s = s.replace(/[^0-9\.km]/g, "");
                      if (!s) return 0;
                      if (s.endsWith("k")) {
                        const n = parseFloat(s.replace(/k$/, ""));
                        return isNaN(n) ? 0 : n * 1000;
                      }
                      if (s.endsWith("m")) {
                        const n = parseFloat(s.replace(/m$/, ""));
                        return isNaN(n) ? 0 : n * 1000000;
                      }
                      const n = parseFloat(s);
                      return isNaN(n) ? 0 : n;
                    }
                    return 0;
                  };

                  const numericHistory = stats.revenue.history.map((v) =>
                    parseRevenue(v as any)
                  );
                  const maxValue = Math.max(...numericHistory, 1);
                  const days = [
                    t.admin?.dashboard?.days?.monday || "Lun",
                    t.admin?.dashboard?.days?.tuesday || "Mar",
                    t.admin?.dashboard?.days?.wednesday || "Mer",
                    t.admin?.dashboard?.days?.thursday || "Jeu",
                    t.admin?.dashboard?.days?.friday || "Ven",
                    t.admin?.dashboard?.days?.saturday || "Sam",
                    t.admin?.dashboard?.days?.sunday || "Dim",
                  ];

                  const formatVal = (v: number) =>
                    v >= 1000000
                      ? (v / 1000000).toFixed(1) + "M"
                      : v >= 1000
                      ? (v / 1000).toFixed(1) + "K"
                      : String(Math.round(v));

                  return (
                    <div className="h-full flex flex-col">
                      {/* Grille horizontale */}
                      <div className="flex-1 relative">
                        {[100, 75, 50, 25, 0].map((line, idx) => (
                          <div
                            key={line}
                            className="absolute w-full flex items-center"
                            style={{ top: `${100 - line}%` }}
                          >
                            <span
                              className={`text-xs mr-2 w-12 text-right ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {formatAmount(convertFromUSD((line / 100) * maxValue))}
                            </span>
                            <div
                              className={`flex-1 border-t ${
                                line === 0
                                  ? isDark
                                    ? "border-gray-600"
                                    : "border-gray-400"
                                  : isDark
                                  ? "border-gray-800"
                                  : "border-gray-200"
                              }`}
                            />
                          </div>
                        ))}

                        {/* Barres */}
                        {/* Barres */}
                        <div className="absolute inset-0 flex items-end justify-between pl-14 pr-4 pb-2 gap-3">
                          {numericHistory.map((value, idx) => {
                            const percentage =
                              maxValue > 0
                                ? Math.round((value / maxValue) * 100)
                                : 0;

                            const isToday = idx === numericHistory.length - 1;

                            return (
                              <div
                                key={idx}
                                className="relative flex-1 max-w-[48px] h-full flex items-end group"
                              >
                                {/* Barre */}
                                <div
                                  className={`absolute bottom-0 w-full rounded-t-md transition-all duration-300 cursor-pointer
            ${
              isToday
                ? "bg-gradient-to-t from-blue-600 to-cyan-500 shadow-md"
                : isDark
                ? "bg-blue-500/70 hover:bg-blue-500"
                : "bg-blue-400 hover:bg-blue-500"
            }
          `}
                                  style={{
                                    height: `${percentage}%`,
                                    minHeight: value > 0 ? "6px" : "2px",
                                  }}
                                >
                                  {/* Tooltip */}
                                  <div
                                    className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap
              ${
                isDark
                  ? "bg-gray-900 text-white border border-gray-700 shadow-lg"
                  : "bg-white text-gray-900 border border-gray-200 shadow-lg"
              }
            `}
                                  >
                                    <div className="text-sm font-semibold">
                                      {formatAmount(convertFromUSD(value))}
                                    </div>
                                    <div className="text-xs opacity-70 text-center">
                                      {days[idx] || `${t.admin?.dashboard?.day || "Jour"} ${idx + 1}`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Labels des jours */}
                      <div className="flex items-center justify-around pl-14 pr-4 pt-3">
                        {numericHistory.map((_, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 max-w-[60px] text-center text-xs font-medium ${
                              idx === stats.revenue.history.length - 1
                                ? "text-blue-600"
                                : isDark
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {days[idx] || `J${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    <span className="text-sm">{t.admin?.dashboard?.currentRevenue || "Revenus actuels"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">{t.admin?.dashboard?.forecast || "Prévision"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                      isDark ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">
                        {t.admin?.dashboard?.revenue?.monthlyTarget || "Objectif mensuel"}
                      </div>
                      <div className="text-lg font-bold">
                        {formatAmount(convertFromUSD(150000))}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {t.admin?.dashboard?.revenue?.updatedAgo || "Mise à jour il y a 5 min"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activities */}
          <div className="space-y-6 lg:space-y-8">
            {/* Recent Activities */}
            <div
              className={`rounded-2xl p-5 lg:p-6 border ${
                isDark
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white border-gray-200"
              } shadow-lg`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <h3
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t.admin?.dashboard?.activities?.title || "Activités récentes"}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t.admin?.dashboard?.activities?.subtitle || "Dernières actions sur la plateforme"}
                  </p>
                </div>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.admin?.dashboard?.activities?.viewAll || "Voir tout"}
                </button>
              </div>

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${activity.color} ${
                        isDark ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span className="font-bold">{activity.user}</span>{" "}
                          {activity.action}
                        </p>
                        {activity.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Services Table - Improved */}
        <div
          className={`rounded-2xl overflow-hidden border ${
            isDark
              ? "bg-gray-900/50 border-gray-800"
              : "bg-white border-gray-200"
          } shadow-lg mt-6 lg:mt-8`}
        >
          <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h3
                  className={`text-xl lg:text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t.admin?.dashboard?.services?.title || "Services les plus performants"}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {t.admin?.dashboard?.services?.subtitle || "Classement par revenus générés"}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                <div
                  className={`relative flex-1 lg:flex-none lg:w-64 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t.admin?.dashboard?.services?.searchPlaceholder || "Rechercher un service..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border ${
                      isDark
                        ? "bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500"
                        : "bg-gray-100 border-gray-300 text-gray-700 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <button
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.admin?.dashboard?.services?.filter || "Filtrer"}
                </button>
                <button
                  className={`p-2.5 rounded-xl ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {[
                    t.admin?.dashboard?.services?.headers?.service || "Service",
                    t.admin?.dashboard?.services?.headers?.revenue || "Revenus",
                    t.admin?.dashboard?.services?.headers?.orders || "Commandes",
                    t.admin?.dashboard?.services?.headers?.satisfaction || "Satisfaction",
                    t.admin?.dashboard?.services?.headers?.status || "Statut",
                    t.admin?.dashboard?.services?.headers?.actions || "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {services.length === 0 ? "Aucun service trouvé" : "Aucun résultat pour cette recherche"}
                        <div className="text-xs mt-2">Total services: {services.length}, Filtrés: {filteredServices.length}</div>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`border-b last:border-0 ${
                      isDark
                        ? "border-gray-800 hover:bg-gray-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                            service.id === 1
                              ? "from-blue-500 to-cyan-500"
                              : service.id === 2
                              ? "from-purple-500 to-pink-500"
                              : service.id === 3
                              ? "from-emerald-500 to-green-500"
                              : service.id === 4
                              ? "from-orange-500 to-red-500"
                              : "from-amber-500 to-yellow-500"
                          }`}
                        ></div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {service.name}
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            ID: #{service.id.toString().padStart(3, "0")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p
                        className={`text-lg font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <CurrencyConverter amount={service.revenue} />
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {service.orders}
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.orders > 50
                              ? isDark
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"
                              : isDark
                              ? "bg-amber-900/30 text-amber-400"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {service.orders > 50 ? (t.admin?.dashboard?.services?.level?.high || "Élevé") : (t.admin?.dashboard?.services?.level?.medium || "Moyen")}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.floor(service.rating)
                                  ? "text-yellow-500 fill-current"
                                  : isDark
                                  ? "text-gray-700"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-base font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {service.rating}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          service.status === "active"
                            ? isDark
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                            : isDark
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            service.status === "active"
                              ? "bg-emerald-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        {service.status === "active" ? (t.admin?.dashboard?.services?.status?.active || "Actif") : (t.admin?.dashboard?.services?.status?.inactive || "Inactif")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title={t.admin?.dashboard?.services?.actions?.viewDetails || "Voir les détails"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title={t.admin?.dashboard?.services?.actions?.share || "Partager"}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title={t.admin?.dashboard?.services?.actions?.moreOptions || "Plus d'options"}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-t border-gray-200 dark:border-gray-800">
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t.admin?.dashboard?.pagination?.showing || "Affichage de"} 1 {t.admin?.dashboard?.pagination?.to || "à"} {filteredServices.length} {t.admin?.dashboard?.pagination?.of || "sur"} {services.length}{" "}
              {t.admin?.dashboard?.pagination?.results || "résultats"}
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg ${
                  isDark
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {t.admin?.dashboard?.pagination?.previous || "Précédent"}
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-8 h-8 rounded-lg ${
                    page === 1
                      ? isDark
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : isDark
                      ? "hover:bg-gray-800 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                className={`p-2 rounded-lg ${
                  isDark
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {t.admin?.dashboard?.pagination?.next || "Suivant"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
