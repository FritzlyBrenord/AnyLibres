"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Star,
  Eye,
  Share2,
  BarChart3,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  Filter,
  Search,
  ChevronRight,
  Bell,
  Settings,
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { mockStats, recentActivities, topServices } from "./menus";

interface DashboardProps {
  isDark: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("7j");
  const [searchQuery, setSearchQuery] = useState("");

  const timeframes = [
    { label: "24h", value: "24h" },
    { label: "7j", value: "7j" },
    { label: "30j", value: "30j" },
    { label: "90j", value: "90j" },
  ];

  const filteredServices = topServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toString().includes(searchQuery)
  );

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div
        className={`lg:hidden sticky top-0 z-50 p-4 border-b ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <h1
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg relative ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
        {/* Welcome Hero Card - Improved */}
        <div
          className={`relative overflow-hidden rounded-2xl lg:rounded-3xl p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8 ${
            isDark
              ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800"
              : "bg-gradient-to-br from-white via-gray-50 to-blue-50"
          } shadow-lg lg:shadow-2xl border ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 lg:gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg">
                      <Award className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm lg:text-base font-medium px-3 py-1 rounded-full ${
                            isDark
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          Premium
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">
                            En ligne
                          </span>
                        </div>
                      </div>
                      <h1
                        className={`text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight mb-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Bienvenue Admin 👋
                      </h1>
                      <p
                        className={`text-base lg:text-lg ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Gérez votre plateforme{" "}
                        <span className="font-semibold text-blue-500">
                          Anylibre
                        </span>{" "}
                        avec des insights en temps réel
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    {
                      icon: <Users className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: "Utilisateurs totaux",
                      value: mockStats.users.total,
                      change: "+12.3%",
                      color: "text-blue-500",
                      bgColor: isDark ? "bg-blue-900/20" : "bg-blue-50",
                    },
                    {
                      icon: <Activity className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: "Performance",
                      value: `${mockStats.performance.score}%`,
                      change: "+5.2%",
                      color: "text-emerald-500",
                      bgColor: isDark ? "bg-emerald-900/20" : "bg-emerald-50",
                    },
                    {
                      icon: <Package className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: "Commandes",
                      value: mockStats.orders.total,
                      change: "+8.7%",
                      color: "text-purple-500",
                      bgColor: isDark ? "bg-purple-900/20" : "bg-purple-50",
                    },
                    {
                      icon: <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />,
                      label: "Session moyenne",
                      value: "24m",
                      change: "+3.1%",
                      color: "text-amber-500",
                      bgColor: isDark ? "bg-amber-900/20" : "bg-amber-50",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 lg:p-4 rounded-xl ${
                        item.bgColor
                      } border ${
                        isDark ? "border-gray-800" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${item.bgColor}`}>
                          <div className={item.color}>{item.icon}</div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isDark
                              ? "bg-gray-800 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.change}
                        </span>
                      </div>
                      <p className="text-lg lg:text-xl font-bold mb-1">
                        {item.value}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-auto lg:self-end">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                  <button
                    className={`group px-6 py-3 lg:py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg w-full lg:w-auto ${
                      isDark
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/25"
                        : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-blue-400/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="text-sm lg:text-base">
                        Analytics détaillés
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <button
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      isDark
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    Générer rapport
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2">
            {/* Stats Cards Grid - Improved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {[
                {
                  title: "Revenus totaux",
                  value: `$${mockStats.revenue.total.toLocaleString()}`,
                  change: "+23.5%",
                  trend: "up",
                  icon: <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-emerald-500 to-teal-500",
                  detail: "Objectif dépassé de 15%",
                  progress: 85,
                },
                {
                  title: "Utilisateurs actifs",
                  value: mockStats.users.active.toLocaleString(),
                  change: "+12.3%",
                  trend: "up",
                  icon: <Users className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-blue-500 to-cyan-500",
                  detail: `${mockStats.users.new} nouveaux aujourd'hui`,
                  progress: 72,
                },
                {
                  title: "Commandes",
                  value: mockStats.orders.total,
                  change: "+8.7%",
                  trend: "up",
                  icon: <Package className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-purple-500 to-pink-500",
                  detail: `${mockStats.orders.pending} en attente`,
                  progress: 64,
                },
                {
                  title: "Taux de conversion",
                  value: `${mockStats.performance.score}%`,
                  change: "+5.2%",
                  trend: "up",
                  icon: <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />,
                  gradient: "from-orange-500 to-yellow-500",
                  detail: "Meilleure performance",
                  progress: 92,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-2xl p-5 lg:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 border ${
                    isDark
                      ? "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  } shadow-lg hover:shadow-xl`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-md`}
                      >
                        <div className="text-white">{stat.icon}</div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          stat.trend === "up"
                            ? isDark
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                            : isDark
                            ? "bg-red-900/30 text-red-400"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4" />
                        )}
                        {stat.change}
                      </div>
                    </div>

                    <h3
                      className={`text-2xl lg:text-3xl font-bold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {stat.value}
                    </h3>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={`text-xs mb-3 ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {stat.detail}
                    </p>

                    {/* Progress bar */}
                    <div className="relative pt-1">
                      <div
                        className={`overflow-hidden h-1.5 rounded-full ${
                          isDark ? "bg-gray-800" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                          style={{ width: `${stat.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Progression
                        </span>
                        <span className="text-xs font-medium">
                          {stat.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Chart - Improved */}
            <div
              className={`rounded-2xl p-5 lg:p-6 mb-6 lg:mb-8 border ${
                isDark
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white border-gray-200"
              } shadow-lg`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h3
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Performance des revenus
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Analyse détaillée de l'évolution des revenus
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center rounded-xl p-1 ${
                      isDark ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    {timeframes.map((timeframe) => (
                      <button
                        key={timeframe.value}
                        onClick={() => setActiveTimeframe(timeframe.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          activeTimeframe === timeframe.value
                            ? isDark
                              ? "bg-gray-700 text-white"
                              : "bg-white text-gray-900 shadow"
                            : isDark
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {timeframe.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className={`p-2 rounded-lg ${
                        isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Filter className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${
                        isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="relative h-48 lg:h-56 xl:h-64">
                <div className="absolute inset-0 flex items-end gap-1.5 lg:gap-2">
                  {mockStats.revenue.history.map((value, idx) => {
                    const height = (value / 140000) * 100;
                    const isToday =
                      idx === mockStats.revenue.history.length - 1;
                    return (
                      <div
                        key={idx}
                        className="flex-1 relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-300 group-hover:opacity-90 ${
                            isToday
                              ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                              : "bg-gradient-to-t from-blue-400/80 to-cyan-300/80"
                          }`}
                        ></div>
                        <div
                          className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap ${
                            isDark
                              ? "bg-gray-800 text-white shadow-lg"
                              : "bg-white text-gray-900 shadow-lg"
                          }`}
                        >
                          <div className="font-semibold">
                            ${(value / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Jour {idx + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 25, 50, 75, 100].map((line) => (
                    <div
                      key={line}
                      className={`border-t ${
                        isDark ? "border-gray-800" : "border-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute left-0 -top-2.5 text-xs ${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        ${((line / 100) * 140).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                    <span className="text-sm">Revenus actuels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Prévision</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                      isDark ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">
                        Objectif mensuel
                      </div>
                      <div className="text-lg font-bold">$150K</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Mise à jour il y a 5 min
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activities */}
          <div className="space-y-6 lg:space-y-8">
            {/* Recent Activities */}
            <div
              className={`rounded-2xl p-5 lg:p-6 border ${
                isDark
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white border-gray-200"
              } shadow-lg`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <h3
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Activités récentes
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Dernières actions sur la plateforme
                  </p>
                </div>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Voir tout
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${activity.color} ${
                        isDark ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      {React.cloneElement(activity.icon, {
                        className: "w-4 h-4 lg:w-5 lg:h-5",
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span className="font-bold">{activity.user}</span>{" "}
                          {activity.action}
                        </p>
                        {activity.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div
              className={`rounded-2xl p-5 lg:p-6 border ${
                isDark
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white border-gray-200"
              } shadow-lg`}
            >
              <h3
                className={`text-xl lg:text-2xl font-bold mb-6 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Aperçu rapide
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Taux de satisfaction",
                    value: "94.2%",
                    color: "text-emerald-500",
                    icon: <Star className="w-4 h-4" />,
                  },
                  {
                    label: "Temps de réponse moyen",
                    value: "2.4min",
                    color: "text-blue-500",
                    icon: <Clock className="w-4 h-4" />,
                  },
                  {
                    label: "Nouvelles commandes",
                    value: "24",
                    color: "text-purple-500",
                    icon: <Package className="w-4 h-4" />,
                  },
                  {
                    label: "Problèmes résolus",
                    value: "98%",
                    color: "text-green-500",
                    icon: <CheckCircle className="w-4 h-4" />,
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isDark ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <div className={stat.color}>{stat.icon}</div>
                      </div>
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Services Table - Improved */}
        <div
          className={`rounded-2xl overflow-hidden border ${
            isDark
              ? "bg-gray-900/50 border-gray-800"
              : "bg-white border-gray-200"
          } shadow-lg mt-6 lg:mt-8`}
        >
          <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h3
                  className={`text-xl lg:text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Services les plus performants
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Classement par revenus générés
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                <div
                  className={`relative flex-1 lg:flex-none lg:w-64 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border ${
                      isDark
                        ? "bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500"
                        : "bg-gray-100 border-gray-300 text-gray-700 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <button
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Filtrer
                </button>
                <button
                  className={`p-2.5 rounded-xl ${
                    isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {[
                    "Service",
                    "Revenus",
                    "Commandes",
                    "Satisfaction",
                    "Statut",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`border-b last:border-0 ${
                      isDark
                        ? "border-gray-800 hover:bg-gray-800/50"
                        : "border-gray-200 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                            service.id === 1
                              ? "from-blue-500 to-cyan-500"
                              : service.id === 2
                              ? "from-purple-500 to-pink-500"
                              : service.id === 3
                              ? "from-emerald-500 to-green-500"
                              : service.id === 4
                              ? "from-orange-500 to-red-500"
                              : "from-amber-500 to-yellow-500"
                          }`}
                        ></div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {service.name}
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            ID: #{service.id.toString().padStart(3, "0")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p
                        className={`text-lg font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        ${service.revenue.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {service.orders}
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.orders > 50
                              ? isDark
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"
                              : isDark
                              ? "bg-amber-900/30 text-amber-400"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {service.orders > 50 ? "Élevé" : "Moyen"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.floor(service.rating)
                                  ? "text-yellow-500 fill-current"
                                  : isDark
                                  ? "text-gray-700"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-base font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {service.rating}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          service.status === "active"
                            ? isDark
                              ? "bg-emerald-900/30 text-emerald-400"
                              : "bg-emerald-100 text-emerald-700"
                            : isDark
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            service.status === "active"
                              ? "bg-emerald-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        {service.status === "active" ? "Actif" : "Inactif"}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title="Partager"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                          title="Plus d'options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-t border-gray-200 dark:border-gray-800">
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Affichage de 1 à {filteredServices.length} sur{" "}
              {topServices.length} résultats
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg ${
                  isDark
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                Précédent
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-8 h-8 rounded-lg ${
                    page === 1
                      ? isDark
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : isDark
                      ? "hover:bg-gray-800 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                className={`p-2 rounded-lg ${
                  isDark
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
