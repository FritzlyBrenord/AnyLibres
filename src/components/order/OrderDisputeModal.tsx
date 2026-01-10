// components/OrderDisputeModal.tsx
import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  Scale,
  MessageSquare,
  FileText,
  Shield,
} from "lucide-react";

interface OrderDisputeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details: string) => void;
  processing: boolean;
}

const OrderDisputeModal: React.FC<OrderDisputeModalProps> = ({
  open,
  onClose,
  onConfirm,
  processing,
}) => {
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const disputeReasons = [
    {
      id: "quality_dispute",
      label: "Litige qualité",
      description: "La qualité du travail ne correspond pas aux standards",
      icon: AlertTriangle,
    },
    {
      id: "delivery_dispute",
      label: "Litige livraison",
      description: "Problème avec la livraison ou les délais",
      icon: FileText,
    },
    {
      id: "communication_dispute",
      label: "Litige communication",
      description: "Problème de communication avec le prestataire",
      icon: MessageSquare,
    },
    {
      id: "terms_violation",
      label: "Violation des termes",
      description: "Le prestataire n'a pas respecté les termes du service",
      icon: Scale,
    },
  ];

  const handleReasonSelect = (reason: (typeof disputeReasons)[0]) => {
    setSelectedReason(reason.id);
    setDisputeReason(reason.label);
  };

  const handleSubmit = () => {
    if (!disputeReason.trim() || !disputeDetails.trim()) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    onConfirm(disputeReason, disputeDetails);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in-90 zoom-in-95">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-200">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Ouvrir un litige
            </h2>
            <p className="text-slate-600">
              Notre équipe va examiner votre cas et trouver une solution
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
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 text-sm mb-1">
                  Processus de litige
                </p>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• Notre équipe examinera les deux parties</li>
                  <li>• Nous pouvons demander des preuves supplémentaires</li>
                  <li>• La décision sera prise sous 3-5 jours ouvrables</li>
                  <li>• Les deux parties seront informées de la résolution</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Type de litige */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">
              Type de litige
            </h3>

            <div className="grid gap-3">
              {disputeReasons.map((reason) => {
                const ReasonIcon = reason.icon;
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedReason === reason.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedReason === reason.id
                            ? "bg-orange-100 text-orange-600"
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
                            ? "bg-orange-500 border-orange-500"
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

          {/* Détails du litige */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Détails du litige *
            </label>
            <textarea
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              placeholder="Décrivez en détail le problème. Incluez toutes les informations pertinentes, les échanges avec le prestataire, les preuves que vous avez, et la résolution que vous souhaitez..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-300 placeholder-slate-400"
              maxLength={3000}
              required
            />
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>
                Plus vous serez détaillé, plus nous pourrons vous aider
                rapidement
              </span>
              <span>{disputeDetails.length}/3000</span>
            </div>
          </div>

          {/* Conseils */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">
                  Conseils pour un litige efficace
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Soyez factuel et évitez les émotions</li>
                  <li>• Incluez des captures d'écran si possible</li>
                  <li>• Mentionnez les dates et heures importantes</li>
                  <li>• Proposez une solution raisonnable</li>
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
            disabled={processing || !selectedReason || !disputeDetails.trim()}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                Ouvrir le litige
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDisputeModal;
