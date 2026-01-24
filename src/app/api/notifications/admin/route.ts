import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications/admin - Récupérer les notifications admin pour l'utilisateur connecté
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Vérifier l'authentification
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Récupérer les notifications de l'utilisateur avec les données admin
        const { data: userNotifications, error: notificationsError } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "system")
            .not("related_id", "is", null)
            .order("created_at", { ascending: false });

        if (notificationsError) {
            console.error("Error fetching notifications:", notificationsError);
            return NextResponse.json(
                { success: false, error: "Erreur lors de la récupération" },
                { status: 500 }
            );
        }

        // Pour chaque notification, récupérer les données admin
        const enrichedNotifications = await Promise.all(
            (userNotifications || []).map(async (notification) => {
                const { data: adminNotif } = await supabase
                    .from("admin_notifications")
                    .select("type, priority, expires_at")
                    .eq("id", notification.related_id)
                    .single();

                return {
                    id: notification.id,
                    title: notification.title || "Notification",
                    message: notification.message,
                    type: adminNotif?.type || "info",
                    priority: adminNotif?.priority || "normal",
                    action_url: notification.link,
                    created_at: notification.created_at,
                    is_read: notification.read,
                    expires_at: adminNotif?.expires_at,
                };
            })
        );

        return NextResponse.json({
            success: true,
            notifications: enrichedNotifications,
        });
    } catch (error) {
        console.error("Error in GET /api/notifications/admin:", error);
        return NextResponse.json(
            { success: false, error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
