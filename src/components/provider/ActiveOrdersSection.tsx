"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Zap,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

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

// Widget de résumé des commandes pour le tableau de bord
export default function ActiveOrdersSummaryWidget() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    late: 0,
    delivered: 0,
    urgent: 0,
    totalValue: 0,
  });
  const [urgentOrders, setUrgentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadOrdersSummary();
  }, []);

  const loadOrdersSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/providers/orders?status=all");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const orders = data.orders;

          // Calculer les stats
          const stats = {
            total: orders.length,
            active: orders.filter((o: any) =>
              ['pending', 'in_progress', 'delivered', 'revision_requested'].includes(o.status)
            ).length,
            late: orders.filter((o: any) => o.is_late).length,
            delivered: orders.filter((o: any) => o.status === 'delivered').length,
            urgent: orders.filter((o: any) => o.is_urgent).length,
            totalValue: orders
              .filter((o: any) => ['pending', 'in_progress', 'delivered', 'revision_requested'].includes(o.status))
              .reduce((sum: number, o: any) => sum + (o.total_cents || 0), 0) / 100,
          };

          setStats(stats);

          // Prendre les 3 commandes les plus urgentes/en retard
          const urgent = orders
            .filter((o: any) => o.is_late || o.is_urgent)
            .sort((a: any, b: any) => a.hours_remaining - b.hours_remaining)
            .slice(0, 3);

          setUrgentOrders(urgent);
        }
      }
    } catch (error) {
      console.error('Error loading orders summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 0) return "En retard";
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Aperçu des commandes
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Gérez vos commandes actives et respectez vos délais
            </p>
          </div>

          <button
            onClick={() => router.push("/Provider/TableauDeBord/Order")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        {/* Actives */}
        <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{stats.active}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">En cours</p>
          <p className="text-xs text-gray-500 mt-1">
            <ConvertedAmount amountCents={Math.round(stats.totalValue * 100)} selectedCurrency={selectedCurrency} />
          </p>
        </div>

        {/* En retard */}
        <div className={`bg-white rounded-lg p-4 border-2 ${stats.late > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className={`w-5 h-5 ${stats.late > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <span className={`text-2xl font-bold ${stats.late > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {stats.late}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700">En retard</p>
          {stats.late > 0 && (
            <p className="text-xs text-red-600 font-medium mt-1">⚠️ Action requise</p>
          )}
        </div>

        {/* Urgentes */}
        <div className={`bg-white rounded-lg p-4 border-2 ${stats.urgent > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <Zap className={`w-5 h-5 ${stats.urgent > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            <span className={`text-2xl font-bold ${stats.urgent > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {stats.urgent}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700">Urgentes</p>
          {stats.urgent > 0 && (
            <p className="text-xs text-orange-600 font-medium mt-1">⏰ &lt; 48h</p>
          )}
        </div>

        {/* Livrées */}
        <div className="bg-white rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.delivered}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Livrées</p>
          <p className="text-xs text-gray-500 mt-1">En attente validation</p>
        </div>
      </div>

      {/* Commandes urgentes/en retard */}
      {urgentOrders.length > 0 ? (
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Commandes prioritaires ({urgentOrders.length})
          </h3>
          <div className="space-y-3">
            {urgentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push("/Provider/TableauDeBord/Order")}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  order.is_late
                    ? 'border-red-200 bg-red-50 hover:border-red-300'
                    : 'border-orange-200 bg-orange-50 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {order.service?.title?.fr || order.service?.title || 'Commande'}
                      </h4>
                      {order.is_late && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold">
                          EN RETARD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.client?.full_name || 'Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      <ConvertedAmount amountCents={order.total_cents || 0} selectedCurrency={selectedCurrency} />
                    </p>
                    <p className={`text-xs font-semibold ${
                      order.is_late ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {formatTimeRemaining(order.hours_remaining)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : stats.active === 0 && stats.total === 0 ? (
        // Aucune commande du tout
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande pour le moment
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Créez vos premiers services pour commencer à recevoir des commandes
          </p>
          <button
            onClick={() => router.push("/Provider/services/create")}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Créer un service
          </button>
        </div>
      ) : stats.active === 0 ? (
        // Aucune commande active mais il y a des commandes terminées
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande en cours
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Vous n'avez pas de commandes actives pour le moment
          </p>
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Order")}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
          >
            Voir l'historique des commandes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Tout va bien
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tout est sous contrôle ! 🎉
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Aucune commande urgente ou en retard
          </p>
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Order")}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
          >
            Voir toutes les commandes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
