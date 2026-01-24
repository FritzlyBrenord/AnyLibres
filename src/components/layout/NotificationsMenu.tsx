// ============================================================================
// Component: NotificationsMenu - Menu des notifications
// ============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Package,
  MessageSquare,
  Star,
  DollarSign,
  CheckCheck,
  Info,
  Truck,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminNotifications } from "@/contexts/NotificationContext";

export function NotificationsMenu() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    showModal,
  } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "review":
        return <Star className="w-4 h-4 text-yellow-600" />;
      case "payment":
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      case "delivery":
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString("fr-FR");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      showModal(notification);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left block px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1 p-1 bg-white rounded-full shadow-sm border border-gray-100 h-fit">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.is_read ? "font-bold" : "font-medium"
                          } text-gray-900`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {notification.priority === "urgent" && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded">
                              URGENT
                            </span>
                          )}
                          {notification.priority === "high" && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded">
                              IMPORTANT
                            </span>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 self-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 text-sm text-center text-indigo-600 font-medium hover:text-indigo-800 hover:bg-gray-100 transition-colors rounded-b-lg"
            >
              Voir l'historique complet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}