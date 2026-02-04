"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguageContext } from "../../../contexts/LanguageContext";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Zap,
  Filter,
  Calendar,
  MessageSquare,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Command,
  Crown,
  Check,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import AnalyticsLive from "./AnalyticsLive";
import { useAuth } from "../../../contexts/AuthContext";
import { usePermissions } from "../../../contexts/PermissionsContext";

interface AdminHeaderProps {
  isDark: boolean;
  onToggleSidebar: () => void;
  onToggleCollapse?: () => void;
  onMenuClick: (menuId: any) => void;
  activeMenu: string;
  isSidebarCollapsed?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  isDark,
  onToggleSidebar,
  onToggleCollapse,
  onMenuClick,
  activeMenu,
  isSidebarCollapsed = false,
}) => {
  const { language, changeLanguage, t } = useLanguageContext();
  const { user, signOut, refreshUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Détection du scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }

    try {
      setIsUploading(true);
      const formDataPhoto = new FormData();
      formDataPhoto.append("file", file);

      const response = await fetch("/api/admin/profile/upload-photo", {
        method: "POST",
        body: formDataPhoto,
      });

      const data = await response.json();

      if (data.success) {
        await refreshUser();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Une erreur est survenue lors de la mise à jour de la photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷", region: "FR" },
    { code: "en", label: "English", flag: "🇬🇧", region: "EN" },
    { code: "es", label: "Español", flag: "🇪🇸", region: "ES" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  const formatMenuTitle = (menu: string) => {
    return menu
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      {showAnalytics && (
        <AnalyticsLive
          isDark={isDark}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Header Premium avec effet de profondeur */}
      <header
        className={`fixed top-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isScrolled
            ? isDark
              ? "bg-slate-950/95 shadow-2xl shadow-black/20 border-b border-slate-800/80"
              : "bg-white/95 shadow-xl shadow-slate-200/50 border-b border-slate-200/80"
            : isDark
              ? "bg-slate-950/50 border-b border-slate-800/30"
              : "bg-white/60 border-b border-white/40"
        } backdrop-blur-2xl ${
          !isSidebarCollapsed ? "lg:left-72" : "lg:left-20"
        } left-0`}
      >
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
          {/* Left Section - Menu Toggle & Branding */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Bouton Menu Premium - Fonctionne sur tous les écrans */}
            <button
              onClick={() => {
                // Sur desktop, on toggle le collapse. Sur mobile, on toggle le menu mobile.
                if (window.innerWidth >= 1024 && onToggleCollapse) {
                  onToggleCollapse();
                } else {
                  onToggleSidebar();
                }
              }}
              className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 active:scale-95 overflow-hidden ${
                isDark
                  ? "bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-400"
                  : "bg-slate-100 border border-slate-200 hover:border-amber-400/50 text-slate-600 hover:text-amber-600"
              }`}
              aria-label={!isSidebarCollapsed ? "Cacher le menu" : "Afficher le menu"}
            >
              {/* Icône qui change selon l'état */}
              <div className="relative w-5 h-5">
                {!isSidebarCollapsed ? (
                  <PanelLeftClose className="w-5 h-5 absolute inset-0 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <PanelLeft className="w-5 h-5 absolute inset-0 transition-transform duration-300 group-hover:scale-110" />
                )}
              </div>

              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {/* Logo / Title Premium */}
            <div className="hidden sm:flex flex-col justify-center">
              <div
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 ${
                  isDark ? "text-amber-500/80" : "text-amber-600"
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Administration</span>
              </div>
              <h1
                className={`text-lg lg:text-xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {formatMenuTitle(activeMenu)}
              </h1>
            </div>
          </div>

          {/* Center Section - Search Bar Premium (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div
              className={`relative w-full group ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  isDark
                    ? "bg-slate-900/80 border border-slate-800 group-focus-within:border-amber-500/50 group-focus-within:bg-slate-900 group-focus-within:shadow-lg group-focus-within:shadow-amber-500/10"
                    : "bg-slate-100/80 border border-slate-200 group-focus-within:border-amber-400/50 group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-amber-500/10"
                }`}
              />
              <div className="relative flex items-center px-4 h-11">
                <Search className="w-4 h-4 mr-3 opacity-60 group-focus-within:opacity-100 transition-opacity" />
                <input
                  type="text"
                  placeholder={
                    t.admin?.header?.searchPlaceholder || "Rechercher..."
                  }
                  className={`w-full bg-transparent border-none outline-none text-sm font-medium placeholder:font-normal ${
                    isDark
                      ? "text-white placeholder-slate-500"
                      : "text-slate-900 placeholder-slate-400"
                  }`}
                />
                <div
                  className={`flex items-center gap-2 ml-3 pl-3 border-l ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <kbd
                    className={`hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-semibold ${
                      isDark
                        ? "bg-slate-800 text-slate-400 border border-slate-700"
                        : "bg-white text-slate-500 border border-slate-300 shadow-sm"
                    }`}
                  >
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </kbd>
                  <button
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark
                        ? "hover:bg-slate-800 text-slate-500"
                        : "hover:bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions Premium */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            {/* Mobile Search */}
            <button
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 active:scale-95 ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Selector - Design Badge Premium */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-300 border ${
                  showLangMenu
                    ? isDark
                      ? "bg-slate-900 border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "bg-white border-amber-400/50 shadow-lg shadow-amber-500/10"
                    : isDark
                      ? "bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-700 text-slate-400 hover:text-white"
                      : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="text-lg leading-none">
                  {currentLang?.flag}
                </span>
                <span className="hidden sm:block text-xs font-bold uppercase tracking-wider w-6">
                  {currentLang?.region}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showLangMenu ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Language - Style Floating Premium */}
              {showLangMenu && (
                <div
                  className={`absolute top-full right-0 mt-2 w-52 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ${
                    isDark
                      ? "bg-slate-900 border-slate-800 shadow-black/50"
                      : "bg-white border-slate-200 shadow-slate-200/50"
                  }`}
                >
                  <div
                    className={`px-4 py-3 border-b ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Sélection de la langue
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code as any);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          language === lang.code
                            ? isDark
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                            : isDark
                              ? "text-slate-400 hover:text-white hover:bg-slate-800"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                        {language === lang.code && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div
              className={`hidden lg:block w-px h-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
            />

            {/* Notifications - Badge animé premium */}
            <button
              className={`relative p-2.5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
              <span className="sr-only">Notifications</span>
            </button>

            {/* Messages */}
            <button
              className={`hidden sm:flex p-2.5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Profil Utilisateur - Design Luxe */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl transition-all duration-300 border ${
                  showProfileMenu
                    ? isDark
                      ? "bg-slate-900 border-amber-500/30 shadow-lg"
                      : "bg-white border-amber-400/50 shadow-lg"
                    : isDark
                      ? "border-transparent hover:bg-slate-900/80 hover:border-slate-700"
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                {/* Avatar avec bordure dorée */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <div
                    className={`w-9 h-9 rounded-xl overflow-hidden ring-2 transition-all duration-300 ${
                      isDark ? "ring-amber-500/30" : "ring-amber-400/30"
                    } ${
                      user?.avatar_url
                        ? ""
                        : isDark
                          ? "bg-gradient-to-br from-amber-600 to-orange-700"
                          : "bg-gradient-to-br from-amber-500 to-orange-600"
                    }`}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Profile"
                        className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        {(
                          user?.first_name?.[0] ||
                          user?.display_name?.[0] ||
                          "A"
                        ).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Overlay upload */}
                  {!isUploading && (
                    <div
                      onClick={handleAvatarClick}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17,8 12,3 7,8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Status online */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                </div>

                {/* Info utilisateur */}
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm font-bold leading-tight ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {user?.display_name || user?.first_name || "Admin"}
                    </p>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                  <p
                    className={`text-[10px] font-medium uppercase tracking-wider leading-tight ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {(user?.role && (t.admin?.header?.roles as any)?.[user.role]) || user?.role || "Admin"}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""} ${
                    isDark ? "text-slate-600" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Dropdown Profil - Style Premium Luxe */}
              {showProfileMenu && (
                <div
                  className={`absolute top-full right-0 mt-3 w-80 rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ${
                    isDark
                      ? "bg-slate-900 border-slate-800 shadow-black/50"
                      : "bg-white border-slate-200 shadow-slate-200/50"
                  }`}
                >
                  {/* Header avec gradient subtil */}
                  <div
                    className={`relative p-6 border-b overflow-hidden ${
                      isDark ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-amber-500/20 via-transparent to-orange-500/20" />

                    <div className="relative flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={`w-16 h-16 rounded-2xl overflow-hidden ring-2 ${
                            isDark ? "ring-amber-500/20" : "ring-amber-400/30"
                          } ${
                            user?.avatar_url
                              ? ""
                              : isDark
                                ? "bg-gradient-to-br from-amber-600 to-orange-700"
                                : "bg-gradient-to-br from-amber-500 to-orange-600"
                          }`}
                        >
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                              {(
                                user?.first_name?.[0] ||
                                user?.display_name?.[0] ||
                                "A"
                              ).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-lg font-bold truncate ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {user?.display_name ||
                            (user?.first_name && user?.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : "Administrateur")}
                        </p>
                        <p
                          className={`text-sm truncate mb-2 ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {user?.email || "admin@anylibre.com"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isDark
                                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20"
                                : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-3 space-y-1">
                    <button
                      onClick={() => {
                        onMenuClick("settings");
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? "bg-slate-800 group-hover:bg-slate-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        <SettingsIcon className="w-4 h-4" />
                      </div>
                      <span>Paramètres du compte</span>
                    </button>

                    <button
                      onClick={() => {
                        onMenuClick("access");
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? "bg-slate-800 group-hover:bg-slate-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Accès & Sécurité</span>
                    </button>

                    {hasPermission("analytics.live") && (
                      <button
                        onClick={() => {
                          setShowAnalytics(true);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          isDark
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "bg-slate-800 group-hover:bg-slate-700"
                              : "bg-slate-100 group-hover:bg-slate-200"
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <span>Analytics Live</span>
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className={`p-3 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}
                  >
                    <button
                      onClick={() => {
                        signOut();
                        window.location.href = "/login";
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all duration-200 group`}
                    >
                      <div className="p-2 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre secondaire - Date et Statut (Desktop) */}
        <div
          className={`hidden lg:block border-t transition-colors duration-300 ${
            isDark ? "border-slate-800/30" : "border-slate-100"
          }`}
        >
          <div className="px-8 h-9 flex items-center justify-between max-w-[1920px] mx-auto">
            <div
              className={`flex items-center gap-3 text-xs font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">
                {new Date().toLocaleDateString(
                  language === "en"
                    ? "en-US"
                    : language === "es"
                      ? "es-ES"
                      : "fr-FR",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Système opérationnel
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacers pour compenser le header fixed */}
      <div className="h-16" />
      <div className="hidden lg:block h-9" />
    </>
  );
};

export default AdminHeader;
