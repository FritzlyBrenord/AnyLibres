"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Send,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Loader2,
  Search,
  Calendar,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { useTheme } from "next-themes";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  target_type: "all_clients" | "all_providers" | "all_users" | "specific";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  total_recipients: number;
  read_count: number;
  read_percentage: number;
}

interface Recipient {
  id: string;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
}

export default function NotificationManagement() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "error">("info");
  const [targetType, setTargetType] = useState<"all_clients" | "all_providers" | "all_users" | "specific">("all_clients");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [actionUrl, setActionUrl] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Recipient[]>([]);
  
  // User list state
  const [allUsers, setAllUsers] = useState<Recipient[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  // UI state
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch notification history
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications?isAdmin=true");
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Load all users when specific targeting is selected
  useEffect(() => {
    if (targetType !== "specific") {
      setAllUsers([]);
      return;
    }

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // Load both clients and providers
        const [clientsRes, providersRes] = await Promise.all([
          fetch("/api/admin/donation/recipients?type=client&search=&isAdmin=true"),
          fetch("/api/admin/donation/recipients?type=provider&search=&isAdmin=true"),
        ]);

        const [clientsData, providersData] = await Promise.all([
          clientsRes.json(),
          providersRes.json(),
        ]);

        const allUsersList: Recipient[] = [
          ...(clientsData.success ? clientsData.recipients || [] : []),
          ...(providersData.success ? providersData.recipients || [] : []),
        ];

        setAllUsers(allUsersList);
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [targetType]);

  // Send notification
  const handleSend = async () => {
    if (!title || !message) {
      setError("Le titre et le message sont requis");
      return;
    }

    if (targetType === "specific" && selectedUsers.length === 0) {
      setError("Veuillez sélectionner au moins un utilisateur");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/notifications?isAdmin=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          target_type: targetType,
          specific_users: targetType === "specific" ? selectedUsers.map((u) => u.id) : undefined,
          priority,
          action_url: actionUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Notification envoyée à ${data.recipients_count} utilisateur(s)`);
        // Reset form
        setTitle("");
        setMessage("");
        setActionUrl("");
        setSelectedUsers([]);
        setUserFilter("");
        // Refresh history
        fetchNotifications();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      setError("Erreur lors de l'envoi de la notification");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const typeIcons = {
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
  };

  const typeColors = {
    info: "from-blue-500 to-cyan-500",
    warning: "from-yellow-500 to-orange-500",
    success: "from-green-500 to-emerald-500",
    error: "from-red-500 to-pink-500",
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Gestion des Notifications
              </h1>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Envoyez des notifications ciblées aux utilisateurs
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showHistory
                ? "bg-purple-600 text-white"
                : isDark
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {showHistory ? "Masquer l'historique" : "Voir l'historique"}
          </button>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                isDark ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
              }`}
            >
              <AlertCircle className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
              <button onClick={() => setError("")} className="ml-auto">
                <X className={`w-4 h-4 ${isDark ? "text-red-400" : "text-red-600"}`} />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                isDark ? "bg-green-900/30 border border-green-800" : "bg-green-50 border border-green-200"
              }`}
            >
              <CheckCircle className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
              <p className={`text-sm ${isDark ? "text-green-300" : "text-green-700"}`}>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${
              isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
            } rounded-2xl shadow-lg border p-6`}
          >
            <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Nouvelle Notification
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de la notification"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Contenu de la notification"
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["info", "warning", "success", "error"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                        type === t
                          ? `bg-gradient-to-r ${typeColors[t]} text-white`
                          : isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {typeIcons[t]}
                      <span className="capitalize text-xs">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Destinataires
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "all_clients", label: "Tous les clients", icon: User },
                    { value: "all_providers", label: "Tous les prestataires", icon: Users },
                    { value: "all_users", label: "Tous les utilisateurs", icon: Users },
                    { value: "specific", label: "Sélection personnalisée", icon: Search },
                  ].map((target) => {
                    const Icon = target.icon;
                    return (
                      <button
                        key={target.value}
                        onClick={() => setTargetType(target.value as any)}
                        className={`px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all ${
                          targetType === target.value
                            ? "bg-purple-600 text-white"
                            : isDark
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {target.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Users Selection */}
              {targetType === "specific" && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Sélectionner des utilisateurs ({selectedUsers.length} sélectionné{selectedUsers.length > 1 ? "s" : ""})
                  </label>

                  {/* Filter Input */}
                  <div className="relative mb-3">
                    <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                      type="text"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      placeholder="Filtrer par nom ou email..."
                      className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  {/* User List with Checkboxes */}
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                  ) : (
                    <div className={`border rounded-lg max-h-80 overflow-y-auto ${
                      isDark ? "border-gray-600" : "border-gray-300"
                    }`}>
                      {allUsers
                        .filter((user) => {
                          if (!userFilter) return true;
                          const searchLower = userFilter.toLowerCase();
                          return (
                            user.display_name.toLowerCase().includes(searchLower) ||
                            user.email.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((user) => {
                          const isSelected = selectedUsers.some((u) => u.id === user.id);
                          return (
                            <label
                              key={user.id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                                isDark
                                  ? "hover:bg-gray-700 border-gray-600"
                                  : "hover:bg-purple-50 border-gray-200"
                              } ${isSelected ? (isDark ? "bg-purple-900/30" : "bg-purple-50") : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                  {user.display_name}
                                </p>
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                  {user.email}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      {allUsers.filter((user) => {
                        if (!userFilter) return true;
                        const searchLower = userFilter.toLowerCase();
                        return (
                          user.display_name.toLowerCase().includes(searchLower) ||
                          user.email.toLowerCase().includes(searchLower)
                        );
                      }).length === 0 && (
                        <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucun utilisateur trouvé</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Priorité
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "normal", "high", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        priority === p
                          ? "bg-purple-600 text-white"
                          : isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action URL */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  URL d'action (optionnel)
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/dashboard, /orders, etc."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending || !title || !message}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer la notification
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Statistics Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${
              isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
            } rounded-2xl shadow-lg border p-6`}
          >
            <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Statistiques
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${
                isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total envoyées</p>
                </div>
                <p className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                  {notifications.length}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Taux de lecture</p>
                </div>
                <p className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                  {notifications.length > 0
                    ? Math.round(
                        notifications.reduce((acc, n) => acc + n.read_percentage, 0) / notifications.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Recent Notifications Preview */}
            <div className="mt-6">
              <h3 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Dernières notifications
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune notification envoyée</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {typeIcons[notification.type]}
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {notification.title}
                          </p>
                        </div>
                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {new Date(notification.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"} mb-2 line-clamp-2`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                          {notification.total_recipients} destinataire(s)
                        </span>
                        <span className={`font-medium ${
                          notification.read_percentage > 50
                            ? "text-green-500"
                            : notification.read_percentage > 25
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}>
                          {notification.read_percentage}% lu
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`${
                isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
              } rounded-2xl shadow-lg border p-6`}
            >
              <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                Historique Complet
              </h2>

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${typeColors[notification.type]}`}>
                          {typeIcons[notification.type]}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(notification.created_at).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {notification.total_recipients} destinataire(s)
                        </p>
                        <p className={`text-xs ${
                          notification.read_percentage > 50
                            ? "text-green-500"
                            : notification.read_percentage > 25
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}>
                          {notification.read_count}/{notification.total_recipients} lu ({notification.read_percentage}%)
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        isDark ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"
                      }`}>
                        {notification.target_type.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700"
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
