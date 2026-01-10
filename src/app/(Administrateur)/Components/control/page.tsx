// app/admin/control/page.tsx
"use client";

import React, { useState } from "react";

import { Settings, Shield, Clock, Globe, AlertTriangle } from "lucide-react";
import QuickActionsPanel from "./QuickActionsPanel";
import DelayConfiguration from "./configuration/DelayConfiguration";
import LimitsConfiguration from "./configuration/LimitsConfiguration";
import EarlyReleaseModal from "./modals/EarlyReleaseModal";
export default function ControlPage() {
  const [isDark, setIsDark] = useState(true);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("delays");

  const configurationSections = [
    {
      id: "delays",
      title: "Délais d'Attente",
      icon: Clock,
      component: DelayConfiguration,
    },
    {
      id: "limits",
      title: "Limites Financières",
      icon: Shield,
      component: LimitsConfiguration,
    },
    { id: "geography", title: "Zones Géographiques", icon: Globe },
    { id: "validation", title: "Validation Retraits", icon: Settings },
    { id: "fraud", title: "Détection Fraude", icon: AlertTriangle },
  ];

  const ActiveComponent = configurationSections.find(
    (s) => s.id === activeSection
  )?.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec toggle theme */}
      <div
        className={`sticky top-0 z-10 border-b ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contrôle Administrateur</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configuration et interventions manuelles sur les paiements
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm">Système actif</span>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={
                isDark ? "Passer en mode clair" : "Passer en mode sombre"
              }
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="p-6">
        <QuickActionsPanel isDark={isDark} />
      </div>

      {/* Navigation Sections */}
      <div className="px-6 mb-6">
        <div
          className={`rounded-xl p-1 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <div className="flex flex-wrap gap-2">
            {configurationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? isDark
                      ? "bg-gray-700 text-white shadow-lg"
                      : "bg-white text-gray-900 shadow-lg"
                    : isDark
                    ? "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu de la section active */}
      <div className="px-6 pb-6">
        {activeSection === "delays" && <DelayConfiguration isDark={isDark} />}
        {activeSection === "limits" && <LimitsConfiguration isDark={isDark} />}

        {activeSection === "geography" && (
          <div
            className={`rounded-2xl border p-8 ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-center">
              <Globe className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-2xl font-bold mb-2">Zones Géographiques</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configurez les règles spécifiques par pays et région
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                  className={`p-6 rounded-xl border ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-3">🇫🇷</div>
                  <h4 className="font-semibold mb-2">France</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Seuil: 50€ • Frais: 2.5% • Délai: 14 jours
                  </div>
                </div>
                <div
                  className={`p-6 rounded-xl border ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-3">🇺🇸</div>
                  <h4 className="font-semibold mb-2">États-Unis</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Seuil: 100€ • Frais: 3.5% • Délai: 15 jours
                  </div>
                </div>
                <div
                  className={`p-6 rounded-xl border ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-3">🇩🇪</div>
                  <h4 className="font-semibold mb-2">Allemagne</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Seuil: 50€ • Frais: 1.5% • Délai: 14 jours
                  </div>
                </div>
              </div>

              <button
                className={`px-6 py-3 rounded-lg font-medium ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                + Ajouter un pays
              </button>
            </div>
          </div>
        )}

        {activeSection === "validation" && (
          <div
            className={`rounded-2xl border p-8 ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center mb-8">
                <Settings className="w-8 h-8 mr-4 text-blue-500" />
                <div>
                  <h3 className="text-2xl font-bold">
                    Mode de Validation des Retraits
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Configurez l'approbation automatique ou manuelle
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div
                  className={`p-6 rounded-xl border ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">
                        Validation Automatique
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Les retraits sont approuvés automatiquement selon les
                        règles
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${
                        isDark
                          ? "bg-green-900/30 text-green-400"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      Actif
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Montant maximum pour auto-approbation
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          defaultValue="5000"
                          className="flex-1"
                        />
                        <span className="font-semibold">5,000 €</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Au-delà de ce montant, validation manuelle requise
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Exceptions (validation manuelle forcée)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Nouveaux prestataires",
                          "Premier retrait",
                          "Montant > 10,000€",
                          "Pays à risque",
                        ].map((item) => (
                          <span
                            key={item}
                            className={`px-3 py-1.5 rounded-lg text-sm ${
                              isDark ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl border ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <h4 className="font-semibold text-lg mb-4">
                    Approbation en Masse
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Valider plusieurs retraits en une seule action
                  </p>
                  <button
                    className={`px-6 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    Gérer l'approbation en masse
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "fraud" && (
          <div
            className={`rounded-2xl border p-8 ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center mb-8">
              <AlertTriangle className="w-8 h-8 mr-4 text-amber-500" />
              <div>
                <h3 className="text-2xl font-bold">
                  Détection et Prévention de la Fraude
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Surveillez et agissez sur les transactions suspectes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div
                className={`p-6 rounded-xl border ${
                  isDark
                    ? "border-amber-700/30 bg-amber-900/10"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Alertes Actives</h4>
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-sm">
                    5
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Transactions nécessitant votre attention
                </p>
                <button
                  className={`w-full py-2.5 rounded-lg font-medium ${
                    isDark
                      ? "bg-amber-700 hover:bg-amber-600"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  Voir les alertes
                </button>
              </div>

              <div
                className={`p-6 rounded-xl border ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-4">Liste Noire</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Prestataires bloqués
                </p>
                <button
                  className={`w-full py-2.5 rounded-lg font-medium ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  Gérer la liste noire
                </button>
              </div>
            </div>

            <div
              className={`p-6 rounded-xl border ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h4 className="font-semibold mb-4">Règles de Détection</h4>
              <div className="space-y-3">
                {[
                  {
                    rule: "Retrait > 10,000€",
                    action: "Alerte",
                    enabled: true,
                  },
                  {
                    rule: "Multiples comptes même IP",
                    action: "Blocage",
                    enabled: true,
                  },
                  {
                    rule: "Changement fréquent RIB",
                    action: "Alerte",
                    enabled: true,
                  },
                  {
                    rule: "Premier retrait < 24h",
                    action: "Validation manuelle",
                    enabled: false,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div>
                      <div className="font-medium">{item.rule}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.action}
                      </div>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full relative ${
                        item.enabled ? "bg-green-500" : "bg-gray-400"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transform ${
                          item.enabled ? "right-1" : "left-1"
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EarlyReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
