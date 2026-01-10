"use client";

import React, { useEffect, useState } from "react";

import AdminSidebar from "../Components/AdminSidebar";
import AdminHeader from "../Components/AdminHeader";
import AdminContent from "../Components/AdminContent";
import type { MenuId } from "../Components/menus";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeMenu, setActiveMenu] = useState<MenuId>("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial avec animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Appliquer le thème au body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Animation feedback
    const themeBtn = document.querySelector('[title*="Mode"]');
    if (themeBtn) {
      themeBtn.classList.add("scale-125");
      setTimeout(() => {
        themeBtn.classList.remove("scale-125");
      }, 300);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMenuClick = (menuId: MenuId) => {
    setActiveMenu(menuId);
    // Animation de feedback
    const activeBtn = document.querySelector(`[data-menu="${menuId}"]`);
    if (activeBtn) {
      activeBtn.classList.add("animate-pulse");
      setTimeout(() => {
        activeBtn.classList.remove("animate-pulse");
      }, 300);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm animate-spin"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Chargement de l'Admin Premium...
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Préparation de votre interface exclusive
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white"
          : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 text-gray-900"
      }`}
    >
      <div className="flex">
        {/* Desktop Sidebar - FIXE */}
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-40">
          <AdminSidebar
            activeMenu={activeMenu}
            isDark={isDark}
            isCollapsed={isSidebarCollapsed}
            onMenuClick={handleMenuClick}
            onToggleTheme={toggleTheme}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>

        {/* Mobile Sidebar Overlay avec animation */}
        {isMobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden animate-fade-in"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div
              className={`fixed left-0 top-0 h-screen z-50 lg:hidden transform transition-transform duration-500 ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <AdminSidebar
                activeMenu={activeMenu}
                isDark={isDark}
                isCollapsed={false}
                isMobile={true}
                onMenuClick={handleMenuClick}
                onToggleTheme={toggleTheme}
                onToggleCollapse={toggleSidebarCollapse}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main Content Area - Avec marge pour la sidebar */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            !isSidebarCollapsed ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          <AdminHeader
            isDark={isDark}
            onToggleSidebar={toggleMobileSidebar}
            activeMenu={activeMenu}
          />

          <AdminContent activeMenu={activeMenu} isDark={isDark} />
        </div>
      </div>

      {/* Notifications système */}
      <div className="hidden fixed bottom-4 right-4 z-40 space-y-2">
        <div
          className={`p-4 rounded-xl backdrop-blur-lg shadow-2xl transform transition-all duration-500 ${
            isDark
              ? "bg-gray-800/90 border border-gray-700/50"
              : "bg-white/90 border border-gray-200/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p
                className={`font-medium text-sm ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Système actif
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Toutes les fonctionnalités sont opérationnelles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles globaux */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        /* Scrollbar Premium */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: ${isDark
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(243, 244, 246, 0.5)"};
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: ${isDark
            ? "linear-gradient(to bottom, #3b82f6, #06b6d4)"
            : "linear-gradient(to bottom, #60a5fa, #38bdf8)"};
          border-radius: 10px;
          border: 2px solid ${isDark ? "#1f2937" : "#f3f4f6"};
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark
            ? "linear-gradient(to bottom, #2563eb, #0891b2)"
            : "linear-gradient(to bottom, #3b82f6, #0ea5e9)"};
        }

        /* Selection color */
        ::selection {
          background: ${isDark
            ? "rgba(59, 130, 246, 0.5)"
            : "rgba(59, 130, 246, 0.3)"};
          color: ${isDark ? "white" : "inherit"};
        }

        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}
