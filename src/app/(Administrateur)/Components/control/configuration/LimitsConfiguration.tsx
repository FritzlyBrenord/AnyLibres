// components/admin/control/configuration/LimitsConfiguration.tsx
"use client";

import React, { useState } from "react";
import { Shield, Euro, Calendar, Globe, Save, Info } from "lucide-react";

interface LimitRule {
  type:
    | "min_withdrawal"
    | "daily_limit"
    | "weekly_limit"
    | "monthly_limit"
    | "fees";
  value: number;
  currency: string;
  appliesTo: string[];
}

interface LimitsConfigurationProps {
  isDark: boolean;
}

const LimitsConfiguration = ({ isDark }: LimitsConfigurationProps) => {
  const [limits, setLimits] = useState<LimitRule[]>([
    {
      type: "min_withdrawal",
      value: 5000,
      currency: "EUR",
      appliesTo: ["all"],
    },
    { type: "daily_limit", value: 50000, currency: "EUR", appliesTo: ["all"] },
    {
      type: "weekly_limit",
      value: 200000,
      currency: "EUR",
      appliesTo: ["all"],
    },
    {
      type: "monthly_limit",
      value: 500000,
      currency: "EUR",
      appliesTo: ["all"],
    },
    { type: "fees", value: 2.5, currency: "%", appliesTo: ["standard"] },
  ]);

  const [geoRules, setGeoRules] = useState([
    { country: "FR", minWithdrawal: 5000, fees: 2.5, specialRules: "Aucune" },
    {
      country: "US",
      minWithdrawal: 10000,
      fees: 3.5,
      specialRules: "+1 jour d'attente",
    },
    {
      country: "GB",
      minWithdrawal: 7500,
      fees: 2.0,
      specialRules: "Retrait immédiat VIP",
    },
    {
      country: "DE",
      minWithdrawal: 5000,
      fees: 1.5,
      specialRules: "Frais réduits",
    },
  ]);

  const updateLimit = (type: LimitRule["type"], value: number) => {
    setLimits(
      limits.map((limit) => (limit.type === type ? { ...limit, value } : limit))
    );
  };

  const saveLimits = () => {
    // API call to save limits
    console.log("Saving limits:", limits);
    console.log("Geo rules:", geoRules);
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
        <div className="flex items-center">
          <div
            className={`p-3 rounded-xl ${
              isDark ? "bg-amber-900/30" : "bg-amber-100"
            }`}
          >
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold">
              Limites et Plafonds Financiers
            </h3>
            <p className="text-sm opacity-75">
              Seuils minimum et plafonds de retrait
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Global Limits */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-6">Limites globales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {limits.map((limit) => (
              <div
                key={limit.type}
                className={`p-6 rounded-xl border ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-medium mb-1">
                      {limit.type === "min_withdrawal" && "Seuil minimum"}
                      {limit.type === "daily_limit" && "Plafond quotidien"}
                      {limit.type === "weekly_limit" && "Plafond hebdomadaire"}
                      {limit.type === "monthly_limit" && "Plafond mensuel"}
                      {limit.type === "fees" && "Frais de service"}
                    </div>
                    <div className="text-sm opacity-75">
                      {limit.type === "fees"
                        ? "Pourcentage appliqué"
                        : "Maximum par période"}
                    </div>
                  </div>
                  {limit.type === "fees" ? (
                    <Euro className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Calendar className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {limit.value.toLocaleString()}
                      <span className="text-sm font-normal ml-1">
                        {limit.type === "fees" ? "%" : limit.currency}
                      </span>
                    </div>
                    <div className="text-xs mt-1">
                      {limit.type === "min_withdrawal" && "≈ 50€"}
                      {limit.type === "daily_limit" && "≈ 500€"}
                      {limit.type === "weekly_limit" && "≈ 2000€"}
                      {limit.type === "monthly_limit" && "≈ 5000€"}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        updateLimit(
                          limit.type,
                          Math.max(
                            0,
                            limit.value - (limit.type === "fees" ? 0.5 : 1000)
                          )
                        )
                      }
                      className={`px-3 py-1 rounded ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        updateLimit(
                          limit.type,
                          limit.value + (limit.type === "fees" ? 0.5 : 1000)
                        )
                      }
                      className={`px-3 py-1 rounded ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographical Rules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold">
              Règles par zone géographique
            </h4>
            <div
              className={`px-3 py-1 rounded-full text-sm flex items-center ${
                isDark
                  ? "bg-blue-900/30 text-blue-300"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <Globe className="w-4 h-4 mr-2" />
              Configuration par pays
            </div>
          </div>

          <div
            className={`rounded-xl overflow-hidden border ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <table className="w-full">
              <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  <th className="p-4 text-left font-medium">Pays</th>
                  <th className="p-4 text-left font-medium">Seuil minimum</th>
                  <th className="p-4 text-left font-medium">Frais</th>
                  <th className="p-4 text-left font-medium">
                    Règles spéciales
                  </th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {geoRules.map((rule, index) => (
                  <tr
                    key={index}
                    className={isDark ? "border-gray-700" : "border-gray-200"}
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {rule.country === "FR"
                            ? "🇫🇷"
                            : rule.country === "US"
                            ? "🇺🇸"
                            : rule.country === "GB"
                            ? "🇬🇧"
                            : rule.country === "DE"
                            ? "🇩🇪"
                            : "🌐"}
                        </span>
                        <div>
                          <div className="font-medium">{rule.country}</div>
                          <div className="text-sm opacity-75">
                            {rule.country === "FR"
                              ? "France"
                              : rule.country === "US"
                              ? "États-Unis"
                              : rule.country === "GB"
                              ? "Royaume-Uni"
                              : rule.country === "DE"
                              ? "Allemagne"
                              : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {(rule.minWithdrawal / 100).toFixed(2)} €
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          isDark
                            ? "bg-green-900/30 text-green-400"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {rule.fees}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{rule.specialRules}</div>
                    </td>
                    <td className="p-4">
                      <button
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isDark
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className={`p-4 border-t ${
                isDark
                  ? "border-gray-700 bg-gray-800/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <button
                className={`px-4 py-2 rounded-lg border ${
                  isDark
                    ? "border-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                + Ajouter un pays
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveLimits}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer toutes les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitsConfiguration;
