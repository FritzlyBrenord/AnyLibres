import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/client-balance - Récupérer le solde du client
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

    const { data: balance, error } = await supabase
      .from("client_balance")
      .select("*")
      .eq("client_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching client balance:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch balance" },
        { status: 500 }
      );
    }

    // Si le client n'a pas encore de balance, la créer
    if (!balance) {
      const { data: newBalance, error: createError } = await supabase
        .from("client_balance")
        .insert({ client_id: user.id })
        .select()
        .single();

      if (createError) {
        console.error("Error creating client balance:", createError);
        return NextResponse.json(
          { success: false, error: "Failed to create balance" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        balance: newBalance,
      });
    }

    return NextResponse.json({
      success: true,
      balance,
    });
  } catch (error) {
    console.error("Error fetching client balance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/client-balance/withdraw - Demander un retrait
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount_cents, payment_method, payment_details } = body;

    // Valider
    if (!amount_cents || !payment_method) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Récupérer le solde
    const { data: balance, error: balanceError } = await supabase
      .from("client_balance")
      .select("*")
      .eq("client_id", user.id)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { success: false, error: "Balance not found" },
        { status: 404 }
      );
    }

    // Vérifier le solde disponible
    if (amount_cents > balance.available_cents) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Créer une transaction de retrait
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        transaction_type: "withdrawal",
        from_user_id: user.id,
        to_user_id: user.id,
        amount_cents,
        status: "processing",
        description: `Withdrawal request to ${payment_method}`,
        payment_method,
        payment_details,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating withdrawal transaction:", transactionError);
      return NextResponse.json(
        { success: false, error: "Failed to create withdrawal" },
        { status: 500 }
      );
    }

    // Mettre à jour le solde (déplacer vers pending_withdrawal)
    await supabase
      .from("client_balance")
      .update({
        available_cents: balance.available_cents - amount_cents,
        pending_withdrawal_cents:
          balance.pending_withdrawal_cents + amount_cents,
      })
      .eq("client_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Withdrawal request created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
