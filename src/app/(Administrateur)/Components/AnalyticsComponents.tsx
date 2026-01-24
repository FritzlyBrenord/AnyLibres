import React from "react";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { CurrencyConverter } from "@/components/common/CurrencyConverter";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "cyan" | "purple" | "emerald" | "amber" | "pink";
  trend?: {
    value: number;
    direction: "up" | "down";
    percentage: boolean;
  };
  isDark?: boolean;
}

const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  cyan: "from-cyan-500 to-cyan-600",
  purple: "from-purple-500 to-purple-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  pink: "from-pink-500 to-pink-600",
};

const bgColorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color = "blue",
  trend,
  isDark = false,
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
          : "bg-gray-50 border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {label}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <p
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  trend.direction === "up"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {trend.value}
                  {trend.percentage ? "%" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${bgColorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

interface UserItemProps {
  name: string;
  email: string;
  role: "client" | "provider" | "admin";
  status: "online" | "idle" | "away";
  connectedSince: string;
  isDark?: boolean;
  onClick?: () => void;
}

export const UserItem: React.FC<UserItemProps> = ({
  name,
  email,
  role,
  status,
  connectedSince,
  isDark = false,
  onClick,
}) => {
  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    away: "bg-red-500",
  };

  const roleColors: Record<string, string> = {
    provider: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    admin: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    client: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
              statusColors[status]
            } ${isDark ? "border-gray-800" : "border-white"}`}
          ></div>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold truncate ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {name}
          </p>
          <p
            className={`text-sm truncate ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {email}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[role]}`}
            >
              {role}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                statusColors[status]
              }/20 text-${statusColors[status].split("-")[1]}-600`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {connectedSince}
        </p>
      </div>
    </div>
  );
};

interface OrderItemProps {
  id: string;
  service: string;
  clientName: string;
  providerName: string;
  amount: number;
  currency: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  timestamp: string;
  isDark?: boolean;
}

const orderStatusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
  in_progress: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const orderStatusLabels: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  in_progress: "En cours",
  completed: "Complétée",
  cancelled: "Annulée",
};

export const OrderItem: React.FC<OrderItemProps> = ({
  id,
  service,
  clientName,
  providerName,
  amount,
  currency,
  status,
  timestamp,
  isDark = false,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4
              className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {service}
            </h4>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusColors[status]}`}
            >
              {orderStatusLabels[status]}
            </span>
          </div>
          <div
            className={`grid grid-cols-2 gap-3 text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <div>
              <span className="font-medium">Client:</span> {clientName}
            </div>
            <div>
              <span className="font-medium">Prestataire:</span> {providerName}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            <CurrencyConverter amount={amount} />
          </p>
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
          >
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

interface LoadingSkeletonProps {
  isDark?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  isDark = false,
}) => {
  return (
    <div
      className={`p-4 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-50"}`}
    >
      <div className="animate-pulse space-y-3">
        <div
          className={`h-4 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-8 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 rounded w-2/3 ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
        ></div>
      </div>
    </div>
  );
};
