'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Check,
  X,
  Star,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { usePermissions } from "@/contexts/PermissionsContext";

// ============================================================================
// Types
// ============================================================================

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  is_active: boolean;
  conversion_mode: 'auto' | 'manual';
  manual_rate_to_default: number | null;
  auto_rate_to_default: number | null;
  last_rate_update: string | null;
  conversion_fee_percentage: number;
  decimal_places: number;
  position: 'before' | 'after';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Component
// ============================================================================

function Currencies() {
  const { hasPermission } = usePermissions();

  const canAdd = hasPermission('currencies.add');
  const canEdit = hasPermission('currencies.edit');
  const canDelete = hasPermission('currencies.delete');
  const canUpdateRates = hasPermission('currencies.update_rates');

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulaire
  const [formData, setFormData] = useState<Partial<Currency>>({
    code: '',
    name: '',
    symbol: '',
    is_default: false,
    is_active: true,
    conversion_mode: 'auto',
    manual_rate_to_default: null,
    conversion_fee_percentage: 0,
    decimal_places: 2,
    position: 'before',
  });

  // ============================================================================
  // Charger les devises
  // ============================================================================

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/currencies?isAdmin=true');
      const data = await response.json();

      if (data.success) {
        setCurrencies(data.data.currencies);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('[CURRENCIES] Error fetching:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  // ============================================================================
  // Mettre à jour les taux de change
  // ============================================================================

  const handleUpdateRates = async () => {
    try {
      setUpdating(true);
      setMessage(null);

      const response = await fetch('/api/admin/currencies/exchange-rates?isAdmin=true');
      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Taux mis à jour pour ${data.data.updated_count} devises`,
        });
        fetchCurrencies();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('[CURRENCIES] Error updating rates:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour des taux' });
    } finally {
      setUpdating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ============================================================================
  // Ajouter/Modifier une devise
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? '/api/admin/currencies?isAdmin=true'
        : '/api/admin/currencies?isAdmin=true';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId
            ? { id: editingId, currency: formData }
            : { currency: formData }
        ),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: editingId ? 'Devise modifiée' : 'Devise ajoutée',
        });
        setShowAddForm(false);
        setEditingId(null);
        setFormData({
          code: '',
          name: '',
          symbol: '',
          is_default: false,
          is_active: true,
          conversion_mode: 'auto',
          manual_rate_to_default: null,
          conversion_fee_percentage: 0,
          decimal_places: 2,
          position: 'before',
        });
        fetchCurrencies();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('[CURRENCIES] Error saving:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  // ============================================================================
  // Supprimer une devise
  // ============================================================================

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette devise ?')) return;

    try {
      const response = await fetch(`/api/admin/currencies?isAdmin=true&id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Devise supprimée' });
        fetchCurrencies();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('[CURRENCIES] Error deleting:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Devises
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les devises supportées et leurs taux de conversion
          </p>
          {currencies.find(c => c.is_default) && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">
                Devise par défaut: {currencies.find(c => c.is_default)?.code} -
                Tous les paiements sont convertis en {currencies.find(c => c.is_default)?.code}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdateRates}
            disabled={updating || !canUpdateRates}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
               !canUpdateRates 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
            }`}
            title={!canUpdateRates ? "Permission manquante" : "Mettre à jour les taux"}
          >
            {!canUpdateRates ? <Lock className="w-4 h-4"/> : <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />}
            {updating ? 'Mise à jour...' : 'Mettre à jour les taux'}
          </button>

          {canAdd && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une devise
          </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Section d'explication */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5"
      >
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Comment fonctionne la conversion des devises?
        </h3>
        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
          <div className="flex gap-3">
            <span className="font-bold min-w-[30px]">1.</span>
            <p>
              <strong>Devise par défaut ({currencies.find(c => c.is_default)?.code || 'USD'}):</strong> Tous les paiements sont traités dans cette devise.
              Si un utilisateur paie en Euro ou Peso, le montant est automatiquement converti en {currencies.find(c => c.is_default)?.code || 'USD'}.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold min-w-[30px]">2.</span>
            <p>
              <strong>Taux de conversion:</strong> Le taux indique combien vaut 1 unité de la devise par défaut dans une autre devise.
              {currencies.find(c => c.is_default) && (
                <> Par exemple: <strong>1 {currencies.find(c => c.is_default)?.code} = 132 HTG</strong> signifie qu&apos;un dollar vaut 132 gourdes.</>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold min-w-[30px]">3.</span>
            <p>
              <strong>Mode automatique:</strong> Les taux sont récupérés en temps réel via une API externe.
              Cliquez sur &quot;Mettre à jour les taux&quot; pour rafraîchir.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold min-w-[30px]">4.</span>
            <p>
              <strong>Mode manuel:</strong> Vous définissez vous-même le taux de conversion qui restera fixe jusqu&apos;à ce que vous le modifiiez.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Formulaire d'ajout/modification */}
      {(showAddForm || editingId) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Modifier la devise' : 'Ajouter une devise'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code ISO *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="USD, EUR, HTG..."
                  maxLength={3}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dollar américain, Euro..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbole *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="$, €, G..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode de conversion
                </label>
                <select
                  value={formData.conversion_mode}
                  onChange={(e) => setFormData({ ...formData, conversion_mode: e.target.value as 'auto' | 'manual' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="auto">Automatique (API)</option>
                  <option value="manual">Manuel</option>
                </select>
              </div>

              {formData.conversion_mode === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taux de conversion
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.manual_rate_to_default || ''}
                    onChange={(e) => setFormData({ ...formData, manual_rate_to_default: parseFloat(e.target.value) })}
                    placeholder="Ex: 132 si 1 USD = 132 HTG"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.code && currencies.find(c => c.is_default) ? (
                      <>
                        1 {currencies.find(c => c.is_default)?.code} = {formData.manual_rate_to_default || 'X'} {formData.code}
                        <br />
                        <span className="text-blue-600 dark:text-blue-400">
                          Exemple: Si 1 USD vaut 132 HTG, saisissez 132
                        </span>
                      </>
                    ) : (
                      'Définissez combien vaut 1 unité de la devise par défaut dans cette devise'
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frais de conversion (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.conversion_fee_percentage}
                  onChange={(e) => setFormData({ ...formData, conversion_fee_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Devise par défaut
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({
                    code: '',
                    name: '',
                    symbol: '',
                    is_default: false,
                    is_active: true,
                    conversion_mode: 'auto',
                    manual_rate_to_default: null,
                    conversion_fee_percentage: 0,
                    decimal_places: 2,
                    position: 'before',
                  });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Liste des devises */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Devise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Taux de conversion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Frais
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currencies.map((currency) => (
              <tr key={currency.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {currency.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {currency.code}
                        </span>
                        {currency.is_default && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currency.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {currency.is_default ? (
                      <div>
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                          Devise de base
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          1 {currency.code} = 1 {currency.code}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {currency.conversion_mode === 'auto' ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                              {currency.auto_rate_to_default?.toFixed(6) || 'N/A'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                              {currency.manual_rate_to_default?.toFixed(6) || 'N/A'}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(() => {
                            const rate = currency.conversion_mode === 'auto'
                              ? currency.auto_rate_to_default
                              : currency.manual_rate_to_default;
                            const defaultCurrency = currencies.find(c => c.is_default);

                            if (!rate || !defaultCurrency) return 'N/A';

                            // IMPORTANT: auto_rate_to_default est stocké comme "1 USD = X de cette devise"
                            // Mais on veut afficher "1 [devise par défaut] = X de cette devise"

                            if (defaultCurrency.code === 'USD') {
                              // Cas simple: USD est par défaut
                              // rate = 132 signifie 1 USD = 132 HTG ✓
                              return `1 ${defaultCurrency.code} = ${rate.toFixed(2)} ${currency.code}`;
                            } else {
                              // Cas complexe: HTG est par défaut, on regarde EUR
                              // rate (EUR) = 0.92 signifie 1 USD = 0.92 EUR
                              // rate (HTG) = 132 signifie 1 USD = 132 HTG
                              // On veut: 1 HTG = ? EUR
                              // 1 HTG = (1/132) USD
                              // (1/132) USD = (1/132) * 0.92 EUR
                              // Donc: 1 HTG = 0.92/132 EUR

                              const defaultRate = defaultCurrency.conversion_mode === 'auto'
                                ? defaultCurrency.auto_rate_to_default
                                : defaultCurrency.manual_rate_to_default;

                              if (!defaultRate) return 'N/A';

                              // Formule: 1 default = (rate_currency / rate_default) autres devises
                              const rateInDefault = rate / defaultRate;
                              return `1 ${defaultCurrency.code} = ${rateInDefault.toFixed(4)} ${currency.code}`;
                            }
                          })()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {currency.conversion_mode === 'auto' ? '(Auto)' : '(Manuel)'}
                        </p>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {currency.conversion_fee_percentage}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  {currency.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(currency.id);
                      setFormData(currency);
                      setShowAddForm(false);
                    }}
                    disabled={!canEdit}
                    className={`transition-colors ${
                      canEdit 
                        ? "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    title={!canEdit ? "Permission manquante" : "Modifier"}
                  >
                    {canEdit ? <Edit className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  {!currency.is_default && (
                    <button
                      onClick={() => handleDelete(currency.id)}
                      disabled={!canDelete}
                      className={`transition-colors ${
                        canDelete
                          ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      title={!canDelete ? "Permission manquante" : "Supprimer"}
                    >
                       {canDelete ? <Trash2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Currencies;
