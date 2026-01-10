import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
    id: string;
    type: 'order' | 'message' | 'payment' | 'system' | 'review' | 'delivery';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
    metadata?: any;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications?limit=20');
            const result = await response.json();

            if (result.success) {
                setNotifications(result.data.data);
                setUnreadCount(result.data.unreadCount);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (notificationId: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });
        } catch (err) {
            console.error('Error marking as read:', err);
            // Revert optimistic update could be done here
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Abonnement temps réel avec Supabase
        const supabase = createClient();
        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT ou UPDATE
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    console.log('Notification change:', payload);
                    // Simple reload for now to keep counters accurate
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}
