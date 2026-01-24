"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Heart,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Users,
  User,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";

interface Recipient {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
}

interface Donation {
  id: string;
  recipient_id: string;
  recipient_type: string;
  recipient_name: string;
  recipient_email?: string;
  amount_cents: number;
  currency: string;
  reason: string;
  created_at: string;
}

interface AdminDonationPanelProps {
  isDark?: boolean;
}

export function AdminDonationPanel({ isDark = false }: AdminDonationPanelProps) {
  const { defaultCurrency, convertFromUSD, formatAmount } = useCurrency();
  const [recipientType, setRecipientType] = useState<"client" | "provider">("client");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Historique des dons
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Charger l'historique des dons
  const fetchDonations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/admin/donation?limit=20", {
        headers: { "isAdmin": "true" },
      });
      const data = await response.json();
      if (data.success) {
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Charger l'historique au montage
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Chercher les recipients
  useEffect(() => {
    const handleSearch = async (query: string) => {
      if (!query.trim() || query.trim().length < 2) {
        setRecipients([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `/api/admin/donation/recipients?type=${recipientType}&search=${encodeURIComponent(query)}`,
          { headers: { "isAdmin": "true" } }
        );
        const data = await response.json();
        if (data.success) {
          setRecipients(data.recipients || []);
        }
      } catch (err) {
        console.error("Error searching recipients:", err);
        setRecipients([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, recipientType]);

  // Soumettre le don
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipient || !amount || parseFloat(amount) <= 0) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "isAdmin": "true",
        },
        body: JSON.stringify({
          recipient_id: selectedRecipient.id,
          recipient_type: recipientType,
          amount_cents: Math.round(parseFloat(amount) * 100),
          reason: reason || `Don à ${recipientType}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors du don");
        return;
      }

      const recipientName = selectedRecipient.display_name ||
        [selectedRecipient.first_name, selectedRecipient.last_name].filter(Boolean).join(" ") ||
        selectedRecipient.email;

      setSuccess(
        `Don de ${formatAmount(parseFloat(amount))} envoyé à ${recipientName}`
      );
      setAmount("");
      setReason("");
      setSelectedRecipient(null);
      setSearchQuery("");
      setRecipients([]);

      // Recharger l'historique
      fetchDonations();

      // Reset après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erreur lors du don");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire de don */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl p-6 shadow-lg border`}
      >
        <h3
          className={`text-xl font-bold mb-6 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          <Heart className="w-6 h-6 text-red-600" />
          Faire un Don
        </h3>

        <form onSubmit={handleDonate} className="space-y-4">
          {/* Messages de statut */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg flex gap-3 ${
                  isDark
                    ? "bg-red-900/30 border border-red-800"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg flex gap-3 ${
                  isDark
                    ? "bg-green-900/30 border border-green-800"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                <p className={`text-sm ${isDark ? "text-green-300" : "text-green-700"}`}>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type de destinataire */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Type de destinataire
            </label>
            <div className="flex gap-2">
              {[
                { value: "client", label: "Client", icon: User },
                { value: "provider", label: "Prestataire", icon: Users },
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setRecipientType(type.value as "client" | "provider");
                      setSelectedRecipient(null);
                      setRecipients([]);
                      setSearchQuery("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                      recipientType === type.value
                        ? "bg-purple-600 text-white"
                        : isDark
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recherche de destinataire */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Chercher un destinataire
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              {searching && (
                <Loader2 className={`absolute right-3 top-2.5 w-5 h-5 animate-spin ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Chercher par nom ou email...`}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />

              {/* Dropdown de résultats */}
              <AnimatePresence>
                {recipients.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-y-auto z-20 ${
                      isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                    }`}
                  >
                    {recipients.map((recipient) => (
                      <button
                        key={recipient.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(recipient);
                          setSearchQuery("");
                          setRecipients([]);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${
                          isDark
                            ? "hover:bg-gray-600 border-gray-600"
                            : "hover:bg-purple-50 border-gray-100"
                        }`}
                      >
                        <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {recipient.display_name ||
                            [recipient.first_name, recipient.last_name].filter(Boolean).join(" ") ||
                            recipient.email}
                        </p>
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {recipient.email}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Destinataire sélectionné */}
            <AnimatePresence>
              {selectedRecipient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mt-2 p-3 rounded-lg border ${
                    isDark
                      ? "bg-purple-900/30 border-purple-700"
                      : "bg-purple-50 border-purple-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDark ? "bg-purple-800" : "bg-purple-100"
                      }`}>
                        {recipientType === "client" ? (
                          <User className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                        ) : (
                          <Users className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {selectedRecipient.display_name ||
                            [selectedRecipient.first_name, selectedRecipient.last_name].filter(Boolean).join(" ") ||
                            selectedRecipient.email}
                        </p>
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {selectedRecipient.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipient(null)}
                      className={`p-1 rounded-full transition-colors ${
                        isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                      }`}
                    >
                      <X className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Montant */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Montant ({defaultCurrency?.symbol || "€"})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Raison (optionnel) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Raison (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Bonus pour excellente performance..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              rows={2}
            />
          </div>

          {/* Info */}
          <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
            <p className={`text-xs ${isDark ? "text-blue-300" : "text-blue-800"}`}>
              Le montant sera déduit de votre solde admin et ajouté automatiquement au solde disponible du destinataire.
            </p>
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={loading || !selectedRecipient || !amount || parseFloat(amount) <= 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Envoyer le don
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Historique des dons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl p-6 shadow-lg border`}
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`w-full flex items-center justify-between mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            Historique des Dons
          </h3>
          {showHistory ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                </div>
              ) : donations.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun don effectué</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {donations.map((donation) => (
                    <motion.div
                      key={donation.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? "bg-gray-700/50 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            donation.recipient_type === "client"
                              ? isDark ? "bg-blue-900/50" : "bg-blue-100"
                              : isDark ? "bg-green-900/50" : "bg-green-100"
                          }`}>
                            {donation.recipient_type === "client" ? (
                              <User className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                            ) : (
                              <Users className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              {donation.recipient_name}
                            </p>
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {donation.recipient_type === "client" ? "Client" : "Prestataire"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                            +{formatAmount(convertFromUSD(donation.amount_cents / 100))}
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {formatDate(donation.created_at)}
                          </p>
                        </div>
                      </div>
                      {donation.reason && (
                        <p className={`mt-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                          {donation.reason}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!showHistory && donations.length > 0 && (
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {donations.length} don{donations.length > 1 ? "s" : ""} effectué{donations.length > 1 ? "s" : ""}
          </p>
        )}
      </motion.div>
    </div>
  );
}
