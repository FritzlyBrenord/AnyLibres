"use client";

import { X, Loader2, AlertCircle, Wallet, Plus, ArrowDownToLine, Clock } from "lucide-react";
import PaymentMethodCard from "@/components/provider/PaymentMethodCard";

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  is_default: boolean;
  verified: boolean;
  icon?: string;
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAmountCents: number;
  selectedCurrency: string;
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
  onSetDefault: (id: string) => Promise<void>;
  onEditPaymentMethod: (method: PaymentMethod) => void;
  onDeletePaymentMethod: (id: string) => Promise<void>;
  withdrawalFeePercentage: number;
  timeRemaining: number;
  accountFrozen?: boolean; // 🆕 Nouveau: statut du compte gelé
  onSubmit: (amount: number, paymentMethodId: string) => Promise<void>;
  ConvertedAmountComponent: React.ComponentType<{ amountCents: number; selectedCurrency: string }>;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  availableAmountCents,
  selectedCurrency,
  paymentMethods,
  onAddPaymentMethod,
  onSetDefault,
  onEditPaymentMethod,
  onDeletePaymentMethod,
  withdrawalFeePercentage,
  timeRemaining,
  accountFrozen = false, // 🆕 Par défaut: false (compte actif)
  onSubmit,
  ConvertedAmountComponent,
}: WithdrawalModalProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const MIN_AMOUNT = 20;
  const MAX_AMOUNT = 5000;
  const available = availableAmountCents / 100;
  const hasInsufficientBalance = available < MIN_AMOUNT;

  // Auto-select default payment method
  useEffect(() => {
    const defaultMethod = paymentMethods.find((m) => m.is_default);
    if (defaultMethod && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultMethod.id);
    }
  }, [paymentMethods]);

  // Reset on open/close and check balance
  useEffect(() => {
    if (isOpen) {
      setWithdrawalAmount("");

      // 🔒 Vérifier si le compte est gelé
      if (accountFrozen) {
        setError(
          "🔒 Compte gelé - Retraits bloqués. Contactez le support pour plus d'informations."
        );
      }
      // Auto-set error if insufficient balance
      else if (hasInsufficientBalance) {
        setError(
          `Solde insuffisant. Minimum requis: ${MIN_AMOUNT}€ • Votre solde: ${available.toFixed(2)}€`
        );
      } else {
        setError("");
      }
    }
  }, [isOpen, hasInsufficientBalance, available, accountFrozen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 🔒 Bloquer immédiatement si compte gelé
    if (accountFrozen) {
      setError("🔒 Compte gelé - Impossible d'effectuer un retrait. Contactez le support.");
      return;
    }

    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount < MIN_AMOUNT) {
      setError(`Le montant minimum est de ${MIN_AMOUNT}€`);
      return;
    }

    if (amount > Math.min(available, MAX_AMOUNT)) {
      setError(`Le montant maximum est de ${Math.min(available, MAX_AMOUNT).toFixed(2)}€`);
      return;
    }

    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    if (timeRemaining > 0) {
      setError("Vous devez attendre 24h entre deux retraits");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(amount, selectedPaymentMethod);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors du retrait");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const amount = parseFloat(withdrawalAmount) || 0;
  const fee = amount * (withdrawalFeePercentage / 100);
  const netAmount = amount - fee;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header avec gradient */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 rounded-t-3xl overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 animate-pulse"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ArrowDownToLine className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Retirer vos gains</h2>
                <p className="text-emerald-100 text-sm mt-1">Transférez vos gains vers votre compte</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* 🔒 Account Frozen Warning */}
          {accountFrozen && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-700 rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    🔒 Compte Gelé
                  </h4>
                  <p className="text-red-50 font-medium mb-3">
                    Votre compte a été temporairement gelé. Tous les retraits sont bloqués.
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-sm text-white font-semibold">
                      📧 Veuillez contacter le support pour plus d&apos;informations et débloquer votre compte.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer Warning */}
          {timeRemaining > 0 && !accountFrozen && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">Prochain retrait disponible dans</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {Math.floor(timeRemaining)}h {Math.round((timeRemaining % 1) * 60)}min
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 24) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Available Balance */}
          <div className={`rounded-2xl p-6 border-2 ${
            accountFrozen
              ? 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400 opacity-60'
              : hasInsufficientBalance
              ? 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-red-300'
              : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className={`w-6 h-6 ${hasInsufficientBalance ? 'text-red-600' : 'text-emerald-600'}`} />
              <p className={`text-sm font-semibold ${hasInsufficientBalance ? 'text-red-700' : 'text-emerald-700'}`}>
                Solde disponible
              </p>
            </div>
            <p className={`text-4xl font-bold bg-gradient-to-r ${
              hasInsufficientBalance 
                ? 'from-red-600 to-orange-600' 
                : 'from-emerald-600 to-teal-600'
            } bg-clip-text text-transparent`}>
              <ConvertedAmountComponent amountCents={availableAmountCents} selectedCurrency={selectedCurrency} />
            </p>
            
            {hasInsufficientBalance ? (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-xs font-semibold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Solde insuffisant pour effectuer un retrait
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Minimum requis: {MIN_AMOUNT}€ • Votre solde: {available.toFixed(2)}€
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 mt-2">
                ⓘ Minimum: {MIN_AMOUNT}€ • Maximum: {MAX_AMOUNT}€ • Frais: {withdrawalFeePercentage}%
              </p>
            )}
          </div>

          {/* Payment Methods Section */}
          <div className={accountFrozen || hasInsufficientBalance ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Mode de paiement</h3>
              <button
                type="button"
                onClick={onAddPaymentMethod}
                disabled={accountFrozen || hasInsufficientBalance}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">Aucun mode de paiement</p>
                <p className="text-sm text-gray-500 mb-4">Ajoutez votre premier mode de paiement pour commencer</p>
                <button
                  type="button"
                  onClick={onAddPaymentMethod}
                  disabled={hasInsufficientBalance}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un mode de paiement
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => !hasInsufficientBalance && setSelectedPaymentMethod(method.id)}
                    className={`cursor-pointer transition-all ${
                      selectedPaymentMethod === method.id ? "ring-2 ring-emerald-500 ring-offset-2" : ""
                    } ${hasInsufficientBalance ? 'cursor-not-allowed' : ''}`}
                  >
                    <PaymentMethodCard
                      method={method}
                      onSetDefault={onSetDefault}
                      onEdit={onEditPaymentMethod}
                      onDelete={onDeletePaymentMethod}
                      disabled={timeRemaining > 0 || hasInsufficientBalance}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Montant à retirer (€)
            </label>
            <div className="relative">
              <input
                type="number"
                min={MIN_AMOUNT}
                max={Math.min(available, MAX_AMOUNT)}
                step="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                disabled={accountFrozen || timeRemaining > 0 || hasInsufficientBalance}
                className={`w-full px-6 py-4 text-2xl font-bold border-2 rounded-xl transition-all ${
                  accountFrozen || timeRemaining > 0 || hasInsufficientBalance
                    ? 'opacity-50 bg-gray-100 border-gray-300 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                placeholder={accountFrozen ? "🔒 Compte gelé" : hasInsufficientBalance ? "Solde insuffisant" : "0.00"}
                required
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setWithdrawalAmount(MIN_AMOUNT.toString())}
                disabled={timeRemaining > 0 || hasInsufficientBalance}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Min ({MIN_AMOUNT}€)
              </button>
              <button
                type="button"
                onClick={() => setWithdrawalAmount(Math.min(available, MAX_AMOUNT).toFixed(2))}
                disabled={timeRemaining > 0 || hasInsufficientBalance}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Max ({Math.min(available, MAX_AMOUNT).toFixed(2)}€)
              </button>
            </div>
          </div>

          {/* Summary */}
          {amount >= MIN_AMOUNT && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span> Récapitulatif
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Montant demandé</span>
                  <span className="font-semibold">{amount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Frais ({withdrawalFeePercentage}%)</span>
                  <span className="font-semibold">-{fee.toFixed(2)} €</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Vous recevrez</span>
                  <span className="text-2xl font-bold text-emerald-600">{netAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={accountFrozen || submitting || timeRemaining > 0 || hasInsufficientBalance || !selectedPaymentMethod || amount < MIN_AMOUNT}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Traitement...
                </>
              ) : accountFrozen ? (
                <>
                  <AlertCircle className="w-6 h-6" />
                  🔒 Compte Gelé
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-6 h-6" />
                  {hasInsufficientBalance ? "Solde insuffisant" : "Confirmer le retrait"}
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-800">
              💡 Les retraits sont traités sous 2-5 jours ouvrables. Un seul retrait autorisé toutes les 24h.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Missing import (add at top of component)
import { useState, useEffect } from "react";
