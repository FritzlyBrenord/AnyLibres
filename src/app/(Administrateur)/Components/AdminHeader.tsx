"use client";

import React from "react";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Users,
  DollarSign,
  Package,
  Zap,
  Globe,
  Filter,
  Download,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface AdminHeaderProps {
  isDark: boolean;
  onToggleSidebar: () => void;
  activeMenu: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  isDark,
  onToggleSidebar,
  activeMenu,
}) => {
  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-lg ${
        isDark
          ? "bg-gray-900/80 border-gray-800/50"
          : "bg-white/80 border-gray-200/50"
      }`}
    >
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Section - Menu + Title */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                  : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <h1
                className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold capitalize flex items-center gap-1 sm:gap-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <span className="truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                  {activeMenu.replace("-", " ")}
                </span>
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded whitespace-nowrap">
                  Premium
                </span>
              </h1>

              {/* Platform Description - Desktop only */}
              <p
                className={`hidden lg:flex items-center gap-2 text-sm ml-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Globe className="w-4 h-4" />
                Plateforme de freelancing exclusive
              </p>
            </div>
          </div>

          {/* Right Section - Actions + Profile */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {/* Mobile Search Button */}
            <button
              className={`lg:hidden p-2 rounded-lg ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                  : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Desktop Search Bar */}
            <div
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2.5 rounded-xl ${
                isDark
                  ? "bg-gray-800/50 text-gray-400"
                  : "bg-gray-100/50 text-gray-600"
              }`}
            >
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Recherche..."
                className={`bg-transparent border-none outline-none text-sm w-32 md:w-40 lg:w-48 ${
                  isDark ? "placeholder-gray-500" : "placeholder-gray-400"
                }`}
              />
              <Filter className="w-3 h-3 md:w-4 md:h-4" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Export Button (Desktop only) */}
              <button
                className={`hidden md:flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
                }`}
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                  Export
                </span>
              </button>

              {/* Notifications */}
              <button
                className={`p-1.5 sm:p-2 rounded-lg md:rounded-xl relative transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                    : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full border border-white dark:border-gray-800"></span>
              </button>

              {/* Messages */}
              <button
                className={`hidden sm:flex p-1.5 sm:p-2 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? "bg-gray-800/50 hover:bg-gray-800 text-gray-400"
                    : "bg-gray-100/50 hover:bg-gray-100 text-gray-600"
                }`}
                aria-label="Messages"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* User Profile - Toujours visible */}
              <div
                className={`flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? "bg-gray-800/50 hover:bg-gray-800"
                    : "bg-gray-100/50 hover:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-0.5">
                    <p
                      className={`text-xs md:text-sm font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Admin Pro
                    </p>
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" />
                  </div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Super Admin
                  </p>
                </div>
                <ChevronDown
                  className={`hidden md:block w-3 h-3 md:w-4 md:h-4 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date Section - Desktop only */}
        <div className="hidden lg:flex items-center justify-between mt-2 md:mt-4">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              isDark ? "bg-gray-800/50" : "bg-gray-100/50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span
              className={`text-sm font-medium whitespace-nowrap ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Quick Action Buttons - Desktop only */}
          <div className="flex items-center gap-2">
            <button
              className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                isDark
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
              }`}
            >
              Analytics Live
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
