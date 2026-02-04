"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  DollarSign,
  MessageSquare,
  Send,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { useCurrency } from "@/hooks/useCurrency";

const REFUND_REASONS = [
  { value: "client_request", label: "client_request" },
  { value: "quality_issue", label: "quality_issue" },
  { value: "not_delivered", label: "not_delivered" },
  { value: "order_cancelled", label: "order_cancelled" },
  { value: "payment_error", label: "payment_error" },
  { value: "duplicate_payment", label: "duplicate_payment" },
  { value: "other", label: "other" },
];

interface RefundRequest {
  id: string;
  order_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reason: string;
  reason_details?: string;
  admin_notes?: string;
  refunded_at?: string;
  created_at: string;
}

interface RefundModalProps {
  orderId: string;
  orderTotal: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundModal({
  orderId,
  orderTotal,
  isOpen,
  onClose,
  onSuccess,
}: RefundModalProps) {
  const { t } = useSafeLanguage();
  const { formatAmount } = useCurrency();
  const [amount, setAmount] = useState(orderTotal);
  const [reason, setReason] = useState("client_request");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation du montant
    const amountCents = Math.round(amount * 100);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError(t('orders.refunds.validation.minAmount'));
      setLoading(false);
      return;
    }
    if (amountCents <= 0) {
      setError(t('orders.refunds.validation.minAmount'));
      setLoading(false);
      return;
    }
    if (amount > orderTotal) {
      setError(t('orders.refunds.validation.maxAmount', { amount: orderTotal.toFixed(2) }));
      setLoading(false);
      return;
    }

    try {
      console.log("Sending refund request:", {
        order_id: orderId,
        amount_cents: amountCents,
        reason,
        reason_details: details,
      });

      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          amount_cents: amountCents,
          reason,
          reason_details: details,
        }),
      });

      console.log("Response status:", response.status);

      let data;
      try {
        const text = await response.text();
        console.log("Response text:", text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setError(t('orders.refunds.validation.readError'));
        return;
      }

      if (!response.ok) {
        // Afficher le message détaillé si disponible
        const errorMessage = data.details || data.error || t('orders.refunds.validation.genericError');
        setError(errorMessage);
        console.error("Refund API error:", data);
        return;
      }

      if (!data.success) {
        setError(data.error || t('orders.refunds.validation.genericError'));
        console.error("Refund API returned error:", data);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Refund request error:", err);
      setError(t('orders.refunds.validation.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('orders.refunds.title')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('orders.amount')}
                </label>
                <div className="relative">
                   <input
                    type="number"
                    step="0.01"
                    max={orderTotal}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">
                    {t('orders.refunds.labels.max')}: {formatAmount(orderTotal)}
                  </span>
                </div>
              </div>

              {/* Raison */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('orders.detail.disputeReason')}
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(`orders.refunds.reasons.${r.value}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Détails */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('orders.detail.disputeDetails')}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('orders.refunds.placeholders.details')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  {t('orders.detail.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('orders.refunds.labels.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('orders.detail.dispute')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RefundStatusBadgeProps {
  status: string;
}

export function RefundStatusBadge({ status }: RefundStatusBadgeProps) {
  const { t } = useSafeLanguage();
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="w-4 h-4" />,
      label: t('orders.refunds.status.pending'),
    },
    approved: {
      color: "bg-blue-100 text-blue-800",
      icon: <Clock className="w-4 h-4" />,
      label: t('orders.refunds.status.approved'),
    },
    processing: {
      color: "bg-blue-100 text-blue-800",
      icon: <Clock className="w-4 h-4" />,
      label: t('orders.refunds.status.processing'),
    },
    completed: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle className="w-4 h-4" />,
      label: t('orders.refunds.status.completed'),
    },
    rejected: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="w-4 h-4" />,
      label: t('orders.refunds.status.rejected'),
    },
    failed: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="w-4 h-4" />,
      label: t('orders.refunds.status.failed'),
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

interface RefundListProps {
  refunds: RefundRequest[];
  loading?: boolean;
}

export function RefundList({ refunds, loading }: RefundListProps) {
  const { t, language } = useSafeLanguage();
  const { formatAmount } = useCurrency();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">{t('orders.detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">{t('orders.refunds.noRefunds')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {refunds.map((refund) => (
        <motion.div
          key={refund.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
             <div>
              <h4 className="font-medium text-gray-900">
                {t('orders.refunds.title')} : {formatAmount(refund.amount_cents / 100)}
              </h4>
              <p className="text-sm text-gray-500">
                {t('orders.refunds.labels.requestedAt')} {new Date(refund.created_at).toLocaleDateString(language || "fr-FR")}
              </p>
            </div>
            <RefundStatusBadge status={refund.status} />
          </div>

          {refund.reason_details && (
            <div className="bg-gray-50 rounded p-2 mb-3">
              <p className="text-sm text-gray-700">{refund.reason_details}</p>
            </div>
          )}

          {refund.admin_notes && (
            <div className="bg-blue-50 rounded p-2 mb-3 border border-blue-200">
              <p className="text-xs font-medium text-blue-900 mb-1">{t('orders.refunds.labels.adminNotes')}</p>
              <p className="text-sm text-blue-800">{refund.admin_notes}</p>
            </div>
          )}

          {refund.refunded_at && (
            <p className="text-xs text-green-600">
              ✓ {t('orders.refunds.labels.refundedAt')} {new Date(refund.refunded_at).toLocaleDateString(language || "fr-FR")}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
