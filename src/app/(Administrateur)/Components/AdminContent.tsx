"use client";

import React from "react";
import type { MenuId } from "./menus";

import ContentWrapper from "./ContentWrapper";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Lock, ShieldAlert } from "lucide-react";
import Dashboard from "./Dashboard";
import Services from "./Services";
import Orders from "./Orders";
import Userss from "./Users";
import FinanceWithBalances from "./FinanceWithBalances";
import Settings from "./Settings";
import QuickActionsPanel from "./control/QuickActionsPanel";
import ControlPage from "./control/page";
import NotificationManagement from "./NotificationManagement";
import DisputeManagement from "./DisputeManagement";
import { SupportManagement } from "./SupportManagement";
import { AdminMessaging } from "./AdminMessaging";
import dynamic from "next/dynamic";

const AccessManagement = dynamic(() => import("./AccessManagement"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  ),
  ssr: false,
});

interface AdminContentProps {
  activeMenu: MenuId;
  isDark: boolean;
}

const Analytics: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="animate-fade-in p-6">
    <h1
      className={`text-2xl font-bold ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      Analytics
    </h1>
    <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
      Analyses avancées
    </p>
  </div>
);

const Reports: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="animate-fade-in p-6">
    <h1
      className={`text-2xl font-bold ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      Rapports
    </h1>
    <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
      Génération de rapports
    </p>
  </div>
);

const Messages: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="animate-fade-in p-6">
    <h1
      className={`text-2xl font-bold ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      Messages
    </h1>
    <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
      Gestion des messages
    </p>
  </div>
);

const Calendar: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="animate-fade-in p-6">
    <h1
      className={`text-2xl font-bold ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      Calendrier
    </h1>
    <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
      Gestion du calendrier
    </p>
  </div>
);

const AdminContent: React.FC<AdminContentProps> = ({ activeMenu, isDark }) => {
  const components: Record<MenuId, React.FC<{ isDark: boolean }>> = {
    dashboard: Dashboard,
    services: Services,
    orders: Orders,
    disputes: DisputeManagement,
    finance: FinanceWithBalances,
    users: Userss,
    settings: Settings,

    messaging: AdminMessaging,
    messages: AdminMessaging,

    notifications: NotificationManagement,
    support: SupportManagement,
    access: AccessManagement,
  };

  const { hasPermission, loading } = usePermissions();

  const menuPermissionMap: Record<string, string> = {
    dashboard: 'dashboard.view',
    services: 'services.view',
    orders: 'orders.view',
    finance: 'finance.view',
    users: 'users.view',
    disputes: 'disputes.view',
    messaging: 'support.chats.view', // ✅ Déjà présent
    messages: 'support.chats.view',
    notifications: 'notifications.view',
    support: 'support.tickets.view',
    settings: 'settings.view',
    access: 'system.users.manage',
  };

  const requiredPermission = menuPermissionMap[activeMenu];
  // ✅ FIX: Autoriser SEULEMENT si permission définie ET accordée
  const isAuthorized = requiredPermission && hasPermission(requiredPermission);

  if (loading) {
    return (
      <ContentWrapper isDark={isDark}>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Vérification des accès...
          </p>
        </div>
      </ContentWrapper>
    );
  }

  if (!isAuthorized) {
    return (
      <ContentWrapper isDark={isDark}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'}`}>
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Accès Refusé
          </h2>
          <p className={`max-w-md text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Vous n'avez pas les permissions nécessaires pour accéder au module <span className="font-bold text-indigo-500">{activeMenu}</span>. 
            Veuillez contacter un administrateur système si vous pensez qu'il s'agit d'une erreur.
          </p>
          <div className={`mt-8 p-4 rounded-xl flex items-center gap-3 text-xs font-mono ${isDark ? 'bg-gray-800/50 text-gray-500' : 'bg-slate-50 text-slate-400'}`}>
            <Lock className="w-4 h-4" />
            <span>PERMISSION_REQUIRED: {requiredPermission}</span>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  const Component = components[activeMenu] || Dashboard;

  return (
    <ContentWrapper isDark={isDark}>
      <Component isDark={isDark} />
    </ContentWrapper>
  );
};

export default AdminContent;
