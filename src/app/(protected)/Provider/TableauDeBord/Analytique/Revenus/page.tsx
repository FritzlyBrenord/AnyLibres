"use client";

import { useEffect, useState } from "react";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Download,
  Clock,
  CreditCard,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  TrendingDown,
  RefreshCw,
  Calendar,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  History
} from "lucide-react";

interface WithdrawalStat {
  id: string;
  amount_cents: number;
  fee_cents: number;
  net_amount_cents: number;
  status: string;
  payment_method_type: string;
  created_at: string;
}

// Composant pour afficher un montant converti
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
      return new Intl.NumberFormat('fr-FR', {
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

export default function AnalyticsRevenue() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // États pour les données
  const [earnings, setEarnings] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalStat[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);

  // États pour les montants convertis
  const [convertedAmounts, setConvertedAmounts] = useState({
    availableBalance: 0,
    totalEarned: 0,
    pendingBalance: 0,
    withdrawnAmount: 0,
    totalWithdrawalFees: 0,
  });

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

  // Convertir les montants quand la devise ou les earnings changent
  useEffect(() => {
    const convertAllAmounts = async () => {
      if (!earnings) return;

      const availableBalance = earnings?.available_cents || 0;
      const totalEarned = earnings?.total_earned_cents || 0;
      const pendingBalance = earnings?.pending_cents || 0;
      const withdrawnAmount = earnings?.withdrawn_cents || 0;
      const totalWithdrawalFees = withdrawals.reduce((acc, w) => acc + (w.fee_cents || 0), 0);

      if (selectedCurrency === 'USD') {
        setConvertedAmounts({
          availableBalance: availableBalance / 100,
          totalEarned: totalEarned / 100,
          pendingBalance: pendingBalance / 100,
          withdrawnAmount: withdrawnAmount / 100,
          totalWithdrawalFees: totalWithdrawalFees / 100,
        });
        return;
      }

      // Convertir tous les montants
      const [
        convertedAvailable,
        convertedTotal,
        convertedPending,
        convertedWithdrawn,
        convertedFees
      ] = await Promise.all([
        convertFromUSD(availableBalance / 100, selectedCurrency),
        convertFromUSD(totalEarned / 100, selectedCurrency),
        convertFromUSD(pendingBalance / 100, selectedCurrency),
        convertFromUSD(withdrawnAmount / 100, selectedCurrency),
        convertFromUSD(totalWithdrawalFees / 100, selectedCurrency),
      ]);

      setConvertedAmounts({
        availableBalance: convertedAvailable || 0,
        totalEarned: convertedTotal || 0,
        pendingBalance: convertedPending || 0,
        withdrawnAmount: convertedWithdrawn || 0,
        totalWithdrawalFees: convertedFees || 0,
      });
    };

    convertAllAmounts();
  }, [earnings, withdrawals, selectedCurrency]);

  // Fonction pour formater les montants avec la devise
  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [earningsRes, withdrawalsRes, paymentMethodsRes, servicesRes] = await Promise.all([
        fetch("/api/provider/earnings"),
        fetch("/api/provider/withdrawals"),
        fetch("/api/provider/payment-methods"),
        fetch("/api/services")
      ]);

      const earningsData = await earningsRes.json();
      const withdrawalsData = await withdrawalsRes.json();
      const paymentMethodsData = await paymentMethodsRes.json();
      const servicesData = await servicesRes.json();

      console.log("Earnings:", earningsData);
      console.log("Withdrawals:", withdrawalsData);
      console.log("Payment Methods:", paymentMethodsData);

      if (earningsData.success) {
        setEarnings(earningsData.data.balance);
        setEarningsHistory(earningsData.data.earnings || []);
      }
      if (withdrawalsData.success) {
        setWithdrawals(withdrawalsData.data || []);
      }
      if (paymentMethodsData.success) {
        setPaymentMethods(paymentMethodsData.data || []);
      }
      if (servicesData.services) {
        setServices(servicesData.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    const csvData = earningsHistory.map(e => ({
      Date: new Date(e.created_at).toLocaleDateString('fr-FR'),
      Montant: (e.amount_cents / 100).toFixed(2),
      Frais: (e.platform_fee_cents / 100).toFixed(2),
      Net: (e.net_amount_cents / 100).toFixed(2),
      Statut: e.status
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenus-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <HeaderProvider />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Chargement des revenus...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculs des statistiques
  const availableBalance = earnings?.available_cents || 0;
  const totalEarned = earnings?.total_earned_cents || 0;
  const pendingBalance = earnings?.pending_cents || 0;
  const withdrawnAmount = earnings?.withdrawn_cents || 0;
  const completedWithdrawals = withdrawals.filter(w => w.status === 'completed').length;
  const totalWithdrawalFees = withdrawals.reduce((acc, w) => acc + (w.fee_cents || 0), 0);

  // Calculer revenus par mois (6 derniers mois)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7);

    const monthEarnings = earningsHistory.filter((e: any) => {
      return e.created_at.startsWith(monthKey) && ['completed', 'processing'].includes(e.status);
    });

    const revenue = monthEarnings.reduce((acc: number, e: any) => acc + (e.net_amount_cents || 0), 0);

    return {
      month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      revenue: revenue / 100,
      count: monthEarnings.length
    };
  });

  // Distribution des modes de paiement utilisés
  const paymentMethodStats = withdrawals.reduce((acc: any, w) => {
    const type = w.payment_method_type || 'Autre';
    if (!acc[type]) {
      acc[type] = { count: 0, amount: 0 };
    }
    acc[type].count++;
    acc[type].amount += w.net_amount_cents || 0;
    return acc;
  }, {});

  const paymentMethodDistribution = Object.entries(paymentMethodStats).map(([type, data]: any) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: data.count,
    amount: data.amount / 100
  }));

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  // Revenus par service (Top 10)
  const revenueByService = services
    .map(service => {
      const serviceEarnings = earningsHistory.filter((e: any) => {
        // Trouver si ce earning correspond à ce service (via order_items)
        return e.order?.order_items?.some((item: any) => item.service_id === service.id);
      });

      const revenue = serviceEarnings.reduce((acc: number, e: any) => acc + (e.net_amount_cents || 0), 0);

      return {
        title: service.title?.fr || service.title?.en || 'Service',
        revenue: revenue / 100,
        count: serviceEarnings.length
      };
    })
    .filter(s => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Statuts des retraits
  const withdrawalsByStatus = [
    { name: 'Complétés', value: withdrawals.filter(w => w.status === 'completed').length, color: '#10b981' },
    { name: 'En cours', value: withdrawals.filter(w => w.status === 'processing').length, color: '#f59e0b' },
    { name: 'En attente', value: withdrawals.filter(w => w.status === 'pending').length, color: '#3b82f6' },
    { name: 'Annulés', value: withdrawals.filter(w => w.status === 'cancelled').length, color: '#ef4444' }
  ].filter(s => s.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <HeaderProvider />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Vos Revenus
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Suivez vos gains, retraits et performances financières
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium text-gray-700">Exporter CSV</span>
              </button>
              <button
                onClick={fetchAllData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium text-gray-700">Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Disponible */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-semibold">Disponible</span>
              </div>
              <p className="text-green-100 text-sm mb-1">Solde Disponible</p>
              <p className="text-4xl font-bold mb-3">{formatAmount(convertedAmounts.availableBalance)}</p>
              <div className="pt-3 border-t border-white/20 text-xs text-green-100">
                Prêt à être retiré maintenant
              </div>
            </div>
          </div>

          {/* Total Gagné */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Revenus Totaux</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatAmount(convertedAmounts.totalEarned)}</p>
            <p className="text-xs text-gray-400">Gains à vie (net)</p>
          </div>

          {/* En attente */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">En Compensation</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatAmount(convertedAmounts.pendingBalance)}</p>
            <p className="text-xs text-gray-400">Disponible sous 14 jours</p>
          </div>

          {/* Déjà retiré */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                <ArrowDownToLine className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Déjà Retiré</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatAmount(convertedAmounts.withdrawnAmount)}</p>
            <p className="text-xs text-gray-400">{completedWithdrawals} retrait{completedWithdrawals > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Montant Restant</h3>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatAmount(convertedAmounts.availableBalance + convertedAmounts.pendingBalance)}</p>
            <p className="text-xs text-gray-500 mt-2">Disponible + En attente</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Frais de Retrait</h3>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatAmount(convertedAmounts.totalWithdrawalFees)}</p>
            <p className="text-xs text-gray-500 mt-2">Total des frais (2.5%)</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Modes de Paiement</h3>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{paymentMethods.length}</p>
            <p className="text-xs text-gray-500 mt-2">Méthode{paymentMethods.length > 1 ? 's' : ''} configurée{paymentMethods.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Evolution Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Évolution des Revenus</h3>
                <p className="text-sm text-gray-500">6 derniers mois (revenus nets)</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
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
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)} €`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Withdrawal Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Statut des Retraits</h3>
            <p className="text-sm text-gray-500 mb-6">Distribution par statut</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={withdrawalsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {withdrawalsByStatus.map((entry, index) => (
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
              {withdrawalsByStatus.map((item, idx) => (
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

        {/* Revenue by Service */}
        {revenueByService.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Revenus par Service</h3>
                <p className="text-sm text-gray-500">Top 10 services les plus rentables</p>
              </div>
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByService} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 11}}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)} €`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Payment Methods & Recent Withdrawals */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modes de Paiement</h3>
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon || '💳'}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.verified && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {method.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucun mode de paiement configuré</p>
              </div>
            )}
          </div>

          {/* Recent Withdrawals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Retraits Récents</h3>
              <History className="w-6 h-6 text-purple-600" />
            </div>
            {withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.slice(0, 5).map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        withdrawal.status === 'completed' ? 'bg-green-100' :
                        withdrawal.status === 'processing' ? 'bg-yellow-100' :
                        withdrawal.status === 'pending' ? 'bg-blue-100' :
                        'bg-red-100'
                      }`}>
                        {withdrawal.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                         withdrawal.status === 'cancelled' ? <XCircle className="w-5 h-5 text-red-600" /> :
                         <Clock className="w-5 h-5 text-yellow-600" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          <ConvertedAmount amountCents={withdrawal.amount_cents} selectedCurrency={selectedCurrency} />
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        <ConvertedAmount amountCents={withdrawal.net_amount_cents} selectedCurrency={selectedCurrency} />
                      </p>
                      <p className="text-xs text-gray-500">
                        Frais: <ConvertedAmount amountCents={withdrawal.fee_cents} selectedCurrency={selectedCurrency} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucun retrait pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
