// src/app/admin/components/menus.ts
import {
  LayoutDashboard,
  Briefcase,
  Package,
  CreditCard,
  Users,
  Shield,
  Settings,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  LogOut,
  Calendar,
  MessageSquare,
  TrendingUp,
  Globe,
  Database,
  Zap,
  Award,
  Target,
  PieChart,
  DollarSign,
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: number;
  gradient: string;
}

export const mainMenus: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: "Vue d'ensemble premium",
    badge: 5,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "services",
    label: "Services",
    icon: <Briefcase className="w-5 h-5" />,
    description: "Gestion premium",
    badge: 12,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "orders",
    label: "Commandes",
    icon: <Package className="w-5 h-5" />,
    description: "Suivi exclusif",
    badge: 23,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "disputes",
    label: "Litiges",
    icon: <AlertTriangle className="w-5 h-5" />,
    description: "Gestion des conflits",
    gradient: "from-red-500 to-pink-600",
  },
  {
    id: "finance",
    label: "Finance",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Revenus & analytics",
    badge: 8,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "users",
    label: "Utilisateurs",
    icon: <Users className="w-5 h-5" />,
    description: "Community premium",
    badge: 45,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Insights avancés",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: "reports",
    label: "Rapports",
    icon: <FileText className="w-5 h-5" />,
    description: "Données premium",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    description: "Envoyer des notifications",
    gradient: "from-purple-500 to-pink-500",
  },
];

export const systemMenus: MenuItem[] = [
  {
    id: "settings",
    label: "Paramètres",
    icon: <Settings className="w-5 h-5" />,
    description: "Configuration avancée",
    gradient: "from-gray-600 to-gray-700",
  },
  {
    id: "security",
    label: "Sécurité",
    icon: <Shield className="w-5 h-5" />,
    description: "Protection premium",
    badge: 3,
    gradient: "from-green-600 to-emerald-600",
  },
  {
    id: "messages",
    label: "Messages",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Communication VIP",
    badge: 18,
    gradient: "from-sky-500 to-blue-500",
  },
  {
    id: "calendar",
    label: "Calendrier",
    icon: <Calendar className="w-5 h-5" />,
    description: "Planning exclusif",
    gradient: "from-red-500 to-orange-500",
  },
];

export type MenuId =
  | "dashboard"
  | "services"
  | "orders"
  | "disputes"
  | "finance"
  | "users"
  | "analytics"
  | "reports"
  | "settings"
  | "security"
  | "messages"
  | "calendar"
  | "notifications";

// Données de test pour les graphiques et statistiques
export const mockStats = {
  revenue: {
    total: 124890,
    change: +23.5,
    trend: "up",
    history: [45000, 52000, 61000, 78000, 92000, 105000, 124890],
  },
  users: {
    total: 2456,
    new: 324,
    active: 1890,
    trend: "up",
  },
  orders: {
    total: 892,
    pending: 56,
    completed: 789,
    revenue: 45678,
  },
  performance: {
    score: 94,
    level: "Excellent",
    metrics: {
      responseTime: 2.4,
      satisfaction: 4.8,
      growth: 34.2,
    },
  },
};

export const recentActivities = [
  {
    id: 1,
    user: "Alexandre Martin",
    action: "a publié un nouveau service",
    time: "Il y a 5 minutes",
    icon: <Zap className="w-4 h-4" />,
    color: "text-yellow-500",
  },
  {
    id: 2,
    user: "Sophie Dubois",
    action: "a complété une commande premium",
    time: "Il y a 15 minutes",
    icon: <Award className="w-4 h-4" />,
    color: "text-purple-500",
  },
  {
    id: 3,
    user: "Thomas Bernard",
    action: "a rejoint la plateforme",
    time: "Il y a 30 minutes",
    icon: <UserCheck className="w-4 h-4" />,
    color: "text-green-500",
  },
  {
    id: 4,
    user: "Marie Lambert",
    action: "a atteint le niveau Expert",
    time: "Il y a 2 heures",
    icon: <Target className="w-4 h-4" />,
    color: "text-blue-500",
  },
];

export const topServices = [
  {
    id: 1,
    name: "Design Logo Premium",
    revenue: 12450,
    orders: 89,
    rating: 4.9,
  },
  { id: 2, name: "Développement Web", revenue: 9870, orders: 67, rating: 4.8 },
  { id: 3, name: "Marketing Digital", revenue: 8560, orders: 54, rating: 4.7 },
  { id: 4, name: "Rédaction SEO", revenue: 7230, orders: 45, rating: 4.9 },
  { id: 5, name: "Montage Vidéo", revenue: 6450, orders: 38, rating: 4.6 },
];
