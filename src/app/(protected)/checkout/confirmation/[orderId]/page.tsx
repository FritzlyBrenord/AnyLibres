// app/checkout/confirmation/[orderId]/page.tsx - VERSION CORRIGÉE
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import {
  CheckCircle2,
  Package,
  Clock,
  Download,
  Share2,
  Home,
  Loader2,
  AlertCircle,
  Mail,
  User,
  CreditCard,
  Building2,
  Wallet,
} from "lucide-react";

interface Order {
  id: string;
  client_id: string;
  provider_id: string;
  total_cents: number;
  fees_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_details?: any;
  message?: string;
  delivery_deadline: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  metadata?: any;
}

interface OrderItem {
  id: string;
  order_id: string;
  service_id: string;
  title: string;
  unit_price_cents: number;
  quantity: number;
  subtotal_cents: number;
  fees_cents: number;
  selected_extras: any[];
}

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- Currency State ---
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [convertedValues, setConvertedValues] = useState<{
    subtotal: number;
    fees: number;
    total: number;
    items: Map<string, { unit: number; subtotal: number; extras: number[] }>;
  }>({
    subtotal: 0,
    fees: 0,
    total: 0,
    items: new Map(),
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

  // Conversion des prix
  useEffect(() => {
    const convertPrices = async () => {
      if (!order) return;

      if (selectedCurrency === 'USD') {
        const itemMap = new Map();
        order.order_items?.forEach(item => {
          itemMap.set(item.id, {
            unit: item.unit_price_cents / 100,
            subtotal: item.subtotal_cents / 100,
            extras: item.selected_extras?.map((e: any) => e.price_cents / 100) || []
          });
        });

        setConvertedValues({
          subtotal: order.total_cents / 100,
          fees: order.fees_cents / 100,
          total: (order.total_cents + order.fees_cents) / 100,
          items: itemMap
        });
        return;
      }

      // Convertir via API/Utilities
      const [convSubtotal, convFees] = await Promise.all([
        convertFromUSD(order.total_cents / 100, selectedCurrency),
        convertFromUSD(order.fees_cents / 100, selectedCurrency)
      ]);

      const itemMap = new Map();
      if (order.order_items) {
        for (const item of order.order_items) {
          const [convUnit, convItemSub] = await Promise.all([
            convertFromUSD(item.unit_price_cents / 100, selectedCurrency),
            convertFromUSD(item.subtotal_cents / 100, selectedCurrency)
          ]);

          const convExtras = [];
          if (item.selected_extras) {
            for (const extra of item.selected_extras) {
              const convExtra = await convertFromUSD(extra.price_cents / 100, selectedCurrency);
              convExtras.push(convExtra || 0);
            }
          }

          itemMap.set(item.id, {
            unit: convUnit || 0,
            subtotal: convItemSub || 0,
            extras: convExtras
          });
        }
      }

      setConvertedValues({
        subtotal: convSubtotal || 0,
        fees: convFees || 0,
        total: (convSubtotal || 0) + (convFees || 0),
        items: itemMap
      });
    };

    convertPrices();
  }, [order, selectedCurrency]);

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadOrder();
    }
  }, [authLoading, user, orderId]);

  const loadOrder = async () => {
    try {
      setError(null);
      console.log("Chargement de la commande:", orderId);

      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      console.log("Réponse API confirmation:", data);

      if (data.success && data.data.order) {
        setOrder(data.data.order);
        setError(null);
      } else {
        const errorMsg = data.error || "Commande introuvable";
        setError(errorMsg);

        // Réessayer automatiquement
        if (retryCount < 5) {
          console.log(`Tentative ${retryCount + 1}/5...`);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 1000 * (retryCount + 1));
        }
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setError("Erreur de connexion au serveur");

      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setLoading(true);
    setError(null);
  };

  const handleContactSupport = () => {
    window.location.href =
      "mailto:support@anylibre.com?subject=Problème avec ma commande";
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="w-5 h-5" />;
      case "paypal":
        return <Wallet className="w-5 h-5" />;
      case "bank":
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Carte bancaire";
      case "paypal":
        return "PayPal";
      case "bank":
        return "Virement bancaire";
      default:
        return method;
    }
  };

  const handleDownloadReceipt = () => {
    if (!order) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de commande #${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #7C3AED; }
          .invoice-title { font-size: 28px; font-weight: bold; color: #333; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .box { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 50px; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ANYLIBRE</div>
          <div class="invoice-title">REÇU DE COMMANDE</div>
        </div>

        <div class="meta-grid">
          <div class="box">
            <h3>Informations Client</h3>
            <p><strong>${user?.first_name || ""} ${
      user?.last_name || ""
    }</strong></p>
            <p>${user?.email || ""}</p>
          </div>
          <div class="box">
            <h3>Détails Commande</h3>
            <p><strong>N°:</strong> #${order.id.split("-")[0]}</p>
            <p><strong>Date:</strong> ${new Date(
              order.created_at
            ).toLocaleDateString("fr-FR")}</p>
            <p><strong>Statut:</strong> Payé</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items
              ?.map(
                (item) => `
              <tr>
                <td>
                  <strong>${item.title}</strong>
                  ${
                    item.selected_extras?.length
                      ? '<br/><span style="font-size: 12px; color: #666;">' +
                        item.selected_extras
                          .map(
                            (e: any) =>
                              "+ " +
                              (typeof e.name === "object" ? e.name.fr : e.name)
                          )
                          .join(", ") +
                        "</span>"
                      : ""
                  }
                </td>
                <td>${item.quantity}</td>
                <td>${formatAmount(convertedValues.items.get(item.id)?.subtotal || 0)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          ${
            // Gérer l'affichage selon qui paie les frais
            order.metadata?.pricing?.fee_config?.paid_by === "client"
              ? `
          <div class="total-row">
            <span>Sous-total</span>
            <span>${formatAmount(convertedValues.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Frais de service</span>
            <span>${formatAmount(convertedValues.fees)}</span>
          </div>
          <div class="total-row final-total">
            <span>Total payé</span>
            <span>${formatAmount(convertedValues.total)}</span>
          </div>
          `
              : order.metadata?.pricing?.fee_config?.paid_by === "split"
              ? `
          <div class="total-row">
            <span>Sous-total</span>
            <span>${formatAmount(convertedValues.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Frais de service (50%)</span>
            <span>${formatAmount(convertedValues.fees / 2)}</span>
          </div>
          <div class="total-row final-total">
            <span>Total payé</span>
            <span>${formatAmount(convertedValues.subtotal + (convertedValues.fees / 2))}</span>
          </div>
          `
              : `
          <div class="total-row final-total">
            <span>Total payé</span>
            <span>${formatAmount(convertedValues.subtotal)}</span>
          </div>
          `
          }
        </div>

        <div class="footer">
          <p>Merci de votre confiance !<br/>AnyLibre Inc. - Plateforme de services freelance</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  // Redirection si non connecté
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <User className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Accès non autorisé
        </h2>
        <button
          onClick={() => router.push("/auth/signin")}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
        >
          Se connecter
        </button>
      </div>
    );
  }

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <Header variant="solid" />

        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {retryCount > 0
                  ? "Vérification de votre commande..."
                  : "Chargement..."}
              </h1>
              <p className="text-slate-600 text-lg">
                {retryCount > 0
                  ? `Tentative ${retryCount}/5`
                  : "Récupération des détails de votre commande"}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage des erreurs
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
        <Header variant="solid" />

        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Commande non trouvée
              </h1>
              <p className="text-slate-600 text-lg mb-6">
                {error || "La commande demandée n'existe pas"}
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 max-w-md mx-auto">
                <p className="text-sm text-amber-800">
                  <strong>ID de commande:</strong> {orderId}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  disabled={retryCount >= 5}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Loader2 className="w-4 h-4" />
                  {retryCount >= 5 ? "Tentatives épuisées" : "Réessayer"}
                </button>
                <button
                  onClick={handleContactSupport}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Support
                </button>
                <button
                  onClick={() => router.push("/orders")}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Mes commandes
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage de la confirmation (SEULEMENT si order existe)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      <Header variant="solid" />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Commande confirmée !
            </h1>
            <p className="text-xl text-slate-600">
              Votre paiement a été traité avec succès
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Détails de la commande */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Package className="w-6 h-6 text-purple-600" />
                  Détails de la commande
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Numéro de commande
                      </label>
                      <p className="text-lg font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                        #{order.id.split("-")[0].toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Date de commande
                      </label>
                      <p className="text-slate-900">
                        {new Date(order.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Statut
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          order.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Paiement
                      </label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            order.payment_status === "succeeded"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          } capitalize`}
                        >
                          {order.payment_status}
                        </span>
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          {getPaymentMethodIcon(order.payment_method)}
                          {getPaymentMethodLabel(order.payment_method)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Livraison prévue
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-900">
                          {new Date(order.delivery_deadline).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </div>
                    {order.metadata?.total_delivery_days && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Durée totale
                        </label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-900">
                            {order.metadata.total_delivery_days} jours
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Détails du paiement
                      </label>
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                        {order.metadata?.pricing?.fee_config?.paid_by ===
                        "client" ? (
                          <>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Sous-total</span>
                              <span>{formatAmount(convertedValues.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Frais de service</span>
                              <span>{formatAmount(convertedValues.fees)}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-200">
                              <span>Total payé</span>
                              <span>{formatAmount(convertedValues.total)}</span>
                            </div>
                          </>
                        ) : order.metadata?.pricing?.fee_config?.paid_by === "split" ? (
                          <>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Sous-total</span>
                              <span>{formatAmount(convertedValues.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Frais de service (50%)</span>
                              <span>{formatAmount(convertedValues.fees / 2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-200">
                              <span>Total payé</span>
                              <span>
                                {formatAmount(convertedValues.subtotal + (convertedValues.fees / 2))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-base font-semibold text-slate-900">
                            <span>Total payé</span>
                            <span>{formatAmount(convertedValues.subtotal)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services commandés */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Services commandés
                  </h3>
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl mb-4"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600">
                              Prix unitaire:{" "}
                              {formatAmount(convertedValues.items.get(item.id)?.unit || 0)}
                            </p>

                            {item.selected_extras &&
                              item.selected_extras.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-slate-700 mb-1">
                                    Options incluses:
                                  </p>
                                  <ul className="text-xs text-slate-600 space-y-1">
                                    {item.selected_extras.map(
                                      (extra: any, extraIndex: number) => (
                                        <li
                                          key={extraIndex}
                                          className="flex justify-between"
                                        >
                                          <span>
                                            •{" "}
                                            {typeof extra.name === "object"
                                              ? extra.name.fr
                                              : extra.name}
                                          </span>
                                          <span className="font-medium">
                                            +
                                            {formatAmount(convertedValues.items.get(item.id)?.extras[extraIndex] || 0)}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.message && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      Votre message au prestataire
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-slate-700">{order.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">
                      Télécharger le reçu
                    </span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors">
                    <Share2 className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">
                      Partager la commande
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <Package className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">
                      Voir mes commandes
                    </span>
                  </button>
                </div>
              </div>

              {/* Prochaines étapes */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Prochaines étapes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">
                        Contact du prestataire
                      </p>
                      <p className="text-sm text-green-700">Sous 24 heures</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">
                        Début des travaux
                      </p>
                      <p className="text-sm text-green-700">
                        Après validation des détails
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Livraison</p>
                      <p className="text-sm text-green-700">
                        Avant le{" "}
                        {new Date(order.delivery_deadline).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
