// ============================================================================
// Component: BalanceManagement - Gestion des soldes providers
// Contrôle total admin sur les soldes (pending, available, frozen)
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Zap,
  Timer,
  Settings,
  TrendingDown,
} from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';

import { usePermissions } from '@/contexts/PermissionsContext';

interface ProviderBalance {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_email: string;
  available_cents: number;
  pending_cents: number;
  withdrawn_cents: number;
  total_earned_cents: number;
  donations_received_cents?: number; // Dons reçus de l'admin
  currency: string;
  last_withdrawal_at: string | null;
  created_at: string;
  Account_gele?: boolean; // 🆕 Nouveau champ pour geler le compte
  is_frozen?: boolean; // Garde pour compatibilité (alias de Account_gele)
  custom_withdra_qty?: number | null; // 🆕 Limite personnalisée de retraits par jour
}

interface BalanceManagementProps {
  isDark: boolean;
}

export default function BalanceManagement({ isDark }: BalanceManagementProps) {
  const { t } = useLanguageContext();
  const { convertFromUSD, formatAmount } = useCurrency();
  const { hasPermission } = usePermissions();
  
  const canRelease = hasPermission('finance.balances.release');
  const canFreeze = hasPermission('finance.balances.freeze');
  const canViewHistory = hasPermission('finance.balances.view_history');
  const canEditLimits = hasPermission('finance.balances.edit_limits');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = t as Record<string, any>;

  const [balances, setBalances] = useState<ProviderBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'available' | 'frozen'>('all');
  const [selectedBalance, setSelectedBalance] = useState<ProviderBalance | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showResetTimerModal, setShowResetTimerModal] = useState(false);
  const [showCustomLimitModal, setShowCustomLimitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyData, setHistoryData] = useState<{
    balance: {
      available: number;
      pending: number;
      withdrawn: number;
      total_earned: number;
      currency: string;
    } | null;
    transactions: {
      id: string;
      date: string;
      type: 'earning' | 'withdrawal';
      amount: number;
      status: string;
      description: string;
    }[];
  } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalPending: 0,
    totalWithdrawn: 0,
    totalProviders: 0,
    frozenAccounts: 0,
  });

  // Nouvelle fonction: Libération automatique au chargement de la page
  const autoReleaseFunds = async () => {
    try {
      console.log('🚀 Déclenchement de la libération automatique (MODE SIMPLE)...');
      console.log('📍 URL appelée: /api/auto-release-funds-simple');

      // Utiliser l'API simplifiée qui fonctionne mieux
      const autoReleaseResponse = await fetch('/api/auto-release-funds-simple', {
        method: 'GET',
      });

      console.log('📡 Réponse reçue, status:', autoReleaseResponse.status);

      const autoReleaseData = await autoReleaseResponse.json();
      console.log('📦 Données reçues:', JSON.stringify(autoReleaseData, null, 2));

      if (autoReleaseData.success) {
        console.log('✅ Libération automatique terminée:', autoReleaseData.summary);

        // Si des fonds ont été libérés, afficher une notification
        if (autoReleaseData.summary.released > 0) {
          console.log(`🎉 ${autoReleaseData.summary.released} provider(s) libéré(s) automatiquement!`);
          alert(`${autoReleaseData.summary.released} ${tAny.admin?.balanceManagement?.alerts?.autoReleaseSuccess || 'provider(s) ont eu leurs fonds libérés automatiquement!'}`);
        } else if (autoReleaseData.summary.failed > 0) {
          console.error('❌ Échecs:', autoReleaseData.summary.failed);
          alert(`${autoReleaseData.summary.failed} ${tAny.admin?.balanceManagement?.alerts?.autoReleaseFailed || 'provider(s) ont échoué lors de la libération automatique.'}`);
        } else {
          console.log('ℹ️ Aucun pending à libérer');
        }
      } else {
        console.error('❌ API returned error:', autoReleaseData.error);
        alert(`${tAny.admin?.balanceManagement?.alerts?.operationError || 'Erreur'}: ${autoReleaseData.error}`);
      }
    } catch (error) {
      console.error('💥 Exception lors de l\'auto-release:', error);
      alert(`${tAny.admin?.balanceManagement?.alerts?.operationError || 'Erreur critique'}: ${error}`);
    } finally {
      // Charger les balances après (qu'il y ait eu libération ou non)
      console.log('🔄 Rechargement des balances...');
      fetchBalances();
    }
  };

  // Appel automatique au montage du composant
  useEffect(() => {
    console.log('⚡ Component mounted - Déclenchement auto-release...');
    autoReleaseFunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Tableau vide = exécuté une seule fois au montage

  const [platformSettings, setPlatformSettings] = useState<any>(null); // 🆕 Platform settings

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/balances');
      const data = await response.json();
      if (data.success) {
        setBalances(data.data || []);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Erreur charger balances:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Fetch platform settings
  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch('/api/admin/platform-settings?isAdmin=true');
      const data = await response.json();
      if (data.success) {
        setPlatformSettings(data.data.settings);
      }
    } catch (error) {
      console.error('Erreur charger settings:', error);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchPlatformSettings();
  }, []);

  const calculateStats = (balancesData: ProviderBalance[]) => {
    const stats = balancesData.reduce((acc, balance) => {
      acc.totalAvailable += balance.available_cents;
      acc.totalPending += balance.pending_cents;
      acc.totalWithdrawn += balance.withdrawn_cents;
      acc.totalProviders++;
      // Vérifier Account_gele OU is_frozen pour compatibilité
      if (balance.Account_gele || balance.is_frozen) acc.frozenAccounts++;
      return acc;
    }, {
      totalAvailable: 0,
      totalPending: 0,
      totalWithdrawn: 0,
      totalProviders: 0,
      frozenAccounts: 0,
    });

    setStats(stats);
  };

  const { language } = useLanguageContext();
  const formatCurrency = (cents: number, currency: string = 'USD') => {
    // Les montants sont stockés en USD (cents).
    // On convertit d'abord en USD (unité), puis vers la devise par défaut.
    return formatAmount(convertFromUSD(cents / 100));
  };

  const releaseFunds = async (providerId: string, amount?: number) => {
    try {
      const response = await fetch('/api/admin/balances/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          amount_cents: amount, // Si undefined, libère tout
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchBalances();
        setShowReleaseModal(false);
        setSelectedBalance(null);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
    }
  };

  const freezeAccount = async (providerId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/balances/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchBalances();
        setShowFreezeModal(false);
        setSelectedBalance(null);
      }
    } catch (error) {
      console.error('Error freezing account:', error);
    }
  };

  const fetchHistory = async (providerId: string) => {
    try {
      setLoadingHistory(true);
      setShowHistoryModal(true);
      const response = await fetch(`/api/admin/balances/${providerId}/history`);
      const data = await response.json();
      if (data.success) {
        setHistoryData(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredBalances = balances.filter(balance => {
    const matchesSearch =
      balance.provider_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      balance.provider_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && balance.pending_cents > 0) ||
      (filterStatus === 'available' && balance.available_cents > 0) ||
      (filterStatus === 'frozen' && (balance.Account_gele || balance.is_frozen));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {tAny.admin?.balanceManagement?.title || 'Gestion des Soldes'}
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {tAny.admin?.balanceManagement?.subtitle || 'Contrôle total sur les soldes des providers'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchBalances()}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
              >
                <Download className="w-4 h-4" />
                {tAny.admin?.balanceManagement?.buttons?.export || 'Exporter'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.balanceManagement?.stats?.availableTotal || 'Disponible Total'}</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(stats.totalAvailable)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.balanceManagement?.stats?.pending || 'En Attente'}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(stats.totalPending)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.balanceManagement?.stats?.withdrawnTotal || 'Retiré Total'}</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(stats.totalWithdrawn)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.balanceManagement?.stats?.providers || 'Providers'}</span>
                <CheckCircle className="w-4 h-4 text-purple-500" />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalProviders}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.balanceManagement?.stats?.frozenAccounts || 'Comptes Gelés'}</span>
                <Lock className="w-4 h-4 text-red-500" />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.frozenAccounts}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={tAny.admin?.balanceManagement?.search || "Rechercher par nom ou email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'available', 'frozen'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter as any)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filterStatus === filter
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {filter === 'all' && (tAny.admin?.balanceManagement?.filters?.all || 'Tous')}
                {filter === 'pending' && (tAny.admin?.balanceManagement?.filters?.pending || 'En attente')}
                {filter === 'available' && (tAny.admin?.balanceManagement?.filters?.available || 'Disponible')}
                {filter === 'frozen' && (tAny.admin?.balanceManagement?.filters?.frozen || 'Gelés')}
              </button>
            ))}
          </div>
        </div>

        {/* Balances Table */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.provider || 'Provider'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.available || 'Disponible'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.pending || 'En Attente'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.withdrawn || 'Retiré'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.totalEarned || 'Total Gagné'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.donationsReceived || 'Dons Reçus'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.status || 'Statut'}
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.balanceManagement?.table?.actions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {tAny.admin?.balanceManagement?.table?.noResults || 'Aucun solde trouvé'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((balance) => (
                    <tr key={balance.id} className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {balance.provider_name || 'N/A'}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {balance.provider_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${balance.available_cents > 0 ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(balance.available_cents, balance.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${balance.pending_cents > 0 ? 'text-amber-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(balance.pending_cents, balance.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatCurrency(balance.withdrawn_cents, balance.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(balance.total_earned_cents, balance.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${(balance.donations_received_cents || 0) > 0 ? 'text-pink-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(balance.donations_received_cents || 0, balance.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(balance.Account_gele || balance.is_frozen) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <Lock className="w-3 h-3" />
                            {tAny.admin?.balanceManagement?.table?.frozen || 'Gelé'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            {tAny.admin?.balanceManagement?.table?.active || 'Actif'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              setShowReleaseModal(true);
                            }}
                            disabled={balance.pending_cents === 0 || !canRelease}
                            className={`p-2 rounded-lg transition-colors ${
                              (balance.pending_cents > 0 && canRelease)
                                ? isDark
                                  ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                : isDark
                                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={!canRelease ? "Permission manquante" : "Libérer fonds"}
                          >
                            <Unlock className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              setShowFreezeModal(true);
                            }}
                            disabled={!canFreeze}
                            className={`p-2 rounded-lg transition-colors ${
                              !canFreeze ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isDark
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={!canFreeze ? "Permission manquante" : (balance.Account_gele || balance.is_frozen) ? 'Dégeler' : 'Geler'}
                          >
                            {(balance.Account_gele || balance.is_frozen) ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              setShowAdjustModal(true);
                            }}
                            disabled={!canEditLimits}
                            className={`p-2 rounded-lg transition-colors ${
                              !canEditLimits ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isDark
                                ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title="Ajuster solde"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              setShowResetTimerModal(true);
                            }}
                            disabled={!canEditLimits}
                            className={`p-2 rounded-lg transition-colors ${
                              !canEditLimits ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isDark
                                ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                            title="Réinitialiser timer 24h"
                          >
                            <Timer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              setShowCustomLimitModal(true);
                            }}
                            disabled={!canEditLimits}
                            className={`p-2 rounded-lg transition-colors ${
                              !canEditLimits ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isDark
                                ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}
                            title="Limite personnalisée"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBalance(balance);
                              fetchHistory(balance.provider_id);
                            }}
                            disabled={!canViewHistory}
                            className={`p-2 rounded-lg transition-colors ${
                              !canViewHistory ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isDark
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Libérer fonds manuellement */}
      {showReleaseModal && selectedBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tAny.admin?.balanceManagement?.actions?.releaseFunds || 'Libérer les fonds'}
                </h3>
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  ✕
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  Prestataire: <span className="font-medium">{selectedBalance.provider_name}</span>
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Montant en attente: <span className="font-bold text-amber-500">
                    {formatCurrency(selectedBalance.pending_cents, selectedBalance.currency)}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant à libérer
                </label>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Laissez vide pour libérer tout le montant en attente
                </p>
                <input
                  type="number"
                  id="release-amount"
                  placeholder={`Max: ${(selectedBalance.pending_cents / 100).toFixed(2)}`}
                  step="0.01"
                  min="0"
                  max={selectedBalance.pending_cents / 100}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tAny.admin?.balanceManagement?.modals?.customLimit?.cancel || 'Annuler'}
                </button>
                <button
                  onClick={async () => {
                    const input = document.getElementById('release-amount') as HTMLInputElement;
                    const amountEur = input.value ? parseFloat(input.value) : null;
                    const amountCents = amountEur ? Math.round(amountEur * 100) : null;

                    try {
                      const response = await fetch('/api/admin/balances/release', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          provider_id: selectedBalance.provider_id,
                          amount_cents: amountCents
                        })
                      });

                      const data = await response.json();

                      if (data.success) {
                        alert(`✅ ${data.message}`);
                        setShowReleaseModal(false);
                        fetchBalances(); // Recharger les données
                      } else {
                        alert(`❌ Erreur: ${data.error}`);
                      }
                    } catch (error) {
                      console.error('Erreur lors de la libération:', error);
                      alert('❌ Erreur lors de la libération des fonds');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Unlock className="w-4 h-4" />
                    {tAny.admin?.balanceManagement?.actions?.releaseFunds || 'Libérer'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Geler/Dégeler compte */}
      {showFreezeModal && selectedBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(selectedBalance.Account_gele || selectedBalance.is_frozen) 
                    ? (tAny.admin?.balanceManagement?.modals?.freeze?.unfreezeTitle || '🔓 Dégeler le compte') 
                    : (tAny.admin?.balanceManagement?.modals?.freeze?.title || '🔒 Geler le compte')}
                </h3>
                <button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  ✕
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  Prestataire: <span className="font-medium">{selectedBalance.provider_name}</span>
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Solde disponible: <span className="font-bold text-green-500">
                    {formatCurrency(selectedBalance.available_cents, selectedBalance.currency)}
                  </span>
                </p>
              </div>

              {!(selectedBalance.Account_gele || selectedBalance.is_frozen) && (
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tAny.admin?.balanceManagement?.modals?.freeze?.reasonLabel || 'Raison du gel *'}
                  </label>
                  <textarea
                    id="freeze-reason"
                    rows={4}
                    placeholder="Ex: Fraude suspectée, Litige client, Documents manquants..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none`}
                  ></textarea>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ⚠️ {tAny.admin?.balanceManagement?.modals?.freeze?.warning || 'Le provider ne pourra plus effectuer de retraits tant que le compte est gelé'}
                  </p>
                </div>
              )}

              {(selectedBalance.Account_gele || selectedBalance.is_frozen) && (
                <div className="mb-6">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                      ⚠️ Ce compte est actuellement gelé
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-500 mt-2">
                      Le dégeler permettra au provider de nouveau effectuer des retraits
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tAny.admin?.balanceManagement?.modals?.freeze?.cancel || 'Annuler'}
                </button>
                <button
                  onClick={async () => {
                    const reasonInput = document.getElementById('freeze-reason') as HTMLTextAreaElement;
                    const reason = reasonInput?.value || 'Action administrative';

                    const isFrozen = selectedBalance.Account_gele || selectedBalance.is_frozen;

                    if (!isFrozen && !reasonInput?.value?.trim()) {
                      alert('⚠️ Veuillez indiquer une raison pour le gel');
                      return;
                    }

                    try {
                      const response = await fetch('/api/admin/balances/freeze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          provider_id: selectedBalance.provider_id,
                          freeze: !isFrozen, // Inverse l'état actuel
                          reason: isFrozen ? 'Dégel administratif' : reason,
                        })
                      });

                      const data = await response.json();

                      if (data.success) {
                        alert(`✅ ${data.message}`);
                        setShowFreezeModal(false);
                        setSelectedBalance(null);
                        fetchBalances(); // Recharger les données
                      } else {
                        alert(`❌ Erreur: ${data.error}`);
                      }
                    } catch (error) {
                      console.error('Erreur lors du gel/dégel:', error);
                      alert('❌ Erreur lors de l\'opération');
                    }
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    (selectedBalance.Account_gele || selectedBalance.is_frozen)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {(selectedBalance.Account_gele || selectedBalance.is_frozen) ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        {tAny.admin?.balanceManagement?.modals?.freeze?.unfreezeButton || 'Dégeler'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        {tAny.admin?.balanceManagement?.modals?.freeze?.freezeButton || 'Geler'}
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Réinitialiser Timer 24h */}
      {showResetTimerModal && selectedBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ⏱️ Réinitialiser le Timer de 24h
                </h3>
                <button
                  onClick={() => {
                    setShowResetTimerModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  ✕
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  Prestataire: <span className="font-medium">{selectedBalance.provider_name}</span>
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Email: <span className="font-medium">{selectedBalance.provider_email}</span>
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-400">
                    ⚠️ Action importante
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-500 mt-2">
                    Cette action va réinitialiser le compteur de retraits des dernières 24h pour ce provider.
                    Il pourra effectuer un nouveau retrait immédiatement.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResetTimerModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/withdrawals/reset-timer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          provider_ids: [selectedBalance.provider_id],
                        })
                      });

                      const data = await response.json();

                      if (data.success) {
                        alert(`✅ ${data.message}`);
                        setShowResetTimerModal(false);
                        setSelectedBalance(null);
                        fetchBalances();
                      } else {
                        alert(`❌ Erreur: ${data.error}`);
                      }
                    } catch (error) {
                      console.error('Erreur lors de la réinitialisation:', error);
                      alert('❌ Erreur lors de la réinitialisation du timer');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4" />
                    {tAny.admin?.balanceManagement?.modals?.resetTimer?.resetButton || 'Réinitialiser'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Limite Personnalisée */}
      {showCustomLimitModal && selectedBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Limite Personnalisée de Retraits
                </h3>
                <button
                  onClick={() => {
                    setShowCustomLimitModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  ✕
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  Prestataire: <span className="font-medium">{selectedBalance.provider_name}</span>
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Limite actuelle: <span className="font-bold text-amber-500">
                    {selectedBalance.custom_withdra_qty !== null && selectedBalance.custom_withdra_qty !== undefined
                      ? `${selectedBalance.custom_withdra_qty} retrait(s)/jour (Personnalisé)`
                      : 'Limite globale (1 retrait/jour)'}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nouvelle limite de retraits par jour
                </label>
                <input
                  type="number"
                  id="custom-limit-input"
                  placeholder="Ex: 3"
                  min="1"
                  max="100"
                  defaultValue={selectedBalance.custom_withdra_qty || ''}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                   💡 Laissez vide pour utiliser la limite globale ({platformSettings?.withdra_qty || 1} retrait(s)/jour)
                 </p>
               </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCustomLimitModal(false);
                    setSelectedBalance(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const input = document.getElementById('custom-limit-input') as HTMLInputElement;
                    const customLimit = input.value ? parseInt(input.value) : null;

                    if (customLimit !== null && (customLimit < 1 || customLimit > 100)) {
                      alert('⚠️ La limite doit être entre 1 et 100');
                      return;
                    }

                    try {
                      const response = await fetch('/api/admin/balances/set-withdrawal-limit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          provider_id: selectedBalance.provider_id,
                          custom_limit: customLimit,
                        })
                      });

                      const data = await response.json();

                      if (data.success) {
                        alert(`✅ ${data.message}`);
                        setShowCustomLimitModal(false);
                        setSelectedBalance(null);
                        fetchBalances();
                      } else {
                        alert(`❌ Erreur: ${data.error}`);
                      }
                    } catch (error) {
                      console.error('Erreur lors de la configuration:', error);
                      alert('❌ Erreur lors de la configuration de la limite');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" />
                    Enregistrer
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Historique des Transactions */}
      {showHistoryModal && selectedBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] flex flex-col rounded-xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tAny.admin?.balanceManagement?.modals?.history?.title || 'Historique des Transactions'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedBalance.provider_name} ({selectedBalance.provider_email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedBalance(null);
                  setHistoryData(null);
                }}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Chargement de l'historique...</p>
                </div>
              ) : historyData ? (
                <>
                  {/* Résumé du solde dans le modal */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                      <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-green-700'}`}>Disponible</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-green-600'}`}>
                        {formatAmount(convertFromUSD(historyData.balance?.available || 0))}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-amber-50'}`}>
                      <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-amber-700'}`}>En attente</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-amber-600'}`}>
                        {formatAmount(convertFromUSD(historyData.balance?.pending || 0))}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                      <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Total Gagné</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-blue-600'}`}>
                        {formatAmount(convertFromUSD(historyData.balance?.total_earned || 0))}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-red-50'}`}>
                      <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-red-700'}`}>Total Retiré</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-red-600'}`}>
                        {formatAmount(convertFromUSD(historyData.balance?.withdrawn || 0))}
                      </p>
                    </div>
                  </div>

                  {/* Liste des transactions */}
                  <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                    <table className="w-full text-left border-collapse">
                      <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date & Heure</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Transaction</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500 text-center">Statut</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {historyData.transactions.length > 0 ? (
                          historyData.transactions.map((tx) => (
                            <tr key={tx.id} className={isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-3 text-sm">
                                <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                                  {new Date(tx.date).toLocaleDateString('fr-FR')}
                                </span>
                                <span className="block text-xs text-gray-500 uppercase">
                                  {new Date(tx.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  {tx.type === 'earning' ? (
                                    <div className="p-1 rounded bg-green-100 text-green-600">
                                      <TrendingUp className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="p-1 rounded bg-red-100 text-red-600">
                                      <TrendingDown className="w-3 h-3" />
                                    </div>
                                  )}
                                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {tx.description}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                                  tx.status === 'completed' || tx.status === 'succeeded'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : tx.status === 'failed' || tx.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm font-bold text-right ${
                                tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {tx.amount > 0 ? '+' : ''}{formatAmount(convertFromUSD(tx.amount))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-gray-500 italic">
                              Aucune transaction trouvée pour ce prestataire
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-red-500">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p>Erreur lors de la récupération des données.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedBalance(null);
                  setHistoryData(null);
                }}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition-colors`}
              >
                {tAny.admin?.balanceManagement?.modals?.history?.close || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
