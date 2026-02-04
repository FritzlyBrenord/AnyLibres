"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Lock, ShieldAlert, Trash2, Globe, Tag, MapPin } from "lucide-react";
import Currencies from "./Currencies";

// ============================================================================
// Types
// ============================================================================

interface PlatformSettings {
  id?: number;
  global_fee_percentage: number;
  global_fee_type: "percentage" | "fixed";
  global_fee_paid_by: "client" | "provider" | "split";
  withdrawal_fee_percentage: number;
  min_fee_cents: number;
  withdra_qty: number; // 🆕 Nombre de retraits autorisés par jour
  fee_by_category: Record<string, number>; // category_id -> fee_percentage
  fee_by_location: Record<string, number>; // country_code -> fee_percentage
  fee_by_location_type: Record<string, number>; // location_type -> fee_percentage
  updated_at?: string;
}

interface Category {
  id: string;
  name: {
    fr: string;
    en: string;
  };
}

// ============================================================================
// Component
// ============================================================================

interface SettingsProps {
  isDark?: boolean;
}

function Settings({ isDark = false }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "global" | "category" | "country" | "location_type" | "monetaire"
  >("global");
  const { defaultCurrency } = useCurrency();
  const { hasPermission } = usePermissions();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

 // Vérifier les permissions
  const canViewSettings = hasPermission('settings.view');
  const canManageFees = hasPermission('settings.fees.manage');
  const canManageCategories = hasPermission('settings.categories.manage');
  const canManageCurrencies = hasPermission('settings.currencies.manage');

  // Formulaire pour les frais par catégorie
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryFee, setCategoryFee] = useState<number>(5);

  // Formulaire pour les frais par pays
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [countryFee, setCountryFee] = useState<number>(5);

  // Formulaire pour les frais par type de localisation
  const [selectedLocationType, setSelectedLocationType] = useState<string>("");
  const [locationTypeFee, setLocationTypeFee] = useState<number>(5);

  // Types de localisation
  const locationTypes = [
    {
      code: "remote",
      name: "À distance (Remote)",
      description: "Service fourni entièrement à distance",
    },
    {
      code: "onsite",
      name: "Sur place (On-site)",
      description: "Service fourni au domicile/lieu du client",
    },
    {
      code: "hybrid",
      name: "Hybride",
      description: "Combinaison de distance et sur place",
    },
  ];

  // Liste des pays courants
  const countries = [
    { code: "FR", name: "France" },
    { code: "BE", name: "Belgique" },
    { code: "CH", name: "Suisse" },
    { code: "CA", name: "Canada" },
    { code: "US", name: "États-Unis" },
    { code: "GB", name: "Royaume-Uni" },
    { code: "DE", name: "Allemagne" },
    { code: "ES", name: "Espagne" },
    { code: "IT", name: "Italie" },
    { code: "PT", name: "Portugal" },
  ];

  // ============================================================================
  // Chargement des données
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les paramètres de la plateforme
        const settingsRes = await fetch(
          "/api/admin/platform-settings?isAdmin=true"
        );
        const settingsData = await settingsRes.json();

        if (settingsData.success) {
          setSettings(settingsData.data.settings);
        }

        // Récupérer les catégories
        const categoriesRes = await fetch("/api/admin/categories?isAdmin=true");
        const categoriesData = await categoriesRes.json();

        if (categoriesData.success) {
          setCategories(categoriesData.data.categories);
        }
      } catch (error) {
        console.error("[SETTINGS] Error fetching data:", error);
        setMessage({
          type: "error",
          text: "Erreur lors du chargement des paramètres",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================================================
  // Sauvegarde des paramètres
  // ============================================================================

  const handleSaveSettings = async () => {
    if (!settings) return;

    if (!window.confirm("Êtes-vous sûr de vouloir enregistrer ces modifications ? Cela affectera l'ensemble de la plateforme.")) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(
        "/api/admin/platform-settings?isAdmin=true",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSettings(data.data.settings);
        setMessage({
          type: "success",
          text: "Paramètres enregistrés avec succès",
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Erreur lors de la sauvegarde",
        });
      }
    } catch (error) {
      console.error("[SETTINGS] Error saving:", error);
      setMessage({
        type: "error",
        text: "Erreur serveur lors de la sauvegarde",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Gestion des frais par catégorie
  // ============================================================================

  const handleAddCategoryFee = () => {
    if (!settings || !selectedCategory || categoryFee < 0 || categoryFee > 100)
      return;

    const category = categories.find(c => c.id === selectedCategory);
    if (!window.confirm(`Ajouter des frais de ${categoryFee}% pour la catégorie "${category?.name.fr || selectedCategory}" ?`)) {
      return;
    }

    setSettings({
      ...settings,
      fee_by_category: {
        ...settings.fee_by_category,
        [selectedCategory]: categoryFee,
      },
    });

    setSelectedCategory("");
    setCategoryFee(5);
  };

  const handleRemoveCategoryFee = (categoryId: string) => {
    if (!settings) return;

    const category = categories.find(c => c.id === categoryId);
    if (!window.confirm(`Supprimer les frais spécifiques pour la catégorie "${category?.name.fr || categoryId}" ?`)) {
      return;
    }

    const newFeeByCategory = { ...settings.fee_by_category };
    delete newFeeByCategory[categoryId];

    setSettings({
      ...settings,
      fee_by_category: newFeeByCategory,
    });
  };

  // ============================================================================
  // Gestion des frais par pays
  // ============================================================================

  const handleAddCountryFee = () => {
    if (!settings || !selectedCountry || countryFee < 0 || countryFee > 100)
      return;

    const country = countries.find(c => c.code === selectedCountry);
    if (!window.confirm(`Ajouter des frais de ${countryFee}% pour le pays "${country?.name || selectedCountry}" ?`)) {
      return;
    }

    setSettings({
      ...settings,
      fee_by_location: {
        ...settings.fee_by_location,
        [selectedCountry]: countryFee,
      },
    });

    setSelectedCountry("");
    setCountryFee(5);
  };

  const handleRemoveCountryFee = (countryCode: string) => {
    if (!settings) return;

    const country = countries.find(c => c.code === countryCode);
    if (!window.confirm(`Supprimer les frais spécifiques pour le pays "${country?.name || countryCode}" ?`)) {
      return;
    }

    const newFeeByLocation = { ...settings.fee_by_location };
    delete newFeeByLocation[countryCode];

    setSettings({
      ...settings,
      fee_by_location: newFeeByLocation,
    });
  };

  // ============================================================================
  // Gestion des frais par type de localisation
  // ============================================================================

  const handleAddLocationTypeFee = () => {
    if (
      !settings ||
      !selectedLocationType ||
      locationTypeFee < 0 ||
      locationTypeFee > 100
    )
      return;

    const locType = locationTypes.find(t => t.code === selectedLocationType);
    if (!window.confirm(`Ajouter des frais de ${locationTypeFee}% pour le type "${locType?.name || selectedLocationType}" ?`)) {
      return;
    }

    setSettings({
      ...settings,
      fee_by_location_type: {
        ...settings.fee_by_location_type,
        [selectedLocationType]: locationTypeFee,
      },
    });

    setSelectedLocationType("");
    setLocationTypeFee(5);
  };

  const handleRemoveLocationTypeFee = (locationType: string) => {
    if (!settings) return;

    const locType = locationTypes.find(t => t.code === locationType);
    if (!window.confirm(`Supprimer les frais spécifiques pour le type "${locType?.name || locationType}" ?`)) {
      return;
    }

    const newFeeByLocationType = { ...settings.fee_by_location_type };
    delete newFeeByLocationType[locationType];

    setSettings({
      ...settings,
      fee_by_location_type: newFeeByLocationType,
    });
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

  if (!settings) {
    return (
      <div className="text-center py-12 text-red-600">
        Erreur lors du chargement des paramètres
      </div>
    );
  }

  // Si pas de permission de voir les paramètres
  if (!canViewSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-red-50 text-red-600">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Accès Refusé
        </h2>
        <p className="max-w-md text-gray-600 dark:text-gray-400">
          Vous n'avez pas la permission de voir les paramètres de la plateforme. Contactez un administrateur système.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          Paramètres de la plateforme
        </h1>
        <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Configurez les frais et commissions de la plateforme
        </p>
      </div>

      {/* Message de notification */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl border ${
            message.type === "success"
              ? isDark
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-green-50 border-green-200 text-green-700"
              : isDark
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className={`border-b ${isDark ? "border-white/10" : "border-slate-200"} sticky top-0 bg-inherit z-10`}>
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
          {[
            { id: "global", label: "Paramètres globaux" },
            { id: "category", label: "Par catégorie" },
            { id: "country", label: "Par pays" },
            { id: "location_type", label: "Par type de localisation" },
            { id: "monetaire", label: "Devises" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? isDark
                    ? "border-indigo-500 text-indigo-400"
                    : "border-indigo-600 text-indigo-600"
                  : isDark
                  ? "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? "bg-slate-900/50 border border-white/10" : "bg-white border border-slate-200"}`}>
        <div className="p-6 md:p-8">
        {/* Tab: Paramètres globaux */}
        {activeTab === "global" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Frais de commission
              </h2>

              {/* Encadré info : Qui paie */}
              <div className={`mb-8 p-5 rounded-2xl border ${isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                  <span className="text-lg">💡</span>
                  <span>
                    Ces frais de commission sont payés par :{" "}
                    <span className={`uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? "bg-indigo-500/20" : "bg-white"}`}>
                      {settings.global_fee_paid_by === "client" && "Le Client"}
                      {settings.global_fee_paid_by === "provider" && "Le Prestataire"}
                      {settings.global_fee_paid_by === "split" && "Les Deux (50/50)"}
                    </span>
                  </span>
                </p>
              </div>

              {/* Pourcentage de commission */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Commission plateforme ({settings.global_fee_type === "percentage" ? "%" : (defaultCurrency?.symbol || "€")})
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      min="0"
                      max={settings.global_fee_type === "percentage" ? "100" : undefined}
                      step={settings.global_fee_type === "percentage" ? "0.1" : "0.01"}
                      value={settings.global_fee_percentage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          global_fee_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                        isDark 
                          ? "bg-slate-800 border-white/10 text-white placeholder-slate-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                        {settings.global_fee_type === "percentage" ? "%" : (defaultCurrency?.symbol || "€")}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {settings.global_fee_type === "percentage"
                      ? "Pourcentage de commission par défaut sur chaque transaction"
                      : "Montant fixe de commission par défaut sur chaque transaction"}
                  </p>
                </div>

                {/* Type de frais */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Type de frais
                  </label>
                  <select
                    value={settings.global_fee_type}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        global_fee_type: e.target.value as
                          | "percentage"
                          | "fixed",
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-white/10 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe ({defaultCurrency?.symbol || "€"})</option>
                  </select>
                </div>

                {/* Payé par */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Frais payés par
                  </label>
                  <select
                    value={settings.global_fee_paid_by}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        global_fee_paid_by: e.target.value as
                          | "client"
                          | "provider"
                          | "split",
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-white/10 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="client">Client</option>
                    <option value="provider">Prestataire</option>
                    <option value="split">Partagé 50/50</option>
                  </select>
                </div>

                {/* Frais minimum */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Frais minimum ({defaultCurrency?.symbol || "€"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(settings.min_fee_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        min_fee_cents:
                          Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-white/10 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Montant minimum de commission par transaction. Si la commission calculée est inférieure, c&apos;est ce montant qui sera appliqué.
                  </p>
                  <div className={`mt-3 p-3 rounded-lg text-xs font-bold inline-block ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                    PAYÉ PAR : {settings.global_fee_paid_by === "client" ? "Le Client" : settings.global_fee_paid_by === "provider" ? "Le Prestataire" : "Les Deux (50/50)"}
                  </div>
                </div>
              </div>
            </div>

            <div className={`border-t pt-8 mt-8 ${isDark ? "border-white/10" : "border-slate-100"}`}>
              <h2 className={`text-xl font-black mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
                Paramètres de retrait
              </h2>
 
              {/* Encadré info : Qui paie les retraits */}
              <div className={`mb-8 p-5 rounded-2xl border ${isDark ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-50 border-orange-100"}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${isDark ? "text-orange-400" : "text-orange-700"}`}>
                  <span className="text-lg">💰</span>
                  <span>Ces frais sont TOUJOURS payés par : <span className="font-bold underline decoration-2">LE PRESTATAIRE</span></span>
                </p>
                <p className={`text-xs mt-2 ml-7 ${isDark ? "text-slate-500" : "text-orange-600/70"}`}>
                  Appliqués quand le prestataire retire son argent vers son compte bancaire.
                </p>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Commission sur les retraits */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Commission sur les retraits (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.withdrawal_fee_percentage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          withdrawal_fee_percentage:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${
                        isDark 
                          ? "bg-slate-800 border-white/10 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className={`font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>%</span>
                    </div>
                  </div>
                </div>
 
                {/* 🆕 Nombre de retraits autorisés par jour */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Limite de retraits quotidiens
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.withdra_qty || 1}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        withdra_qty: parseInt(e.target.value) || 1,
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-white/10 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Nombre maximum de retraits autorisés par période de 24h.
                  </p>
                </div>
              </div>
 
              <div className={`mt-6 p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <span className="font-bold mr-1">💡 Note :</span> 
                  Une fois la limite atteinte, le prestataire devra attendre que 24 heures se soient écoulées depuis son premier retrait de la série avant de pouvoir en effectuer un nouveau.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Par catégorie */}
        {activeTab === "category" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Frais par catégorie
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Définissez des frais spécifiques pour certaines catégories de
                services. Ces frais remplacent le taux global.
              </p>

              {/* Encadré info : Qui paie */}
              <div className={`mb-8 p-5 rounded-2xl border ${isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                  <span className="text-lg">💡</span>
                  <span>
                    Frais payés par :{" "}
                    <span className={`uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? "bg-indigo-500/20" : "bg-white"}`}>
                      {settings.global_fee_paid_by === "client" && "Le Client"}
                      {settings.global_fee_paid_by === "provider" && "Le Prestataire"}
                      {settings.global_fee_paid_by === "split" && "Les Deux (50/50)"}
                    </span>
                  </span>
                </p>
              </div>

              {/* Formulaire d'ajout */}
              <div className={`p-6 rounded-2xl mb-8 border ${isDark ? "bg-slate-800/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Catégorie
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                        isDark 
                          ? "bg-slate-800 border-white/10 text-white" 
                          : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories
                        .filter((cat) => !settings.fee_by_category[cat.id])
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name.fr}
                          </option>
                        ))}
                    </select>
                  </div>
 
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Commission (%)
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={categoryFee}
                          onChange={(e) =>
                            setCategoryFee(parseFloat(e.target.value) || 0)
                          }
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                            isDark 
                              ? "bg-slate-800 border-white/10 text-white" 
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>%</span>
                        </div>
                      </div>
                      <button
                        onClick={handleAddCategoryFee}
                        disabled={!selectedCategory}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des frais par catégorie */}
              {Object.keys(settings.fee_by_category).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(settings.fee_by_category).map(
                    ([categoryId, fee]) => {
                      const category = categories.find(
                        (c) => c.id === categoryId
                      );
                      return (
                        <div
                          key={categoryId}
                          className={`flex items-center justify-between p-5 border rounded-2xl transition-all hover:shadow-md ${
                            isDark 
                              ? "bg-slate-800/40 border-white/5 hover:bg-slate-800/60" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div>
                            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {category?.name.fr || categoryId}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                commission: {fee}%
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCategoryFee(categoryId)}
                            className={`p-2 rounded-xl transition-all ${
                              isDark 
                                ? "text-red-400 hover:bg-red-500/10" 
                                : "text-red-500 hover:bg-red-50"
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Aucun frais spécifique par catégorie configuré
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Par pays */}
        {activeTab === "country" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Frais par pays
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Définissez des frais spécifiques selon le pays du client ou du
                prestataire. Ces frais remplacent le taux global.
              </p>

              {/* Encadré info : Qui paie */}
              <div className={`mb-8 p-5 rounded-2xl border ${isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                  <span className="text-lg">💡</span>
                  <span>
                    Frais payés par :{" "}
                    <span className={`uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? "bg-indigo-500/20" : "bg-white"}`}>
                      {settings.global_fee_paid_by === "client" && "Le Client"}
                      {settings.global_fee_paid_by === "provider" && "Le Prestataire"}
                      {settings.global_fee_paid_by === "split" && "Les Deux (50/50)"}
                    </span>
                  </span>
                </p>
              </div>

              {/* Formulaire d'ajout */}
              <div className={`p-6 rounded-2xl mb-8 border ${isDark ? "bg-slate-800/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Pays
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                        isDark 
                          ? "bg-slate-800 border-white/10 text-white" 
                          : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">Sélectionner un pays</option>
                      {countries
                        .filter(
                          (country) => !settings.fee_by_location[country.code]
                        )
                        .map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                    </select>
                  </div>
 
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Commission (%)
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={countryFee}
                          onChange={(e) =>
                            setCountryFee(parseFloat(e.target.value) || 0)
                          }
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                            isDark 
                              ? "bg-slate-800 border-white/10 text-white" 
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>%</span>
                        </div>
                      </div>
                      <button
                        onClick={handleAddCountryFee}
                        disabled={!selectedCountry}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des frais par pays */}
              {Object.keys(settings.fee_by_location).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(settings.fee_by_location).map(
                    ([countryCode, fee]) => {
                      const country = countries.find(
                        (c) => c.code === countryCode
                      );
                      return (
                        <div
                          key={countryCode}
                          className={`flex items-center justify-between p-5 border rounded-2xl transition-all hover:shadow-md ${
                            isDark 
                              ? "bg-slate-800/40 border-white/5 hover:bg-slate-800/60" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div>
                            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {country?.name || countryCode}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                commission: {fee}%
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCountryFee(countryCode)}
                            className={`p-2 rounded-xl transition-all ${
                              isDark 
                                ? "text-red-400 hover:bg-red-500/10" 
                                : "text-red-500 hover:bg-red-50"
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Aucun frais spécifique par pays configuré
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Par type de localisation */}
        {activeTab === "location_type" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Frais par type de localisation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Définissez des frais spécifiques selon le type de localisation
                du service (à distance, sur place, hybride). Ces frais
                remplacent le taux global.
              </p>

              {/* Encadré info : Qui paie */}
              <div className={`mb-8 p-5 rounded-2xl border ${isDark ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
                  <span className="text-lg">💡</span>
                  <span>
                    Frais payés par :{" "}
                    <span className={`uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? "bg-indigo-500/20" : "bg-white"}`}>
                      {settings.global_fee_paid_by === "client" && "Le Client"}
                      {settings.global_fee_paid_by === "provider" && "Le Prestataire"}
                      {settings.global_fee_paid_by === "split" && "Les Deux (50/50)"}
                    </span>
                  </span>
                </p>
              </div>
 
              {/* Formulaire d'ajout */}
              <div className={`p-6 rounded-2xl mb-8 border ${isDark ? "bg-slate-800/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Type de localisation
                    </label>
                    <select
                      value={selectedLocationType}
                      onChange={(e) => setSelectedLocationType(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                        isDark 
                          ? "bg-slate-800 border-white/10 text-white" 
                          : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">Sélectionner un type</option>
                      {locationTypes
                        .filter(
                          (type) => !settings.fee_by_location_type[type.code]
                        )
                        .map((type) => (
                          <option key={type.code} value={type.code}>
                            {type.name}
                          </option>
                        ))}
                    </select>
                    {selectedLocationType && (
                      <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {
                          locationTypes.find(
                            (t) => t.code === selectedLocationType
                          )?.description
                        }
                      </p>
                    )}
                  </div>
 
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Commission (%)
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={locationTypeFee}
                          onChange={(e) =>
                            setLocationTypeFee(parseFloat(e.target.value) || 0)
                          }
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                            isDark 
                              ? "bg-slate-800 border-white/10 text-white" 
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>%</span>
                        </div>
                      </div>
                      <button
                        onClick={handleAddLocationTypeFee}
                        disabled={!selectedLocationType}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Liste des frais par type de localisation */}
              {Object.keys(settings.fee_by_location_type).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(settings.fee_by_location_type).map(
                    ([typeCode, fee]) => {
                      const locationType = locationTypes.find(
                        (t) => t.code === typeCode
                      );
                      return (
                        <div
                          key={typeCode}
                          className={`flex items-center justify-between p-5 border rounded-2xl transition-all hover:shadow-md ${
                            isDark 
                              ? "bg-slate-800/40 border-white/5 hover:bg-slate-800/60" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div>
                            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {locationType?.name || typeCode}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                              {locationType?.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                                commission: {fee}%
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveLocationTypeFee(typeCode)
                            }
                            className={`p-2 rounded-xl transition-all ${
                              isDark 
                                ? "text-red-400 hover:bg-red-500/10" 
                                : "text-red-500 hover:bg-red-50"
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className={`text-center py-12 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                  Aucun frais spécifique par type de localisation configuré
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "monetaire" && <Currencies />}

        {/* Bouton de sauvegarde */}
        <div className={`mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3`}
          >
            {saving && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </div>
    </div>

      {/* Aide et informations */}
      <div className={`rounded-2xl p-6 border ${isDark ? "bg-indigo-500/5 border-indigo-500/10" : "bg-blue-50 border-blue-100"}`}>
        <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-indigo-300" : "text-blue-900"}`}>
          Ordre de priorité des frais
        </h3>
        <ol className={`list-decimal list-inside space-y-2 text-sm ${isDark ? "text-slate-400" : "text-blue-800"}`}>
          <li>
            Frais spécifique au service (si configuré dans le service
            individuel)
          </li>
          <li>Frais par catégorie (configuré ci-dessus)</li>
          <li>
            Frais par type de localisation (à distance, sur place, hybride)
          </li>
          <li>Frais par pays (configuré ci-dessus)</li>
          <li>Frais global (paramètres globaux)</li>
        </ol>
        <p className={`text-xs mt-4 italic ${isDark ? "text-slate-500" : "text-blue-600"}`}>
          Si plusieurs configurations s'appliquent, c'est la plus spécifique qui
          sera utilisée.
        </p>
      </div>
    </div>
  );
}

export default Settings;
