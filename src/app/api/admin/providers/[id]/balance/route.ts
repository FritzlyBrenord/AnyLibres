import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/providers/[id]/balance - Récupérer le solde d'un provider
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Récupérer le solde du provider
    const { data: balance, error } = await supabase
      .from("provider_balance")
      .select("*")
      .eq("provider_id", params.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching provider balance:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch balance" },
        { status: 500 }
      );
    }

    if (!balance) {
      return NextResponse.json(
        { success: false, error: "Provider balance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: {
        available_cents: balance.available_cents,
        pending_cents: balance.pending_cents,
        withdrawn_cents: balance.withdrawn_cents,
        total_earned_cents: balance.total_earned_cents,
      },
    });
  } catch (error) {
    console.error("Error fetching provider balance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
