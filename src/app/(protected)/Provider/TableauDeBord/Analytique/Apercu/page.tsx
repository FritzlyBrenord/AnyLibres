"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  Clock,
  Package,
  Activity,
  Eye,
  Target,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  kpi: {
    total_revenue: {
      amount_cents: number;
      currency: string;
      growth_percent: number;
    };
    orders: {
      total: number;
      completed: number;
      active: number;
      cancelled: number;
    };
    avg_selling_price_cents: number;
  };
  provider_stats: {
    rating: number;
    total_reviews: number;
    response_time_hours: number;
  };
  recent_activity: any[];
  revenue_history: Array<{ name: string; value: number }>;
}

interface RevenueData {
  chart_data: Array<{
    date: string;
    amount_cents: number;
    amount_formatted: string;
  }>;
  summary: {
    total_earnings_cents: number;
    pending_clearance_cents: number;
    available_for_withdrawal_cents: number;
  };
}

interface PerformanceData {
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

interface ClientsData {
  total_unique_clients: number;
  repeat_clients_count: number;
  repeat_rate: string;
  top_clients: Array<{
    client_id: string;
    orders_count: number;
    total_spend_cents: number;
  }>;
}

// Composant pour afficher un montant converti depuis USD
interface ConvertedAmountProps {
  amountCents: number;
  selectedCurrency: string;
}

function ConvertedAmount({ amountCents, selectedCurrency }: ConvertedAmountProps) {
  const { t } = useSafeLanguage();
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
      const locale = t.lang === 'en' ? 'en-US' : t.lang === 'es' ? 'es-ES' : 'fr-FR';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(displayAmount);
    } catch {
      return `${displayAmount.toFixed(2)} ${selectedCurrency}`;
    }
  }, [displayAmount, selectedCurrency, t.lang]);

  return <>{formattedAmount}</>;
}

export default function AnalyticsOverview() {
  const { t } = useSafeLanguage();
  const ta = t.analytics;
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [clients, setClients] = useState<ClientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
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
    if (!authLoading && user) {
      fetchAllData();
    }
  }, [authLoading, user]);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      // Utiliser les APIs qui fonctionnent déjà
      const [earningsRes, servicesRes, ordersRes, reviewsRes] = await Promise.all([
        fetch("/api/provider/earnings"),
        fetch("/api/services"), // Charger TOUS les services pour avoir les statistiques complètes
        fetch("/api/providers/orders"),
        fetch("/api/providers/reviews")
      ]);

      const earningsData = await earningsRes.json();
      const servicesData = await servicesRes.json();
      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes.json();

      console.log("Earnings Data:", earningsData);
      console.log("Services Data:", servicesData);
      console.log("Orders Data:", ordersData);
      console.log("Reviews Data:", reviewsData);

      // Calculer les métriques à partir des données réelles
      if (earningsData.success && ordersData.success && reviewsData.success && servicesData) {
        const balance = earningsData.data.balance;
        const orders = ordersData.orders || [];
        const services = servicesData.services || [];
        const reviewStats = reviewsData.stats || {};
        const earningsHistory = earningsData.data.earnings || [];

        // Calculer les revenus par jour (7 derniers jours) depuis les earnings
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        const revenueByDay = last7Days.map(date => {
          const dayKey = date.toISOString().split('T')[0];
          // Utiliser earnings au lieu des orders pour avoir les vrais montants du provider
          const dayEarnings = earningsHistory.filter((earning: any) => {
            const earningDate = new Date(earning.created_at).toISOString().split('T')[0];
            return earningDate === dayKey && ['completed', 'processing', 'pending'].includes(earning.status);
          });
          // Utiliser net_amount_cents qui est le montant après frais de plateforme
          const dayRevenue = dayEarnings.reduce((acc: number, earning: any) =>
            acc + (earning.net_amount_cents || 0), 0
          );
          return {
            name: date.toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase() +
                  date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(1),
            value: dayRevenue / 100
          };
        });

        // Compter les commandes par statut (utiliser les mêmes statuts que dans Order page)
        const completedOrders = orders.filter((o: any) =>
          o.status === 'completed'
        ).length;
        const activeOrders = orders.filter((o: any) =>
          ['in_progress', 'delivery_delayed'].includes(o.status)
        ).length;
        const cancelledOrders = orders.filter((o: any) =>
          o.status === 'cancelled'
        ).length;

        // Calculer le prix moyen depuis les earnings (pas depuis les commandes)
        // Les earnings contiennent déjà le net_amount_cents (montant après frais pour le provider)
        const completedEarnings = earningsHistory.filter((e: any) =>
          ['completed', 'processing'].includes(e.status)
        );
        const avgPrice = completedEarnings.length > 0
          ? completedEarnings.reduce((acc: number, e: any) =>
              acc + (e.net_amount_cents || 0), 0
            ) / completedEarnings.length
          : 0;

        // Construire l'objet analytics
        setAnalytics({
          kpi: {
            total_revenue: {
              amount_cents: balance.total_earned_cents || 0,
              currency: balance.currency || 'EUR',
              growth_percent: 0
            },
            orders: {
              total: orders.length,
              completed: completedOrders,
              active: activeOrders,
              cancelled: cancelledOrders
            },
            avg_selling_price_cents: avgPrice
          },
          provider_stats: {
            rating: reviewStats.average_rating || 0,
            total_reviews: reviewStats.total_reviews || 0,
            response_time_hours: 24
          },
          recent_activity: orders.slice(0, 5),
          revenue_history: revenueByDay
        });

        // Données de revenus
        setRevenue({
          chart_data: [],
          summary: {
            total_earnings_cents: balance.total_earned_cents || 0,
            pending_clearance_cents: balance.pending_cents || 0,
            available_for_withdrawal_cents: balance.available_cents || 0
          }
        });

        // Performance des services - calculer les vraies commandes depuis les orders
        const servicesWithMetrics = services.map((service: any) => {
          // Compter les commandes réelles pour ce service depuis les order_items
          const serviceOrders = orders.filter((order: any) => {
            // Vérifier si cette commande contient ce service
            if (order.order_items && order.order_items.length > 0) {
              return order.order_items.some((item: any) => item.service_id === service.id);
            }
            return false;
          });

          const ordersCount = serviceOrders.length;
          const viewsCount = service.metrics?.views || 0;

          // Calculer le revenu réel généré par ce service depuis les earnings
          const serviceRevenue = earningsHistory
            .filter((earning: any) => {
              const order = orders.find((o: any) => o.id === earning.order_id);
              if (!order || !order.order_items) return false;
              return order.order_items.some((item: any) => item.service_id === service.id);
            })
            .reduce((acc: number, earning: any) => acc + (earning.net_amount_cents || 0), 0);

          return {
            id: service.id,
            title: service.title?.fr || service.title?.en || service.title || 'Service',
            views_count: viewsCount,
            orders_count: ordersCount,
            base_price_cents: service.base_price_cents || 0,
            rating: service.reviews && service.reviews.length > 0
              ? service.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / service.reviews.length
              : 0,
            reviews_count: service.reviews?.length || 0,
            conversion_rate: viewsCount > 0
              ? ((ordersCount / viewsCount) * 100).toFixed(2)
              : '0',
            revenue_estimated_cents: serviceRevenue
          };
        });
        setPerformance(servicesWithMetrics);

        // Clients data - utiliser les earnings pour calculer les revenus réels du provider
        const clientsMap = new Map();
        earningsHistory.forEach((earning: any) => {
          // Trouver l'order correspondant pour récupérer le client_id
          const relatedOrder = orders.find((o: any) => o.id === earning.order_id);
          if (!relatedOrder) return;

          const clientId = relatedOrder.client_id || relatedOrder.client?.id;
          if (!clientId) return;

          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              client_id: clientId,
              orders_count: 0,
              total_spend_cents: 0
            });
          }

          const client = clientsMap.get(clientId);
          client.orders_count++;
          // Utiliser net_amount_cents (earnings du provider après frais de plateforme)
          client.total_spend_cents += (earning.net_amount_cents || 0);
        });

        const topClients = Array.from(clientsMap.values())
          .sort((a: any, b: any) => b.total_spend_cents - a.total_spend_cents)
          .slice(0, 10);

        const repeatClients = Array.from(clientsMap.values()).filter((c: any) => c.orders_count > 1).length;

        setClients({
          total_unique_clients: clientsMap.size,
          repeat_clients_count: repeatClients,
          repeat_rate: clientsMap.size > 0
            ? ((repeatClients / clientsMap.size) * 100).toFixed(1)
            : '0',
          top_clients: topClients
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    trend,
    trendLabel,
    color = "purple"
  }: any) => {
    const colorClasses = {
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      green: "bg-green-50 text-green-600 border-green-100",
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      orange: "bg-orange-50 text-orange-600 border-orange-100",
      pink: "bg-pink-50 text-pink-600 border-pink-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} transition-transform group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trend >= 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {trend >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              {trendLabel && <span className="font-medium">{trendLabel}</span>}
              {subtext}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <HeaderProvider />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">{ta.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = analytics?.kpi?.total_revenue?.amount_cents || 0;
  const completedOrders = analytics?.kpi?.orders?.completed || 0;
  const activeOrders = analytics?.kpi?.orders?.active || 0;
  const avgPrice = analytics?.kpi?.avg_selling_price_cents || 0;
  const rating = analytics?.provider_stats?.rating || 0;
  const totalReviews = analytics?.provider_stats?.total_reviews || 0;

  // Prepare performance chart data
  const topServices = performance.slice(0, 5).map(s => ({
    name: s.title.substring(0, 20) + (s.title.length > 20 ? '...' : ''),
    vues: s.views_count,
    commandes: s.orders_count,
    conversion: parseFloat(s.conversion_rate)
  }));

  // Order status distribution
  const orderDistribution = [
    { name: 'Complétées', value: completedOrders, color: '#10b981' },
    { name: 'En cours', value: activeOrders, color: '#f59e0b' },
    { name: 'Annulées', value: analytics?.kpi?.orders?.cancelled || 0, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <HeaderProvider />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {ta.title}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {ta.subtitle}
              </p>
            </div>
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium text-gray-700">{ta.refresh}</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={ta.kpi.totalRevenue}
            value={<ConvertedAmount amountCents={totalRevenue} selectedCurrency={selectedCurrency} />}
            subtext={ta.kpi.netRevenue}
            icon={DollarSign}
            trend={analytics?.kpi?.total_revenue?.growth_percent}
            trendLabel={ta.kpi.vsLastMonth}
            color="green"
          />
          <StatCard
            title={ta.kpi.completedOrders}
            value={completedOrders}
            subtext={t('analytics.kpi.activeOrdersCount', { count: activeOrders })}
            icon={ShoppingBag}
            color="blue"
          />
          <StatCard
            title={ta.kpi.avgPrice}
            value={<ConvertedAmount amountCents={avgPrice} selectedCurrency={selectedCurrency} />}
            subtext={ta.kpi.perCompletedOrder}
            icon={Target}
            color="purple"
          />
          <StatCard
            title={ta.kpi.globalRating}
            value={`${rating.toFixed(1)}/5`}
            subtext={t('analytics.kpi.basedOnReviews', { count: totalReviews })}
            icon={Star}
            color="orange"
          />
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={ta.secondaryKpi.uniqueClients}
            value={clients?.total_unique_clients || 0}
            subtext={t('analytics.secondaryKpi.repeatRate', { rate: clients?.repeat_rate || 0 })}
            icon={Users}
            color="indigo"
          />
          <StatCard
            title={ta.secondaryKpi.conversionRate}
            value={
              performance.length > 0
                ? `${(performance.reduce((acc, s) => acc + parseFloat(s.conversion_rate), 0) / performance.length).toFixed(1)}%`
                : '0%'
            }
            subtext={ta.secondaryKpi.avgAllServices}
            icon={TrendingUp}
            color="pink"
          />
          <StatCard
            title={ta.secondaryKpi.responseTime}
            value={`${analytics?.provider_stats?.response_time_hours || 0}h`}
            subtext={ta.secondaryKpi.avgResponseTime}
            icon={Clock}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{ta.charts.revenueEvolution}</h3>
                <p className="text-sm text-gray-500">{ta.charts.last7Days}</p>
              </div>
              <div className="flex gap-2">
                {['7d', '30d', '90d', 'all'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {ta.charts.periods[period as keyof typeof ta.charts.periods]}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenue_history || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)} €`, 'Revenus']}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{ta.charts.orderDistribution}</h3>
            <p className="text-sm text-gray-500 mb-6">{ta.charts.currentStatus}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {orderDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart & Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Service Performance */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{ta.charts.servicePerformance}</h3>
                <p className="text-sm text-gray-500">{ta.charts.topServicesDesc}</p>
              </div>
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 11}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{paddingTop: '20px'}}
                    iconType="circle"
                  />
                  <Bar dataKey="vues" name={ta.charts.legend.views} fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="commandes" name={ta.charts.legend.orders} fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{ta.recentActivity.title}</h3>
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
                analytics.recent_activity.map((order: any, idx: number) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        order.status === 'completed' ? 'bg-green-100' :
                        order.status === 'in_progress' ? 'bg-blue-100' :
                        order.status === 'delivered' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        <Package className={`w-5 h-5 ${
                          order.status === 'completed' ? 'text-green-600' :
                          order.status === 'in_progress' ? 'text-blue-600' :
                          order.status === 'delivered' ? 'text-purple-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        <ConvertedAmount
                          amountCents={
                            order.metadata?.pricing?.fee_config?.paid_by === "provider"
                              ? order.total_cents - (order.fees_cents || 0)
                              : order.metadata?.pricing?.fee_config?.paid_by === "split"
                              ? order.total_cents - ((order.fees_cents || 0) / 2)
                              : order.total_cents
                          }
                          selectedCurrency={selectedCurrency}
                        />
                      </p>
                      {order.metadata?.pricing?.fee_config?.paid_by === "split" && order.fees_cents > 0 && (
                        <p className="text-xs text-gray-500">
                          (Frais 50%: <ConvertedAmount amountCents={order.fees_cents / 2} selectedCurrency={selectedCurrency} />)
                        </p>
                      )}
                      {order.metadata?.pricing?.fee_config?.paid_by === "provider" && order.fees_cents > 0 && (
                        <p className="text-xs text-gray-500">
                          (Frais: <ConvertedAmount amountCents={order.fees_cents || 0} selectedCurrency={selectedCurrency} />)
                        </p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{ta.recentActivity.noActivity}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Top Clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{ta.topClients.title}</h3>
                <p className="text-sm text-gray-500">{ta.topClients.subtitle}</p>
              </div>
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="space-y-3">
              {clients?.top_clients && clients.top_clients.slice(0, 5).map((client, idx) => (
                <div
                  key={client.client_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Client #{client.client_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('analytics.topClients.ordersCount', { 
                          count: client.orders_count,
                          s: client.orders_count > 1 ? 's' : ''
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      <ConvertedAmount amountCents={client.total_spend_cents} selectedCurrency={selectedCurrency} />
                    </p>
                  </div>
                </div>
              ))}
              {(!clients?.top_clients || clients.top_clients.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{ta.topClients.noClients}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{ta.quickSummary.title}</h3>
              <Activity className="w-6 h-6 opacity-80" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 opacity-80" />
                  <p className="text-sm opacity-90">{ta.quickSummary.totalViews}</p>
                </div>
                <p className="text-2xl font-bold">
                  {performance.reduce((acc, s) => acc + s.views_count, 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 opacity-80" />
                  <p className="text-sm opacity-90">{ta.quickSummary.conversions}</p>
                </div>
                <p className="text-2xl font-bold">
                  {performance.reduce((acc, s) => acc + s.orders_count, 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 opacity-80" />
                  <p className="text-sm opacity-90">{ta.quickSummary.activeServices}</p>
                </div>
                <p className="text-2xl font-bold">{performance.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 opacity-80" />
                  <p className="text-sm opacity-90">{ta.quickSummary.satisfaction}</p>
                </div>
                <p className="text-2xl font-bold">{((rating / 5) * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-sm opacity-90 mb-1">{ta.quickSummary.availableForWithdrawal}</p>
              <p className="text-3xl font-bold">
                <ConvertedAmount amountCents={revenue?.summary?.available_for_withdrawal_cents || 0} selectedCurrency={selectedCurrency} />
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
