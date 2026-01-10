// components/admin/control/configuration/DelayConfiguration.tsx
"use client";

import React, { useState } from "react";
import { Save, Clock, Plus, Trash2, Info } from "lucide-react";

interface DelayRule {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  appliesTo: string[];
  isDefault: boolean;
}

interface DelayConfigurationProps {
  isDark: boolean;
}

const DelayConfiguration = ({ isDark }: DelayConfigurationProps) => {
  const [rules, setRules] = useState<DelayRule[]>([
    {
      id: "1",
      name: "Standard",
      minDays: 14,
      maxDays: 14,
      appliesTo: ["all"],
      isDefault: true,
    },
    {
      id: "2",
      name: "Nouveau Prestataire",
      minDays: 30,
      maxDays: 30,
      appliesTo: ["new"],
      isDefault: false,
    },
    {
      id: "3",
      name: "VIP",
      minDays: 0,
      maxDays: 0,
      appliesTo: ["vip"],
      isDefault: false,
    },
    {
      id: "4",
      name: "Montant élevé",
      minDays: 7,
      maxDays: 7,
      appliesTo: ["amount>5000"],
      isDefault: false,
    },
  ]);

  const [newRule, setNewRule] = useState({
    name: "",
    minDays: 7,
    maxDays: 14,
    appliesTo: ["standard"] as string[],
  });

  const [exceptionPeriods, setExceptionPeriods] = useState([
    {
      name: "Période de Noël",
      start: "2024-12-20",
      end: "2024-12-31",
      delay: 5,
    },
    { name: "Soldes d'été", start: "2024-07-01", end: "2024-07-31", delay: 3 },
  ]);

  const addRule = () => {
    if (!newRule.name.trim()) return;

    const rule: DelayRule = {
      id: Date.now().toString(),
      name: newRule.name,
      minDays: newRule.minDays,
      maxDays: newRule.maxDays,
      appliesTo: newRule.appliesTo,
      isDefault: false,
    };

    setRules([...rules, rule]);
    setNewRule({ name: "", minDays: 7, maxDays: 14, appliesTo: ["standard"] });
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const saveChanges = () => {
    // API call to save rules
    console.log("Saving rules:", rules);
    console.log("Exception periods:", exceptionPeriods);
  };

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-blue-900/30" : "bg-blue-100"
              }`}
            >
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold">
                Configuration des Délais d'Attente
              </h3>
              <p className="text-sm opacity-75">
                Définir les périodes 0-90 jours
              </p>
            </div>
          </div>
          <button
            onClick={saveChanges}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Existing Rules */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">
            Règles de délai actuelles
          </h4>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border ${
                  isDark ? "border-gray-700" : "border-gray-200"
                } ${
                  rule.isDefault
                    ? isDark
                      ? "bg-gray-700/30"
                      : "bg-gray-50"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{rule.name}</span>
                        {rule.isDefault && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">
                          {rule.minDays === rule.maxDays ? (
                            <>{rule.minDays} jours</>
                          ) : (
                            <>
                              {rule.minDays} à {rule.maxDays} jours
                            </>
                          )}
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            isDark ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          {rule.appliesTo.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!rule.isDefault && (
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Rule */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">
            Ajouter une nouvelle règle
          </h4>
          <div
            className={`p-6 rounded-xl border ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule({ ...newRule, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Ex: 'Prestataire Premium'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  S'applique à
                </label>
                <select
                  multiple
                  value={newRule.appliesTo}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      appliesTo: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="new">Nouveaux prestataires</option>
                  <option value="vip">VIP</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="amount>5000">Montant &gt; 5000€</option>
                  <option value="amount<1000">Montant &lt; 1000€</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jours minimum
                </label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={newRule.minDays}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      minDays: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span>0</span>
                  <span className="font-medium">{newRule.minDays} jours</span>
                  <span>90</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jours maximum
                </label>
                <input
                  type="range"
                  min={newRule.minDays}
                  max="90"
                  value={newRule.maxDays}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      maxDays: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span>{newRule.minDays}</span>
                  <span className="font-medium">{newRule.maxDays} jours</span>
                  <span>90</span>
                </div>
              </div>
            </div>
            <button
              onClick={addRule}
              className="mt-6 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la règle
            </button>
          </div>
        </div>

        {/* Exception Periods */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Périodes exceptionnelles</h4>
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                isDark
                  ? "bg-purple-900/30 text-purple-300"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              <Info className="w-4 h-4 inline mr-1" />
              Réductions temporaires de délais
            </div>
          </div>
          <div
            className={`p-6 rounded-xl border ${
              isDark
                ? "border-purple-700/30 bg-purple-900/10"
                : "border-purple-200 bg-purple-50"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exceptionPeriods.map((period, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="font-medium mb-2">{period.name}</div>
                  <div className="text-sm opacity-75 mb-3">
                    {period.start} → {period.end}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full inline-block ${
                      isDark
                        ? "bg-green-900/30 text-green-400"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    Délai réduit à {period.delay} jours
                  </div>
                </div>
              ))}
              <div
                className={`p-4 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer ${
                  isDark
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Plus className="w-6 h-6 mr-2" />
                <span>Ajouter une période</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayConfiguration;
