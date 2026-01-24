/**
 * Configuration pour Analytics Live
 * Gère les paramètres de mise à jour, les seuils, et les préférences
 */

export const ANALYTICS_CONFIG = {
  // Intervalle de rafraîchissement en millisecondes
  REFRESH_INTERVAL: 1000, // 1 seconde

  // Délai avant que quelqu'un soit considéré comme inactif
  INACTIVITY_TIMEOUT: 5 * 60000, // 5 minutes

  // Seuils pour les alertes
  ALERTS: {
    // Nombre maximum de commandes pending avant alerte
    MAX_PENDING_ORDERS: 50,
    // Nombre minimum d'utilisateurs actifs avant alerte
    MIN_ACTIVE_USERS: 10,
    // Revenus minimum par jour
    MIN_DAILY_REVENUE: 100,
  },

  // Périodes disponibles pour l'historique
  PERIODS: {
    TODAY: "today",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
  },

  // Statuts des commandes
  ORDER_STATUSES: {
    PENDING: "pending",
    ACCEPTED: "accepted",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },

  // Rôles utilisateur
  USER_ROLES: {
    CLIENT: "client",
    PROVIDER: "provider",
    ADMIN: "admin",
  },

  // Statuts de présence
  PRESENCE_STATUS: {
    ONLINE: "online",
    IDLE: "idle",
    AWAY: "away",
    OFFLINE: "offline",
  },

  // Limites d'affichage
  LIMITS: {
    MAX_USERS_DISPLAY: 50,
    MAX_ORDERS_DISPLAY: 20,
    MAX_VISITORS_DISPLAY: 15,
    MAX_RECENT_ACTIVITIES: 30,
  },

  // Configuration Realtime
  REALTIME: {
    // Activer les changements en temps réel des commandes
    ENABLE_ORDERS_REALTIME: true,
    // Activer les changements en temps réel des utilisateurs
    ENABLE_USERS_REALTIME: true,
    // Activer le tracking de présence
    ENABLE_PRESENCE: true,
    // Intervalle de ping pour la présence
    PRESENCE_PING_INTERVAL: 30000, // 30 secondes
  },

  // Traductions (à adapter selon votre i18n)
  TRANSLATIONS: {
    FR: {
      ONLINE: "En ligne",
      IDLE: "Inactif",
      AWAY: "Absent",
      OFFLINE: "Hors ligne",
      PENDING: "En attente",
      ACCEPTED: "Acceptée",
      IN_PROGRESS: "En cours",
      COMPLETED: "Complétée",
      CANCELLED: "Annulée",
    },
    EN: {
      ONLINE: "Online",
      IDLE: "Idle",
      AWAY: "Away",
      OFFLINE: "Offline",
      PENDING: "Pending",
      ACCEPTED: "Accepted",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    },
  },
};

/**
 * Obtient la couleur pour un statut
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    away: "bg-red-500",
    offline: "bg-gray-500",
    pending: "bg-blue-500/10",
    accepted: "bg-green-500/10",
    in_progress: "bg-purple-500/10",
    completed: "bg-emerald-500/10",
    cancelled: "bg-red-500/10",
  };
  return colors[status] || "bg-gray-500";
}

/**
 * Obtient le libellé traduit pour un statut
 */
export function getStatusLabel(
  status: string,
  language: "fr" | "en" = "fr"
): string {
  const translations = ANALYTICS_CONFIG.TRANSLATIONS[language.toUpperCase() as keyof typeof ANALYTICS_CONFIG.TRANSLATIONS];
  return (translations as Record<string, string>)?.[status.toUpperCase()] || status;
}

/**
 * Formate un nombre en devise
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Calcule la durée depuis un timestamp
 */
export function getDurationString(
  startTime: string | Date,
  language: "fr" | "en" = "fr"
): string {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

  if (diff < 60) {
    return language === "fr" ? `${diff}s` : `${diff}s ago`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return language === "fr" ? `${minutes}m` : `${minutes}m ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return language === "fr" ? `${hours}h` : `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400);
    return language === "fr" ? `${days}j` : `${days}d ago`;
  }
}
