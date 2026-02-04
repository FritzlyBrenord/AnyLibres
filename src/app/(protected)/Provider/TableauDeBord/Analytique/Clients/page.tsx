"use client";

import { useEffect, useState, useMemo } from "react";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  Users,
  Repeat,
  Trophy,
  Star,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Award,
  UserCheck,
  Activity,
  Crown
} from "lucide-react";

interface ClientData {
  client_id: string;
  orders_count: number;
  total_spend_cents: number;
  first_order_date?: string;
  last_order_date?: string;
  avg_order_value?: number;
}

// Composant pour afficher un montant converti depuis USD
interface ConvertedAmountProps {
  amountCents: number;
  selectedCurrency: string;
}

function ConvertedAmount({ amountCents, selectedCurrency }: ConvertedAmountProps) {
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

export default function AnalyticsClients() {
  const { t, language } = useSafeLanguage();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [totalUniqueClients, setTotalUniqueClients] = useState(0);
  const [repeatClientsCount, setRepeatClientsCount] = useState(0);
  const [repeatRate, setRepeatRate] = useState('0');
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
      fetchClientsData();
    }
  }, [authLoading, user]);

  const fetchClientsData = async () => {
    setRefreshing(true);
    try {
      // Utiliser les vraies APIs comme dans Aperçu
      const [ordersRes, earningsRes] = await Promise.all([
        fetch("/api/providers/orders"),
        fetch("/api/provider/earnings")
      ]);

      const ordersData = await ordersRes.json();
      const earningsData = await earningsRes.json();

      console.log("Orders:", ordersData);
      console.log("Earnings:", earningsData);

      if (ordersData.success && earningsData.success) {
        const orders = ordersData.orders || [];
        const earningsHistory = earningsData.data.earnings || [];

        // Calculer les stats clients depuis les earnings (vrais montants)
        const clientsMap = new Map();

        earningsHistory.forEach((earning: any) => {
          const relatedOrder = orders.find((o: any) => o.id === earning.order_id);
          if (!relatedOrder) return;

          const clientId = relatedOrder.client_id || relatedOrder.client?.id;
          if (!clientId) return;

          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              client_id: clientId,
              orders_count: 0,
              total_spend_cents: 0,
              orders: [],
              first_order_date: relatedOrder.created_at,
              last_order_date: relatedOrder.created_at
            });
          }

          const client = clientsMap.get(clientId);
          client.orders_count++;
          client.total_spend_cents += (earning.net_amount_cents || 0);
          client.orders.push(relatedOrder);

          // Mettre à jour les dates
          if (new Date(relatedOrder.created_at) < new Date(client.first_order_date)) {
            client.first_order_date = relatedOrder.created_at;
          }
          if (new Date(relatedOrder.created_at) > new Date(client.last_order_date)) {
            client.last_order_date = relatedOrder.created_at;
          }
        });

        // Convertir en array et calculer moyenne
        const clientsArray = Array.from(clientsMap.values()).map((client: any) => ({
          ...client,
          avg_order_value: client.orders_count > 0
            ? client.total_spend_cents / client.orders_count
            : 0
        }));

        // Stats globales
        const totalClients = clientsArray.length;
        const repeatClients = clientsArray.filter(c => c.orders_count > 1).length;
        const rate = totalClients > 0 ? ((repeatClients / totalClients) * 100).toFixed(1) : '0';

        setClients(clientsArray);
        setTotalUniqueClients(totalClients);
        setRepeatClientsCount(repeatClients);
        setRepeatRate(rate);
      }
    } catch (error) {
      console.error("Failed to fetch clients data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
            <p className="text-gray-600 font-medium">{t.analytics.clientsPage.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Trier les clients
  const topClientsBySpending = [...clients]
    .sort((a, b) => b.total_spend_cents - a.total_spend_cents)
    .slice(0, 10);

  const topClientsByOrders = [...clients]
    .sort((a, b) => b.orders_count - a.orders_count)
    .slice(0, 10);

  const recurringClients = clients.filter(c => c.orders_count > 1)
    .sort((a, b) => b.orders_count - a.orders_count)
    .slice(0, 10);

  // Distribution des clients par nombre de commandes
  const orderDistribution = [
    { name: t.analytics.clientsPage.distribution.legend.one, value: clients.filter(c => c.orders_count === 1).length, color: '#ef4444' },
    { name: t.analytics.clientsPage.distribution.legend.twoToThree, value: clients.filter(c => c.orders_count >= 2 && c.orders_count <= 3).length, color: '#f59e0b' },
    { name: t.analytics.clientsPage.distribution.legend.fourToFive, value: clients.filter(c => c.orders_count >= 4 && c.orders_count <= 5).length, color: '#10b981' },
    { name: t.analytics.clientsPage.distribution.legend.sixPlus, value: clients.filter(c => c.orders_count >= 6).length, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  // Stats pour graphique valeur moyenne par commande
  const avgOrderValueData = topClientsBySpending.slice(0, 8).map(client => ({
    client: `Client ${client.client_id.slice(0, 6)}`,
    valeur: client.avg_order_value / 100
  }));

  const totalRevenue = clients.reduce((acc, c) => acc + c.total_spend_cents, 0);
  const totalOrders = clients.reduce((acc, c) => acc + c.orders_count, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <HeaderProvider />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {t.analytics.clientsPage.title}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.analytics.clientsPage.subtitle}
              </p>
            </div>
            <button
              onClick={fetchClientsData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium text-gray-700">{t.analytics.clientsPage.refresh}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{t.analytics.clientsPage.kpi.uniqueClients}</p>
            <p className="text-4xl font-bold text-gray-900">{totalUniqueClients}</p>
            <p className="text-xs text-gray-400 mt-1">{t.analytics.clientsPage.kpi.totalClients}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform">
                <Repeat className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{t.analytics.clientsPage.kpi.retentionRate}</p>
            <p className="text-4xl font-bold text-gray-900">{repeatRate}%</p>
            <p className="text-xs text-gray-400 mt-1">{t.analytics.clientsPage.kpi.recurringClients.replace('{count}', repeatClientsCount.toString())}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{t.analytics.clientsPage.kpi.totalRevenue}</p>
            <p className="text-4xl font-bold text-gray-900"><ConvertedAmount amountCents={totalRevenue} selectedCurrency={selectedCurrency} /></p>
            <p className="text-xs text-gray-400 mt-1">{t.analytics.clientsPage.kpi.allClients}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-50 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{t.analytics.clientsPage.kpi.avgOrderValue}</p>
            <p className="text-4xl font-bold text-gray-900"><ConvertedAmount amountCents={avgOrderValue} selectedCurrency={selectedCurrency} /></p>
            <p className="text-xs text-gray-400 mt-1">{t.analytics.clientsPage.kpi.perOrder}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Distribution des clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{t.analytics.clientsPage.distribution.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{t.analytics.clientsPage.distribution.subtitle}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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

          {/* Valeur moyenne par commande */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{t.analytics.clientsPage.avgValueChart.title}</h3>
                <p className="text-sm text-gray-500">{t.analytics.clientsPage.avgValueChart.subtitle}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgOrderValueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="client"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 11}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                    tickFormatter={(value) => `${value} ${selectedCurrency === 'USD' ? '$' : selectedCurrency}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)} ${selectedCurrency === 'USD' ? '$' : selectedCurrency}`, t.analytics.clientsPage.avgValueChart.label]}
                  />
                  <Bar dataKey="valeur" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Top Clients par Dépenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    {t.analytics.clientsPage.topSpenders.title}
                  </h3>
                  <p className="text-sm text-gray-500">{t.analytics.clientsPage.topSpenders.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.topSpenders.table.rank}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.topSpenders.table.clientId}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.topSpenders.table.orders}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.topSpenders.table.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topClientsBySpending.length > 0 ? (
                    topClientsBySpending.map((client, i) => (
                      <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-600">
                            {client.client_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {client.orders_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-green-600">
                            <ConvertedAmount amountCents={client.total_spend_cents} selectedCurrency={selectedCurrency} />
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{t.analytics.clientsPage.topSpenders.empty}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clients les Plus Actifs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    {t.analytics.clientsPage.mostActive.title}
                  </h3>
                  <p className="text-sm text-gray-500">{t.analytics.clientsPage.mostActive.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.mostActive.table.rank}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.mostActive.table.clientId}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.mostActive.table.orders}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.mostActive.table.avgPerOrder}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topClientsByOrders.length > 0 ? (
                    topClientsByOrders.map((client, i) => (
                      <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-600">
                            {client.client_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-blue-600">
                            {client.orders_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            <ConvertedAmount amountCents={client.avg_order_value || 0} selectedCurrency={selectedCurrency} />
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{t.analytics.clientsPage.mostActive.empty}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Clients Récurrents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  {t.analytics.clientsPage.recurring.title}
                </h3>
                <p className="text-sm text-gray-500">{t.analytics.clientsPage.recurring.subtitle}</p>
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <span className="font-semibold">{t.analytics.clientsPage.recurring.loyalClients.replace('{count}', repeatClientsCount.toString())}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.recurring.table.rank}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.recurring.table.clientId}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.recurring.table.orders}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.recurring.table.totalSpent}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">{t.analytics.clientsPage.recurring.table.avgValue}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recurringClients.length > 0 ? (
                  recurringClients.map((client, i) => (
                    <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-600">
                            {client.client_id.slice(0, 8)}...
                          </span>
                          <Award className="w-4 h-4 text-green-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <Repeat className="w-3 h-3" />
                          {client.orders_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          <ConvertedAmount amountCents={client.total_spend_cents} selectedCurrency={selectedCurrency} />
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-600">
                          <ConvertedAmount amountCents={client.avg_order_value || 0} selectedCurrency={selectedCurrency} />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      <Repeat className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{t.analytics.clientsPage.recurring.empty}</p>
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
