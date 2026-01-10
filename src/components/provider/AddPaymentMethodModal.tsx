"use client";

import { X, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface PaymentMethod {
  id?: string;
  type: string;
  label: string;
  details: string;
  is_default: boolean;
}

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMethod?: PaymentMethod | null;
}

const PAYMENT_TYPES = [
  { value: "paypal", label: "PayPal", icon: "💳", placeholder: "email@example.com" },
  { value: "payoneer", label: "Payoneer", icon: "⚡", placeholder: "email@example.com" },
  { value: "bank", label: "Virement Bancaire", icon: "🏦", placeholder: "FR76 XXXX XXXX XXXX XXXX XXXX XXX" },
  { value: "moncash", label: "Moncash", icon: "📱", placeholder: "+509 XXXX XXXX" },
];

export default function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  editingMethod,
}: AddPaymentMethodModalProps) {
  const [type, setType] = useState("paypal");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Additional fields for bank
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bic, setBic] = useState("");

  useEffect(() => {
    if (editingMethod) {
      setType(editingMethod.type);
      setLabel(editingMethod.label);
      setDetails(editingMethod.details);
      setIsDefault(editingMethod.is_default);
      
      // Parse bank details if editing a bank method
      if (editingMethod.type === "bank" && editingMethod.details) {
        const parts = editingMethod.details.split(" | ");
        if (parts.length >= 3) {
          setBankName(parts[1]);
          setAccountName(parts[2]);
          if (parts[3]) setBic(parts[3]);
        }
      }
    } else {
      // Reset form
      setType("paypal");
      setLabel("");
      setDetails("");
      setIsDefault(false);
      setBankName("");
      setAccountName("");
      setBic("");
    }
    setError("");
  }, [editingMethod, isOpen]);

  const validateForm = () => {
    if (!label.trim()) {
      setError("Le nom est requis");
      return false;
    }

    if (type === "paypal" || type === "payoneer") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(details)) {
        setError("Adresse email invalide");
        return false;
      }
    }

    if (type === "bank") {
      if (!details.trim() || !bankName.trim() || !accountName.trim()) {
        setError("Tous les champs bancaires sont requis");
        return false;
      }
    }

    if (type === "moncash") {
      if (!details.match(/^\+?[0-9\s-()]+$/)) {
        setError("Numéro de téléphone invalide");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Format details for bank
      let finalDetails = details;
      if (type === "bank") {
        finalDetails = `${details} | ${bankName} | ${accountName}${bic ? ` | ${bic}` : ""}`;
      }

      const url = editingMethod
        ? `/api/provider/payment-methods/${editingMethod.id}`
        : "/api/provider/payment-methods";

      const method = editingMethod ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          label,
          details: finalDetails,
          is_default: isDefault,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = PAYMENT_TYPES.find((t) => t.value === type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingMethod ? "Modifier" : "Ajouter"} un mode de paiement
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de paiement
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_TYPES.map((paymentType) => (
                <button
                  key={paymentType.value}
                  type="button"
                  onClick={() => setType(paymentType.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === paymentType.value
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{paymentType.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {paymentType.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom (ex: "Mon PayPal principal")
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="Mon compte PayPal"
              required
            />
          </div>

          {/* Details - Conditional based on type */}
          {type === "bank" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la banque
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Crédit Agricole"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIC/SWIFT (optionnel)
                </label>
                <input
                  type="text"
                  value={bic}
                  onChange={(e) => setBic(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="AGRIFRPP"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "moncash" ? "Numéro de téléphone" : "Adresse email"}
              </label>
              <input
                type={type === "moncash" ? "tel" : "email"}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder={selectedType?.placeholder}
                required
              />
            </div>
          )}

          {/* Set as Default */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700 cursor-pointer">
              Définir comme mode de paiement par défaut
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>{editingMethod ? "Mettre à jour" : "Ajouter"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
