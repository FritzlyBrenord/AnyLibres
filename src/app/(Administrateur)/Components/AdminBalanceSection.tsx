"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Heart,
  Download,
  DollarSign,
  Gift,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Search,
  User,
  Users,
  X,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";

interface AdminBalance {
  id: string | null;
  admin_id: string;
  available_cents: number;
  total_donated_cents: number;
  total_refunded_cents: number;
  total_withdrawn_cents?: number;
  currency: string;
  metadata?: {
    last_sync?: string;
    total_platform_fees?: number;
    total_withdrawal_fees?: number;
    total_system_fees?: number;
    total_system_revenue?: number;
  };
  needs_sync?: boolean;
}

interface Recipient {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
}

interface Donation {
  id: string;
  recipient_id: string;
  recipient_type: string;
  recipient_name: string;
  recipient_email?: string;
  amount_cents: number;
  currency: string;
  reason: string;
  created_at: string;
}

interface AdminBalanceSectionProps {
  isDark?: boolean;
  systemRevenue: number;
}

// Composant Section avec chevron
function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = false,
  isDark,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isDark?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-xl overflow-hidden ${isDark ? "border-gray-700" : "border-gray-200"}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 flex items-center justify-between transition-colors ${
          isDark ? "bg-gray-700/50 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 ${isDark ? "bg-gray-800/30" : "bg-white"}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminBalanceSection({
  isDark = false,
  systemRevenue,
}: AdminBalanceSectionProps) {
  const { language, t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal retrait
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Section Dons
  const [recipientType, setRecipientType] = useState<"client" | "provider">("client");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationReason, setDonationReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [donating, setDonating] = useState(false);

  // Historique des dons
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Synchroniser la balance avec les revenus calculés
  const syncBalance = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/admin-balance?isAdmin=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
        if (!silent) {
          setSuccess(t('admin.finance.balanceStats.syncSuccess'));
          setTimeout(() => setSuccess(""), 2000);
        }
      } else if (!silent) {
        setError(data.error || t('admin.finance.balanceStats.syncError'));
      }
    } catch (err) {
      if (!silent) setError(t('admin.finance.balanceStats.syncError'));
      console.error(err);
    } finally {
      if (!silent) setSyncing(false);
    }
  }, []);

  // Charger la balance et synchroniser automatiquement au montage
  useEffect(() => {
    const initBalance = async () => {
      setLoading(true);
      try {
        // D'abord récupérer la balance existante
        const response = await fetch("/api/admin/admin-balance?isAdmin=true");
        const data = await response.json();

        if (data.success && data.balance) {
          setBalance(data.balance);

          // Si needs_sync ou pas de dernière synchro, synchroniser automatiquement
          if (data.balance.needs_sync || !data.balance.metadata?.last_sync) {
            await syncBalance(true);
          }
        } else {
          // Pas de balance, créer et synchroniser
          await syncBalance(true);
        }
      } catch (err) {
        console.error("Error initializing balance:", err);
      } finally {
        setLoading(false);
      }
    };

    initBalance();
  }, [syncBalance]);

  // Charger l'historique des dons
  const fetchDonations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/admin/donation?limit=50&isAdmin=true");
      const data = await response.json();
      if (data.success) {
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (showPanel) {
      fetchDonations();
    }
  }, [showPanel, fetchDonations]);

  // Chercher les recipients
  useEffect(() => {
    const handleSearch = async (query: string) => {
      if (!query.trim() || query.trim().length < 2) {
        setRecipients([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `/api/admin/donation/recipients?type=${recipientType}&search=${encodeURIComponent(query)}&isAdmin=true`
        );
        const data = await response.json();
        if (data.success) {
          setRecipients(data.recipients || []);
        }
      } catch (err) {
        console.error("Error searching recipients:", err);
        setRecipients([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, recipientType]);

  // Effectuer un don
  const handleDonate = async () => {
    if (!selectedRecipient || !donationAmount || parseFloat(donationAmount) <= 0) {
      setError(t('admin.donation.errorAllFields'));
      return;
    }

    const amountCents = Math.round(parseFloat(donationAmount) * 100);

    if (balance && amountCents > balance.available_cents) {
      setError(t('admin.finance.balanceStats.withdrawInsufficientFunds'));
      return;
    }

    setDonating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/donation?isAdmin=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: selectedRecipient.id,
          recipient_type: recipientType,
          amount_cents: amountCents,
          reason: donationReason || t('admin.donation.reasonDefault', { type: recipientType === 'client' ? t('admin.donation.client') : t('admin.donation.provider') }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const recipientName = selectedRecipient.display_name ||
          [selectedRecipient.first_name, selectedRecipient.last_name].filter(Boolean).join(" ") ||
          selectedRecipient.email;

        setSuccess(t('admin.donation.successWithDetails', { 
          amount: formatAmount(parseFloat(donationAmount)), 
          name: recipientName 
        }));
        setDonationAmount("");
        setDonationReason("");
        setSelectedRecipient(null);
        setSearchQuery("");
        setRecipients([]);

        // Recharger la balance et l'historique
        await syncBalance(true);
        fetchDonations();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || t('admin.donation.errorGeneric'));
      }
    } catch (err) {
      setError(t('admin.donation.errorGeneric'));
      console.error(err);
    } finally {
      setDonating(false);
    }
  };

  // Effectuer un retrait
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError(t('admin.finance.balanceStats.withdrawInvalidAmount'));
      return;
    }

    const amountCents = Math.round(parseFloat(withdrawAmount) * 100);

    if (balance && amountCents > balance.available_cents) {
      setError(t('admin.finance.balanceStats.withdrawInsufficientFunds'));
      return;
    }

    setWithdrawing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/admin-balance?isAdmin=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          amount_cents: amountCents,
          reason: withdrawReason || t('admin.finance.balanceStats.withdrawDefaultReason'),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
        setSuccess(t('admin.finance.balanceStats.withdrawSuccess', { amount: formatAmount(parseFloat(withdrawAmount)) }));
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawReason("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || t('admin.finance.balanceStats.withdrawError'));
      }
    } catch (err) {
      setError(t('admin.finance.balanceStats.withdrawError'));
      console.error(err);
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return formatAmount(cents / 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('admin.finance.balanceStats.neverSynced');
    const locales = { fr: 'fr-FR', en: 'en-US', es: 'es-ES' };
    return new Date(dateStr).toLocaleDateString(locales[language] || 'fr-FR', {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      } rounded-2xl shadow-lg border overflow-hidden mb-8`}
    >
      {/* Header avec toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowPanel(!showPanel)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowPanel(!showPanel);
          }
        }}
        className={`w-full p-6 flex items-center justify-between transition-colors cursor-pointer ${
          isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {t('admin.finance.balanceStats.cardTitle')}
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {t('admin.finance.balanceStats.cardSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Aperçu rapide du solde */}
          {!loading && balance && (
            <div className="text-right mr-4">
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {t('admin.finance.balanceStats.availableBalance')}
              </p>
              <p className={`text-2xl font-bold ${
                balance.available_cents > 0 ? "text-green-500" : isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                {showBalance ? formatCurrency(balance.available_cents) : "••••••"}
              </p>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBalance(!showBalance);
            }}
            className={`p-2 rounded-lg ${isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
          >
            {showBalance ? (
              <EyeOff className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
            ) : (
              <Eye className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
            )}
          </button>

          {showPanel ? (
            <ChevronUp className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
          ) : (
            <ChevronDown className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
          )}
        </div>
      </div>

      {/* Contenu du panneau */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-6 pt-0 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-4 mt-4 p-4 rounded-lg flex items-center gap-3 ${
                      isDark ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                    <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
                    <button onClick={() => setError("")} className="ml-auto">
                      <X className={`w-4 h-4 ${isDark ? "text-red-400" : "text-red-600"}`} />
                    </button>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-4 mt-4 p-4 rounded-lg flex items-center gap-3 ${
                      isDark ? "bg-green-900/30 border border-green-800" : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                    <p className={`text-sm ${isDark ? "text-green-300" : "text-green-700"}`}>{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {/* Section Statistiques */}
                  <CollapsibleSection
                    title={t('admin.finance.balanceStats.title')}
                    icon={DollarSign}
                    iconColor="text-green-500"
                    defaultOpen={true}
                    isDark={isDark}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Solde Disponible */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{t('admin.finance.balanceStats.available')}</p>
                        </div>
                        <p className={`text-xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                          {showBalance ? formatCurrency(balance?.available_cents || 0) : "••••••"}
                        </p>
                      </div>

                      {/* Total Dons */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-pink-900/20 border-pink-800" : "bg-pink-50 border-pink-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className={`w-4 h-4 ${isDark ? "text-pink-400" : "text-pink-600"}`} />
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{t('admin.finance.balanceStats.donated')}</p>
                        </div>
                        <p className={`text-xl font-bold ${isDark ? "text-pink-400" : "text-pink-600"}`}>
                          {showBalance ? formatCurrency(balance?.total_donated_cents || 0) : "••••••"}
                        </p>
                      </div>

                      {/* Total Remboursé */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-orange-900/20 border-orange-800" : "bg-orange-50 border-orange-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{t('admin.finance.balanceStats.refunded')}</p>
                        </div>
                        <p className={`text-xl font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                          {showBalance ? formatCurrency(balance?.total_refunded_cents || 0) : "••••••"}
                        </p>
                      </div>

                      {/* Total Retiré */}
                      <div className={`p-4 rounded-xl border ${
                        isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Download className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{t('admin.finance.balanceStats.withdrawn')}</p>
                        </div>
                        <p className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                          {showBalance ? formatCurrency(balance?.total_withdrawn_cents || 0) : "••••••"}
                        </p>
                      </div>
                    </div>

                    {/* Info dernière synchro + boutons */}
                    <div className={`flex items-center justify-between mt-4 p-3 rounded-lg ${
                      isDark ? "bg-gray-700/50" : "bg-gray-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {t('admin.finance.balanceStats.syncedAt')} {formatDate(balance?.metadata?.last_sync)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => syncBalance(false)}
                          disabled={syncing}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isDark
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          } disabled:opacity-50`}
                        >
                          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          {t('admin.finance.balanceStats.sync')}
                        </button>
                        <button
                          onClick={() => setShowWithdrawModal(true)}
                          disabled={!balance || balance.available_cents <= 0}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isDark
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Download className="w-3 h-3" />
                          {t('admin.finance.balanceStats.withdraw')}
                        </button>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Section Faire un Don */}
                  <CollapsibleSection
                    title={t('admin.donation.title')}
                    icon={Heart}
                    iconColor="text-pink-500"
                    defaultOpen={false}
                    isDark={isDark}
                  >
                    <div className="space-y-4">
                      {/* Type de destinataire */}
                      <div className="flex gap-2">
                        {[
                          { value: "client", label: t('admin.donation.client'), icon: User },
                          { value: "provider", label: t('admin.donation.provider'), icon: Users },
                        ].map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                setRecipientType(type.value as "client" | "provider");
                                setSelectedRecipient(null);
                                setRecipients([]);
                                setSearchQuery("");
                              }}
                              className={`flex-1 px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all ${
                                recipientType === type.value
                                  ? "bg-purple-600 text-white"
                                  : isDark
                                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Recherche */}
                      <div className="relative">
                        <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        {searching && (
                          <Loader2 className={`absolute right-3 top-2.5 w-4 h-4 animate-spin ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        )}
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('admin.donation.searchPlaceholder')}
                          className={`w-full pl-9 pr-9 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />

                        {/* Dropdown résultats */}
                        <AnimatePresence>
                          {recipients.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 ${
                                isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                              }`}
                            >
                              {recipients.map((recipient) => (
                                <button
                                  key={recipient.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecipient(recipient);
                                    setSearchQuery("");
                                    setRecipients([]);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors border-b last:border-b-0 ${
                                    isDark
                                      ? "hover:bg-gray-600 border-gray-600"
                                      : "hover:bg-purple-50 border-gray-100"
                                  }`}
                                >
                                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {recipient.display_name ||
                                      [recipient.first_name, recipient.last_name].filter(Boolean).join(" ") ||
                                      recipient.email}
                                  </p>
                                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    {recipient.email}
                                  </p>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Destinataire sélectionné */}
                      {selectedRecipient && (
                        <div className={`p-3 rounded-lg border flex items-center justify-between ${
                          isDark ? "bg-purple-900/30 border-purple-700" : "bg-purple-50 border-purple-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            {recipientType === "client" ? (
                              <User className={`w-4 h-4 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                            ) : (
                              <Users className={`w-4 h-4 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                {selectedRecipient.display_name ||
                                  [selectedRecipient.first_name, selectedRecipient.last_name].filter(Boolean).join(" ") ||
                                  selectedRecipient.email}
                              </p>
                              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {selectedRecipient.email}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedRecipient(null)}>
                            <X className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                          </button>
                        </div>
                      )}

                      {/* Montant et raison */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          placeholder={t('admin.donation.amount')}
                          className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                        <input
                          type="text"
                          value={donationReason}
                          onChange={(e) => setDonationReason(e.target.value)}
                          placeholder={t('admin.donation.reason')}
                          className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>

                      {/* Bouton envoyer */}
                      <button
                        onClick={handleDonate}
                        disabled={donating || !selectedRecipient || !donationAmount || parseFloat(donationAmount) <= 0}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                      >
                        {donating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                        {t('admin.donation.send')}
                      </button>
                    </div>
                  </CollapsibleSection>

                  {/* Section Historique des Dons */}
                  <CollapsibleSection
                    title={t('admin.donation.historyTitle')}
                    icon={History}
                    iconColor="text-purple-500"
                    defaultOpen={false}
                    isDark={isDark}
                  >
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                      </div>
                    ) : donations.length === 0 ? (
                      <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <Heart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t('admin.donation.noHistory')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {donations.map((donation) => (
                          <div
                            key={donation.id}
                            className={`p-3 rounded-lg border ${
                              isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {donation.recipient_type === "client" ? (
                                  <User className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                ) : (
                                  <Users className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                                )}
                                <div>
                                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {donation.recipient_name}
                                  </p>
                                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                    {formatDate(donation.created_at)}
                                  </p>
                                </div>
                              </div>
                              <p className={`font-bold text-green-500`}>
                                +{formatCurrency(donation.amount_cents)}
                              </p>
                            </div>
                            {donation.reason && (
                              <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {donation.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Retrait */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full rounded-2xl shadow-2xl ${
                isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
              } p-6`}
            >
              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                {t('admin.finance.balanceStats.withdrawModalTitle')}
              </h3>

              <div className={`mb-4 p-4 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t('admin.finance.balanceStats.availableBalance')}</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(balance?.available_cents || 0)}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(balance?.available_cents || 0) / 100}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={t('admin.finance.balanceStats.withdrawAmountLabel')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
                <input
                  type="text"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder={t('admin.finance.balanceStats.withdrawReasonLabel')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t('admin.finance.balanceStats.cancel')}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t('admin.finance.balanceStats.withdraw')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
