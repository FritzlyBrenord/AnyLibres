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
  ShieldCheck,
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
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    description: "Envoyer des notifications",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "messaging",
    label: "Messagerie",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Messages utilisateurs",
    gradient: "from-indigo-500 to-blue-500",
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
    id: "messages",
    label: "Messages",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Communication VIP",
    badge: 18,
    gradient: "from-sky-500 to-blue-500",
  },

  {
    id: "support",
    label: "Support",
    icon: <HelpCircle className="w-5 h-5" />,
    description: "Tickets & Live Chat",
    badge: 0,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "access",
    label: "Accès Système",
    icon: <ShieldCheck className="w-5 h-5" />,
    description: "Rôles & Permissions",
    gradient: "from-red-600 to-rose-700",
  },
];

export type MenuId =
  | "dashboard"
  | "services"
  | "orders"
  | "disputes"
  | "finance"
  | "users"
  | "settings"
  | "messages"
  | "support"
  | "notifications"
  | "access";
