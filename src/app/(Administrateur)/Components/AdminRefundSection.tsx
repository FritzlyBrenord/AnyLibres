"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";

import { usePermissions } from "@/contexts/PermissionsContext";

interface RefundRequest {
  id: string;
  order_id: string;
  client_id: string;
  provider_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reason: string;
  reason_details?: string;
  admin_notes?: string;
  refunded_at?: string;
  created_at: string;
}

interface ProviderBalance {
  available_cents: number;
  pending_cents: number;
  withdrawn_cents: number;
}

interface AdminRefundSectionProps {
  orderId: string;
  providerId: string;
  clientId: string;
  orderTotal: number;
  isDark?: boolean;
}

export function AdminRefundSection({
  orderId,
  providerId,
  isDark = false,
}: AdminRefundSectionProps) {
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission('orders.refunds.approve');
  const canReject = hasPermission('orders.refunds.reject');
  const canView = hasPermission('orders.refunds.view');

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerBalance, setProviderBalance] = useState<ProviderBalance | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshData = useCallback(async () => {
    // Fetch refunds
    try {
      const response = await fetch(`/api/admin/refunds?order_id=${orderId}`, {
        headers: { "isAdmin": "true" },
      });
      const data = await response.json();
      if (data.success) {
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error("Error fetching refunds:", err);
    } finally {
      setLoading(false);
    }

    // Fetch provider balance
    try {
      const response = await fetch(
        `/api/admin/providers/${providerId}/balance`,
        { headers: { "isAdmin": "true" } }
      );
      const data = await response.json();
      if (data.success) {
        setProviderBalance(data.balance);
      }
    } catch (err) {
      console.error("Error fetching provider balance:", err);
    }
  }, [orderId, providerId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const refetch = async () => {
    try {
      const refundsRes = await fetch(`/api/admin/refunds?order_id=${orderId}`, {
        headers: { "isAdmin": "true" },
      });
      const refundsData = await refundsRes.json();
      if (refundsData.success) {
        setRefunds(refundsData.refunds || []);
      }

      const balanceRes = await fetch(
        `/api/admin/providers/${providerId}/balance`,
        { headers: { "isAdmin": "true" } }
      );
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setProviderBalance(balanceData.balance);
      }
    } catch (err) {
      console.error("Error refetching data:", err);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    setProcessingRefund(refundId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "isAdmin": "true",
        },
        body: JSON.stringify({
          approved: true,
          admin_notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors du remboursement");
        return;
      }

      setSuccess("Remboursement approuvé avec succès");
      setAdminNotes("");
      setSelectedRefund(null);
      refetch();
    } catch (err) {
      setError("Erreur lors du traitement du remboursement");
      console.error(err);
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter ce remboursement ?")) {
      return;
    }

    setProcessingRefund(refundId);
    setError("");

    try {
      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "isAdmin": "true",
        },
        body: JSON.stringify({
          approved: false,
          admin_notes: adminNotes || "Remboursement rejeté",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors du rejet");
        return;
      }

      setAdminNotes("");
      setSelectedRefund(null);
      refetch();
    } catch (err) {
      setError("Erreur lors du rejet du remboursement");
      console.error(err);
    } finally {
      setProcessingRefund(null);
    }
  };

  const pendingRefunds = refunds.filter((r) => r.status === "pending");
  const processedRefunds = refunds.filter((r) => r.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Chargement des remboursements...</p>
        </div>
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Aucune demande de remboursement</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solde du provider */}
      {providerBalance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-4 ${
            isDark
              ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-600"
              : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
          }`}
        >
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-blue-300" : "text-gray-900"}`}>
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Solde du Provider
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Disponible</p>
              <p className="font-bold text-green-600">
                <CurrencyConverter amount={providerBalance.available_cents / 100} />
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>En attente</p>
              <p className="font-bold text-yellow-600">
                <CurrencyConverter amount={providerBalance.pending_cents / 100} />
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Retiré</p>
              <p className="font-bold text-blue-600">
                <CurrencyConverter amount={providerBalance.withdrawn_cents / 100} />
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages de statut */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border rounded-lg flex gap-3 ${isDark ? "bg-red-900/30 border-red-600" : "bg-red-50 border-red-200"}`}
        >
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border rounded-lg flex gap-3 ${isDark ? "bg-green-900/30 border-green-600" : "bg-green-50 border-green-200"}`}
        >
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? "text-green-300" : "text-green-700"}`}>{success}</p>
        </motion.div>
      )}

      {/* Demandes en attente */}
      {pendingRefunds.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Demandes en attente ({pendingRefunds.length})
          </h4>
          <div className="space-y-3">
            {pendingRefunds.map((refund) => (
              <motion.div
                key={refund.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Remboursement demandé: <CurrencyConverter amount={refund.amount_cents / 100} />
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Raison: {refund.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRefund(refund)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded"
                  >
                    Détails
                  </button>
                </div>

                {refund.reason_details && (
                  <div className="bg-white rounded p-2 mb-3 text-sm text-gray-700">
                    {refund.reason_details}
                  </div>
                )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRefund(refund.id)}
                      disabled={processingRefund === refund.id || !canApprove}
                      className={`flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2 ${
                        !canApprove ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title={!canApprove ? "Permission manquante" : "Approuver"}
                    >
                      {processingRefund === refund.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approuver
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectRefund(refund.id)}
                      disabled={processingRefund === refund.id || !canReject}
                      className={`flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2 ${
                        !canReject ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title={!canReject ? "Permission manquante" : "Rejeter"}
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Remboursements traités */}
      {processedRefunds.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Remboursements traités
          </h4>
          <div className="space-y-2">
            {processedRefunds.map((refund) => (
              <motion.div
                key={refund.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {refund.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <CurrencyConverter amount={refund.amount_cents / 100} />
                      </p>
                      <p className="text-xs text-gray-600">
                        {refund.status === "completed" ? "Approuvé" : "Rejeté"} le{" "}
                        {new Date(refund.refunded_at || refund.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {refund.admin_notes && (
                    <div className="text-xs bg-white rounded px-2 py-1">
                      {refund.admin_notes}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de détails */}
      <AnimatePresence>
        {selectedRefund && (
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Détails du remboursement
                </h3>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-bold text-2xl text-gray-900">
                    <CurrencyConverter amount={selectedRefund.amount_cents / 100} />
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Raison</p>
                  <p className="font-medium text-gray-900">{selectedRefund.reason}</p>
                </div>

                {selectedRefund.reason_details && (
                  <div>
                    <p className="text-sm text-gray-600">Détails</p>
                    <p className="text-gray-900">{selectedRefund.reason_details}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Demandé le</p>
                  <p className="text-gray-900">
                    {new Date(selectedRefund.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {selectedRefund.status === "pending" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes admin
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ajoute des notes (optionnel)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRefund(selectedRefund.id)}
                      disabled={processingRefund === selectedRefund.id || !canApprove}
                      className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium ${
                        !canApprove ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      {processingRefund === selectedRefund.id ? "Traitement..." : "Approuver"}
                    </button>
                    <button
                      onClick={() => handleRejectRefund(selectedRefund.id)}
                      disabled={processingRefund === selectedRefund.id || !canReject}
                      className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium ${
                        !canReject ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
