/**
 * Configuration avancée pour les alertes et notifications Analytics
 */

export interface AlertThreshold {
  name: string;
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  actions: string[];
}

export const ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    name: "Commandes Pending Excessive",
    condition: "pending_orders > 50",
    threshold: 50,
    severity: "high",
    actions: ["notify_admin", "log_event", "email_alert"],
  },
  {
    name: "Utilisateurs Actifs Bas",
    condition: "active_users < 10",
    threshold: 10,
    severity: "medium",
    actions: ["notify_admin", "log_event"],
  },
  {
    name: "Revenus Basés",
    condition: "daily_revenue < 100",
    threshold: 100,
    severity: "low",
    actions: ["log_event"],
  },
  {
    name: "Taux Annulation Élevé",
    condition: "cancelled_orders_ratio > 0.2",
    threshold: 0.2,
    severity: "high",
    actions: ["notify_admin", "email_alert"],
  },
  {
    name: "Temps de Réponse Lent",
    condition: "api_response_time > 2000",
    threshold: 2000,
    severity: "medium",
    actions: ["log_event", "notify_admin"],
  },
  {
    name: "Erreur de Paiement",
    condition: "payment_errors > 5",
    threshold: 5,
    severity: "critical",
    actions: ["notify_admin", "email_alert", "sms_alert"],
  },
];

/**
 * Configuration pour les tableaux de bord
 */
export interface DashboardConfig {
  refreshInterval: number;
  maxDataPoints: number;
  cacheEnabled: boolean;
  cacheDuration: number;
}

export const DASHBOARD_CONFIGS: Record<string, DashboardConfig> = {
  live: {
    refreshInterval: 1000, // 1 seconde
    maxDataPoints: 100,
    cacheEnabled: false,
    cacheDuration: 0,
  },
  history: {
    refreshInterval: 5000, // 5 secondes
    maxDataPoints: 365, // 1 an de données
    cacheEnabled: true,
    cacheDuration: 300000, // 5 minutes
  },
};

/**
 * Mapping des statuts de commande pour l'UI
 */
export const ORDER_STATUS_MAP = {
  pending: {
    label: "En attente",
    icon: "Clock",
    color: "blue",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    borderColor: "border-blue-500",
  },
  accepted: {
    label: "Acceptée",
    icon: "CheckCircle",
    color: "green",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    borderColor: "border-green-500",
  },
  in_progress: {
    label: "En cours",
    icon: "Zap",
    color: "purple",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600",
    borderColor: "border-purple-500",
  },
  completed: {
    label: "Complétée",
    icon: "CheckCircle",
    color: "emerald",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500",
  },
  cancelled: {
    label: "Annulée",
    icon: "AlertCircle",
    color: "red",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-500",
  },
};

/**
 * Mapping des rôles utilisateur
 */
export const USER_ROLE_MAP = {
  client: {
    label: "Client",
    icon: "Users",
    color: "blue",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-600",
  },
  provider: {
    label: "Prestataire",
    icon: "Briefcase",
    color: "purple",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-600",
  },
  admin: {
    label: "Admin",
    icon: "Shield",
    color: "amber",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-600",
  },
};

/**
 * Mapping des statuts de présence
 */
export const PRESENCE_STATUS_MAP = {
  online: {
    label: "En ligne",
    icon: "Circle",
    color: "green",
    bgColor: "bg-green-500",
  },
  idle: {
    label: "Inactif",
    icon: "Circle",
    color: "yellow",
    bgColor: "bg-yellow-500",
  },
  away: {
    label: "Absent",
    icon: "Circle",
    color: "red",
    bgColor: "bg-red-500",
  },
  offline: {
    label: "Hors ligne",
    icon: "Circle",
    color: "gray",
    bgColor: "bg-gray-500",
  },
};

/**
 * Métriques clés à surveiller
 */
export interface KeyMetric {
  id: string;
  name: string;
  description: string;
  query: string;
  chartType: "line" | "bar" | "pie" | "area";
  unit: string;
  refreshInterval: number;
}

export const KEY_METRICS: KeyMetric[] = [
  {
    id: "daily_revenue",
    name: "Revenus du jour",
    description: "Revenus totaux aujourd'hui",
    query: "SELECT SUM(price) FROM orders WHERE status = 'completed' AND DATE(updated_at) = TODAY()",
    chartType: "line",
    unit: "$",
    refreshInterval: 5000,
  },
  {
    id: "active_orders",
    name: "Commandes Actives",
    description: "Nombre de commandes en cours",
    query: "SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'accepted', 'in_progress')",
    chartType: "line",
    unit: "ordre",
    refreshInterval: 2000,
  },
  {
    id: "online_users",
    name: "Utilisateurs En Ligne",
    description: "Nombre d'utilisateurs connectés",
    query: "SELECT COUNT(*) FROM user_activity_log WHERE last_activity_time > NOW() - INTERVAL 5 MINUTES",
    chartType: "line",
    unit: "utilisateur",
    refreshInterval: 1000,
  },
  {
    id: "completion_rate",
    name: "Taux de Complément",
    description: "% de commandes complétées",
    query: "SELECT COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100 / COUNT(*) FROM orders WHERE DATE(created_at) = TODAY()",
    chartType: "pie",
    unit: "%",
    refreshInterval: 60000,
  },
];

/**
 * Filtres disponibles
 */
export interface FilterOption {
  id: string;
  label: string;
  type: "select" | "date" | "range" | "search";
  options?: Array<{ label: string; value: string }>;
}

export const AVAILABLE_FILTERS: FilterOption[] = [
  {
    id: "role",
    label: "Rôle",
    type: "select",
    options: [
      { label: "Client", value: "client" },
      { label: "Prestataire", value: "provider" },
      { label: "Admin", value: "admin" },
    ],
  },
  {
    id: "status",
    label: "Statut",
    type: "select",
    options: [
      { label: "En attente", value: "pending" },
      { label: "Acceptée", value: "accepted" },
      { label: "En cours", value: "in_progress" },
      { label: "Complétée", value: "completed" },
      { label: "Annulée", value: "cancelled" },
    ],
  },
  {
    id: "date_range",
    label: "Plage de dates",
    type: "date",
  },
  {
    id: "search",
    label: "Recherche",
    type: "search",
  },
];

/**
 * Configuration d'export
 */
export interface ExportFormat {
  format: "csv" | "json" | "pdf" | "xlsx";
  label: string;
  mimeType: string;
  extension: string;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    format: "csv",
    label: "CSV",
    mimeType: "text/csv",
    extension: ".csv",
  },
  {
    format: "json",
    label: "JSON",
    mimeType: "application/json",
    extension: ".json",
  },
  {
    format: "pdf",
    label: "PDF",
    mimeType: "application/pdf",
    extension: ".pdf",
  },
  {
    format: "xlsx",
    label: "Excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
];
