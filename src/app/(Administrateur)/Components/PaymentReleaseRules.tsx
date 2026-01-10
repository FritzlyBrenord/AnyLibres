// ============================================================================
// Component: PaymentReleaseRules - Gestion des règles de déblocage paiements
// Admin peut configurer quand les fonds pending → available
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Users,
  DollarSign,
  Shield,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Edit2,
  Calendar,
  Award,
  Globe,
} from 'lucide-react';

interface ReleaseRule {
  id: string;
  name: string;
  delay_hours: number;
  applies_to: string; // 'all', 'new_providers', 'vip', 'amount_threshold', 'country'
  condition?: {
    min_amount?: number;
    max_amount?: number;
    country?: string;
    countries?: string[]; // Pour la sélection multiple
    provider_age_days?: number;
    provider_rating?: number;
  };
  is_active: boolean;
  priority: number;
}

interface PaymentReleaseRulesProps {
  isDark: boolean;
}

export default function PaymentReleaseRules({ isDark }: PaymentReleaseRulesProps) {
  const [rules, setRules] = useState<ReleaseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<ReleaseRule | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Liste complète des pays
  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'CA', name: 'Canada' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MC', name: 'Monaco' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'ES', name: 'Espagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'US', name: 'États-Unis' },
    { code: 'PT', name: 'Portugal' },
    { code: 'NL', name: 'Pays-Bas' },
    { code: 'AT', name: 'Autriche' },
    { code: 'IE', name: 'Irlande' },
    { code: 'SE', name: 'Suède' },
    { code: 'NO', name: 'Norvège' },
    { code: 'DK', name: 'Danemark' },
    { code: 'FI', name: 'Finlande' },
    { code: 'PL', name: 'Pologne' },
    { code: 'CZ', name: 'République tchèque' },
    { code: 'HU', name: 'Hongrie' },
    { code: 'RO', name: 'Roumanie' },
    { code: 'BG', name: 'Bulgarie' },
    { code: 'GR', name: 'Grèce' },
    { code: 'HR', name: 'Croatie' },
    { code: 'SI', name: 'Slovénie' },
    { code: 'SK', name: 'Slovaquie' },
    { code: 'EE', name: 'Estonie' },
    { code: 'LV', name: 'Lettonie' },
    { code: 'LT', name: 'Lituanie' },
    { code: 'CY', name: 'Chypre' },
    { code: 'MT', name: 'Malte' },
    { code: 'MA', name: 'Maroc' },
    { code: 'TN', name: 'Tunisie' },
    { code: 'DZ', name: 'Algérie' },
    { code: 'SN', name: 'Sénégal' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'RE', name: 'La Réunion' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'GF', name: 'Guyane française' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'NC', name: 'Nouvelle-Calédonie' },
    { code: 'PF', name: 'Polynésie française' },
  ];

  // Règles par défaut
  const defaultRules: ReleaseRule[] = [
    {
      id: '1',
      name: 'Standard',
      delay_hours: 336, // 14 jours
      applies_to: 'all',
      is_active: true,
      priority: 0,
    },
    {
      id: '2',
      name: 'Nouveaux Providers',
      delay_hours: 720, // 30 jours
      applies_to: 'new_providers',
      condition: { provider_age_days: 30 },
      is_active: true,
      priority: 10,
    },
    {
      id: '3',
      name: 'VIP / Premium',
      delay_hours: 0, // Immédiat
      applies_to: 'vip',
      condition: { provider_rating: 4.8 },
      is_active: true,
      priority: 20,
    },
    {
      id: '4',
      name: 'Montants Élevés (>5000€)',
      delay_hours: 168, // 7 jours
      applies_to: 'amount_threshold',
      condition: { min_amount: 500000 }, // en cents
      is_active: true,
      priority: 15,
    },
    {
      id: '5',
      name: 'Petits Montants (<100€)',
      delay_hours: 24, // 1 jour
      applies_to: 'amount_threshold',
      condition: { max_amount: 10000 }, // en cents
      is_active: true,
      priority: 5,
    },
  ];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-rules');
      const data = await response.json();

      if (data.success) {
        setRules(data.data.length > 0 ? data.data : defaultRules);
      } else {
        setRules(defaultRules);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      setRules(defaultRules);
    } finally {
      setLoading(false);
    }
  };

  const saveRules = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Règles sauvegardées avec succès!');
        await fetchRules(); // Recharger les règles depuis le serveur
      } else {
        alert('❌ Erreur: ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Error saving rules:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, is_active: !r.is_active } : r
    );
    setRules(updatedRules);

    // Sauvegarder immédiatement
    try {
      const response = await fetch('/api/admin/payment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules }),
      });

      if (!response.ok) {
        alert('❌ Erreur lors de la mise à jour');
        await fetchRules(); // Recharger en cas d'erreur
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      await fetchRules();
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle?')) {
      return;
    }

    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);

    // Sauvegarder immédiatement
    try {
      const response = await fetch('/api/admin/payment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules }),
      });

      if (response.ok) {
        alert('✅ Règle supprimée avec succès!');
      } else {
        alert('❌ Erreur lors de la suppression');
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('❌ Erreur lors de la suppression');
      await fetchRules();
    }
  };

  const addNewRule = (preset?: { name: string; hours: number }) => {
    const newRule: ReleaseRule = {
      id: `new-${Date.now()}`,
      name: preset?.name || 'Nouvelle Règle',
      delay_hours: preset?.hours || 336,
      applies_to: 'all',
      is_active: true,
      priority: 0,
    };

    setEditingRule(newRule);
    setSelectedCountries([]);
    setCountrySearch('');
    setShowAddModal(true);
  };

  const editExistingRule = (rule: ReleaseRule) => {
    setEditingRule({ ...rule });
    setSelectedCountries(rule.condition?.countries || []);
    setCountrySearch('');
    setShowAddModal(true);
  };

  const toggleCountrySelection = (countryCode: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      } else {
        return [...prev, countryCode];
      }
    });
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const saveNewRule = async () => {
    if (!editingRule) return;

    // Ajouter les pays sélectionnés à la condition
    const ruleToSave = {
      ...editingRule,
      condition: {
        ...editingRule.condition,
        countries: editingRule.applies_to === 'country' ? selectedCountries : undefined,
      }
    };

    // Vérifier si c'est une modification ou un ajout
    const isEditing = rules.some(r => r.id === editingRule.id);
    let updatedRules: ReleaseRule[];

    if (isEditing) {
      // Modification
      updatedRules = rules.map(r => r.id === editingRule.id ? ruleToSave : r);
    } else {
      // Ajout
      updatedRules = [...rules, ruleToSave];
    }

    setRules(updatedRules);
    setShowAddModal(false);
    setEditingRule(null);
    setSelectedCountries([]);

    // Sauvegarder sur le serveur
    try {
      const response = await fetch('/api/admin/payment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules }),
      });

      if (response.ok) {
        alert(isEditing ? '✅ Règle modifiée avec succès!' : '✅ Règle ajoutée avec succès!');
        await fetchRules();
      } else {
        alert('❌ Erreur lors de la sauvegarde');
        await fetchRules();
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('❌ Erreur lors de la sauvegarde');
      await fetchRules();
    }
  };

  const updateEditingRule = (updates: Partial<ReleaseRule>) => {
    if (editingRule) {
      setEditingRule({ ...editingRule, ...updates });
    }
  };

  const formatDelay = (hours: number) => {
    if (hours === 0) return 'Immédiat';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  const getRuleIcon = (appliesTo: string) => {
    switch (appliesTo) {
      case 'all': return <Users className="w-5 h-5" />;
      case 'new_providers': return <Clock className="w-5 h-5" />;
      case 'vip': return <Award className="w-5 h-5" />;
      case 'amount_threshold': return <DollarSign className="w-5 h-5" />;
      case 'country': return <Globe className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getRuleColor = (appliesTo: string) => {
    switch (appliesTo) {
      case 'all': return 'blue';
      case 'new_providers': return 'amber';
      case 'vip': return 'purple';
      case 'amount_threshold': return 'green';
      case 'country': return 'cyan';
      default: return 'gray';
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Règles de Déblocage des Paiements
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Configurez quand les fonds pending deviennent available automatiquement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => addNewRule()}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              <Plus className="w-4 h-4" />
              Ajouter Règle
            </button>

            <button
              onClick={saveRules}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isDark
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors disabled:opacity-50`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder Tout'}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className={isDark ? 'text-blue-300' : 'text-blue-800'}>
            <p className="font-medium mb-1">Comment ça marche?</p>
            <p className="text-sm">
              Les règles sont appliquées par <strong>ordre de priorité</strong> (plus élevée = prioritaire).
              Quand un paiement arrive, le système vérifie quelle règle s&apos;applique et programme le déblocage automatique.
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          rules
            .sort((a, b) => b.priority - a.priority)
            .map((rule) => {
              const color = getRuleColor(rule.applies_to);
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border p-6 transition-all ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                      : 'bg-white border-gray-200 hover:shadow-lg'
                  } ${!rule.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                        {getRuleIcon(rule.applies_to)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {rule.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                            Priorité: {rule.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatDelay(rule.delay_hours)}
                            </span>
                          </div>

                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            S&apos;applique à: <strong>{rule.applies_to}</strong>
                          </div>
                        </div>

                        {/* Conditions */}
                        {rule.condition && (
                          <div className="flex flex-wrap gap-2">
                            {rule.condition.min_amount && (
                              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                Min: {(rule.condition.min_amount / 100).toFixed(0)}€
                              </span>
                            )}
                            {rule.condition.max_amount && (
                              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                Max: {(rule.condition.max_amount / 100).toFixed(0)}€
                              </span>
                            )}
                            {rule.condition.provider_age_days && (
                              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                Provider &lt; {rule.condition.provider_age_days} jours
                              </span>
                            )}
                            {rule.condition.provider_rating && (
                              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                Note ≥ {rule.condition.provider_rating}⭐
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.is_active
                            ? isDark
                              ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            : isDark
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {rule.is_active ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => editExistingRule(rule)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Quick Presets */}
      <div className="mt-8">
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Préréglages Rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: 'Immédiat', hours: 0, icon: Zap, color: 'green' },
            { name: '24 heures', hours: 24, icon: Clock, color: 'blue' },
            { name: '7 jours', hours: 168, icon: Calendar, color: 'amber' },
            { name: '14 jours', hours: 336, icon: Shield, color: 'purple' },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => addNewRule(preset)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  : 'bg-white border-gray-200 hover:shadow-lg'
              }`}
            >
              <preset.icon className={`w-6 h-6 mb-2 text-${preset.color}-500`} />
              <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {preset.name}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Ajouter règle
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Ajouter/Éditer Règle */}
      {showAddModal && editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full rounded-xl p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {rules.some(r => r.id === editingRule.id) ? 'Modifier la Règle' : 'Nouvelle Règle de Paiement'}
            </h3>

            {/* Nom */}
            <div className="mb-4">
              <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Nom de la règle
              </label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) => updateEditingRule({ name: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Ex: VIP Instant Release"
              />
            </div>

            {/* Délai */}
            <div className="mb-4">
              <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Délai (heures)
              </label>
              <input
                type="number"
                value={editingRule.delay_hours}
                onChange={(e) => updateEditingRule({ delay_hours: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="0"
                max="2160"
              />
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDelay(editingRule.delay_hours)} (max 90 jours)
              </p>
            </div>

            {/* Type d'application */}
            <div className="mb-4">
              <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                S'applique à
              </label>
              <select
                value={editingRule.applies_to}
                onChange={(e) => updateEditingRule({ applies_to: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Tous les providers</option>
                <option value="new_providers">Nouveaux providers</option>
                <option value="vip">VIP (rating élevé)</option>
                <option value="amount_threshold">Seuil de montant</option>
                <option value="country">Pays spécifique</option>
              </select>
            </div>

            {/* Conditions spécifiques */}
            {editingRule.applies_to === 'new_providers' && (
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Âge maximum du provider (jours)
                </label>
                <input
                  type="number"
                  value={editingRule.condition?.provider_age_days || 30}
                  onChange={(e) => updateEditingRule({
                    condition: { ...editingRule.condition, provider_age_days: parseInt(e.target.value) }
                  })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            )}

            {editingRule.applies_to === 'vip' && (
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rating minimum
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingRule.condition?.provider_rating || 4.8}
                  onChange={(e) => updateEditingRule({
                    condition: { ...editingRule.condition, provider_rating: parseFloat(e.target.value) }
                  })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  min="0"
                  max="5"
                />
              </div>
            )}

            {editingRule.applies_to === 'amount_threshold' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant min (€)
                  </label>
                  <input
                    type="number"
                    value={(editingRule.condition?.min_amount || 0) / 100}
                    onChange={(e) => updateEditingRule({
                      condition: { ...editingRule.condition, min_amount: parseFloat(e.target.value) * 100 }
                    })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant max (€)
                  </label>
                  <input
                    type="number"
                    value={(editingRule.condition?.max_amount || 0) / 100}
                    onChange={(e) => updateEditingRule({
                      condition: { ...editingRule.condition, max_amount: parseFloat(e.target.value) * 100 }
                    })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {editingRule.applies_to === 'country' && (
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pays ({selectedCountries.length} sélectionné{selectedCountries.length > 1 ? 's' : ''})
                </label>

                {/* Recherche */}
                <input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border mb-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />

                {/* Pays sélectionnés */}
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCountries.map(code => {
                      const country = countries.find(c => c.code === code);
                      return country ? (
                        <span
                          key={code}
                          className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                            isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {country.name}
                          <button
                            onClick={() => toggleCountrySelection(code)}
                            className="hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Liste des pays */}
                <div className={`max-h-60 overflow-y-auto border rounded-lg ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}>
                  {filteredCountries.map(country => (
                    <div
                      key={country.code}
                      onClick={() => toggleCountrySelection(country.code)}
                      className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
                        selectedCountries.includes(country.code)
                          ? isDark
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                          : isDark
                          ? 'hover:bg-gray-600 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country.code)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span className="font-mono text-xs text-gray-500">{country.code}</span>
                      <span>{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priorité */}
            <div className="mb-6">
              <label className={`block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Priorité (plus élevé = prioritaire)
              </label>
              <input
                type="number"
                value={editingRule.priority}
                onChange={(e) => updateEditingRule({ priority: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRule(null);
                }}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={saveNewRule}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
