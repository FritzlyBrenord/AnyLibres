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
  Lock,
} from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { usePermissions } from "@/contexts/PermissionsContext";

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
  const { hasPermission } = usePermissions();

  const canViewDetails = hasPermission('withdrawals.details.view');

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
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
      processing: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: RefreshCw },
      completed: { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle },
      failed: { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle },
      cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-500', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5" />
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
        <div className={`rounded-3xl shadow-xl border overflow-hidden ${isDark ? 'bg-slate-800/40 border-white/5 backdrop-blur-sm' : 'bg-white border-slate-200'}`}>
          <div className="p-8">
            <h2 className={`text-2xl font-black mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {tAny.admin?.withdrawalManagement?.title || 'Gestion des Retraits'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-800/60 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tAny.admin?.withdrawalManagement?.stats?.pending || 'En attente'}</span>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalPending}
                </div>
                <div className={`text-sm font-bold mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                  {formatCurrency(stats.totalAmountPending)}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-800/60 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tAny.admin?.withdrawalManagement?.stats?.completed || 'Complétés'}</span>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalCompleted}
                </div>
                <div className={`text-sm font-bold mt-1 ${isDark ? 'text-green-400/80' : 'text-green-600'}`}>
                  {formatCurrency(stats.totalAmountCompleted)}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-800/60 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tAny.admin?.withdrawalManagement?.stats?.failed || 'Échoués'}</span>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'completed', 'failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter as any)}
                className={`px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  filterStatus === filter
                    ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {filter === 'all' ? (tAny.admin?.withdrawalManagement?.filters?.all || 'Tous') : (tAny.admin?.withdrawalManagement?.filters?.[filter] || filter.charAt(0).toUpperCase() + filter.slice(1))}
              </button>
            ))}
          </div>

          <button
            onClick={fetchWithdrawals}
            className={`p-3 rounded-xl transition-all shadow-sm ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-8">
        <div className={`rounded-3xl shadow-xl border overflow-hidden ${isDark ? 'bg-slate-800/40 border-white/5 backdrop-blur-sm' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-900/40' : 'bg-slate-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.provider || 'Prestataire'}
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.amount || 'Montant'}
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.method || 'Méthode'}
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.status || 'Statut'}
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tAny.admin?.withdrawalManagement?.table?.requestDate || 'Date demande'}
                  </th>
                  <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {withdrawal.provider_name}
                          </div>
                          <div className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {withdrawal.provider_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className={`text-sm font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
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
                          onClick={() => canViewDetails && handleViewDetails(withdrawal)}
                          disabled={!canViewDetails}
                          className={`p-2 rounded-lg transition-colors ${
                            !canViewDetails
                              ? 'text-gray-400 cursor-not-allowed'
                              : isDark
                              ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title={!canViewDetails ? "Permission manquante" : "Voir détails"}
                        >
                          {canViewDetails ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border ${
            isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`sticky top-0 px-8 py-6 border-b z-10 ${
              isDark ? 'bg-slate-900/80 backdrop-blur-md border-white/10' : 'bg-white/80 backdrop-blur-md border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
            <div className={`sticky bottom-0 px-8 py-6 border-t z-10 ${
              isDark ? 'bg-slate-900/80 backdrop-blur-md border-white/10' : 'bg-white/80 backdrop-blur-md border-slate-100'
            }`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`px-8 py-3 rounded-xl font-black text-sm transition-all shadow-sm ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
