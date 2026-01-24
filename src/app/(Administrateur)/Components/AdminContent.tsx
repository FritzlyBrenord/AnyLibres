"use client";

import React from "react";
import type { MenuId } from "./menus";

import ContentWrapper from "./ContentWrapper";
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
    analytics: Analytics,
    reports: Reports,
    settings: Settings,
    security: ControlPage,
    messages: Messages,
    calendar: Calendar,
    notifications: NotificationManagement,
  };

  const Component = components[activeMenu] || Dashboard;

  return (
    <ContentWrapper isDark={isDark}>
      <Component isDark={isDark} />
    </ContentWrapper>
  );
};

export default AdminContent;
