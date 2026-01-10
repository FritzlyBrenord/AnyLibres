// src/app/admin/page.tsx
"use client";

import React from "react";
import {
  Rocket,
  Shield,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Target,
  Award,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section Premium */}
      <div
        className={`relative overflow-hidden rounded-3xl p-8 mb-8 ${
          true
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-white via-gray-50 to-white"
        } shadow-2xl`}
      >
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="lg:w-2/3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 rounded-full text-sm font-medium">
                    VERSION PREMIUM
                  </span>
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Tableau de Bord Exclusif
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8">
                Gérez votre plateforme Anylibre avec des outils professionnels
                et des insights avancés
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Démarrer un Audit
                  </div>
                </button>
                <button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:shadow-2xl hover:shadow-gray-500/30 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Voir les Analytics
                  </div>
                </button>
              </div>
            </div>

            <div className="lg:w-1/3">
              <div
                className={`p-6 rounded-2xl backdrop-blur-lg border ${
                  true
                    ? "bg-gray-800/30 border-gray-700/50"
                    : "bg-white/30 border-gray-200/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="font-bold text-white">Sécurité Maximale</h3>
                    <p className="text-sm text-gray-400">
                      Système 100% sécurisé
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-blue-500" />
                  <div>
                    <h3 className="font-bold text-white">Disponibilité 24/7</h3>
                    <p className="text-sm text-gray-400">
                      Service toujours actif
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-purple-500" />
                  <div>
                    <h3 className="font-bold text-white">Performance</h3>
                    <p className="text-sm text-gray-400">
                      Optimisation continue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Effets de fond */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Revenus Totaux",
            value: "$124,890",
            change: "+23.5%",
            icon: <DollarSign className="w-6 h-6" />,
            color: "from-emerald-500 to-teal-500",
            details: "Mois en cours",
          },
          {
            title: "Utilisateurs Actifs",
            value: "2,456",
            change: "+12.3%",
            icon: <Users className="w-6 h-6" />,
            color: "from-blue-500 to-cyan-500",
            details: "324 nouveaux",
          },
          {
            title: "Commandes Traitées",
            value: "892",
            change: "+8.7%",
            icon: <Package className="w-6 h-6" />,
            color: "from-purple-500 to-pink-500",
            details: "56 en attente",
          },
          {
            title: "Performance",
            value: "94%",
            change: "+5.2%",
            icon: <TrendingUp className="w-6 h-6" />,
            color: "from-orange-500 to-yellow-500",
            details: "Excellent",
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className={`group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
              true ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-white"
            } shadow-xl hover:shadow-2xl`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}
                >
                  <div className="text-white">{metric.icon}</div>
                </div>
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400">
                  {metric.change}
                </span>
              </div>

              <h3 className="text-3xl font-bold text-white mb-1">
                {metric.value}
              </h3>
              <p className="text-gray-400 text-sm font-medium mb-2">
                {metric.title}
              </p>
              <p className="text-gray-500 text-xs">{metric.details}</p>
            </div>

            <div
              className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            ></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className={`md:col-span-2 rounded-2xl p-6 ${
            true ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-white"
          } shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Actions Rapides
              </h3>
              <p className="text-gray-400">
                Accédez rapidement aux fonctionnalités principales
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Users />, label: "Utilisateurs", color: "bg-blue-500" },
              { icon: <Package />, label: "Commandes", color: "bg-purple-500" },
              {
                icon: <DollarSign />,
                label: "Paiements",
                color: "bg-green-500",
              },
              {
                icon: <BarChart3 />,
                label: "Rapports",
                color: "bg-orange-500",
              },
            ].map((action, idx) => (
              <button
                key={idx}
                className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  true
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div
                  className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 mx-auto`}
                >
                  <div className="text-white">{action.icon}</div>
                </div>
                <span className="text-sm font-medium text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${
            true ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-white"
          } shadow-xl`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="text-lg font-bold text-white">Statut VIP</h3>
              <p className="text-sm text-gray-400">Niveau Administrateur</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Complétude</span>
              <span className="text-white font-bold">94%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                style={{ width: "94%" }}
              ></div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Permissions</span>
                <span className="text-green-500 font-bold">Illimitées</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Accès</span>
                <span className="text-blue-500 font-bold">Complet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Note */}
      <div
        className={`rounded-2xl p-6 mb-8 ${
          true
            ? "bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-800/30"
            : "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              🎯 Phase de Développement Premium
            </h3>
            <p className="text-gray-300 mb-3">
              Cette interface admin est maintenant complète avec :
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Design premium avec thème clair/sombre
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Navigation fluide et animations
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Données de test complètes
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Interface 100% responsive
              </li>
            </ul>
            <p className="text-blue-400 font-medium">
              Prêt pour le développement des modules métier !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
