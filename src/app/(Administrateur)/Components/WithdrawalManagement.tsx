"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
} from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';

interface Withdrawal {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_email: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  payment_details: any;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface WithdrawalManagementProps {
  isDark: boolean;
}

export default function WithdrawalManagement({ isDark }: WithdrawalManagementProps) {
  const { t } = useLanguageContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = t as Record<string, any>;

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPending: 0,
    totalProcessing: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalAmountPending: 0,
    totalAmountCompleted: 0,
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawals');
      const data = await response.json();

      if (data.success) {
        setWithdrawals(data.data || []);
        calculateStats(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (withdrawalsData: Withdrawal[]) => {
    const stats = withdrawalsData.reduce((acc, withdrawal) => {
      if (withdrawal.status === 'pending') {
        acc.totalPending++;
        acc.totalAmountPending += withdrawal.amount_cents;
      } else if (withdrawal.status === 'processing') {
        acc.totalProcessing++;
      } else if (withdrawal.status === 'completed') {
        acc.totalCompleted++;
        acc.totalAmountCompleted += withdrawal.amount_cents;
      } else if (withdrawal.status === 'failed') {
        acc.totalFailed++;
      }
      return acc;
    }, {
      totalPending: 0,
      totalProcessing: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalAmountPending: 0,
      totalAmountCompleted: 0,
    });

    setStats(stats);
  };

  const { language } = useLanguageContext();
  const { convertFromUSD, formatAmount } = useCurrency();

  const formatCurrency = (cents: number, currency: string = 'USD') => {
    // Les retraits sont stockés en cents USD.
    // On convertit d'abord en USD (unité), puis vers la devise par défaut.
    return formatAmount(convertFromUSD(cents / 100));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const locale = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', icon: Clock },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', icon: RefreshCw },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: CheckCircle },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: XCircle },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-400', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {tAny.admin?.withdrawalManagement?.status?.[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewDetails = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesSearch =
      withdrawal.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.provider_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || withdrawal.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header & Stats */}
      <div className="p-6">
        <div className={`rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6">
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {tAny.admin?.withdrawalManagement?.title || 'Gestion des Retraits'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.withdrawalManagement?.stats?.pending || 'En attente'}</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalPending}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatCurrency(stats.totalAmountPending)}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.withdrawalManagement?.stats?.completed || 'Complétés'}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalCompleted}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatCurrency(stats.totalAmountCompleted)}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tAny.admin?.withdrawalManagement?.stats?.failed || 'Échoués'}</span>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalFailed}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={tAny.admin?.withdrawalManagement?.search || "Rechercher par nom ou email..."}
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
            {['all', 'pending', 'completed', 'failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter as any)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filterStatus === filter
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? (tAny.admin?.withdrawalManagement?.filters?.all || 'Tous') : (tAny.admin?.withdrawalManagement?.filters?.[filter] || filter.charAt(0).toUpperCase() + filter.slice(1))}
              </button>
            ))}
          </div>

          <button
            onClick={fetchWithdrawals}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.provider || 'Prestataire'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.amount || 'Montant'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.method || 'Méthode'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.status || 'Statut'}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.requestDate || 'Date demande'}
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.actions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {tAny.admin?.withdrawalManagement?.table?.noResults || 'Aucun retrait trouvé'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {withdrawal.provider_name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {withdrawal.provider_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(withdrawal.amount_cents, withdrawal.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {withdrawal.payment_method || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatDate(withdrawal.requested_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de détails du retrait */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Header */}
            <div className={`sticky top-0 px-6 py-4 border-b ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tAny.admin?.withdrawalManagement?.modal?.title || 'Détails du retrait'}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Informations du prestataire */}
              <div>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {tAny.admin?.withdrawalManagement?.modal?.providerInfo || 'Informations du prestataire'}
                </h4>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nom</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedWithdrawal.provider_name}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedWithdrawal.provider_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du retrait */}
              <div>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {tAny.admin?.withdrawalManagement?.modal?.withdrawalDetails || 'Détails du retrait'}
                </h4>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Montant</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(selectedWithdrawal.amount_cents, selectedWithdrawal.currency)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Statut</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedWithdrawal.status)}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Méthode de paiement</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedWithdrawal.payment_method || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Devise</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedWithdrawal.currency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails de paiement */}
              {selectedWithdrawal.payment_details && (
                <div>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Détails de paiement
                  </h4>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <pre className={`text-sm overflow-x-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {JSON.stringify(selectedWithdrawal.payment_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Historique
                </h4>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Demandé le
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(selectedWithdrawal.requested_at)}
                      </span>
                    </div>

                    {selectedWithdrawal.processed_at && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Traité le
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(selectedWithdrawal.processed_at)}
                        </span>
                      </div>
                    )}

                    {selectedWithdrawal.completed_at && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Complété le
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(selectedWithdrawal.completed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedWithdrawal.notes && (
                <div>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </h4>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedWithdrawal.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`sticky bottom-0 px-6 py-4 border-t ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tAny.admin?.withdrawalManagement?.modal?.close || 'Fermer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
