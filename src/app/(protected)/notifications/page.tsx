"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell,
  Package,
  MessageSquare,
  Star,
  DollarSign,
  CheckCheck,
  Info,
  Truck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, refresh } =
    useNotifications();

  // Refresh on mount to get the latest
  useEffect(() => {
    refresh();
  }, [refresh]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-6 h-6 text-blue-600" />;
      case "message":
        return <MessageSquare className="w-6 h-6 text-green-600" />;
      case "review":
        return <Star className="w-6 h-6 text-yellow-600" />;
      case "payment":
        return <DollarSign className="w-6 h-6 text-purple-600" />;
      case "delivery":
        return <Truck className="w-6 h-6 text-indigo-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header variant="solid" />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-600 mt-2">
              Consultez votre historique d'activité
            </p>
          </div>
          {notifications.length > 0 && notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Aucune notification
            </h3>
            <p className="text-slate-500 mt-2">
              Vous n'avez pas encore reçu de notifications.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-slate-50 transition-colors ${
                    !notification.read ? "bg-indigo-50/30" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className={`text-lg ${
                              !notification.read ? "font-bold" : "font-semibold"
                            } text-slate-900`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-slate-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDateTime(notification.created_at)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.read)
                                markAsRead(notification.id);
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            Voir les détails
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-slate-500 hover:text-slate-700"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
