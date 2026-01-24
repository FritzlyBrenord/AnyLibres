"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
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

function Settings() {
  const [activeTab, setActiveTab] = useState<
    "global" | "category" | "country" | "location_type" | "monetaire"
  >("global");
  const { defaultCurrency } = useCurrency();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Paramètres de la plateforme
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configurez les frais et commissions de la plateforme
        </p>
      </div>

      {/* Message de notification */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "global", label: "Paramètres globaux" },
            { id: "category", label: "Par catégorie" },
            { id: "country", label: "Par pays" },
            { id: "location_type", label: "Par type de localisation" },
            { id: "monetaire", label: "devises" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {/* Tab: Paramètres globaux */}
        {activeTab === "global" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Frais de commission
              </h2>

              {/* Encadré info : Qui paie */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  💡 Ces frais de commission sont payés par :{" "}
                  <span className="font-bold">
                    {settings.global_fee_paid_by === "client" && "LE CLIENT"}
                    {settings.global_fee_paid_by === "provider" && "LE PRESTATAIRE"}
                    {settings.global_fee_paid_by === "split" && "LES DEUX (50/50)"}
                  </span>
                </p>
              </div>

              {/* Pourcentage de commission */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission plateforme ({settings.global_fee_type === "percentage" ? "%" : (defaultCurrency?.symbol || "€")})
                  </label>
                  <div className="relative">
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
                      className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {settings.global_fee_type === "percentage" ? "%" : (defaultCurrency?.symbol || "€")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {settings.global_fee_type === "percentage"
                      ? "Pourcentage de commission par défaut sur chaque transaction"
                      : "Montant fixe de commission par défaut sur chaque transaction"}
                  </p>
                </div>

                {/* Type de frais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>

                {/* Payé par */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="client">Client</option>
                    <option value="provider">Prestataire</option>
                    <option value="split">Partagé 50/50</option>
                  </select>
                </div>

                {/* Frais minimum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Montant minimum de commission par transaction. Si la commission calculée est inférieure, c&apos;est ce montant qui sera appliqué.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                    Payé par : {settings.global_fee_paid_by === "client" ? "Client" : settings.global_fee_paid_by === "provider" ? "Prestataire" : "Les deux (50/50)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Paramètres de retrait
              </h2>

              {/* Encadré info : Qui paie les retraits */}
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  💰 Ces frais sont TOUJOURS payés par : <span className="font-bold">LE PRESTATAIRE</span>
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Appliqués quand le prestataire retire son argent vers son compte bancaire
                </p>
              </div>

              <div className="space-y-4">
                {/* Commission sur les retraits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission sur les retraits (%)
                  </label>
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pourcentage prélevé sur chaque retrait des prestataires
                  </p>
                </div>

                {/* 🆕 Nombre de retraits autorisés par jour */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de retraits autorisés par jour
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Nombre maximum de retraits qu&apos;un prestataire peut effectuer par période de 24 heures
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      💡 <span className="font-semibold">Exemple:</span> Si vous mettez <span className="font-bold">3</span>,
                      un prestataire pourra faire maximum 3 retraits par jour.
                      Une fois la limite atteinte, il devra attendre 24h avant le prochain retrait.
                    </p>
                  </div>
                </div>
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
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  💡 Payé par :{" "}
                  <span className="font-bold">
                    {settings.global_fee_paid_by === "client" && "LE CLIENT"}
                    {settings.global_fee_paid_by === "provider" && "LE PRESTATAIRE"}
                    {settings.global_fee_paid_by === "split" && "LES DEUX (50/50)"}
                  </span>
                </p>
              </div>

              {/* Formulaire d'ajout */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commission (%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={categoryFee}
                        onChange={(e) =>
                          setCategoryFee(parseFloat(e.target.value) || 0)
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={handleAddCategoryFee}
                        disabled={!selectedCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {category?.name.fr || categoryId}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Commission: {fee}%
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCategoryFee(categoryId)}
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Supprimer
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
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  💡 Payé par :{" "}
                  <span className="font-bold">
                    {settings.global_fee_paid_by === "client" && "LE CLIENT"}
                    {settings.global_fee_paid_by === "provider" && "LE PRESTATAIRE"}
                    {settings.global_fee_paid_by === "split" && "LES DEUX (50/50)"}
                  </span>
                </p>
              </div>

              {/* Formulaire d'ajout */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pays
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commission (%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={countryFee}
                        onChange={(e) =>
                          setCountryFee(parseFloat(e.target.value) || 0)
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={handleAddCountryFee}
                        disabled={!selectedCountry}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {country?.name || countryCode}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Commission: {fee}%
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCountryFee(countryCode)}
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Supprimer
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
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  💡 Payé par :{" "}
                  <span className="font-bold">
                    {settings.global_fee_paid_by === "client" && "LE CLIENT"}
                    {settings.global_fee_paid_by === "provider" && "LE PRESTATAIRE"}
                    {settings.global_fee_paid_by === "split" && "LES DEUX (50/50)"}
                  </span>
                </p>
              </div>

              {/* Formulaire d'ajout */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de localisation
                    </label>
                    <select
                      value={selectedLocationType}
                      onChange={(e) => setSelectedLocationType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {
                          locationTypes.find(
                            (t) => t.code === selectedLocationType
                          )?.description
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commission (%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={locationTypeFee}
                        onChange={(e) =>
                          setLocationTypeFee(parseFloat(e.target.value) || 0)
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={handleAddLocationTypeFee}
                        disabled={!selectedLocationType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {locationType?.name || typeCode}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {locationType?.description}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Commission: {fee}%
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveLocationTypeFee(typeCode)
                            }
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Aucun frais spécifique par type de localisation configuré
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "monetaire" && <Currencies />}

        {/* Bouton de sauvegarde */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </div>

      {/* Aide et informations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Ordre de priorité des frais
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
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
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
          Si plusieurs configurations s'appliquent, c'est la plus spécifique qui
          sera utilisée.
        </p>
      </div>
    </div>
  );
}

export default Settings;
