import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/refunds/[id] - Récupérer un remboursement spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Utiliser le client normal pour vérifier l'authentification
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Utiliser le client admin pour bypasser les RLS
    const supabase = createAdminClient();

    const { data: refund, error } = await supabase
      .from("refunds")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error("Error fetching refund:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/refunds/[id] - Approuver/Rejeter un remboursement
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Utiliser le client normal pour vérifier l'authentification
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Utiliser le client admin pour bypasser les RLS
    const supabase = createAdminClient();

    const body = await req.json();
    const { approved, admin_notes } = body;

    // Récupérer la demande de remboursement
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .select("*")
      .eq("id", id)
      .single();

    if (refundError || !refund) {
      return NextResponse.json(
        { success: false, error: "Refund request not found" },
        { status: 404 }
      );
    }

    if (refund.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Refund request already processed" },
        { status: 400 }
      );
    }

    let newStatus = approved ? "approved" : "rejected";

    // Si approuvé, créer la transaction et mettre à jour les balances
    if (approved) {
      // Créer une transaction pour tracer le remboursement
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          transaction_type: "refund",
          from_user_id: refund.provider_id,
          to_user_id: refund.client_id,
          amount_cents: refund.amount_cents,
          status: "processing",
          description: `Refund for order ${refund.order_id}`,
          related_refund_id: refund.id,
          related_order_id: refund.order_id,
        });

      if (transactionError) {
        console.error("Error creating refund transaction:", transactionError);
        // Continue même si la transaction échoue (pour ne pas bloquer le remboursement)
      }

      // Déduire du provider_balance
      const { data: providerBalance } = await supabase
        .from("provider_balance")
        .select("*")
        .eq("provider_id", refund.provider_id)
        .single();

      if (providerBalance) {
        // Déterminer d'où déduire (pending ou available)
        let deduction_from = "pending_cents";
        if (providerBalance.pending_cents < refund.amount_cents) {
          deduction_from = "available_cents";
        }

        await supabase
          .from("provider_balance")
          .update({
            [deduction_from]:
              providerBalance[deduction_from] - refund.amount_cents,
          })
          .eq("provider_id", refund.provider_id);
      }

      // Ajouter au client_balance
      const { data: clientBalance } = await supabase
        .from("client_balance")
        .select("*")
        .eq("client_id", refund.client_id)
        .single();

      if (clientBalance) {
        await supabase
          .from("client_balance")
          .update({
            available_cents:
              clientBalance.available_cents + refund.amount_cents,
            total_received_cents:
              clientBalance.total_received_cents + refund.amount_cents,
          })
          .eq("client_id", refund.client_id);
      } else {
        // Créer la balance si elle n'existe pas
        await supabase.from("client_balance").insert({
          client_id: refund.client_id,
          available_cents: refund.amount_cents,
          total_received_cents: refund.amount_cents,
        });
      }

      newStatus = "completed";

      // Mettre à jour le statut de la commande en "refunded"
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", refund.order_id);

      if (orderUpdateError) {
        console.error("Error updating order status to refunded:", orderUpdateError);
        // Continue même si la mise à jour échoue
      }
    }

    // Mettre à jour la demande de remboursement
    const { data: updatedRefund, error: updateError } = await supabase
      .from("refunds")
      .update({
        status: newStatus,
        admin_notes,
        refunded_at: approved ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating refund:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update refund" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: approved ? "Refund approved" : "Refund rejected",
      refund: updatedRefund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
