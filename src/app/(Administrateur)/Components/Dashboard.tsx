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
  Sparkles,
  Crown,
  TrendingDown,
  Trash2,
  ChevronLeft,
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
    history: { value: number; label: string }[];
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

interface VisitorLog {
  id: string;
  ip_address: string;
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  user_agent: string;
  path: string;
  created_at: string;
}

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  logs: VisitorLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ isDark }) => {
  const { t } = useLanguageContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("7j");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // États pour les données API
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorSearchQuery, setVisitorSearchQuery] = useState("");
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<Set<string>>(
    new Set(),
  );
  const [visitorPage, setVisitorPage] = useState(1);
  const visitorItemsPerPage = 10;
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { convertFromUSD, formatAmount } = useCurrency();

  // Logic pour filtrer les visiteurs
  const filteredVisitors =
    visitorStats?.logs.filter(
      (log) =>
        log.ip_address
          .toLowerCase()
          .includes(visitorSearchQuery.toLowerCase()) ||
        log.city.toLowerCase().includes(visitorSearchQuery.toLowerCase()) ||
        log.country.toLowerCase().includes(visitorSearchQuery.toLowerCase()) ||
        log.user_agent.toLowerCase().includes(visitorSearchQuery.toLowerCase()),
    ) || [];

  const totalVisitorPages = Math.ceil(
    filteredVisitors.length / visitorItemsPerPage,
  );
  const paginatedVisitors = filteredVisitors.slice(
    (visitorPage - 1) * visitorItemsPerPage,
    visitorPage * visitorItemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, visitorPage - 2);
    const end = Math.min(totalVisitorPages, visitorPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const toggleSelectAll = () => {
    if (selectedVisitorIds.size === paginatedVisitors.length) {
      setSelectedVisitorIds(new Set());
    } else {
      setSelectedVisitorIds(new Set(paginatedVisitors.map((v) => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedVisitorIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedVisitorIds(newSelected);
  };

  const deleteSelectedVisitors = async () => {
    if (selectedVisitorIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedVisitorIds.size} logs?`)) return;

    try {
      setIsBulkDeleting(true);
      const res = await fetch("/api/admin/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedVisitorIds) }),
      });

      if (res.ok) {
        if (visitorStats) {
          setVisitorStats({
            ...visitorStats,
            logs: visitorStats.logs.filter(
              (l) => !selectedVisitorIds.has(l.id),
            ),
          });
        }
        setSelectedVisitorIds(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const exportVisitorsToCSV = () => {
    if (!visitorStats) return;
    const headers = ["ID", "IP", "Pays", "Ville", "UA", "Path", "Date"];
    const rows = visitorStats.logs.map((v) => [
      v.id,
      v.ip_address,
      v.country,
      v.city,
      v.user_agent,
      v.path,
      v.created_at,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "visitors_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timeframes = [
    { label: "24h", value: "24h" },
    { label: "7j", value: "7j" },
    { label: "30j", value: "30j" },
    { label: "90j", value: "90j" },
    { label: "6m", value: "6m" },
    { label: "1an", value: "1an" },
  ];

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toString().includes(searchQuery),
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
 
        // Charger toutes les données en parallèle
        const [statsRes, activitiesRes, servicesRes, visitorsRes] =
          await Promise.all([
            fetch(`/api/admin/dashboard-stats?isAdmin=true&timeframe=${activeTimeframe}`),
            fetch("/api/admin/recent-activities?isAdmin=true&limit=5"),
            fetch("/api/admin/top-services?isAdmin=true&limit=5"),
            fetch(`/api/admin/visitors?timeframe=${activeTimeframe}`),
          ]);
 
        const [statsData, activitiesData, servicesData, visitorsData] =
          await Promise.all([
            statsRes.json(),
            activitiesRes.json(),
            servicesRes.json(),
            visitorsRes.json(),
          ]);
 
        if (statsData.success) {
          setStats(statsData.data.stats);
        }
 
        if (activitiesData.success) {
          setActivities(activitiesData.data.activities);
        }
 
        if (servicesData.success) {
          setServices(servicesData.data.services);
        }
 
        if (visitorsData.success) {
          setVisitorStats(visitorsData.data);
        }
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
 
    loadDashboardData();
  }, [activeTimeframe]);

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
      award: <Award className="w-4 h-4" />,
      package: <Package className="w-4 h-4" />,
      "user-check": <UserCheck className="w-4 h-4" />,
      briefcase: <Briefcase className="w-4 h-4" />,
      zap: <Zap className="w-4 h-4" />,
      target: <Target className="w-4 h-4" />,
    };
    return icons[iconName] || <Activity className="w-4 h-4" />;
  };

  // Afficher un loader pendant le chargement
  if (isLoading || !stats) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-4" />
            <div
              className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin mx-auto mb-4 opacity-50"
              style={{ animationDuration: "1.5s" }}
            />
          </div>
          <p
            className={`text-sm font-medium tracking-wide uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {t.admin?.dashboard?.loading || "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"} font-sans selection:bg-blue-500/20`}
    >
      {/* Redundant Mobile Header removed as it is now handled by the global AdminHeader */}

      <div className="p-4 lg:p-8 xl:p-12 max-w-[1600px] mx-auto">
        {/* Welcome Section - Hero Premium */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    isDark
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
                <span
                  className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  • {t.admin?.dashboard?.online || "En ligne"}
                </span>
              </div>
              <h1
                className={`text-3xl lg:text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {t.admin?.dashboard?.welcome || "Bienvenue"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                  Admin
                </span>
              </h1>
              <p
                className={`text-base lg:text-lg max-w-2xl ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {t.admin?.dashboard?.welcomeSubtitle ||
                  "Gérez votre plateforme avec excellence et précision"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`group px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                  isDark
                    ? "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </div>
              </button>
              <button
                className={`group px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Rapport détaillé</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Quick Stats Row - Premium Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: t.admin?.dashboard?.stats?.totalUsers || "Utilisateurs",
                value: stats.users.total.toLocaleString(),
                trend: "+12.3%",
                trendUp: true,
                color: "blue",
              },
              {
                icon: Activity,
                label: t.admin?.dashboard?.stats?.performance || "Performance",
                value: `${stats.performance.score}%`,
                trend: "+5.2%",
                trendUp: true,
                color: "emerald",
              },
              {
                icon: Package,
                label: t.admin?.dashboard?.stats?.orders || "Commandes",
                value: stats.orders.total,
                trend: `${stats.orders.pending} en attente`,
                trendUp: true,
                color: "violet",
              },
              {
                icon: Eye,
                label: "Visites Totales",
                value: visitorStats?.totalVisits || 0,
                trend: "+15.2%",
                trendUp: true,
                color: "rose",
                onClick: () => setShowVisitorModal(true),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={item.onClick}
                className={`group relative overflow-hidden rounded-2xl p-4 lg:p-5 transition-all duration-300 hover:-translate-y-1 ${
                  item.onClick ? "cursor-pointer" : ""
                } ${
                  isDark
                    ? "bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50"
                    : "bg-white border border-slate-200/50 hover:border-slate-300/50 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isDark
                        ? `bg-${item.color}-500/10 text-${item.color}-400`
                        : `bg-${item.color}-50 text-${item.color}-600`
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      item.trendUp
                        ? isDark
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                        : isDark
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {item.trendUp ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.trend}
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <p
                    className={`text-2xl lg:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {item.value}
                  </p>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                  >
                    {item.label}
                  </p>
                </div>
                {/* Subtle gradient overlay */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-${item.color}-500/5 to-transparent`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Stats & Chart */}
          <div className="xl:col-span-2 space-y-6">
            {/* Primary Stats - Bento Grid Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenue Card - Featured */}
              <div
                className={`md:col-span-2 relative overflow-hidden rounded-3xl p-6 lg:p-8 ${
                  isDark
                    ? "bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800"
                    : "bg-gradient-to-br from-white to-slate-50 border border-slate-200"
                } shadow-xl`}
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div>
                    <p
                      className={`text-sm font-medium uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Revenus Totaux
                    </p>
                    <div className="flex items-baseline gap-3">
                      <h3
                        className={`text-4xl lg:text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        <CurrencyConverter amount={stats.revenue.total} />
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
                          isDark
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        +23.5%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center rounded-xl p-1 ${isDark ? "bg-slate-950/50" : "bg-slate-100"}`}
                    >
                      {timeframes.map((tf) => (
                        <button
                          key={tf.value}
                          onClick={() => setActiveTimeframe(tf.value)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTimeframe === tf.value
                              ? isDark
                                ? "bg-slate-800 text-white shadow-sm"
                                : "bg-white text-slate-900 shadow-sm"
                              : isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Chart */}
                <div className="relative h-64 lg:h-72 mt-6">
                  {(() => {
                    const numericHistory = stats.revenue.history.map((h: any) => h.value);
                    const maxValue = Math.max(...numericHistory, 1);
                    const labels = stats.revenue.history.map((h: any) => h.label);

                    return (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 relative">
                          {/* Grid lines */}
                          {[100, 75, 50, 25, 0].map((line) => (
                            <div
                              key={line}
                              className="absolute w-full flex items-center"
                              style={{ top: `${100 - line}%` }}
                            >
                              <span
                                className={`text-xs mr-3 w-12 text-right tabular-nums ${isDark ? "text-slate-600" : "text-slate-400"}`}
                              >
                                {formatAmount(
                                  convertFromUSD((line / 100) * maxValue),
                                ).replace(/[^0-9KMB\.]/g, "")}
                              </span>
                              <div
                                className={`flex-1 border-t ${isDark ? "border-slate-800" : "border-slate-100"} ${line === 0 ? "border-slate-300 dark:border-slate-600" : ""}`}
                              />
                            </div>
                          ))}

                          {/* Bars */}
                          <div className="absolute inset-0 flex items-end justify-between pl-16 pr-4 pb-px gap-2">
                            {stats.revenue.history.map((point: any, idx: number) => {
                              const percentage =
                                maxValue > 0
                                  ? Math.round((point.value / maxValue) * 100)
                                  : 0;
                              const isToday = idx === stats.revenue.history.length - 1;

                              return (
                                <div
                                  key={idx}
                                  className="relative flex-1 h-full flex items-end group"
                                >
                                  <div
                                    className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer relative overflow-hidden ${
                                      isToday
                                        ? "bg-gradient-to-t from-blue-600 to-indigo-500"
                                        : isDark
                                          ? "bg-slate-700 hover:bg-slate-600"
                                          : "bg-slate-200 hover:bg-slate-300"
                                    }`}
                                    style={{
                                      height: `${Math.max(percentage, 4)}%`,
                                    }}
                                  >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>

                                  {/* Tooltip */}
                                  <div
                                    className={`absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap shadow-xl ${
                                      isDark
                                        ? "bg-slate-800 text-white border border-slate-700"
                                        : "bg-white text-slate-900 border border-slate-200"
                                    }`}
                                  >
                                    <p className="text-sm font-bold">
                                      {formatAmount(convertFromUSD(point.value))}
                                    </p>
                                    <p className="text-xs opacity-70">
                                      {point.label}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* X Axis labels */}
                        <div className="flex items-center justify-around pl-16 pr-4 pt-4">
                          {labels.map((label: string, idx: number) => {
                            // Afficher seulement quelques labels si trop nombreux (ex: 30j, 24h)
                            const shouldShow = 
                              labels.length <= 12 || 
                              idx === 0 || 
                              idx === labels.length - 1 || 
                              idx % Math.floor(labels.length / 6) === 0;

                            if (!shouldShow) return <div key={idx} className="flex-1" />;

                            return (
                              <div
                                key={idx}
                                className={`flex-1 text-center text-[10px] font-medium truncate px-1 ${
                                  idx === labels.length - 1
                                    ? isDark
                                      ? "text-blue-400"
                                      : "text-blue-600"
                                    : isDark
                                      ? "text-slate-500"
                                      : "text-slate-400"
                                }`}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Stats */}
                <div className="relative z-10 mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p
                        className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Objectif mensuel
                      </p>
                      <p
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {formatAmount(convertFromUSD(150000))}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <p
                        className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Réalisé
                      </p>
                      <p className={`text-lg font-bold text-emerald-500`}>
                        85%
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Mise à jour à l'instant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activities & Details */}
          <div className="space-y-6">
            {/* Recent Activities - Premium Timeline */}
            <div
              className={`rounded-3xl p-6 lg:p-8 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Activités récentes
                  </h3>
                  <p
                    className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Dernières actions
                  </p>
                </div>
                <button
                  className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="relative space-y-6">
                {/* Timeline line */}
                <div
                  className={`absolute left-5 top-3 bottom-3 w-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                />

                {activities.map((activity, idx) => (
                  <div
                    key={activity.id}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* Icon */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-300 ${
                        activity.status === "success"
                          ? isDark
                            ? "bg-slate-900 border-emerald-500/30 text-emerald-400"
                            : "bg-white border-emerald-200 text-emerald-600"
                          : isDark
                            ? "bg-slate-900 border-amber-500/30 text-amber-400"
                            : "bg-white border-amber-200 text-amber-600"
                      }`}
                    >
                      {getActivityIcon(activity.icon)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <p
                        className={`text-sm font-medium leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}
                      >
                        <span className="font-semibold">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {activity.time}
                        </span>
                        {activity.status === "success" && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Complété
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className={`w-full mt-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Voir toute l'historique
              </button>
            </div>

            {/* Performance Card */}
            <div
              className={`relative overflow-hidden rounded-3xl p-6 lg:p-8 ${isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white border border-slate-200 shadow-sm"}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Performance
                  </h3>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </div>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className={isDark ? "text-slate-800" : "text-slate-100"}
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={351.86}
                        strokeDashoffset={
                          351.86 * (1 - stats.performance.score / 100)
                        }
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {stats.performance.score}
                      </span>
                      <span
                        className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="text-center">
                    <p
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {stats.performance.metrics.responseTime}s
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Réponse
                    </p>
                  </div>
                  <div className="text-center border-x border-slate-200/50 dark:border-slate-800/50">
                    <p
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {stats.performance.metrics.satisfaction}%
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Satisfaction
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold text-emerald-500`}>
                      +{stats.performance.metrics.growth}%
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Croissance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Detail Modal */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowVisitorModal(false)}
          />
          <div
            className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Détails des Visiteurs</h2>
                <p className="text-sm opacity-60">
                  Suivi du trafic en temps réel
                </p>
              </div>
              <button
                onClick={() => setShowVisitorModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!visitorStats ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-lg opacity-60">
                    Chargement des statistiques...
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-500 uppercase tracking-wider mb-1">
                        Total Visites
                      </p>
                      <p className="text-3xl font-bold">
                        {visitorStats.totalVisits}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm font-medium text-emerald-500 uppercase tracking-wider mb-1">
                        Visiteurs Uniques
                      </p>
                      <p className="text-3xl font-bold">
                        {visitorStats.uniqueVisitors}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-1">
                        Affichés
                      </p>
                      <p className="text-3xl font-bold">
                        {filteredVisitors.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <p className="text-sm font-medium text-violet-500 uppercase tracking-wider mb-1">
                        Période
                      </p>
                      <p className="text-3xl font-bold">{activeTimeframe}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 min-w-[300px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par IP, Ville, Pays..."
                        value={visitorSearchQuery}
                        onChange={(e) => {
                          setVisitorSearchQuery(e.target.value);
                          setVisitorPage(1);
                        }}
                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                          isDark
                            ? "bg-slate-950/50 border-slate-800 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedVisitorIds.size > 0 && (
                        <button
                          onClick={deleteSelectedVisitors}
                          disabled={isBulkDeleting}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer ({selectedVisitorIds.size})</span>
                        </button>
                      )}
                      <button
                        onClick={exportVisitorsToCSV}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isDark
                            ? "bg-slate-800 text-slate-300 hover:text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        <span>Exporter CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden mb-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr
                          className={
                            isDark
                              ? "bg-slate-950/50 text-slate-400"
                              : "bg-slate-50 text-slate-500"
                          }
                        >
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={
                                selectedVisitorIds.size > 0 &&
                                selectedVisitorIds.size ===
                                  paginatedVisitors.length
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase">
                            IP / Localisation
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase">
                            Chemin
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase">
                            Navigateur
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                        {paginatedVisitors.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center opacity-50 text-sm"
                            >
                              Aucun résultat trouvé
                            </td>
                          </tr>
                        ) : (
                          paginatedVisitors.map((log) => (
                            <tr
                              key={log.id}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${selectedVisitorIds.has(log.id) ? (isDark ? "bg-blue-500/5" : "bg-blue-50") : ""}`}
                            >
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedVisitorIds.has(log.id)}
                                  onChange={() => toggleSelect(log.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm opacity-80">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col group/ip relative">
                                  <span className="text-sm font-mono font-bold flex items-center gap-2">
                                    {log.ip_address}
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          log.ip_address,
                                        );
                                        alert("IP copiée !");
                                      }}
                                      className="opacity-0 group-hover/ip:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                    >
                                      <Sparkles className="w-3 h-3 text-blue-500" />
                                    </button>
                                  </span>
                                  <span className="text-xs opacity-60">
                                    {log.city}, {log.country}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                                  {log.path}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <p
                                  className="text-xs opacity-60 max-w-[150px] truncate"
                                  title={log.user_agent}
                                >
                                  {log.user_agent}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={async () => {
                                    if (confirm("Supprimer ce log?")) {
                                      try {
                                        const res = await fetch(
                                          `/api/admin/visitors?id=${log.id}`,
                                          { method: "DELETE" },
                                        );
                                        if (res.ok) {
                                          setVisitorStats({
                                            ...visitorStats,
                                            logs: visitorStats.logs.filter(
                                              (l) => l.id !== log.id,
                                            ),
                                          });
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalVisitorPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
                      <p
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Page {visitorPage} sur {totalVisitorPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setVisitorPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={visitorPage === 1}
                          className={`p-2 rounded-lg transition-all ${
                            visitorPage === 1
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        {getPageNumbers().map((p) => (
                          <button
                            key={p}
                            onClick={() => setVisitorPage(p)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              visitorPage === p
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setVisitorPage((prev) =>
                              Math.min(totalVisitorPages, prev + 1),
                            )
                          }
                          disabled={visitorPage === totalVisitorPages}
                          className={`p-2 rounded-lg transition-all ${
                            visitorPage === totalVisitorPages
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
