import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/analytics-history?period=week
 * Retourne les données historiques d'analytics par période
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get("period") || "week";
    const startDate = getStartDate(period);

    // Compter les commandes par statut
    const statuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];
    const ordersByStatus: Record<string, number> = {};

    for (const status of statuses) {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", status)
        .gte("created_at", startDate.toISOString());
      ordersByStatus[status] = count || 0;
    }

    // Revenus totaux
    const { data: revenueData } = await supabase
      .from("orders")
      .select("price")
      .eq("status", "completed")
      .gte("updated_at", startDate.toISOString());

    const totalRevenue =
      revenueData?.reduce((sum, o) => sum + (o.price || 0), 0) || 0;

    // Nouveaux utilisateurs
    const { count: newUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Nouveaux fournisseurs
    const { count: newProviders } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "provider")
      .gte("created_at", startDate.toISOString());

    // Utilisateurs actifs
    const { count: activeUsers } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("last_activity_time", startDate.toISOString());

    // Commandes créées dans la période
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Données par jour (pour les graphiques)
    const { data: dailyData } = await supabase
      .from("orders")
      .select("created_at, price, status")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Grouper par jour
    const dailyStats = groupByDay(dailyData || []);

    // Top services
    const { data: topServices } = await supabase
      .from("orders")
      .select("services(title), COUNT(*)")
      .gte("created_at", startDate.toISOString())
      .limit(5);

    // Top clients
    const { data: topClients } = await supabase
      .from("orders")
      .select("clients(full_name, id), COUNT(*)")
      .gte("created_at", startDate.toISOString())
      .limit(10);

    // Top prestataires
    const { data: topProviders } = await supabase
      .from("orders")
      .select("providers(full_name, id), COUNT(*)")
      .gte("created_at", startDate.toISOString())
      .limit(10);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      stats: {
        totalOrders: totalOrders || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        newUsers: newUsers || 0,
        newProviders: newProviders || 0,
        activeUsers: activeUsers || 0,
        ordersByStatus,
      },
      dailyStats,
      topServices: topServices || [],
      topClients: topClients || [],
      topProviders: topProviders || [],
    });
  } catch (error) {
    console.error("Error fetching analytics history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function getStartDate(period: string): Date {
  const date = new Date();
  switch (period) {
    case "today":
      date.setHours(0, 0, 0, 0);
      break;
    case "week":
      date.setDate(date.getDate() - 7);
      break;
    case "month":
      date.setMonth(date.getMonth() - 1);
      break;
    case "year":
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 7);
  }
  return date;
}

function groupByDay(data: any[]) {
  const grouped: Record<string, any> = {};

  data.forEach((item) => {
    const day = new Date(item.created_at).toISOString().split("T")[0];
    if (!grouped[day]) {
      grouped[day] = {
        date: day,
        orders: 0,
        revenue: 0,
        completed: 0,
        pending: 0,
      };
    }
    grouped[day].orders++;
    grouped[day].revenue += item.price || 0;
    if (item.status === "completed") grouped[day].completed++;
    if (item.status === "pending") grouped[day].pending++;
  });

  return Object.values(grouped).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
