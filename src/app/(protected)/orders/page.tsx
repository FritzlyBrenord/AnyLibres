"use client";

import { useEffect, useState } from "react";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  payment_processing: "Paiement en cours",
  paid: "Payé",
  in_progress: "En cours",
  delivered: "Livré",
  revision_requested: "Révision demandée",
  completed: "Terminé",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  payment_processing: "bg-blue-100 text-blue-800",
  paid: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  revision_requested: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  processing: "En traitement",
  succeeded: "Réussi",
  failed: "Échoué",
  refunded: "Remboursé",
  cancelled: "Annulé",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"client" | "provider">("client");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");

  // --- Currency Support ---
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [convertedOrders, setConvertedOrders] = useState<Map<string, number>>(new Map());

  // Charger la devise et écouter les changements
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

  // Convertir tous les prix de la liste quand la devise ou les commandes changent
  useEffect(() => {
    const convertAllPrices = async () => {
      if (orders.length === 0) return;

      const newConvertedMap = new Map<string, number>();

      if (selectedCurrency === 'USD') {
        orders.forEach(order => {
          const totalCents = order.metadata?.pricing?.fee_config?.paid_by === "client"
            ? order.total_cents + (order.fees_cents || 0)
            : order.metadata?.pricing?.fee_config?.paid_by === "split"
            ? order.total_cents + ((order.fees_cents || 0) / 2)
            : order.total_cents;
          
          newConvertedMap.set(order.id, totalCents / 100);
        });
        setConvertedOrders(newConvertedMap);
        return;
      }

      await Promise.all(orders.map(async (order) => {
        const totalCents = order.metadata?.pricing?.fee_config?.paid_by === "client"
          ? order.total_cents + (order.fees_cents || 0)
          : order.metadata?.pricing?.fee_config?.paid_by === "split"
          ? order.total_cents + ((order.fees_cents || 0) / 2)
          : order.total_cents;
        
        const converted = await convertFromUSD(totalCents / 100, selectedCurrency);
        newConvertedMap.set(order.id, converted || 0);
      }));

      setConvertedOrders(newConvertedMap);
    };

    convertAllPrices();
  }, [orders, selectedCurrency]);

  useEffect(() => {
    fetchOrders();
  }, [role, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role });
      if (statusFilter) params.append("status", statusFilter);
      if (paymentFilter) params.append("paymentStatus", paymentFilter);

      const response = await fetch(`/api/orders/list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders || []);
      } else {
        console.error("Erreur:", data.error);
      }
    } catch (error) {
      console.error("Erreur récupération commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: selectedCurrency,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "cancelled":
      case "refunded":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <Header variant="solid" />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Mes Commandes
                </h1>
                <p className="text-slate-600 text-lg">
                  Gérez et suivez vos commandes en temps réel
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Filtres</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Role Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vue
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRole("client")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      role === "client"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Achats
                  </button>
                  <button
                    onClick={() => setRole("provider")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      role === "provider"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Ventes
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut Commande
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="in_progress">En cours</option>
                  <option value="delivered">Livré</option>
                  <option value="revision_requested">Révision demandée</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut Paiement
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="processing">En traitement</option>
                  <option value="succeeded">Réussi</option>
                  <option value="failed">Échoué</option>
                  <option value="refunded">Remboursé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setPaymentFilter("");
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune commande
              </h3>
              <p className="text-gray-600">
                {role === "client"
                  ? "Vous n'avez pas encore passé de commande."
                  : "Vous n'avez pas encore reçu de commande."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Status Bar */}
                  <div
                    className={`h-2 ${
                      order.status === "completed"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : order.status === "in_progress"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : order.status === "delivered"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : order.status === "cancelled" ||
                          order.status === "refunded"
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500"
                    }`}
                  />

                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      {/* Left: Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Status Icon */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            {getStatusIcon(order.status as OrderStatus)}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Order Number & Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="text-xl font-bold text-slate-900">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                  STATUS_COLORS[order.status as OrderStatus]
                                }`}
                              >
                                {STATUS_LABELS[order.status as OrderStatus]}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>

                            {/* Order Items */}
                            {order.order_items &&
                              order.order_items.length > 0 && (
                                <div className="space-y-2">
                                  {order.order_items.map((item: any) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2"
                                    >
                                      <Package className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                      <p className="text-sm font-medium text-slate-700">
                                        {item.quantity}x {item.title}
                                      </p>
                                      {item.selected_extras &&
                                        item.selected_extras.length > 0 && (
                                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            +{item.selected_extras.length} extra
                                            {item.selected_extras.length > 1
                                              ? "s"
                                              : ""}
                                          </span>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Action */}
                      <div className="flex items-center gap-6 lg:border-l-2 lg:border-slate-200 lg:pl-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-600 mb-1">
                            Montant total
                          </p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {formatPrice(convertedOrders.get(order.id) || 0)}
                          </p>
                          <span
                            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                              PAYMENT_STATUS_COLORS[
                                order.payment_status as PaymentStatus
                              ]
                            }`}
                          >
                            {
                              PAYMENT_STATUS_LABELS[
                                order.payment_status as PaymentStatus
                              ]
                            }
                          </span>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                            <ChevronRight className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
