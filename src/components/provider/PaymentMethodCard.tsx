"use client";

import { CreditCard, Trash2, Edit, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  is_default: boolean;
  verified: boolean;
  icon?: string;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => Promise<void>;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

const PAYMENT_METHOD_ICONS: Record<string, string> = {
  paypal: "💳",
  bank: "🏦",
  payoneer: "⚡",
  moncash: "📱",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  paypal: "from-blue-500 to-blue-600",
  bank: "from-green-500 to-green-600",
  payoneer: "from-orange-500 to-orange-600",
  moncash: "from-purple-500 to-purple-600",
};

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onEdit,
  onDelete,
  disabled = false,
}: PaymentMethodCardProps) {
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSetDefault = async () => {
    if (disabled || method.is_default) return;
    setIsSettingDefault(true);
    try {
      await onSetDefault(method.id);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDelete = async () => {
    if (disabled) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce mode de paiement ?")) return;
    setIsDeleting(true);
    try {
      await onDelete(method.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const icon = PAYMENT_METHOD_ICONS[method.type] || "💳";
  const gradientColor = PAYMENT_METHOD_COLORS[method.type] || "from-gray-500 to-gray-600";

  return (
    <div
      className={`group relative bg-white rounded-xl border-2 transition-all duration-300 ${
        method.is_default
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      } ${disabled || isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center text-2xl shadow-md`}>
            {icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{method.label}</h4>
              {method.is_default && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  <Check className="w-3 h-3" />
                  Défaut
                </span>
              )}
              {method.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  ✓ Vérifié
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{method.details}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{method.type}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {!method.is_default && (
              <button
                onClick={handleSetDefault}
                disabled={disabled || isSettingDefault}
                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                title="Définir par défaut"
              >
                {isSettingDefault ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => onEdit(method)}
              disabled={disabled}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={disabled || isDeleting}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Glow effect for default */}
      {method.is_default && (
        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl opacity-50"></div>
      )}
    </div>
  );
}
