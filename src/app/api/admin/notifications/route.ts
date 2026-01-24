import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface NotificationRequest {
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "error";
    target_type: "all_clients" | "all_providers" | "all_users" | "specific";
    specific_users?: string[];
    priority: "low" | "normal" | "high" | "urgent";
    action_url?: string;
    expires_at?: string;
}

// POST /api/admin/notifications - Créer et envoyer une notification
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

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

        // Vérifier que l'utilisateur est admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Accès refusé" },
                { status: 403 }
            );
        }

        const body: NotificationRequest = await req.json();
        const {
            title,
            message,
            type,
            target_type,
            specific_users,
            priority,
            action_url,
            expires_at,
        } = body;

        // Validation
        if (!title || !message || !type || !target_type || !priority) {
            return NextResponse.json(
                { success: false, error: "Champs requis manquants" },
                { status: 400 }
            );
        }

        if (target_type === "specific" && (!specific_users || specific_users.length === 0)) {
            return NextResponse.json(
                { success: false, error: "Aucun utilisateur spécifique sélectionné" },
                { status: 400 }
            );
        }

        // 1. Créer la notification admin
        const { data: adminNotification, error: notificationError } = await supabase
            .from("admin_notifications")
            .insert({
                admin_id: user.id,
                title,
                message,
                type,
                target_type,
                priority,
                action_url,
                expires_at: expires_at || null,
            })
            .select()
            .single();

        if (notificationError || !adminNotification) {
            console.error("Error creating admin notification:", notificationError);
            return NextResponse.json(
                { success: false, error: "Erreur lors de la création de la notification" },
                { status: 500 }
            );
        }

        // 2. Déterminer les destinataires
        let recipientIds: string[] = [];

        if (target_type === "all_clients") {
            const { data: clients } = await supabaseAdmin // Bypass RLS to see all clients
                .from("profiles")
                .select("user_id")
                .eq("role", "client");
            recipientIds = clients?.map((c) => c.user_id).filter(Boolean) || [];
        } else if (target_type === "all_providers") {
            const { data: providers } = await supabaseAdmin // Bypass RLS to see all providers
                .from("profiles")
                .select("user_id")
                .eq("role", "provider");
            recipientIds = providers?.map((p) => p.user_id).filter(Boolean) || [];
        } else if (target_type === "all_users") {
            const { data: users } = await supabaseAdmin // Bypass RLS to see all users
                .from("profiles")
                .select("user_id")
                .in("role", ["client", "provider"]);
            recipientIds = users?.map((u) => u.user_id).filter(Boolean) || [];
        } else if (target_type === "specific") {
            recipientIds = specific_users || [];
        }

        if (recipientIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "Aucun destinataire trouvé" },
                { status: 400 }
            );
        }

        console.log(`Sending notification to ${recipientIds.length} recipients`);

        // 3. & 4. Créer les destinataires et les notifications de manière résiliente
        // On traite chaque utilisateur individuellement ou par petits lots pour éviter qu'un profil "fantôme" (supprimé de auth mais présent dans profiles) ne bloque tout l'envoi.

        let successCount = 0;
        let failureCount = 0;
        const errors: any[] = [];

        // Utiliser Promise.allSettled pour traiter tout le monde en parallèle
        // Note: Pour une très grande échelle (>1000), il faudrait utiliser des chunks, mais pour <100 c'est acceptable.
        const results = await Promise.allSettled(
            recipientIds.map(async (userId) => {
                // A. Créer le lien destinataire
                const { error: recipientError } = await supabaseAdmin
                    .from("admin_notification_recipients")
                    .insert({ notification_id: adminNotification.id, user_id: userId });

                // On ignore l'erreur de clé étrangère ici pour le lien admin, mais on log
                if (recipientError) {
                    // Si c'est une violation de FK, c'est un user fantôme, on ne peut rien faire pour lui
                    throw recipientError;
                }

                // B. Créer la notification utilisateur
                const { error: userNotifError } = await supabaseAdmin
                    .from("notifications")
                    .insert({
                        user_id: userId,
                        type: "system",
                        title,
                        message: message,
                        link: action_url || null,
                        related_id: adminNotification.id,
                        read: false,
                    });

                if (userNotifError) throw userNotifError;
            })
        );

        results.forEach((result) => {
            if (result.status === "fulfilled") {
                successCount++;
            } else {
                failureCount++;
                errors.push(result.reason);
                console.error("Failed to send notification to a user:", result.reason);
            }
        });

        if (successCount === 0 && failureCount > 0) {
            // Si TOUT a échoué, on retourne une erreur
            return NextResponse.json(
                {
                    success: false,
                    error: "Échec total de l'envoi. Verifiez les profils utilisateurs.",
                    details: errors[0]
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: adminNotification,
            recipients_count: recipientIds.length,
        });
    } catch (error) {
        console.error("Error in POST /api/admin/notifications:", error);
        return NextResponse.json(
            { success: false, error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// GET /api/admin/notifications - Récupérer l'historique des notifications
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient(); // Init admin client

        // Vérifier l'authentification
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        // ... existing auth checks ...

        // Vérifier que l'utilisateur est admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Accès refusé" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Récupérer les notifications avec le nombre de destinataires
        const { data: notifications, error: notificationsError, count } = await supabase
            .from("admin_notifications")
            .select("*", { count: "exact" })
            .eq("admin_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (notificationsError) {
            console.error("Error fetching notifications:", notificationsError);
            return NextResponse.json(
                { success: false, error: "Erreur lors de la récupération" },
                { status: 500 }
            );
        }

        // Pour chaque notification, récupérer les statistiques de lecture via Admin Client (bypass RLS)
        const enrichedNotifications = await Promise.all(
            (notifications || []).map(async (notification) => {
                const { data: recipients, count: totalRecipients } = await supabaseAdmin // Utilize admin client
                    .from("admin_notification_recipients")
                    .select("*", { count: "exact" })
                    .eq("notification_id", notification.id);

                const readCount = recipients?.filter((r) => r.is_read).length || 0;

                return {
                    ...notification,
                    total_recipients: totalRecipients || 0,
                    read_count: readCount,
                    read_percentage: totalRecipients ? Math.round((readCount / totalRecipients) * 100) : 0,
                };
            })
        );

        return NextResponse.json({
            success: true,
            notifications: enrichedNotifications,
            total: count || 0,
        });
    } catch (error) {
        console.error("Error in GET /api/admin/notifications:", error);
        return NextResponse.json(
            { success: false, error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
