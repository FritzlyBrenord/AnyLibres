// components/OrderRefundModal.tsx
import React, { useState } from "react";
import {
  X,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Shield,
  Info,
} from "lucide-react";

interface OrderRefundModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string, amount?: number) => void;
  processing: boolean;
  orderAmount: number;
}

const OrderRefundModal: React.FC<OrderRefundModalProps> = ({
  open,
  onClose,
  onConfirm,
  processing,
  orderAmount,
}) => {
  const [refundReason, setRefundReason] = useState("");
  const [refundDetails, setRefundDetails] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<number>(orderAmount);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");

  const refundReasons = [
    {
      id: "service_not_delivered",
      label: "Service non livré",
      description: "Le prestataire n'a pas livré le service promis",
      icon: AlertTriangle,
    },
    {
      id: "quality_issue",
      label: "Problème de qualité",
      description: "La qualité du travail ne correspond pas aux attentes",
      icon: CheckCircle,
    },
    {
      id: "delayed_delivery",
      label: "Livraison en retard",
      description: "Le prestataire a dépassé les délais convenus",
      icon: CreditCard,
    },
    {
      id: "not_as_described",
      label: "Non conforme à la description",
      description: "Le résultat ne correspond pas à la description du service",
      icon: Info,
    },
    {
      id: "other",
      label: "Autre raison",
      description: "Une autre raison justifiant un remboursement",
      icon: Shield,
    },
  ];

  const handleReasonSelect = (reason: (typeof refundReasons)[0]) => {
    setSelectedReason(reason.id);
    setRefundReason(reason.label);
  };

  const handleSubmit = () => {
    if (!refundReason.trim()) {
      alert("Veuillez sélectionner une raison de remboursement");
      return;
    }
    onConfirm(refundReason, refundDetails, refundAmount);
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2) + " €";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-200">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Demander un remboursement
            </h2>
            <p className="text-slate-600">
              Soumettez votre demande de remboursement
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Montant du remboursement */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-900 text-lg mb-4">
              Montant du remboursement
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">
                  Montant total de la commande :
                </span>
                <span className="font-bold text-slate-900">
                  {formatAmount(orderAmount)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRefundType("full");
                    setRefundAmount(orderAmount);
                  }}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all duration-300 ${
                    refundType === "full"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-semibold">Remboursement total</p>
                    <p className="text-sm">{formatAmount(orderAmount)}</p>
                  </div>
                </button>

                <button
                  onClick={() => setRefundType("partial")}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all duration-300 ${
                    refundType === "partial"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-semibold">Remboursement partiel</p>
                    <p className="text-sm">Montant personnalisé</p>
                  </div>
                </button>
              </div>

              {refundType === "partial" && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Montant du remboursement
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={refundAmount / 100}
                      onChange={(e) =>
                        setRefundAmount(
                          Math.round(parseFloat(e.target.value) * 100)
                        )
                      }
                      min="0"
                      max={orderAmount / 100}
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-3 text-slate-500">
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Montant maximum : {formatAmount(orderAmount)}</span>
                    <span>{formatAmount(refundAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raisons de remboursement */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">
              Raison du remboursement
            </h3>

            <div className="grid gap-3">
              {refundReasons.map((reason) => {
                const ReasonIcon = reason.icon;
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedReason === reason.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedReason === reason.id
                            ? "bg-purple-100 text-purple-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <ReasonIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {reason.label}
                        </p>
                        <p className="text-sm text-slate-600">
                          {reason.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          selectedReason === reason.id
                            ? "bg-purple-500 border-purple-500"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedReason === reason.id && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Détails supplémentaires */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Détails supplémentaires
            </label>
            <textarea
              value={refundDetails}
              onChange={(e) => setRefundDetails(e.target.value)}
              placeholder="Décrivez en détail pourquoi vous demandez un remboursement. Soyez aussi précis que possible pour faciliter le traitement de votre demande..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-300 placeholder-slate-400"
              maxLength={2000}
            />
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>
                Plus vous serez précis, plus le traitement sera rapide
              </span>
              <span>{refundDetails.length}/2000</span>
            </div>
          </div>

          {/* Informations de traitement */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">
                  Traitement de votre demande
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Notre équipe examinera votre demande sous 48 heures</li>
                  <li>• Le prestataire sera contacté pour son avis</li>
                  <li>
                    • Le remboursement sera traité sous 5-7 jours ouvrables
                  </li>
                  <li>• Vous serez notifié à chaque étape du processus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            disabled={processing || !selectedReason}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Soumettre la demande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderRefundModal;
