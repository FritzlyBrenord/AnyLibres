import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/refunds - Créer une demande de remboursement
export async function POST(req: NextRequest) {
  console.log("=== POST /api/refunds called ===");

  try {
    console.log("Creating supabase client...");
    const supabase = await createClient();

    console.log("Getting user...");
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
    }

    if (!user) {
      console.log("No user found, returning 401");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.id);

    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    const { order_id, amount_cents, reason, reason_details } = body;

    // Valider les données
    if (!order_id || !amount_cents || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Vérifier que le client qui demande est bien le client de la commande
    if (order.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Vérifier que le montant demandé ne dépasse pas le total
    console.log("Amount validation:", {
      amount_cents,
      order_total_cents: order.total_cents,
      exceeds: amount_cents > order.total_cents
    });

    if (amount_cents > order.total_cents) {
      console.log("Refund amount exceeds order total - returning 400");
      return NextResponse.json(
        { success: false, error: "Refund amount exceeds order total", details: `Requested: ${amount_cents} cents, Order total: ${order.total_cents} cents` },
        { status: 400 }
      );
    }

    // Vérifier que le provider_id existe
    if (!order.provider_id) {
      return NextResponse.json(
        { success: false, error: "Provider not assigned to this order" },
        { status: 400 }
      );
    }

    // Vérifier que le provider existe dans auth.users (pour éviter l'erreur de foreign key)
    let validProviderId: string | null = order.provider_id;

    const { data: providerExists, error: providerCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", order.provider_id)
      .single();

    if (providerCheckError || !providerExists) {
      console.warn("Provider validation warning:", {
        provider_id: order.provider_id,
        error: providerCheckError?.message,
        message: "Provider not found, will use client_id as fallback for provider_id"
      });
      // Utiliser le client_id comme fallback si le provider n'existe pas
      // Cela permet de créer le remboursement même si le prestataire a été supprimé
      validProviderId = user.id;
    }

    // Log des données avant insertion
    console.log("Refund data to insert:", {
      order_id,
      client_id: user.id,
      provider_id: validProviderId,
      amount_cents,
      currency: order.currency,
      reason,
      reason_details: reason_details || null,
      status: "pending",
    });

    // Créer la demande de remboursement
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .insert({
        order_id,
        client_id: user.id,
        provider_id: validProviderId,
        amount_cents,
        currency: order.currency || "EUR",
        reason,
        reason_details: reason_details || null,
        status: "pending",
      })
      .select()
      .single();

    if (refundError) {
      console.error("Refund creation error:", {
        message: refundError.message,
        code: refundError.code,
        details: refundError.details,
        hint: refundError.hint,
        fullError: refundError,
        insertData: {
          order_id,
          client_id: user.id,
          provider_id: order.provider_id,
          amount_cents,
          currency: order.currency,
        }
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create refund request",
          details: refundError.message,
          code: refundError.code,
          hint: refundError.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Refund request created successfully",
      refund,
    });
  } catch (error) {
    console.error("Error creating refund:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/refunds - Récupérer les refunds du client
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const order_id = searchParams.get("order_id");

    let query = supabase
      .from("refunds")
      .select("*")
      .eq("client_id", user.id)
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
        { success: false, error: "Failed to fetch refunds" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refunds,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
