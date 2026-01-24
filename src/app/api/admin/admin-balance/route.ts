// ============================================================================
// API: Admin Balance - Gestion du solde administrateur
// ============================================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ProviderEarning {
  platform_fee_cents: number;
  amount_cents: number;
  order_id: string;
  status: string;
}

interface Order {
  id: string;
  total_cents: number;
  fees_cents: number;
  payment_status: string;
  status: string;
}

interface Withdrawal {
  fee_cents: number;
  status: string;
}

// GET /api/admin/admin-balance - Récupérer la balance admin
export async function GET() {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Récupérer la balance admin
    const { data: adminBalance, error } = await supabase
      .from("admin_balance")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching admin balance:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admin balance" },
        { status: 500 }
      );
    }

    // Si pas de balance, retourner des valeurs par défaut
    if (!adminBalance) {
      return NextResponse.json({
        success: true,
        balance: {
          id: null,
          admin_id: user.id,
          available_cents: 0,
          total_donated_cents: 0,
          total_refunded_cents: 0,
          currency: "EUR",
          needs_sync: true,
          metadata: {},
        },
      });
    }

    return NextResponse.json({
      success: true,
      balance: adminBalance,
    });
  } catch (error) {
    console.error("Error in admin balance API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/admin-balance - Synchroniser ou créer la balance admin
export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { action, amount_cents } = body;

    // Action: sync - Synchroniser avec les revenus système calculés
    if (action === "sync") {
      console.log("=== SYNC ADMIN BALANCE ===");

      // 1. Récupérer TOUTES les commandes payées pour calculer les revenus
      const { data: paidOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_cents, fees_cents, payment_status, status")
        .eq("payment_status", "succeeded");

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }

      console.log("Paid orders found:", paidOrders?.length || 0);

      // Debug: afficher quelques commandes pour comprendre le format des données
      if (paidOrders && paidOrders.length > 0) {
        console.log("Sample orders (first 3):");
        paidOrders.slice(0, 3).forEach((o: Order, i: number) => {
          console.log(`  Order ${i + 1}: total_cents=${o.total_cents}, fees_cents=${o.fees_cents}`);
        });
      }

      // 2. Récupérer les earnings pour avoir les montants réels
      const { data: allEarnings, error: earningsError } = await supabase
        .from("provider_earnings")
        .select("platform_fee_cents, amount_cents, order_id, status");

      if (earningsError) {
        console.error("Error fetching earnings:", earningsError);
      }

      console.log("Earnings found:", allEarnings?.length || 0);

      // Créer un map des earnings par order_id
      const earningsMap = new Map(
        ((allEarnings || []) as ProviderEarning[]).map((e) => [e.order_id, e])
      );

      // Calculer les revenus système CONFIRMÉS uniquement (aligné avec finance-stats)
      // Les revenus ne sont comptés que lorsque:
      // 1. L'earning existe ET status = 'completed' (client a accepté le service)
      // 2. OU l'earning n'existe pas ET order.status = 'completed'

      let totalPlatformFees = 0; // Commission 5% en cents (confirmés seulement)
      let totalSystemFees = 0; // Frais système (fees_cents) en cents (confirmés seulement)

      ((paidOrders || []) as Order[]).forEach((order) => {
        const earning = earningsMap.get(order.id);

        // Déterminer si les revenus sont confirmés
        const isConfirmed =
          (earning && earning.status === 'completed') ||
          (!earning && order.status === 'completed');

        if (!isConfirmed) {
          // Ne pas compter les revenus non confirmés
          return;
        }

        // Ajouter les frais système de la commande (déjà en cents dans fees_cents)
        totalSystemFees += order.fees_cents || 0;

        // Calculer la commission 5%
        if (earning) {
          // Si earning existe, utiliser platform_fee_cents ou calculer 5%
          if (earning.platform_fee_cents > 0) {
            totalPlatformFees += earning.platform_fee_cents;
          } else {
            // Calculer 5% du montant du service (amount_cents est en cents)
            const serviceAmount = earning.amount_cents || Math.round(order.total_cents);
            totalPlatformFees += Math.round(serviceAmount * 0.05);
          }
        } else {
          // Pas d'earning mais commande completed, calculer 5% du total_cents
          // total_cents est en cents (malgré le type double precision)
          totalPlatformFees += Math.round(order.total_cents * 0.05);
        }
      });

      console.log("Total platform fees (5%) in cents:", totalPlatformFees);
      console.log("Total system fees in cents:", totalSystemFees);

      // 3. Récupérer les frais de retrait (2.5%) - déjà en cents
      const { data: completedWithdrawals, error: withdrawalsError } = await supabase
        .from("provider_withdrawals")
        .select("fee_cents, status")
        .in("status", ["completed", "processing"]);

      if (withdrawalsError) {
        console.error("Error fetching withdrawals:", withdrawalsError);
      }

      let totalWithdrawalFees = 0;
      ((completedWithdrawals || []) as Withdrawal[]).forEach((w) => {
        totalWithdrawalFees += w.fee_cents || 0;
      });

      console.log("Total withdrawal fees in cents:", totalWithdrawalFees);

      // Total des revenus système = commission 5% + frais système + frais retrait 2.5% (tout en cents)
      const totalSystemRevenue = totalPlatformFees + totalSystemFees + totalWithdrawalFees;

      console.log("=== TOTAL SYSTEM REVENUE:", totalSystemRevenue, "cents ===");
      console.log("=== TOTAL SYSTEM REVENUE:", totalSystemRevenue / 100, "EUR ===");

      // 3.5. Récupérer la balance actuelle
      const { data: currentBalance } = await supabase
        .from("admin_balance")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      // 4. Calculer le total des dons effectués depuis admin_donations
      const { data: donationsList, error: donationsError } = await supabase
        .from("admin_donations")
        .select("amount_cents")
        .eq("admin_id", user.id);

      if (donationsError) {
        console.error("Error fetching donations for sync:", donationsError);
      }

      let totalDonated = 0;
      if (donationsList && donationsList.length > 0) {
        totalDonated = donationsList.reduce((acc, d) => acc + (d.amount_cents || 0), 0);
      } else {
        // Fallback: si la table est vide mais que la balance actuelle a une valeur, on la garde?
        // Non, c'est un sync, on devrait être honnête avec les records.
        // Sauf si on veut éviter une augmentation soudaine du solde si la table a été vidée par erreur.
        // On va logguer la différence.
        const currentRecDonated = currentBalance?.total_donated_cents || 0;
        if (currentRecDonated > 0) {
          console.warn(`Sync mismatch: Balance says ${currentRecDonated} donated but admin_donations is empty. Using 0 from table.`);
        }
        totalDonated = 0;
      }

      console.log("Total donated (from history table) in cents:", totalDonated);

      const totalRefunded = currentBalance?.total_refunded_cents || 0;
      // Note: total_withdrawn_cents n'est pas dans la table, on peut le stocker dans metadata
      const totalWithdrawn = currentBalance?.metadata?.total_withdrawn_cents || 0;

      // Solde disponible = revenus - dons - remboursements - retraits
      const availableCents = totalSystemRevenue - totalDonated - totalRefunded - totalWithdrawn;

      console.log("Available cents synced:", availableCents);

      // Upsert la balance admin
      const { data: updatedBalance, error: upsertError } = await supabase
        .from("admin_balance")
        .upsert(
          {
            admin_id: user.id,
            available_cents: Math.max(0, availableCents),
            total_donated_cents: totalDonated,
            total_refunded_cents: totalRefunded,
            currency: "EUR",
            metadata: {
              ...(currentBalance?.metadata || {}),
              last_sync: new Date().toISOString(),
              total_platform_fees: totalPlatformFees,
              total_withdrawal_fees: totalWithdrawalFees,
              total_system_fees: totalSystemFees,
              total_system_revenue: totalSystemRevenue,
              total_withdrawn_cents: totalWithdrawn, // On maintient ici
              orders_count: paidOrders?.length || 0,
              earnings_count: allEarnings?.length || 0,
            },
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "admin_id",
          }
        )
        .select()
        .single();

      if (upsertError) {
        console.error("Error syncing admin balance:", upsertError);
        return NextResponse.json(
          { success: false, error: "Failed to sync admin balance: " + upsertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Admin balance synchronized successfully",
        balance: updatedBalance,
        details: {
          total_platform_fees: totalPlatformFees / 100,
          total_withdrawal_fees: totalWithdrawalFees / 100,
          total_system_fees: totalSystemFees / 100,
          total_system_revenue: totalSystemRevenue / 100,
          total_donated: totalDonated / 100,
          total_refunded: totalRefunded / 100,
          total_withdrawn: totalWithdrawn / 100,
          available: Math.max(0, availableCents) / 100,
          orders_count: paidOrders?.length || 0,
          earnings_count: allEarnings?.length || 0,
        },
      });
    }

    // Action: withdraw - Effectuer un retrait admin
    if (action === "withdraw") {
      if (!amount_cents || amount_cents <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount" },
          { status: 400 }
        );
      }

      const { data: currentBalance } = await supabase
        .from("admin_balance")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (!currentBalance || currentBalance.available_cents < amount_cents) {
        return NextResponse.json(
          { success: false, error: "Insufficient balance" },
          { status: 400 }
        );
      }

      // Mettre à jour la balance
      const newTotalWithdrawn = (currentBalance?.metadata?.total_withdrawn_cents || 0) + amount_cents;
      const { data: updatedBalance, error: updateError } = await supabase
        .from("admin_balance")
        .update({
          available_cents: currentBalance.available_cents - amount_cents,
          metadata: {
            ...(currentBalance.metadata || {}),
            total_withdrawn_cents: newTotalWithdrawn,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("admin_id", user.id);

      if (updateError) {
        console.error("Error withdrawing admin balance:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to withdraw" },
          { status: 500 }
        );
      }

      // Enregistrer le retrait dans les transactions
      await supabase.from("transactions").insert({
        transaction_type: "admin_withdrawal",
        from_user_id: user.id,
        to_user_id: user.id,
        amount_cents,
        status: "completed",
        description: body.reason || "Retrait administrateur",
      });

      return NextResponse.json({
        success: true,
        message: "Withdrawal successful",
        balance: updatedBalance,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in admin balance API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
