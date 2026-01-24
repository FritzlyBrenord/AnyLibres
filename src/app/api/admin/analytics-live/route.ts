import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from "next/server";

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider" | "admin";
  connectedAt: string;
  lastActivity: string;
  status: "online" | "idle" | "away";
}

interface LiveOrder {
  id: string;
  clientName: string;
  providerName: string;
  service: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Visitor {
  id: string;
  device: string;
  location: string;
  currentPage: string;
  sessionDuration: number;
  entryTime: string;
}

/**
 * GET /api/admin/analytics-live?period=week
 * Retourne les données analytics en temps réel
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

    // Récupérer les utilisateurs en ligne
    const { data: onlineUsers, error: usersError } = await supabase
      .from("user_activity_log")
      .select(
        `
        id,
        user_id,
        users!inner(id, email, full_name, role),
        login_time,
        last_activity_time,
        status
      `
      )
      .gte("last_activity_time", new Date(Date.now() - 5 * 60000).toISOString()) // Actif dans les 5 dernières minutes
      .order("last_activity_time", { ascending: false });

    // Récupérer les commandes actives
    const { data: liveOrders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        client_id,
        provider_id,
        title,
        status,
        price,
        currency,
        created_at,
        updated_at,
        clients:client_id(full_name),
        providers:provider_id(full_name),
        services!inner(title)
      `
      )
      .in("status", ["pending", "accepted", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(20);

    // Récupérer les visiteurs actuels (simulation - à adapter selon votre tracking)
    const { data: visitors } = await supabase
      .from("user_activity_log")
      .select(
        `
        id,
        device_info,
        page_visited,
        session_start,
        user_id
      `
      )
      .is("user_id", true) // Visiteurs non connectés
      .gte("session_start", new Date(Date.now() - 30 * 60000).toISOString())
      .limit(15);

    // Compter les statistiques
    const { count: totalOnline } = await supabase
      .from("user_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("last_activity_time", new Date(Date.now() - 5 * 60000).toISOString());

    const { count: clientsOnline } = await supabase
      .from("user_activity_log")
      .select("id", { count: "exact", head: true })
      .eq("users.role", "client")
      .gte("last_activity_time", new Date(Date.now() - 5 * 60000).toISOString());

    const { count: providersOnline } = await supabase
      .from("user_activity_log")
      .select("id", { count: "exact", head: true })
      .eq("users.role", "provider")
      .gte("last_activity_time", new Date(Date.now() - 5 * 60000).toISOString());

    const { count: adminsOnline } = await supabase
      .from("user_activity_log")
      .select("id", { count: "exact", head: true })
      .eq("users.role", "admin")
      .gte("last_activity_time", new Date(Date.now() - 5 * 60000).toISOString());

    const { count: activeOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "accepted", "in_progress"]);

    const { count: completedToday } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", new Date(Date.now() - 24 * 60 * 60000).toISOString());

    // Calculer les données par période
    let startDate = new Date();
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const { count: totalOrdersPeriod } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    const { data: ordersRevenuePeriod } = await supabase
      .from("orders")
      .select("price")
      .eq("status", "completed")
      .gte("updated_at", startDate.toISOString());

    const totalRevenuePeriod =
      ordersRevenuePeriod?.reduce((sum, o) => sum + (o.price || 0), 0) || 0;

    const { count: newSignups } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Formater les données
    const formattedUsers = onlineUsers?.map((log: any) => ({
      id: log.users?.id || log.id,
      name: log.users?.full_name || "Unknown",
      email: log.users?.email || "unknown@example.com",
      role: log.users?.role || "client",
      connectedAt: log.login_time,
      lastActivity: log.last_activity_time,
      status: log.status || "online",
    })) || [];

    const formattedOrders = liveOrders?.map((order: any) => ({
      id: order.id,
      clientName: order.clients?.full_name || "Unknown",
      providerName: order.providers?.full_name || "Unknown",
      service: order.services?.[0]?.title || order.title || "Service",
      status: order.status,
      amount: order.price || 0,
      currency: order.currency || "USD",
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    })) || [];

    const formattedVisitors = visitors?.map((v: any) => ({
      id: v.id,
      device: v.device_info || "Unknown",
      location: "Unknown Location",
      currentPage: v.page_visited || "/",
      sessionDuration: Math.floor(
        (Date.now() - new Date(v.session_start).getTime()) / 1000
      ),
      entryTime: v.session_start,
    })) || [];

    const responseData = {
      onlineUsers: formattedUsers,
      visitors: formattedVisitors,
      liveOrders: formattedOrders,
      stats: {
        totalOnline: totalOnline || 0,
        clientsOnline: clientsOnline || 0,
        providersOnline: providersOnline || 0,
        adminsOnline: adminsOnline || 0,
        totalVisitors: formattedVisitors.length,
        activeOrders: activeOrders || 0,
        completedToday: completedToday || 0,
        revenueToday: 0, // À calculer selon votre logique
      },
      periodStats: {
        period,
        totalOrders: totalOrdersPeriod || 0,
        totalRevenue: Math.round(totalRevenuePeriod * 100) / 100,
        newSignups: newSignups || 0,
        activeUsers: totalOnline || 0,
        activeProviders: providersOnline || 0,
        uniqueVisitors: formattedVisitors.length,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
