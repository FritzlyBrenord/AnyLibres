import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/refunds - Récupérer toutes les demandes de remboursement (admin)
export async function GET(req: NextRequest) {
  try {
    // Utiliser le client normal pour vérifier l'authentification
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    // Utiliser le client admin pour bypasser les RLS
    const supabase = createAdminClient();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Vérifier que c'est un admin (à adapter selon votre système de rôles)
    // const { data: profile } = await supabase
    //   .from("profiles")
    //   .select("role")
    //   .eq("id", user.id)
    //   .single();

    // if (profile?.role !== "admin") {
    //   return NextResponse.json(
    //     { success: false, error: "Unauthorized" },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const order_id = searchParams.get("order_id");

    let query = supabase
      .from("refunds")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (order_id) {
      query = query.eq("order_id", order_id);
    }

    const { data: refunds, error } = await query;

    if (error) {
      console.error("Error fetching refunds:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch refunds", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refunds: refunds || [],
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
