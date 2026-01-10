
"use client";

import { useEffect, useState } from "react";
import { convertFromUSD } from "@/utils/lib/currencyConversion";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  User,
  Calendar,
  Shield,
  Award,
  AlertTriangle,
  X,
  Eye,
  ShoppingBag,
  TrendingArrowUp,
  Globe,
  MapPin,
  Briefcase
} from "lucide-react";
import OrderMessagingModal from "@/components/message/OrderMessagingModal";
import OrderChat from "@/components/order/OrderChat";
import OrderReviewSection from "@/components/review/OrderReviewSection";
import DeliveryGallery from "@/components/order/DeliveryGallery";
import Link from 'next/link';

interface OrderDetailViewProps {
  order: any;
  isAdmin?: boolean;
  isDark?: boolean;
  onBack?: () => void;
  // Callback props for actions (only used if !isAdmin)
  onOpenMessaging?: () => void;
  onOpenDispute?: () => void;
  onOpenRevision?: () => void;
  onOpenCancel?: () => void;
  onAcceptDelivery?: () => void;
}

const STATUS_CONFIG: any = {
    pending: {
      label: "En attente de paiement",
      color: "amber",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      description: "En attente du traitement du paiement",
    },
    paid: {
      label: "Payée - En attente",
      color: "blue",
      icon: CheckCircle,
      gradient: "from-blue-500 to-cyan-500",
      description: "Paiement confirmé, le prestataire doit commencer",
    },
    in_progress: {
      label: "En cours de réalisation",
      color: "purple",
      icon: Package,
      gradient: "from-purple-500 to-pink-500",
      description: "Le prestataire travaille sur la commande",
    },
    delivered: {
      label: "Livrée - À vérifier",
      color: "emerald",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-500",
      description: "Travail livré, en attente de validation",
    },
    revision_requested: {
      label: "Révision demandée",
      color: "orange",
      icon: RefreshCw,
      gradient: "from-orange-500 to-red-500",
      description: "Le client a demandé des modifications",
    },
    completed: {
      label: "Terminée",
      color: "green",
      icon: Award,
      gradient: "from-green-500 to-emerald-500",
      description: "Commande finalisée avec succès",
    },
    cancelled: {
      label: "Annulée",
      color: "red",
      icon: XCircle,
      gradient: "from-red-500 to-rose-500",
      description: "Cette commande a été annulée",
    },
    refunded: {
      label: "Remboursée",
      color: "gray",
      icon: Shield,
      gradient: "from-gray-500 to-slate-500",
      description: "Commande remboursée",
    },
    disputed: {
      label: "En litige",
      color: "violet",
      icon: AlertCircle,
      gradient: "from-violet-500 to-purple-500",
      description: "Litige en cours de résolution",
    },
};

export default function OrderDetailView({
  order,
  isAdmin = false,
  isDark = false,
  onBack,
  onOpenMessaging,
  onOpenDispute,
  onOpenRevision,
  onOpenCancel,
  onAcceptDelivery
}: OrderDetailViewProps) {

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

      // Ensure we have a valid total and fees
      const totalCents = order.total_cents || 0;
      const feesCents = order.fees_cents || 0;

      if (selectedCurrency === 'USD') {
        const itemMap = new Map();
        order.order_items?.forEach((item: any) => {
          itemMap.set(item.id, {
            unit: item.unit_price_cents / 100,
            subtotal: item.subtotal_cents / 100,
            extras: item.selected_extras?.map((e: any) => e.price_cents / 100) || []
          });
        });

        setConvertedValues({
          subtotal: (totalCents - feesCents) / 100,
          fees: feesCents / 100,
          total: totalCents / 100,
          items: itemMap
        });
        return;
      }

      // Special case: if order metadata already has USD amounts, use them as base?
      // For now, assume order.total_cents is in USD (platform base)
      const baseTotalUSD = totalCents / 100;
      const baseFeesUSD = feesCents / 100;
      const baseSubtotalUSD = (totalCents - feesCents) / 100;

      const [convSubtotal, convFees, convTotal] = await Promise.all([
        convertFromUSD(baseSubtotalUSD, selectedCurrency),
        convertFromUSD(baseFeesUSD, selectedCurrency),
        convertFromUSD(baseTotalUSD, selectedCurrency)
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
        total: convTotal || 0,
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

  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = currentStatus.icon;

  const getStatusColor = (status: string) => {
      // Helper for smaller badges
      const config = STATUS_CONFIG[status];
      return config ? `text-${config.color}-600 bg-${config.color}-50` : "text-gray-600 bg-gray-50";
  };

  return (
    <div className={`flex flex-col ${isDark ? "text-gray-200" : "text-slate-900"}`}>
       {/* Admin Specific Header Controls */}
        {isAdmin && onBack && (
            <button
                onClick={onBack}
                className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg w-fit transition-colors ${
                    isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                }`}
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
            </button>
        )}

      {/* Main Header */}
      <div className={`mb-8 ${isDark ? "text-white" : ""}`}>
        {!isAdmin && (
             <button
               onClick={onBack}
               className="group flex items-center gap-3 text-slate-600 hover:text-slate-900 mb-6 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/50 backdrop-blur-sm"
             >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
               <span className="font-medium">Retour aux commandes</span>
             </button>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
              <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"}`}>
                Commande #{order.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <p className={`${isDark ? "text-gray-400" : "text-slate-600"} text-lg flex items-center gap-2`}>
              <Calendar className="w-5 h-5" />
              Créée le{" "}
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
             {/* Admin: Show Client and Provider links clearly */}
             {isAdmin && (
                 <div className="flex items-center gap-6 mt-4 pb-4 border-b border-gray-700/50">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Client</span>
                        <Link href={`/profile/${order.client_id}`} className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                             <User className="w-4 h-4" />
                             <span className="font-semibold">
                                {order.client?.profile?.first_name} {order.client?.profile?.last_name}
                             </span>
                        </Link>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Prestataire</span>
                        <Link href={`/public/provider/${order.provider?.profile_id}`} className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                             <Briefcase className="w-4 h-4" />
                             <span className="font-semibold">
                                {order.provider?.company_name || "Provider"}
                             </span>
                        </Link>
                    </div>
                 </div>
             )}
          </div>

          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${currentStatus.gradient} text-white shadow-lg`}
          >
            <StatusIcon className="w-6 h-6" />
            <div>
              <span className="font-semibold text-lg block">
                {currentStatus.label}
              </span>
              <span className="text-sm opacity-90">
                {currentStatus.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
            {/* Status Banners - Conditional */}
            {/* Only show interactive banners if NOT admin (or simplified for admin) */}
            {!isAdmin && order.status === "paid" && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/80 backdrop-blur-sm rounded-3xl border border-blue-200/60 shadow-xl p-8">
                     <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Paiement confirmé !</h2>
                        <p className="text-slate-600 mb-4">Le prestataire va bientôt commencer à travailler.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                           <button onClick={onOpenMessaging} className="flex items-center gap-2 px-6 py-3 bg-white border border-blue-300 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors">
                                <MessageSquare className="w-4 h-4" /> Envoyer un message
                           </button>
                           <button onClick={onOpenCancel} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
                                <XCircle className="w-4 h-4" /> Annuler la commande
                           </button>
                        </div>
                     </div>
                </div>
            )}
            
            {/* Admin simplified progress view */}
            {order.status === "in_progress" && (
                 <div className={`rounded-3xl border p-8 shadow-xl ${
                     isDark 
                     ? "bg-gray-800/50 border-gray-700" 
                     : "bg-gradient-to-br from-purple-50 to-pink-50/80 border-purple-200/60"
                 }`}>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-white animate-bounce" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                            Travail en cours
                        </h2>
                      </div>
                      
                      {/* Progress Bar */}
                       <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-slate-700"}`}>
                            Progression estimée
                          </span>
                           <span className="text-sm font-bold text-purple-600">
                            {/* Logic duplicated from original for visual fidelity */}
                             {(() => {
                              const start = new Date(order.created_at).getTime();
                              const end = new Date(order.delivery_deadline).getTime();
                              const now = Date.now();
                              const progress = Math.min(Math.max(((now - start) / (end - start)) * 100, 5), 95);
                              return Math.round(progress);
                            })()}%
                           </span>
                        </div>
                        <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? "bg-gray-700" : "bg-slate-200"}`}>
                             <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                       </div>
                 </div>
            )}


          {/* Order Items */}
          <div className={`rounded-3xl border shadow-sm overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
            <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-slate-100"}`}>
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Détails de la commande</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
               {order.order_items?.map((item: any) => (
                   <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                        <div className={`w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-slate-100"}`}>
                             <Package className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
                        </div>
                        <div className="flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{item.title}</h3>
                                <div className={`text-right font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                    {formatAmount(convertedValues.items.get(item.id)?.subtotal || 0)}
                                </div>
                             </div>
                             <div className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                                Quantité: {item.quantity} × {formatAmount(convertedValues.items.get(item.id)?.unit || 0)}
                             </div>
                        </div>
                   </div>
               ))}
            </div>
          </div>

          {/* Bannière statut DELIVERED - Livraison à valider */}
           {/* Only show interactive banners if NOT admin */}
           {!isAdmin && order.status === "delivered" && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 backdrop-blur-sm rounded-3xl border border-green-200/60 shadow-xl p-8 mb-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          Votre commande est livrée !
                        </h2>
                        <p className="text-slate-600 mb-4">
                          Veuillez vérifier le travail fourni et confirmer qu'il répond à vos attentes
                        </p>

                         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                           <button onClick={onAcceptDelivery} className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg">
                                <Award className="w-5 h-5" /> Accepter le travail
                           </button>
                           <div className="flex gap-3">
                                <button onClick={onOpenRevision} className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
                                     <RefreshCw className="w-4 h-4" /> Demander révision
                                </button>
                                <button onClick={onOpenDispute} className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
                                     <AlertTriangle className="w-4 h-4" /> Litige
                                </button>
                           </div>
                         </div>
                      </div>
                </div>
           )}

          {/* Delivery & Files Gallery */}
          {order.order_deliveries && order.order_deliveries.length > 0 && (
             <div className={`mb-8 p-8 rounded-3xl border shadow-xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white/80 border-white/20 backdrop-blur-sm"}`}>
                 <h2 className={`text-2xl font-bold mb-8 ${isDark ? "text-white" : "text-slate-900"}`}>Travail Livré</h2>
                 <DeliveryGallery 
                    images={order.order_deliveries.map((d: any) => d.file_url).filter(Boolean)}
                    title="de la livraison"
                 />
                 {/* External Link */}
                  {order.order_deliveries[0]?.external_link && (
                     <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                         <p className="font-semibold text-slate-900 mb-2">Lien externe:</p>
                         <a href={order.order_deliveries[0].external_link} target="_blank" className="text-blue-600 hover:underline break-all">
                             {order.order_deliveries[0].external_link}
                         </a>
                     </div>
                  )}
             </div>
          )}

           {/* Chat Section */}
            <OrderChat 
                orderId={order.id}
                currentUserId={isAdmin ? "admin" : (order.client_id || "")} 
                recipientId={isAdmin ? "admin" : (order.provider_id || "")}
                recipientName={isAdmin ? "Admin View" : (order.provider?.profile?.first_name || "Prestataire")}
                // If admin, maybe read only or allow chat as system? 
                // For "monitor" mode, usually we just want to see messages.
                // Assuming OrderChat has a read-only mode or we just show it.
            />

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
             {/* Payment Info */}
             <div className={`bg-gradient-to-br p-6 rounded-3xl border shadow-lg ${isDark ? "from-gray-800 to-gray-900 border-gray-700 text-white" : "from-slate-900 to-slate-800 text-white border-transparent"}`}>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Paiement sécurisé
                  </h3>
                   <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-sm opacity-90">
                          <span>Sous-total</span>
                          <span>{formatAmount(convertedValues.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm opacity-90">
                          <span>Frais de service</span>
                          <span>{formatAmount(convertedValues.fees)}</span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center font-bold text-lg">
                          <span>Total payé</span>
                          <span>{formatAmount(convertedValues.total)}</span>
                      </div>
                  </div>
                  {!isAdmin && order.status === 'completed' && (
                     <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2">
                         <Download className="w-4 h-4" /> Télécharger la facture
                     </button>
                  )}
             </div>

             {/* Provider Card (Side) - Only show if simple user viewing, for Admin we have header links */}
             {!isAdmin && order.provider && (
                 <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                               {/* Avatar or Placeholder */}
                               <User className="w-6 h-6 text-slate-400" />
                           </div>
                           <div>
                               <h3 className="font-bold text-slate-900">{order.provider.company_name}</h3>
                               <p className="text-sm text-slate-500">Prestataire</p>
                           </div>
                      </div>
                      <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-sm">
                           Voir le profil
                      </button>
                 </div>
             )}

             {/* Admin Actions */}
             {isAdmin && (
                 <div className={`rounded-3xl border p-6 shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
                      <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          Actions Admin
                      </h3>
                      <div className="space-y-3">
                          <button onClick={onOpenDispute} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors text-left px-4">
                              Forcer l'annulation
                          </button>
                          <button className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors text-left px-4">
                              Contacter les parties
                          </button>
                      </div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return <Shield className={className} />;
}
function Download({ className }: { className?: string }) {
    // Placeholder icon
    return <ArrowLeft className={`rotate-[-90deg] ${className}`} />;
}

