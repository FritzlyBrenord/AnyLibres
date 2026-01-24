"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  priority: "low" | "normal" | "high" | "urgent";
  action_url?: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  currentModal: AdminNotification | null;
  showModal: (notification: AdminNotification) => void;
  closeModal: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [currentModal, setCurrentModal] = useState<AdminNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<AdminNotification[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/notifications/admin");
      const data = await response.json();

      if (data.success) {
        const adminNotifs: AdminNotification[] = data.notifications.map((n: any) => ({
          id: n.id,
          title: n.title || "Notification",
          message: n.message,
          type: n.type || "info",
          priority: n.priority || "normal",
          action_url: n.action_url,
          created_at: n.created_at,
          is_read: n.is_read,
        }));

        setNotifications(adminNotifs);

        // Add unread notifications to queue for auto-display
        const unreadNotifs = adminNotifs.filter((n) => !n.is_read);
        if (unreadNotifs.length > 0 && notificationQueue.length === 0) {
          setNotificationQueue(unreadNotifs);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user, notificationQueue.length]);

  // Process notification queue (show one by one)
  useEffect(() => {
    if (notificationQueue.length > 0 && !currentModal && !isProcessingQueue) {
      setIsProcessingQueue(true);
      const nextNotification = notificationQueue[0];
      setCurrentModal(nextNotification);
      setNotificationQueue((prev) => prev.slice(1));

      // Auto-dismiss based on priority
      if (nextNotification.priority === "low" || nextNotification.priority === "normal") {
        setTimeout(() => {
          closeModal();
        }, 5000);
      } else if (nextNotification.priority === "high") {
        setTimeout(() => {
          closeModal();
        }, 10000);
      }
      // urgent stays until manually closed
    }
  }, [notificationQueue, currentModal, isProcessingQueue]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const showModal = (notification: AdminNotification) => {
    setCurrentModal(notification);
  };

  const closeModal = () => {
    setCurrentModal(null);
    setIsProcessingQueue(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        currentModal,
        showModal,
        closeModal,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within NotificationProvider");
  }
  return context;
}
