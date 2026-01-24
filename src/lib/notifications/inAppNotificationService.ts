import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Types de notification correspondant à la base de données
export type NotificationType = 'order' | 'message' | 'payment' | 'system' | 'review' | 'delivery';

export interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
}

export class InAppNotificationService {
    /**
     * Créer une notification interne pour un utilisateur
     * Utilise le client admin pour contourner la RLS si nécessaire lors de l'envoi système
     */
    async create(params: CreateNotificationParams) {
        try {
            // Utiliser le client admin si disponible pour les notifications système, sinon server client
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
            const supabase = createAdminClient(supabaseUrl, supabaseServiceKey);

            const { error } = await supabase.from('notifications').insert({
                user_id: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link,
                metadata: params.metadata || {},
                read: false,
            });

            if (error) {
                console.error('Error creating notification:', error);
                return { success: false, error };
            }

            return { success: true };
        } catch (error) {
            console.error('Exception creating notification:', error);
            return { success: false, error };
        }
    }

    /**
     * Récupérer les notifications de l'utilisateur courant
     */
    async getUserNotifications(userId: string, limit = 50, offset = 0) {
        const supabase = await createClient();

        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error };
        }

        // Compter les non lus
        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        return {
            success: true,
            data: data,
            count: count,
            unreadCount: unreadCount || 0
        };
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(notificationId: string) {
        const supabase = await createClient();

        // On essaie de mettre à jour dans les deux tables car on ne sait pas d'où vient l'ID
        // (Sauf si on avait passé la source, mais l'interface ne le prévoit pas encore)

        // 1. Essayer table notifications
        const { error: standardError } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        // 2. Essayer table admin_notification_recipients (l'ID passé est l'ID de la NOTIFICATION admin, pas du recipient record ?)
        // ATTENTION : Dans le route.ts (fetch), j'ai mappé `id: r.admin_notifications.id`.
        // Donc l'ID reçu ici est l'ID de la `admin_notification`.
        // Mais dans `admin_notification_recipients`, on doit chercher par `notification_id` ET `user_id`.

        // Il nous faut le user_id pour être sûr (on peut le récupérer via auth.getUser dans le route handler qui appelle cette fonction, mais ici on ne l'a pas en paramètre explicite sauf si on l'ajoute).
        // Le service `markAsRead` prend juste `notificationId`.

        // Solution : Fetcher le user courant ici
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "User not found" };

        const { error: adminError } = await supabase
            .from('admin_notification_recipients')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('notification_id', notificationId) // L'ID reçu est celui de la notif admin
            .eq('user_id', user.id);

        if (standardError && adminError) {
            return { success: false, error: standardError || adminError };
        }

        return { success: true };
    }

    /**
     * Marquer toutes les notifications comme lues pour l'utilisateur
     */
    async markAllAsRead(userId: string) {
        const supabase = await createClient();

        // 1. Marquer les notifications standard
        const { error: standardError } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (standardError) {
            console.error("Error marking standard notifications as read:", standardError);
        }

        // 2. Marquer les notifications admin
        const { error: adminError } = await supabase
            .from('admin_notification_recipients')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (adminError) {
            console.error("Error marking admin notifications as read:", adminError);
            return { success: false, error: adminError };
        }

        return { success: true };
    }
}

export const inAppNotificationService = new InAppNotificationService();
