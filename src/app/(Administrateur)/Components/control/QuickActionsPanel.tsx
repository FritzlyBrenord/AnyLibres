// components/admin/control/QuickActionsPanel.tsx
"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  Zap,
  Lock,
  Unlock,
  Euro,
  Ban,
  Clock,
  Globe,
  Shield,
  Settings,
  Filter,
  Bell,
  UserX,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";

interface QuickActionsPanelProps {
  isDark: boolean;
}

const QuickActionsPanel = ({ isDark }: QuickActionsPanelProps) => {
  const { theme } = useTheme();
  const currentTheme = isDark ? "dark" : theme || "light";

  const quickActions = [
    {
      title: "LIBÉRER FONDS",
      description: "Débloquer avant date",
      icon: Unlock,
      type: "release",
      variants: [
        {
          label: "Pour un utilisateur",
          href: "/admin/control/releases/single",
        },
        { label: "Pour tous", href: "/admin/control/releases/bulk" },
        { label: "Par catégorie", href: "/admin/control/releases/category" },
      ],
      color:
        "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "GELER FONDS",
      description: "Bloquer temporairement",
      icon: Lock,
      type: "freeze",
      variants: [
        {
          label: "Utilisateur spécifique",
          href: "/admin/control/freeze/single",
        },
        { label: "Par motif", href: "/admin/control/freeze/reason" },
        { label: "Urgence", href: "/admin/control/freeze/emergency" },
      ],
      color:
        "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
    },
    {
      title: "PAIEMENT MANUEL",
      description: "Transaction exceptionnelle",
      icon: Euro,
      type: "payment",
      variants: [
        {
          label: "Nouveau paiement",
          href: "/admin/control/manual-payments/new",
        },
        {
          label: "Annuler paiement",
          href: "/admin/control/manual-payments/cancel",
        },
        {
          label: "Ajuster montant",
          href: "/admin/control/manual-payments/adjust",
        },
      ],
      color:
        "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    },
    {
      title: "BLACKLIST",
      description: "Bloquer prestataire",
      icon: UserX,
      type: "blacklist",
      variants: [
        { label: "Ajouter à liste", href: "/admin/control/blacklist/add" },
        { label: "Retirer de liste", href: "/admin/control/blacklist/remove" },
        { label: "Voir liste", href: "/admin/control/blacklist/view" },
      ],
      color:
        "bg-gray-800/10 border-gray-800/20 text-gray-800 dark:text-gray-300",
    },
  ];

  const configSections = [
    {
      title: "DÉLAIS D'ATTENTE",
      icon: Clock,
      actions: [
        { label: "Configurer 0-90 jours", href: "/admin/control/rules/delays" },
        {
          label: "Périodes exceptionnelles",
          href: "/admin/control/rules/exceptions",
        },
        { label: "Règles VIP", href: "/admin/control/rules/vip" },
      ],
    },
    {
      title: "ZONES GÉOGRAPHIQUES",
      icon: Globe,
      actions: [
        { label: "Par pays", href: "/admin/control/rules/countries" },
        { label: "Régions spéciales", href: "/admin/control/rules/regions" },
        { label: "Devises", href: "/admin/control/rules/currencies" },
      ],
    },
    {
      title: "LIMITES FINANCIÈRES",
      icon: Shield,
      actions: [
        {
          label: "Seuil minimum (ex: 50€)",
          href: "/admin/control/rules/minimum",
        },
        { label: "Plafonds retrait", href: "/admin/control/rules/limits" },
        { label: "Frais de service", href: "/admin/control/rules/fees" },
      ],
    },
    {
      title: "VALIDATION RETRAITS",
      icon: Filter,
      actions: [
        {
          label: "Mode auto vs manuel",
          href: "/admin/control/rules/validation",
        },
        {
          label: "Règles d'approbation",
          href: "/admin/control/rules/approval",
        },
        {
          label: "Approbation en masse",
          href: "/admin/control/withdrawals/bulk",
        },
      ],
    },
  ];

  const securityActions = [
    {
      title: "ALERTES FRAUDE",
      icon: AlertTriangle,
      badge: 5,
      href: "/admin/control/fraud/alerts",
      description: "Transactions suspectes",
    },
    {
      title: "NOTIFICATIONS",
      icon: Bell,
      href: "/admin/control/notifications",
      description: "Configurer alertes",
    },
    {
      title: "SYNCHRO BANQUE",
      icon: RefreshCw,
      href: "/admin/control/sync",
      description: "Forcer synchronisation",
    },
    {
      title: "EXPORT DONNÉES",
      icon: Download,
      href: "/admin/control/export",
      description: "Rapports et données",
    },
  ];

  return (
    <div
      className={`p-6 ${currentTheme === "dark" ? "bg-gray-900" : "bg-white"}`}
    >
      {/* ACTIONS RAPIDES */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Actions Rapides
          </h2>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
            Intervention immédiate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.type}
              className={`p-5 rounded-xl border ${action.color} transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-4">
                <action.icon className="w-8 h-8" />
                <div className="flex space-x-2">
                  {action.variants.map((variant, idx) => (
                    <a
                      key={idx}
                      href={variant.href}
                      className="px-2 py-1 text-xs rounded bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition"
                    >
                      {variant.label}
                    </a>
                  ))}
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-sm opacity-75 mb-3">{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATION */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Configuration des Règles
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {configSections.map((section) => (
            <div
              key={section.title}
              className={`p-6 rounded-xl border ${
                currentTheme === "dark"
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 mr-3 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-lg">{section.title}</h3>
              </div>
              <div className="space-y-3">
                {section.actions.map((action, idx) => (
                  <a
                    key={idx}
                    href={action.href}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      currentTheme === "dark"
                        ? "hover:bg-gray-700/50"
                        : "hover:bg-white"
                    } transition group`}
                  >
                    <span>{action.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition">
                      →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SÉCURITÉ ET MAINTENANCE */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Sécurité et Maintenance
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {securityActions.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className={`p-5 rounded-xl border ${
                currentTheme === "dark"
                  ? "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                  : "bg-gray-50 border-gray-200 hover:bg-white"
              } transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <item.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                {item.badge && (
                  <span className="px-2 py-1 text-xs rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 className="font-semibold mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
