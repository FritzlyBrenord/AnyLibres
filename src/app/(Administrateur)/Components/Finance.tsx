"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";
import { AdminBalanceSection } from "./AdminBalanceSection";

interface FinanceStats {
  total_revenue_gross: number;
  total_revenue_net: number;
  total_revenue_net_pending: number;
  total_withdrawal_fees: number;
  total_system_revenue: number;
  total_system_revenue_pending: number;
  total_provider_earnings: number;
  total_provider_earnings_pending: number;
  total_refunds: number;
  total_withdrawals: number;
  pending_provider_balance: number;
  provider_balances: {
    available: number;
    pending: number;
    withdrawn: number;
    total_earned: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    by_status: {
      pending: number;
      in_progress: number;
      in_review: number;
      completed: number;
      cancelled: number;
    };
  };
  monthly_stats: {
    month: string;
    revenue: number;
    platform_share: number;
    provider_share: number;
    orders_count: number;
  }[];
}

const Finance = ({ isDark }: { isDark?: boolean }) => {
  const { t, language } = useLanguage();
  const { convertFromUSD, formatAmount } = useCurrency();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawalFeePercentage, setWithdrawalFeePercentage] = useState(2.5);

  useEffect(() => {
    fetchFinanceStats();
    fetchWithdrawalFee();
  }, []);

  const fetchFinanceStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/finance-stats?isAdmin=true");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      } else {
        setError(
          data.error ||
            t('admin.finance.error') ||
            "Erreur lors du chargement des statistiques",
        );
      }
    } catch (err) {
      console.error("Error fetching finance stats:", err);
      setError(
        t('admin.finance.error') ||
          "Impossible de charger les statistiques financières",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalFee = async () => {
    try {
      const response = await fetch("/api/admin/platform-settings?isAdmin=true");
      const data = await response.json();

      if (data.success && data.data.settings) {
        setWithdrawalFeePercentage(
          data.data.settings.withdrawal_fee_percentage || 2.5,
        );
      }
    } catch (err) {
      console.error("Error fetching withdrawal fee:", err);
      // Garder la valeur par défaut de 2.5 en cas d'erreur
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
            {t('admin.finance.loading') ||
              "Chargement des statistiques financières..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`${
            isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
          } border rounded-xl p-6 max-w-md`}
        >
          <AlertCircle
            className={`w-12 h-12 ${
              isDark ? "text-red-400" : "text-red-600"
            } mx-auto mb-4`}
          />
          <p
            className={`text-center ${
              isDark ? "text-red-300" : "text-red-800"
            }`}
          >
            {error || t('admin.finance.error') || "Erreur lors du chargement"}
          </p>
        </div>
      </div>
    );
  }


  const formatCurrency = (amount: number) => {
    return formatAmount(convertFromUSD(amount));
  };

  // Composant Section avec chevron
  const CollapsibleSection = ({
    title,
    icon: Icon,
    iconColor,
    children,
    defaultOpen = false,
  }: {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div
        className={`border rounded-2xl overflow-hidden mb-6 ${
          isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"
        } shadow-lg shadow-purple-500/5`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-6 flex items-center justify-between transition-all ${
            isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h3
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
          </div>
          <div
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
            }`}
          >
            {isOpen ? (
              <ChevronUp
                className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              />
            ) : (
              <ChevronDown
                className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              />
            )}
          </div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} p-6`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t('admin.finance.title')}
            </h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              {t('admin.finance.subtitle')}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
            <Download className="w-5 h-5" />
            {t('admin.finance.export')}
          </button>
        </div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenus Bruts Totaux */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats.total_revenue_gross)}
          </div>
          <p className="text-green-100 text-sm">
            {t('admin.finance.cards.grossRevenue.title')}
          </p>
          <p className="text-xs text-green-200 mt-2">
            {t('admin.finance.cards.grossRevenue.subtitle')}
          </p>
        </motion.div>

        {/* Revenus Système CONFIRMÉS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats.total_system_revenue)}
          </div>
          <p className="text-green-100 text-sm">
            {t('admin.finance.cards.confirmedRevenue.title')}
          </p>
          <p className="text-xs text-green-200 mt-2">
            {t('admin.finance.cards.confirmedRevenue.subtitle')}
          </p>
        </motion.div>

        {/* Total Prestataires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <ArrowDownRight className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats.total_provider_earnings)}
          </div>
          <p className="text-blue-100 text-sm">
            {t('admin.finance.cards.providerShare.title')}
          </p>
          <p className="text-xs text-blue-200 mt-2">
            {t('admin.finance.cards.providerShare.subtitle')}
          </p>
        </motion.div>

        {/* Solde Restant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <Clock className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats.pending_provider_balance)}
          </div>
          <p className="text-orange-100 text-sm">
            {t('admin.finance.cards.pendingBalance.title')}
          </p>
          <p className="text-xs text-orange-200 mt-2">
            {t('admin.finance.cards.pendingBalance.subtitle')}
          </p>
        </motion.div>
      </div>

      {/* Revenus Système Détaillés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <CollapsibleSection
          title={t('admin.finance.systemRevenue.title')}
          icon={DollarSign}
          iconColor="text-purple-600"
          defaultOpen={true}
        >
          {/* Revenus CONFIRMÉS */}
          <div className="mb-6">
            <h4
              className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              ✅{" "}
              {t('admin.finance.systemRevenue.confirmed')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Commission sur commandes (5%) */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.commission')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.systemRevenue.commissionConfirmed')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.total_revenue_net)}
                </span>
              </div>

              {/* Frais de retrait (2.5%) */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.withdrawalFees')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {withdrawalFeePercentage}%{" "}
                        {t('admin.finance.systemRevenue.withdrawalFeesDesc')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.total_withdrawal_fees)}
                </span>
              </div>

              {/* Total Système CONFIRMÉ */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-300 dark:border-green-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('admin.finance.systemRevenue.totalConfirmed')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.moneyEarned')}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.total_system_revenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenus EN ATTENTE */}
          <div className="mb-6">
            <h4
              className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              ⏳{" "}
                {t('admin.finance.systemRevenue.pending')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.commissionPending')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.systemRevenue.commissionNotConfirmed')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(stats.total_revenue_net_pending)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.providersPending')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.systemRevenue.providersNotConfirmed')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(stats.total_provider_earnings_pending)}
                </span>
              </div>
            </div>
          </div>

          {/* Remboursements */}
          {stats.total_refunds > 0 && (
            <div>
              <h4
                className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                ↩️{" "}
                {t('admin.finance.systemRevenue.refunds')}
              </h4>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.systemRevenue.totalRefunded')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.systemRevenue.cancelledOrders')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(stats.total_refunds)}
                </span>
              </div>
            </div>
          )}
        </CollapsibleSection>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Soldes Prestataires Détaillés */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CollapsibleSection
            title={t('admin.finance.providerBalances.title')}
            icon={Wallet}
            iconColor="text-purple-600"
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.providerBalances.available')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.providerBalances.availableDesc')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.provider_balances.available)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.providerBalances.pending')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.providerBalances.pendingDesc')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(stats.provider_balances.pending)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.providerBalances.withdrawn')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.providerBalances.withdrawnDesc')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats.provider_balances.withdrawn)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.finance.providerBalances.totalEarned')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {t('admin.finance.providerBalances.totalEarnedDesc')}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(stats.provider_balances.total_earned)}
                </span>
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>

        {/* Statistiques Commandes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CollapsibleSection
            title={t('admin.finance.orderStats.title')}
            icon={ShoppingCart}
            iconColor="text-purple-600"
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {t('admin.finance.orderStats.total')}
                  </span>
                </div>
                <span
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stats.orders.total}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {t('admin.finance.orderStats.completed')}
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {stats.orders.completed}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {t('admin.finance.orderStats.pending')}
                  </span>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {stats.orders.pending}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {t('admin.finance.orderStats.cancelled')}
                  </span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {stats.orders.cancelled}
                </span>
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>

      {/* Section Solde Admin avec Dons et Retraits */}
      <AdminBalanceSection isDark={isDark} systemRevenue={stats.total_system_revenue} />

      {/* Monthly Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <CollapsibleSection
          title={t('admin.finance.monthlyRevenue.title')}
          icon={Calendar}
          iconColor="text-purple-600"
          defaultOpen={false}
        >
          <div className="space-y-3">
            {stats.monthly_stats.map((month, index) => {
              const maxRevenue = Math.max(
                ...stats.monthly_stats.map((m) => m.revenue),
              );
              const percentage = (month.revenue / maxRevenue) * 100;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {month.month}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-purple-600 font-semibold">
                        {t('admin.finance.monthlyRevenue.platform')}
                        : {formatCurrency(month.platform_share)}
                      </span>
                      <span className="text-blue-600 font-semibold">
                        {t('admin.finance.monthlyRevenue.providers')}
                        : {formatCurrency(month.provider_share)}
                      </span>
                      <span
                        className={`font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(month.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-8">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="h-full flex">
                        {/* Part Plateforme (5%) */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage * 0.05}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center"
                        >
                          {percentage * 0.05 > 2 && (
                            <span className="text-xs font-semibold text-white">
                              5%
                            </span>
                          )}
                        </motion.div>
                        {/* Part Prestataires (95%) */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage * 0.95}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center"
                        >
                          {percentage * 0.95 > 5 && (
                            <span className="text-xs font-semibold text-white">
                              95%
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs text-gray-500">
                      {month.orders_count}{" "}
                      {month.orders_count > 1
                        ? t('admin.finance.monthlyRevenue.orders')
: t('admin.finance.monthlyRevenue.order')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <CollapsibleSection
          title={t('admin.finance.globalDistribution.title')}
          icon={PieChart}
          iconColor="text-white"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl text-white">
            <div className="text-center">
              <p className="text-purple-100 text-sm mb-1">
                {t('admin.finance.globalDistribution.confirmed')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.total_system_revenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-purple-100 text-sm mb-1">
                {t('admin.finance.globalDistribution.pending')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.total_system_revenue_pending)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-purple-100 text-sm mb-1">
                {t('admin.finance.globalDistribution.refunds')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.total_refunds)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-purple-100 text-sm mb-1">
                {t('admin.finance.globalDistribution.gross')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.total_revenue_gross)}
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>
    </div>
  );
};

export default Finance;
