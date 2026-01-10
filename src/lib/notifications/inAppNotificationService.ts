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
        const supabase = createClient();

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
        const supabase = createClient();

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            return { success: false, error };
        }

        return { success: true };
    }

    /**
     * Marquer toutes les notifications comme lues pour l'utilisateur
     */
    async markAllAsRead(userId: string) {
        const supabase = createClient();

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            return { success: false, error };
        }

        return { success: true };
    }
}

export const inAppNotificationService = new InAppNotificationService();
