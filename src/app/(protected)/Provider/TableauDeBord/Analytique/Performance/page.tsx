"use client";

import { useEffect, useState, useMemo } from "react";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import {
  Eye,
  ShoppingBag,
  TrendingUp,
  ArrowUpDown,
  Package,
  DollarSign,
  Star,
  BarChart3,
  TrendingDown,
  Activity,
  Award,
  Target,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface ServicePerformance {
  id: string;
  title: string;
  views_count: number;
  orders_count: number;
  base_price_cents: number;
  rating: number;
  reviews_count: number;
  conversion_rate: string;
  revenue_estimated_cents: number;
}

// Composant pour afficher un montant converti depuis USD
interface ConvertedAmountProps {
  amountCents: number;
  selectedCurrency: string;
}

function ConvertedAmount({ amountCents, selectedCurrency }: ConvertedAmountProps) {
  const { language } = useSafeLanguage();
  const [displayAmount, setDisplayAmount] = useState<number>(amountCents / 100);

  useEffect(() => {
    const convert = async () => {
      if (selectedCurrency === 'USD') {
        setDisplayAmount(amountCents / 100);
        return;
      }
      const converted = await convertFromUSD(amountCents / 100, selectedCurrency);
      if (converted !== null) {
        setDisplayAmount(converted);
      }
    };
    convert();
  }, [amountCents, selectedCurrency]);

  const formattedAmount = useMemo(() => {
    try {
      return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(displayAmount);
    } catch {
      return `${displayAmount.toFixed(2)} ${selectedCurrency}`;
    }
  }, [displayAmount, selectedCurrency]);

  return <>{formattedAmount}</>;
}

interface AnalyticsPerformanceProps {
  providerId?: string;
  isAdmin?: boolean;
  isDark?: boolean;
}

export default function AnalyticsPerformance({
  providerId,
  isAdmin = false,
  isDark = false,
}: AnalyticsPerformanceProps) {
  const { t, language } = useSafeLanguage();
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState<ServicePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState("orders_count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Charger la devise sélectionnée et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // If Admin, we don't need auth user check necessarily, but good to wait for hydrate
    // If not Admin, wait for user
    if (isAdmin) {
      if (providerId) fetchPerformance();
    } else {
      if (!authLoading && user) {
        fetchPerformance();
      }
    }
  }, [authLoading, user, isAdmin, providerId]);

  const fetchPerformance = async () => {
    setRefreshing(true);
    try {
      const queryParams =
        isAdmin && providerId ? `?profileId=${providerId}` : "";

      console.log("[Performance] Fetching data with params:", {
        isAdmin,
        providerId,
        queryParams,
      });

      const [servicesRes, ordersRes, earningsRes] = await Promise.all([
        fetch(`/api/services${queryParams}`),
        fetch(`/api/providers/orders${queryParams}`),
        fetch(`/api/provider/earnings${queryParams}`),
      ]);

      const servicesData = await servicesRes.json();
      const ordersData = await ordersRes.json();
      const earningsData = await earningsRes.json();

      if (servicesData && ordersData.success && earningsData.success) {
        const allServices = servicesData.services || [];
        const orders = ordersData.orders || [];
        const earningsHistory = earningsData.data.earnings || [];

        // Calculer les vraies métriques pour chaque service
        const servicesWithMetrics = allServices.map((service: any) => {
          // Compter les commandes réelles pour ce service
          const serviceOrders = orders.filter((order: any) => {
            if (order.order_items && order.order_items.length > 0) {
              return order.order_items.some(
                (item: any) => item.service_id === service.id
              );
            }
            return false;
          });

          const ordersCount = serviceOrders.length;
          const viewsCount = service.views_count || service.metrics?.views || 0;

          // Calculer le revenu réel généré par ce service depuis les earnings
          const serviceRevenue = earningsHistory
            .filter((earning: any) => {
              const order = orders.find((o: any) => o.id === earning.order_id);
              if (!order || !order.order_items) return false;
              return order.order_items.some(
                (item: any) => item.service_id === service.id
              );
            })
            .reduce(
              (acc: number, earning: any) =>
                acc + (earning.net_amount_cents || 0),
              0
            );

          return {
            id: service.id,
            title:
              service.title?.fr ||
              service.title?.en ||
              service.title ||
              "Service",
            views_count: viewsCount,
            orders_count: ordersCount,
            base_price_cents: service.base_price_cents || 0,
            rating:
              service.reviews && service.reviews.length > 0
                ? service.reviews.reduce(
                    (acc: number, r: any) => acc + r.rating,
                    0
                  ) / service.reviews.length
                : 0,
            reviews_count: service.reviews?.length || 0,
            conversion_rate:
              viewsCount > 0
                ? ((ordersCount / viewsCount) * 100).toFixed(2)
                : "0",
            revenue_estimated_cents: serviceRevenue,
          };
        });

        setServices(servicesWithMetrics);
      }
    } catch (error) {
      console.error("Failed to fetch performance analytics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedServices = [...services].sort((a, b) => {
    let aValue: any = a[sortField as keyof ServicePerformance];
    let bValue: any = b[sortField as keyof ServicePerformance];

    if (sortField === "conversion_rate") {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  // Calculs pour les statistiques globales
  const totalViews = services.reduce(
    (acc, curr) => acc + (curr.views_count || 0),
    0
  );
  const totalOrders = services.reduce(
    (acc, curr) => acc + (curr.orders_count || 0),
    0
  );
  const totalRevenue = services.reduce(
    (acc, curr) => acc + (curr.revenue_estimated_cents || 0),
    0
  );
  const avgConversion =
    services.length > 0
      ? (
          services.reduce(
            (acc, curr) => acc + parseFloat(curr.conversion_rate || "0"),
            0
          ) / services.length
        ).toFixed(2)
      : "0";

  // Top 5 services pour le graphique
  const topServicesByRevenue = [...services]
    .sort((a, b) => b.revenue_estimated_cents - a.revenue_estimated_cents)
    .slice(0, 5)
    .map((s) => ({
      name: s.title.length > 20 ? s.title.substring(0, 20) + "..." : s.title,
      revenus: s.revenue_estimated_cents / 100,
      commandes: s.orders_count,
    }));

  const performanceDistribution = [
    {
      name: t.analytics.performancePage.charts.distribution.excellent,
      value: services.filter((s) => parseFloat(s.conversion_rate) > 5).length,
      color: "#10b981",
    },
    {
      name: t.analytics.performancePage.charts.distribution.good,
      value: services.filter(
        (s) =>
          parseFloat(s.conversion_rate) >= 2 &&
          parseFloat(s.conversion_rate) <= 5
      ).length,
      color: "#f59e0b",
    },
    {
      name: t.analytics.performancePage.charts.distribution.poor,
      value: services.filter((s) => parseFloat(s.conversion_rate) < 2).length,
      color: "#ef4444",
    },
  ];

  if (loading) {
    if (isAdmin) {
      // Show simplified loading without header if IsAdmin
      return (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-500">{t.analytics.performancePage.loading}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {isAdmin && <HeaderProvider />}
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">
              {t.analytics.performancePage.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Adjust container class based on isAdmin
  return (
    <div
      className={
        isAdmin
          ? "w-full bg-transparent"
          : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
      }
    >
      {!isAdmin && <HeaderProvider />}

      <main
        className={
          isAdmin ? "" : "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {/* Header Section */}
        {!isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1
                  className={`text-4xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t.analytics.performancePage.title}
                </h1>
                <p
                  className={`flex items-center gap-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  {t.analytics.performancePage.subtitle}
                </p>
              </div>
              <button
                onClick={fetchPerformance}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors disabled:opacity-50 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="font-medium">{t.analytics.performancePage.refresh}</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all group ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                  isDark
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Eye className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.analytics.performancePage.kpi.total}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {totalViews}
                </p>
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.analytics.performancePage.kpi.totalViews}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t.analytics.performancePage.kpi.totalViewsSub}
            </p>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all group ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                  isDark
                    ? "bg-green-900/30 text-green-400"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.analytics.performancePage.kpi.total}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {totalOrders}
                </p>
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.analytics.performancePage.kpi.totalOrders}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t.analytics.performancePage.kpi.totalOrdersSub}
            </p>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all group ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                  isDark
                    ? "bg-purple-900/30 text-purple-400"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                <Target className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.analytics.performancePage.kpi.average}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {avgConversion}%
                </p>
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.analytics.performancePage.kpi.conversionRate}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t.analytics.performancePage.kpi.conversionRateSub}
            </p>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all group ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                  isDark
                    ? "bg-orange-900/30 text-orange-400"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.analytics.performancePage.kpi.total}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  <ConvertedAmount amountCents={totalRevenue} selectedCurrency={selectedCurrency} />
                </p>
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t.analytics.performancePage.kpi.totalRevenue}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t.analytics.performancePage.kpi.totalRevenueSub}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Top 5 Services Chart */}
          <div
            className={`lg:col-span-2 rounded-2xl shadow-sm border p-6 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-xl font-bold mb-1 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t.analytics.performancePage.charts.topServices.title}
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t.analytics.performancePage.charts.topServices.subtitle}
                </p>
              </div>
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesByRevenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? "#374151" : "#f1f5f9"}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDark ? "#9ca3af" : "#64748b",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDark ? "#9ca3af" : "#64748b",
                      fontSize: 12,
                    }}
                    label={{
                      value: t.analytics.performancePage.charts.topServices.revenueLabel.replace('{currency}', selectedCurrency === 'USD' ? '$' : selectedCurrency),
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: isDark ? "#9ca3af" : "#64748b" },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDark ? "#9ca3af" : "#64748b",
                      fontSize: 12,
                    }}
                    label={{
                      value: t.analytics.performancePage.charts.topServices.ordersLabel,
                      angle: 90,
                      position: "insideRight",
                      style: { fill: isDark ? "#9ca3af" : "#64748b" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenus"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                    name={t.analytics.performancePage.charts.topServices.revenueLabel.replace('{currency}', selectedCurrency === 'USD' ? '$' : selectedCurrency)}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="commandes"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    name={t.analytics.performancePage.charts.topServices.ordersLabel}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Distribution */}
          <div
            className={`rounded-2xl shadow-sm border p-6 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-1 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {t.analytics.performancePage.charts.distribution.title}
            </h3>
            <p
              className={`text-sm mb-6 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t.analytics.performancePage.charts.distribution.subtitle}
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {performanceDistribution.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span
                      className={`${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div
          className={`rounded-2xl shadow-sm border overflow-hidden ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div
            className={`p-6 border-b ${
              isDark ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-1 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {t.analytics.performancePage.table.title}
            </h3>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t.analytics.performancePage.table.sortingHint}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={`${
                  isDark
                    ? "bg-gray-900/50 border-gray-700"
                    : "bg-gray-50 border-gray-100"
                } border-b`}
              >
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t.analytics.performancePage.table.header.service}
                  </th>
                  <th
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase cursor-pointer transition-colors ${
                      isDark
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSort("views_count")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t.analytics.performancePage.table.header.views} <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase cursor-pointer transition-colors ${
                      isDark
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSort("orders_count")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t.analytics.performancePage.table.header.orders} <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase cursor-pointer transition-colors ${
                      isDark
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSort("conversion_rate")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t.analytics.performancePage.table.header.conversion} <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase cursor-pointer transition-colors ${
                      isDark
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSort("revenue_estimated_cents")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t.analytics.performancePage.table.header.revenue} <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t.analytics.performancePage.table.header.rating}
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-100"
                }`}
              >
                {sortedServices.length > 0 ? (
                  sortedServices.map((service) => {
                    const conversionRate = parseFloat(service.conversion_rate);
                    return (
                      <tr
                        key={service.id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div
                                className={`font-semibold line-clamp-1 max-w-xs ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                                title={service.title}
                              >
                                {service.title}
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${
                                  isDark ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                {t.analytics.performancePage.table.pricePrefix}{" "}
                                <ConvertedAmount amountCents={service.base_price_cents} selectedCurrency={selectedCurrency} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span
                              className={`font-mono font-medium ${
                                isDark ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {service.views_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            <span
                              className={`font-mono font-medium ${
                                isDark ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {service.orders_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              conversionRate > 5
                                ? isDark
                                  ? "bg-green-900/40 text-green-300"
                                  : "bg-green-100 text-green-700"
                                : conversionRate >= 2
                                ? isDark
                                  ? "bg-yellow-900/40 text-yellow-300"
                                  : "bg-yellow-100 text-yellow-700"
                                : isDark
                                ? "bg-red-900/40 text-red-300"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {conversionRate > 5 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : conversionRate >= 2 ? (
                              <Activity className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {service.conversion_rate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`font-bold text-lg ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <ConvertedAmount amountCents={service.revenue_estimated_cents || 0} selectedCurrency={selectedCurrency} />
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {t.analytics.performancePage.table.netAfterFees}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span
                              className={`font-semibold ${
                                isDark ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {service.rating > 0
                                ? service.rating.toFixed(1)
                                : "-"}
                            </span>
                            <span
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              ({service.reviews_count})
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package
                        className={`w-16 h-16 mx-auto mb-4 ${
                          isDark ? "text-gray-600" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`font-medium ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {t.analytics.performancePage.table.empty}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {t.analytics.performancePage.table.emptySub}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
