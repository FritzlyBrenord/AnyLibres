"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface ClientBalance {
  id: string;
  available_cents: number;
  pending_withdrawal_cents: number;
  withdrawn_cents: number;
  total_received_cents: number;
  currency: string;
}

interface ClientBalancePanelProps {
  balance: ClientBalance | null;
  loading?: boolean;
}

export function ClientBalancePanel({
  balance,
  loading,
}: ClientBalancePanelProps) {
  const { t } = useSafeLanguage();
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  const available = (balance?.available_cents || 0) / 100;
  const pending = (balance?.pending_withdrawal_cents || 0) / 100;
  const total = (balance?.total_received_cents || 0) / 100;

  return (
    <div className="space-y-4">
      {/* Balance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
             <div>
              <p className="text-purple-100 text-sm">{t('orders.tabs.balance')}</p>
              <p className="text-white text-xs">{t('orders.balance.available')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-white/70 hover:text-white"
          >
            {showBalance ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold">
            {showBalance ? `€${available.toFixed(2)}` : "••••"}
          </div>
           <p className="text-purple-100 text-sm mt-1">
            {t('orders.balance.received')}: €{total.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/10 rounded-lg p-3">
            <p className="text-purple-100 text-xs mb-1">{t('orders.balance.pending')}</p>
            <p className="text-lg font-semibold">€{pending.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setWithdrawalOpen(true)}
            className="bg-white text-purple-600 rounded-lg p-3 hover:bg-purple-50 transition-colors font-semibold flex items-center justify-center gap-2"
          >
             <Download className="w-5 h-5" />
            <span>{t('orders.balance.withdraw')}</span>
          </button>
        </div>
      </motion.div>

      {/* Transaction History */}
      {balance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
           <h3 className="font-bold text-lg text-gray-900 mb-4">
            {t('orders.balance.sectionTitle')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                 <div>
                  <p className="text-sm font-medium text-gray-900">{t('orders.status.completed')}</p>
                  <p className="text-xs text-gray-600">{t('orders.balance.ready')}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">
                €{available.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('orders.balance.processing')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('orders.balance.processing')}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-yellow-600">
                €{pending.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                   <p className="text-sm font-medium text-gray-900">
                    {t('orders.balance.received')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('orders.balance.sinceStart')}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">
                €{total.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalOpen}
        onClose={() => setWithdrawalOpen(false)}
        available={available}
        onSuccess={() => {
          setWithdrawalOpen(false);
          // Refresh balance
          window.location.reload();
        }}
      />
    </div>
  );
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  available: number;
  onSuccess: () => void;
}

 function WithdrawalModal({
  isOpen,
  onClose,
  available,
  onSuccess,
}: WithdrawalModalProps) {
  const { t } = useSafeLanguage();
  const [amount, setAmount] = useState(available);
  const [method, setMethod] = useState("stripe");
  const [accountInfo, setAccountInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/client-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: Math.round(amount * 100),
          payment_method: method,
          payment_details: {
            account_info: accountInfo,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('orders.balance.errors.createFailed'));
        return;
      }

      onSuccess();
    } catch (err) {
      setError(t('orders.balance.errors.createFailed'));
      console.error(err);
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
              <h2 className="text-2xl font-bold text-gray-900">{t('orders.balance.withdraw')}</h2>
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
                  {t('orders.balance.amountToWithdraw')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                    {t('orders.balance.max')}: €{available.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('orders.balance.paymentMethod')}
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="stripe">{t('orders.balance.methods.stripe')}</option>
                  <option value="paypal">{t('orders.balance.methods.paypal')}</option>
                  <option value="bank_transfer">{t('orders.balance.methods.bank_transfer')}</option>
                </select>
              </div>

              {/* Info compte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {method === "stripe" && t('orders.balance.methods.stripeEmail')}
                  {method === "paypal" && t('orders.balance.methods.paypalEmail')}
                  {method === "bank_transfer" && t('orders.balance.methods.iban')}
                </label>
                <input
                  type="text"
                  value={accountInfo}
                  onChange={(e) => setAccountInfo(e.target.value)}
                  placeholder={
                    method === "stripe"
                      ? t('orders.balance.placeholders.stripe')
                      : method === "paypal"
                      ? t('orders.balance.placeholders.paypal')
                      : t('orders.balance.placeholders.bank_transfer')
                  }
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  ℹ️ {t('orders.balance.withdrawInfo')}
                </p>
              </div>

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
                  disabled={loading || amount <= 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('orders.detail.loading')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {t('orders.balance.withdraw')}
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
