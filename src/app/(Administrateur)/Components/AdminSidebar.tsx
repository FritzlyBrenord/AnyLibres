// src/app/admin/components/AdminSidebar.tsx
"use client";

import React from "react";
import { useLanguageContext } from "../../../contexts/LanguageContext";
import { mainMenus, systemMenus, type MenuId, type MenuItem } from "./menus";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";

interface AdminSidebarProps {
  activeMenu: MenuId;
  isDark: boolean;
  isCollapsed: boolean;
  onMenuClick: (menuId: MenuId) => void;
  onToggleTheme: () => void;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeMenu,
  isDark,
  isCollapsed,
  onMenuClick,
  onToggleTheme,
  onToggleCollapse,
  onCloseMobile,
  isMobile = false,
}) => {
  const { t } = useLanguageContext();

  const renderMenuItems = (menus: MenuItem[], title: string) => (
    <div>
      <div className="mb-8">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-2 mb-4 px-3">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {title === "Navigation Principale" ? (t.admin?.sidebar?.mainNav || title) : 
               title === "Système" ? (t.admin?.sidebar?.system || title) : title}
            </h3>
          </div>
        )}

        <div className="space-y-2">
          {menus.map((menu) => {
            const isActive = activeMenu === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  onMenuClick(menu.id as MenuId);
                  if (isMobile && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`relative w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? `bg-gradient-to-r ${menu.gradient} text-white shadow-xl scale-[1.02]`
                    : isDark
                    ? "hover:bg-gray-800/80 text-gray-300 hover:text-white backdrop-blur-sm"
                    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
                } ${isCollapsed && !isMobile ? "justify-center px-3" : ""}`}
              >
                {/* Effet de brillance au hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                )}

                <div className="relative flex items-center gap-3 z-10">
                  <div
                    className={`p-2 rounded-lg backdrop-blur-sm ${
                      isActive
                        ? "bg-white/20"
                        : isDark
                        ? "bg-gray-800/50"
                        : "bg-gray-100"
                    }`}
                  >
                    <div
                      className={`transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      {menu.icon}
                    </div>
                  </div>

                  {(!isCollapsed || isMobile) && (
                    <div className="text-left">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {(t.admin?.sidebar?.menus as any)?.[menu.id] || menu.label}
                        {menu.id === "dashboard" && (
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isActive
                            ? "text-white/90"
                            : isDark
                            ? "text-gray-500"
                            : "text-gray-500"
                        }`}
                      >
                         {(t.admin?.sidebar?.descriptions as any)?.[menu.id] || menu.description}
                      </div>
                    </div>
                  )}
                </div>

                {(!isCollapsed || isMobile) && menu.badge && (
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full min-w-6 text-center z-10 ${
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : isDark
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {menu.badge}
                  </span>
                )}

                {isActive && (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`h-screen flex flex-col transition-all duration-500 ${
        isDark
          ? "bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800/50"
          : "bg-gradient-to-b from-white to-gray-50 border-r border-gray-200/50"
      } ${isCollapsed && !isMobile ? "w-24" : "w-72"} shadow-2xl`}
    >
      {/* Header Sidebar Premium */}
      <div
        className={`p-6 border-b ${
          isDark ? "border-gray-800/50" : "border-gray-200/50"
        }`}
      >
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg`}
                >
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1
                  className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent`}
                >
                  Anylibre
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Premium Admin
                  </p>
                </div>
              </div>
            </div>
          )}

          {isMobile ? (
            <button
              onClick={onCloseMobile}
              className={`p-2 rounded-lg backdrop-blur-sm ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                  : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className={`p-2 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                  : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
              }`}
              title={isCollapsed ? "Étendre" : "Réduire"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Sidebar */}
      <div className="flex-1 overflow-y-auto p-5">
        {renderMenuItems(mainMenus, "Navigation Principale")}
        {renderMenuItems(systemMenus, "Système")}
      </div>

      {/* Footer Sidebar Premium */}
      <div
        className={`p-5 border-t ${
          isDark ? "border-gray-800/50" : "border-gray-200/50"
        } backdrop-blur-sm`}
      >
        <div className="space-y-4">
          {/* Toggle Theme */}
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
              isDark
                ? "bg-gray-800/50 hover:bg-gray-800"
                : "bg-gray-100/50 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600" />
                )}
              </div>
              {(!isCollapsed || isMobile) && (
                <div className="text-left">
                  <div
                    className={`text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {isDark ? (t.admin?.sidebar?.lightMode || "Mode Clair") : (t.admin?.sidebar?.darkMode || "Mode Sombre")}
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {isDark
                      ? (t.admin?.sidebar?.enableLight || "Activer le thème clair")
                      : (t.admin?.sidebar?.enableDark || "Activer le thème sombre")}
                  </div>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobile) && (
              <div
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {isDark ? "🌙" : "☀️"}
              </div>
            )}
          </button>

          {/* User Profile Premium */}
          {(!isCollapsed || isMobile) && (
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-gray-800/50" : "bg-gray-100/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-bold text-sm ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Admin Premium
                    </h4>
                    <div className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded text-xs text-white font-bold">
                      VIP
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Super Administrateur
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
