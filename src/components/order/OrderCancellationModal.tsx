// components/OrderCancellationModal.tsx
import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  MessageSquare,
  CreditCard,
  Clock,
  User,
  Shield,
} from "lucide-react";

interface OrderCancellationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => void;
  processing: boolean;
}

const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
  open,
  onClose,
  onConfirm,
  processing,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationDetails, setCancellationDetails] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const cancellationReasons = [
    {
      id: "change_mind",
      label: "J'ai changé d'avis",
      description: "Je ne souhaite plus continuer cette commande",
      icon: User,
    },
    {
      id: "found_alternative",
      label: "J'ai trouvé une autre solution",
      description: "J'ai choisi un autre prestataire ou méthode",
      icon: CreditCard,
    },
    {
      id: "timing_issue",
      label: "Problème de timing",
      description: "Les délais ne me conviennent plus",
      icon: Clock,
    },
    {
      id: "communication_issue",
      label: "Problème de communication",
      description: "Difficulté à communiquer avec le prestataire",
      icon: MessageSquare,
    },
    {
      id: "other",
      label: "Autre raison",
      description: "Une autre raison non listée",
      icon: AlertTriangle,
    },
  ];

  const handleReasonSelect = (reason: (typeof cancellationReasons)[0]) => {
    setSelectedReason(reason.id);
    setCancellationReason(reason.label);
  };

  const handleSubmit = () => {
    if (!cancellationReason.trim()) {
      alert("Veuillez sélectionner une raison d'annulation");
      return;
    }
    onConfirm(cancellationReason, cancellationDetails);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-200">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Annuler la commande
            </h2>
            <p className="text-slate-600">
              Cette action est irréversible. Veuillez nous indiquer la raison.
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
          {/* Avertissement important */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm mb-1">
                  Important à savoir
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• L'annulation est définitive et irréversible</li>
                  <li>• Le prestataire sera notifié de votre décision</li>
                  <li>
                    • Les fonds vous seront remboursés selon notre politique
                  </li>
                  <li>
                    • Vous pourrez toujours contacter le support si besoin
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Raisons d'annulation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">
              Pourquoi souhaitez-vous annuler ?
            </h3>

            <div className="grid gap-3">
              {cancellationReasons.map((reason) => {
                const ReasonIcon = reason.icon;
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedReason === reason.id
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedReason === reason.id
                            ? "bg-red-100 text-red-600"
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
                            ? "bg-red-500 border-red-500"
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
              Détails supplémentaires (optionnel)
            </label>
            <textarea
              value={cancellationDetails}
              onChange={(e) => setCancellationDetails(e.target.value)}
              placeholder="Expliquez plus en détail les raisons de votre annulation..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all duration-300 placeholder-slate-400"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>Ces informations aident à améliorer notre service</span>
              <span>{cancellationDetails.length}/1000</span>
            </div>
          </div>

          {/* Politique de remboursement */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">
                  Politique de remboursement
                </p>
                <p className="text-blue-700 text-sm">
                  Votre remboursement sera traité sous 5-7 jours ouvrables. Le
                  montant total vous sera intégralement remboursé, frais de
                  service inclus.
                </p>
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
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Confirmer l'annulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCancellationModal;
