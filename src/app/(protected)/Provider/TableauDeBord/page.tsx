"use client";

import { useState, useEffect, useMemo } from "react";
import { convertFromUSD, convertToUSD } from "@/utils/lib/currencyConversion";
import {
  MessageSquare,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Package,
  DollarSign,
  ArrowRight,
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Mail,
  Send,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import ActiveOrdersSection from "@/components/provider/ActiveOrdersSection";
import PaymentMethodCard from "@/components/provider/PaymentMethodCard";
import AddPaymentMethodModal from "@/components/provider/AddPaymentMethodModal";
import WithdrawalModal from "@/components/provider/WithdrawalModal";
import { useConversations } from "@/hooks/useConversations";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

// Types
interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  is_default: boolean;
  verified: boolean;
}

interface ReviewsStats {
  total_reviews: number;
  average_rating: number;
  with_response: number;
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
    let isMounted = true;
    const convert = async () => {
      console.log('[TableauDeBord ConvertedAmount] 🔍 Conversion demandée:', {
        amountCents,
        amountUSD: amountCents / 100,
        selectedCurrency
      });

      if (selectedCurrency === 'USD') {
        if (isMounted) setDisplayAmount(amountCents / 100);
        return;
      }

      const converted = await convertFromUSD(amountCents / 100, selectedCurrency);

      console.log('[TableauDeBord ConvertedAmount] 💱 Résultat conversion:', {
        amountUSD: amountCents / 100,
        selectedCurrency,
        converted
      });

      if (isMounted) {
        if (converted !== null) {
          setDisplayAmount(converted);
        } else {
          console.error('[TableauDeBord ConvertedAmount] ❌ Conversion échouée - utilisation du montant USD');
        }
      }
    };
    
    convert();
    
    return () => {
      isMounted = false;
    };
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

export default function ProviderDashboard() {
  const { t } = useSafeLanguage();
  const td = t.providerDashboard;
  const { user, loading } = useAuth();
  const router = useRouter();
  const { conversations, loading: conversationsLoading } = useConversations();

  const [showBalance, setShowBalance] = useState(true);
  const [isProvider, setIsProvider] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Charger la devise sélectionnée et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    console.log('[TableauDeBord] 🔍 Devise chargée depuis localStorage:', savedCurrency);

    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      console.log('[TableauDeBord] 💱 Changement de devise détecté:', event.detail.code);
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  // États pour les gains
  const [earnings, setEarnings] = useState({
    available_cents: 0,
    pending_cents: 0,
    total_earned_cents: 0,
    withdrawn_cents: 0,
    currency: "EUR",
    last_withdrawal_at: null as string | null,
    Account_gele: false, // 🆕 Statut du compte gelé
  });

  // Reviews stats
  const [reviewsStats, setReviewsStats] = useState<ReviewsStats>({
    total_reviews: 0,
    average_rating: 0,
    with_response: 0,
  });

  // Conversations récentes depuis le hook
  const recentConversations = conversations.slice(0, 2);

  // États pour la modal de retrait
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [withdrawalFeePercentage, setWithdrawalFeePercentage] = useState(2.5);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

  const getUserName = () => {
    if (user?.display_name) return user.display_name;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return td.recentMessages.fallbackUser;
  };

  const userData = {
    name: getUserName(),
    email: user?.email || "",
    avatar:
      user?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        user?.username || "default"
      }`,
    username: user?.username || "",
    level: td.sellerLevel,
    successScore: "N/A",
    rating: reviewsStats.total_reviews > 0 
      ? reviewsStats.average_rating.toFixed(1) 
      : "N/A",
    responseRate: reviewsStats.total_reviews > 0
      ? `${Math.round((reviewsStats.with_response / reviewsStats.total_reviews) * 100)}%`
      : "N/A",
    activeOrders: 0,
    activeOrdersValue: 0,
    balance: earnings.available_cents / 100,
    occupations: [],
  };

  // Définir la configuration des retraits (identique à l'API)
  const WITHDRAWAL_CONFIG = {
    MIN_AMOUNT_CENTS: 2000, // 20 EUR minimum
    MAX_AMOUNT_CENTS: 500000, // 5000 EUR maximum par transaction
    PROCESSING_DELAY_HOURS: 24, // Délai de traitement simulé
  };

  // Fonction pour vérifier le statut des retraits récents
  const checkWithdrawalStatus = async () => {
    try {
      const response = await fetch("/api/provider/withdrawals/recent");
      const data = await response.json();
      if (data.success) {
        setTimeRemaining(data.timeRemaining || 0);
      }
    } catch (error) {
      console.error("Error checking withdrawal status:", error);
    }
  };

  // Mise à jour du compte à rebours en temps réel
  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          // Décrémente d'une seconde (1/3600 d'heure)
          return Math.max(0, prev - 1 / 3600);
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  // Charger les données du provider depuis Supabase
  useEffect(() => {
    const loadProviderData = async () => {
      if (!user) {
        router.push("/auth/signin?redirect=/Provider/TableauDeBord");
        return;
      }

      try {
        const supabase = createClient();

        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.user_id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        setIsProvider(true);

        // Récupérer les données du provider
        const { error: providerError } = await supabase
          .from("providers")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        if (providerError) {
          console.error("Error fetching provider:", providerError);
        }

        // ====================================================================
        // AUTO-RELEASE: Libérer automatiquement les fonds pending
        // ====================================================================
        try {
          console.log('🚀 [Provider Dashboard] Auto-release des fonds pending...');
          const autoReleaseResponse = await fetch('/api/auto-release-funds-simple');
          const autoReleaseData = await autoReleaseResponse.json();

          if (autoReleaseData.success) {
            console.log('✅ [Provider Dashboard] Auto-release terminé:', autoReleaseData.summary);
            if (autoReleaseData.summary.released > 0) {
              console.log(`🎉 ${autoReleaseData.summary.released} provider(s) libéré(s)!`);
            }
          }
        } catch (error) {
          console.warn('⚠️ [Provider Dashboard] Auto-release failed (non-bloquant):', error);
        }
        // ====================================================================

        // Charger les gains du provider
        const earningsResponse = await fetch("/api/provider/earnings");
        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json();
          if (earningsData.success && earningsData.data.balance) {
            setEarnings(earningsData.data.balance);
          }
        }

        // Charger les méthodes de paiement
        const paymentMethodsResponse = await fetch(
          "/api/provider/payment-methods"
        );
        if (paymentMethodsResponse.ok) {
          const paymentMethodsData = await paymentMethodsResponse.json();
          if (paymentMethodsData.success) {
            const methods = paymentMethodsData.data || [];
            setPaymentMethods(methods);
            // Sélectionner la méthode par défaut
            const defaultMethod = methods.find(
              (m: PaymentMethod) => m.is_default
            );
            if (defaultMethod) {
              setSelectedPaymentMethod(defaultMethod.id);
            }
          }
        }

        // Charger les frais de retrait depuis les settings
        const settingsResponse = await fetch(
          "/api/admin/platform-settings?isAdmin=false"
        );
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data.settings) {
            setWithdrawalFeePercentage(
              settingsData.data.settings.withdrawal_fee_percentage || 2.5
            );
          }
        }

        // Vérifier le statut des retraits
        await checkWithdrawalStatus();

        // Charger les statistiques des avis
        const reviewsResponse = await fetch("/api/providers/reviews");
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success && reviewsData.stats) {
            setReviewsStats(reviewsData.stats);
          }
        }
      } catch (error) {
        console.error("Error loading provider data:", error);
      }
    };

    if (!loading && user) {
      loadProviderData();
    }
  }, [user, loading, router]);

  // Fonction pour ouvrir la modal de retrait
  const handleOpenWithdrawalModal = () => {
    setWithdrawalError("");
    setWithdrawalAmount("");
    setShowWithdrawalModal(true);
    // Rafraîchir le statut des retraits quand la modal s'ouvre
    checkWithdrawalStatus();
  };

  // Calculer les frais et le montant net
  const calculateWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    const fee = amount * (withdrawalFeePercentage / 100);
    const netAmount = amount - fee;
    return { amount, fee, netAmount };
  };

  // Valider la demande de retrait côté client
  const validateWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount <= 0) {
      setWithdrawalError(td.withdrawal.errors.invalidAmount);
      return false;
    }

    if (amount < WITHDRAWAL_CONFIG.MIN_AMOUNT_CENTS / 100) {
      setWithdrawalError(
        t('providerDashboard.withdrawal.errors.minAmount', {
          amount: `${WITHDRAWAL_CONFIG.MIN_AMOUNT_CENTS / 100} €`
        })
      );
      return false;
    }

    if (amount > WITHDRAWAL_CONFIG.MAX_AMOUNT_CENTS / 100) {
      setWithdrawalError(
        t('providerDashboard.withdrawal.errors.maxAmount', {
          amount: `${WITHDRAWAL_CONFIG.MAX_AMOUNT_CENTS / 100} €`
        })
      );
      return false;
    }

    const availableAmount = earnings.available_cents / 100;
    if (amount > availableAmount) {
      setWithdrawalError(
        t('providerDashboard.withdrawal.errors.insufficientFunds', {
          amount: `${availableAmount.toFixed(2)} €`
        })
      );
      return false;
    }

    if (!selectedPaymentMethod) {
      setWithdrawalError(td.withdrawal.errors.selectMethod);
      return false;
    }

    return true;
  };

  // Soumettre la demande de retrait
  const handleSubmitWithdrawal = async () => {
    setWithdrawalError("");

    // Validation côté client
    if (!validateWithdrawal()) {
      return;
    }

    // Vérifier si un retrait est déjà en cours
    if (timeRemaining > 0) {
      setWithdrawalError(td.withdrawal.errors.wait24h);
      return;
    }

    try {
      setSubmittingWithdrawal(true);

      const response = await fetch("/api/provider/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: Math.round(parseFloat(withdrawalAmount) * 100),
          payment_method_id: selectedPaymentMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les données
        const earningsResponse = await fetch("/api/provider/earnings");
        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json();
          if (earningsData.success && earningsData.data.balance) {
            setEarnings(earningsData.data.balance);
          }
        }

        // Mettre à jour le statut des retraits
        await checkWithdrawalStatus();

        // Fermer la modal
        setShowWithdrawalModal(false);
        setWithdrawalAmount("");
        setSelectedPaymentMethod("");

        // Afficher un message de succès
        alert(
          t('providerDashboard.withdrawal.success', {
            amount: `${parseFloat(withdrawalAmount).toFixed(2)} €`
          })
        );
      } else {
        setWithdrawalError(
          data.error || td.withdrawal.errors.general
        );
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      setWithdrawalError(td.withdrawal.errors.server);
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Recharger les méthodes de paiement
  const reloadPaymentMethods = async () => {
    try {
      const response = await fetch("/api/provider/payment-methods");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentMethods(data.data || []);
          // Auto-select default method
          const defaultMethod = data.data.find((m: PaymentMethod) => m.is_default);
          if (defaultMethod && !selectedPaymentMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
          }
        }
      }
    } catch (error) {
      console.error("Error reloading payment methods:", error);
    }
  };

  // Définir un mode de paiement par défaut
  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/provider/payment-methods/${id}/set-default`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        await reloadPaymentMethods();
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
    }
  };

  // Modifier un mode de paiement
  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    setShowAddPaymentModal(true);
  };

  // Supprimer un mode de paiement
  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/provider/payment-methods/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        await reloadPaymentMethods();
        // If deleted was selected, clear selection
        if (selectedPaymentMethod === id) {
          setSelectedPaymentMethod("");
        }
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
  };

  // Gérer la fermeture de la modal d'ajout
  const handleCloseAddPaymentModal = () => {
    setShowAddPaymentModal(false);
    setEditingPaymentMethod(null);
  };

  // Gérer le succès d'ajout/modification
  const handlePaymentMethodSuccess = async () => {
    await reloadPaymentMethods();
    handleCloseAddPaymentModal();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200">{td.loading}</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200">{td.redirecting}</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas un provider
  if (!isProvider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {td.notProvider.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {td.notProvider.description}
          </p>
          <button
            onClick={() => router.push("/Provider/Accueil")}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            {td.notProvider.button}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <HeaderProvider />

      {/* Hero Section avec gradient */}
      <div className="relative pt-8 pb-20 lg:pt-12 lg:pb-32 overflow-hidden">
        {/* Effet de lumière */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-emerald-400" />
              {t('providerDashboard.welcome', { name: userData.name })}
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto">
              {td.subtitle}
            </p>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Card 1 - Balance */}
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-emerald-400" />
                  </div>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {showBalance ? (
                      <Eye className="w-5 h-5 text-slate-300" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-400 mb-2">{td.stats.availableBalance}</p>
                {showBalance ? (
                  <p className="text-3xl font-black text-white">
                    <ConvertedAmount amountCents={earnings.available_cents} selectedCurrency={selectedCurrency} />
                  </p>
                ) : (
                  <p className="text-3xl font-black text-white">••••••</p>
                )}
                <button
                  onClick={handleOpenWithdrawalModal}
                  className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {td.stats.withdraw}
                </button>
              </div>
            </div>

            {/* Card 2 - Total Earned */}
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm text-slate-400 mb-2">{td.stats.totalEarned}</p>
                <p className="text-3xl font-black text-white">
                  <ConvertedAmount amountCents={earnings.total_earned_cents} selectedCurrency={selectedCurrency} />
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {td.stats.pending} <ConvertedAmount amountCents={earnings.pending_cents} selectedCurrency={selectedCurrency} />
                </p>
              </div>
            </div>

            {/* Card 3 - Orders */}
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-slate-400 mb-2">{td.stats.activeOrders}</p>
                <p className="text-3xl font-black text-white">
                  {userData.activeOrders}
                </p>
                <button
                  onClick={() => router.push("/Provider/TableauDeBord/Order")}
                  className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  {td.stats.viewAll}
                </button>
              </div>
            </div>

            {/* Card 4 - Rating */}
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-3 h-3 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-2">{td.stats.rating}</p>
                <p className="text-3xl font-black text-white">
                  {userData.rating}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {td.stats.responseRate} {userData.responseRate}
                </p>
              </div>
            </div>
          </div>

          {/* Messages récents Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Messages récents */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {td.recentMessages.title}
                  </h2>
                </div>
                <button
                  onClick={() => router.push("/messages")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  {td.recentMessages.viewAll}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recentConversations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">{td.recentMessages.noMessages}</p>
                  <button
                    onClick={() => router.push("/messages")}
                    className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    {td.recentMessages.viewAllButton}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => {
                    // Fonction pour formater le temps relatif
                    const getRelativeTime = (dateString: string) => {
                      const now = new Date();
                      const messageDate = new Date(dateString);
                      const diffInMs = now.getTime() - messageDate.getTime();
                      const diffInMinutes = Math.floor(diffInMs / 60000);
                      const diffInHours = Math.floor(diffInMs / 3600000);
                      const diffInDays = Math.floor(diffInMs / 86400000);

                      if (diffInMinutes < 1) return td.recentMessages.relativeTime.justNow;
                      if (diffInMinutes < 60) return t('providerDashboard.recentMessages.relativeTime.minutes', { count: diffInMinutes });
                      if (diffInHours < 24) return t('providerDashboard.recentMessages.relativeTime.hours', { count: diffInHours });
                      if (diffInDays < 7) return t('providerDashboard.recentMessages.relativeTime.days', { count: diffInDays });
                      
                      const locale = t.lang === 'en' ? 'en-US' : t.lang === 'es' ? 'es-ES' : 'fr-FR';
                      return messageDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                    };

                    return (
                      <div
                        key={conversation.id}
                        className="flex items-start gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => router.push(`/messages?conversation=${conversation.id}`)}
                      >
                        <img
                          src={conversation.other_participant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.other_participant_name || 'User'}`}
                          alt={conversation.other_participant_name || td.recentMessages.fallbackUser}
                          className="w-12 h-12 rounded-full border-2 border-emerald-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white text-sm">
                              {conversation.other_participant_name || td.recentMessages.fallbackUser}
                            </h3>
                            <span className="text-xs text-slate-400">
                              {getRelativeTime(conversation.last_message_at)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                            {conversation.last_message_text || td.recentMessages.noMessageText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {td.quickActions.title}
                </h2>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    router.push("/Provider/TableauDeBord/Analytique/Apercu")
                  }
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">
                        {td.quickActions.analytics.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {td.quickActions.analytics.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => router.push("/Provider/TableauDeBord/Service")}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">
                        {td.quickActions.services.title}
                      </p>
                      <p className="text-xs text-slate-400">{td.quickActions.services.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => router.push("/messages")}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Send className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">
                        {td.quickActions.messages.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {td.quickActions.messages.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  onClick={handleOpenWithdrawalModal}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <ArrowDownToLine className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">
                        {td.quickActions.withdrawGains.title}
                      </p>
                      <p className="text-xs text-emerald-100">
                        {td.quickActions.withdrawGains.available.replace('{amount}', '')}
                        <ConvertedAmount amountCents={earnings.available_cents} selectedCurrency={selectedCurrency} />
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Active Orders Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <ActiveOrdersSection />
          </div>
        </div>
      </div>

      {/* Modal de retrait - Nouvelle version améliorée */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableAmountCents={earnings.available_cents}
        selectedCurrency={selectedCurrency}
        paymentMethods={paymentMethods}
        onAddPaymentMethod={() => {
          setEditingPaymentMethod(null);
          setShowAddPaymentModal(true);
        }}
        onSetDefault={handleSetDefaultPaymentMethod}
        onEditPaymentMethod={handleEditPaymentMethod}
        onDeletePaymentMethod={handleDeletePaymentMethod}
        withdrawalFeePercentage={withdrawalFeePercentage}
        timeRemaining={timeRemaining}
        accountFrozen={earnings.Account_gele} // 🆕 Passe le statut du compte gelé
        onSubmit={async (amount, paymentMethodId) => {
          const response = await fetch("/api/provider/withdrawals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount_cents: Math.round(amount * 100),
              payment_method_id: paymentMethodId,
            }),
          });

          const data = await response.json();

          if (data.success) {
            // Recharger les données
            const earningsResponse = await fetch("/api/provider/earnings");
            if (earningsResponse.ok) {
              const earningsData = await earningsResponse.json();
              if (earningsData.success && earningsData.data.balance) {
                setEarnings(earningsData.data.balance);
              }
            }

            // Mettre à jour le statut des retraits
            await checkWithdrawalStatus();

            alert(
              t('providerDashboard.withdrawal.success', {
                amount: `${amount.toFixed(2)} ${selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'USD' ? '$' : selectedCurrency}`
              })
            );
          } else {
            throw new Error(data.error || td.withdrawal.errors.general);
          }
        }}
        ConvertedAmountComponent={ConvertedAmount}
      />

      {/* Modal d'ajout/modification de mode de paiement */}
      <AddPaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={handleCloseAddPaymentModal}
        onSuccess={handlePaymentMethodSuccess}
        editingMethod={editingPaymentMethod}
      />
    </div>
  );
}
