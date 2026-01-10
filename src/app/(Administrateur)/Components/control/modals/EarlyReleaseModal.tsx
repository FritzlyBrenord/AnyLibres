// components/admin/control/modals/EarlyReleaseModal.tsx
"use client";

import React, { useState } from "react";
import { X, User, Users, Folder, Calendar, AlertCircle } from "lucide-react";

interface EarlyReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const EarlyReleaseModal = ({
  isOpen,
  onClose,
  isDark,
}: EarlyReleaseModalProps) => {
  const [scope, setScope] = useState<"single" | "category" | "all">("single");
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique de libération anticipée
    console.log({ scope, userId, category, reason, amount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg ${
                isDark ? "bg-emerald-900/30" : "bg-emerald-100"
              }`}
            >
              <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold">Libération Anticipée</h3>
              <p className="text-sm opacity-75">
                Débloquer des fonds avant la date normale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Scope Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Portée de la libération
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setScope("single")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  scope === "single"
                    ? isDark
                      ? "border-emerald-500 bg-emerald-900/20"
                      : "border-emerald-500 bg-emerald-50"
                    : isDark
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <User className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Utilisateur unique</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("category")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  scope === "category"
                    ? isDark
                      ? "border-emerald-500 bg-emerald-900/20"
                      : "border-emerald-500 bg-emerald-50"
                    : isDark
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Folder className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Par catégorie</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  scope === "all"
                    ? isDark
                      ? "border-emerald-500 bg-emerald-900/20"
                      : "border-emerald-500 bg-emerald-50"
                    : isDark
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Tous les utilisateurs</span>
              </button>
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="space-y-4 mb-6">
            {scope === "single" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID Utilisateur
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Ex: user_123456..."
                  required
                />
              </div>
            )}

            {scope === "category" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="vip">VIP</option>
                  <option value="new">Nouveaux prestataires</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Montant (optionnel)
              </label>
              <div className="relative">
                <span
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  €
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Laisser vide pour tout débloquer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Raison de la libération anticipée
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
                placeholder="Ex: Client VIP, demande urgente, problème technique..."
                required
              />
            </div>
          </div>

          {/* Warning */}
          <div
            className={`p-4 rounded-lg mb-6 ${
              isDark
                ? "bg-yellow-900/20 border-yellow-800"
                : "bg-yellow-50 border-yellow-200"
            } border`}
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  Attention
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400/80 mt-1">
                  Cette action bypassera les délais de sécurité standard.
                  Assurez-vous de la légitimité de la demande.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition"
            >
              Confirmer la libération
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EarlyReleaseModal;
