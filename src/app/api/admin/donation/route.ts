import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface DonationRecord {
  id: string;
  recipient_id: string;
  recipient_type: string;
  amount_cents: number;
  currency: string;
  reason: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  display_name?: string;
}

// POST /api/admin/donation - Envoyer de l'argent (don) à un client ou provider
export async function POST(req: NextRequest) {
  try {
    // Utiliser createClient pour l'authentification
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

    // Utiliser admin client pour les opérations de base de données (bypass RLS)
    const supabase = createAdminClient();

    const body = await req.json();
    console.log("=== DONATION REQUEST START ===");
    console.log("Body:", JSON.stringify(body, null, 2));
    const { recipient_id, recipient_type, amount_cents, reason } = body;

    // Valider
    if (!recipient_id || !recipient_type || !amount_cents) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["client", "provider"].includes(recipient_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient_type" },
        { status: 400 }
      );
    }

    if (amount_cents <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Récupérer la balance de l'admin
    const { data: adminBalance, error: adminBalanceError } = await supabase
      .from("admin_balance")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    if (adminBalanceError) {
      console.error("Error fetching admin balance:", adminBalanceError);
      // Si pas de balance admin, créer une entrée avec 0
      if (adminBalanceError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Admin balance not found. Please set up admin balance first." },
          { status: 400 }
        );
      }
    }

    if (!adminBalance || adminBalance.available_cents < amount_cents) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient admin balance. Available: ${adminBalance?.available_cents || 0} cents, Requested: ${amount_cents} cents`,
        },
        { status: 400 }
      );
    }

    // Récupérer les infos du destinataire
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, display_name")
      .eq("id", recipient_id)
      .single();

    const recipientName =
      recipientProfile?.display_name ||
      [recipientProfile?.first_name, recipientProfile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      recipientProfile?.email ||
      recipient_id;

    // 1. Enregistrer le don dans admin_donations (historique)
    console.log(`Creating donation record in admin_donations: admin=${user.id}, recipient=${recipient_id}, amount=${amount_cents}`);
    const { data: donation, error: donationError } = await supabase
      .from("admin_donations")
      .insert({
        admin_id: user.id,
        recipient_id,
        recipient_type,
        amount_cents,
        reason: reason || `Don à ${recipientName}`,
        currency: "EUR"
      })
      .select()
      .single();

    if (donationError) {
      console.error("CRITICAL error creating donation record:", donationError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to record donation in history: ${donationError.message}. Details: ${donationError.details || 'none'}`,
          code: donationError.code
        },
        { status: 500 }
      );
    }

    console.log("Donation record created successfully:", donation.id);

    // 2. Créer une transaction (pour compatibilité)
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        transaction_type: "admin_donation",
        from_user_id: user.id,
        to_user_id: recipient_id,
        amount_cents,
        status: "completed",
        description: reason || `Don admin à ${recipientName}`,
      });

    if (transactionError) {
      console.warn("Non-critical error creating donation transaction:", transactionError);
      // On continue même si ça échoue (l'essentiel est admin_donations et balance)
    }

    const { error: adminUpdateError } = await supabase
      .from("admin_balance")
      .update({
        available_cents: adminBalance.available_cents - amount_cents,
        total_donated_cents: (adminBalance.total_donated_cents || 0) + amount_cents,
        updated_at: new Date().toISOString(),
      })
      .eq("admin_id", user.id);

    if (adminUpdateError) {
      console.error("Error updating admin balance:", adminUpdateError);
      return NextResponse.json(
        { success: false, error: "Failed to update admin balance" },
        { status: 500 }
      );
    }

    // 4. Ajouter au client_balance si client
    if (recipient_type === "client") {
      const { data: clientBalance } = await supabase
        .from("client_balance")
        .select("*")
        .eq("client_id", recipient_id)
        .single();

      if (clientBalance) {
        await supabase
          .from("client_balance")
          .update({
            available_cents: clientBalance.available_cents + amount_cents,
            total_received_cents:
              (clientBalance.total_received_cents || 0) + amount_cents,
            donations_received_cents:
              (clientBalance.donations_received_cents || 0) + amount_cents,
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", recipient_id);
      } else {
        await supabase.from("client_balance").insert({
          client_id: recipient_id,
          available_cents: amount_cents,
          total_received_cents: amount_cents,
          donations_received_cents: amount_cents,
        });
      }
    }

    // 5. Ajouter au provider_balance si provider
    if (recipient_type === "provider") {
      const { data: providerBalance } = await supabase
        .from("provider_balance")
        .select("*")
        .eq("provider_id", recipient_id)
        .single();

      if (providerBalance) {
        await supabase
          .from("provider_balance")
          .update({
            available_cents: providerBalance.available_cents + amount_cents,
            total_earned_cents:
              (providerBalance.total_earned_cents || 0) + amount_cents,
            donations_received_cents:
              (providerBalance.donations_received_cents || 0) + amount_cents,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_id", recipient_id);
      } else {
        await supabase.from("provider_balance").insert({
          provider_id: recipient_id,
          available_cents: amount_cents,
          total_earned_cents: amount_cents,
          donations_received_cents: amount_cents,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Donation sent successfully",
      donation: donation || { id: "created", amount_cents, recipient_id },
      recipient_name: recipientName,
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/admin/donation - Obtenir l'historique des dons
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Récupérer l'historique des dons avec infos du destinataire
    const { data: donations, error: donationsError } = await supabase
      .from("admin_donations")
      .select(
        `
        id,
        recipient_id,
        recipient_type,
        amount_cents,
        currency,
        reason,
        created_at
      `
      )
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (donationsError) {
      console.error("Error fetching donations:", donationsError);
      // Si la table n'existe pas, retourner tableau vide
      if (donationsError.code === "42P01") {
        return NextResponse.json({
          success: true,
          donations: [],
          total: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    // Récupérer les profils des destinataires
    const donationsList = (donations || []) as DonationRecord[];
    const recipientIds = [...new Set(donationsList.map((d: DonationRecord) => d.recipient_id))];

    let recipientProfiles: Record<string, ProfileRecord> = {};

    if (recipientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email, display_name")
        .in("user_id", recipientIds);

      if (profiles) {
        recipientProfiles = (profiles as any[]).reduce(
          (acc: Record<string, any>, p: any) => {
            acc[p.user_id] = p; // Clé par user_id pour correspondre à recipient_id (auth ID)
            return acc;
          },
          {} as Record<string, any>
        );
      }
    }

    // Enrichir les donations avec les noms
    const enrichedDonations = donationsList.map((d: DonationRecord) => {
      const profile = recipientProfiles[d.recipient_id];
      return {
        ...d,
        recipient_name:
          profile?.display_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          profile?.email ||
          d.recipient_id,
        recipient_email: profile?.email,
      };
    });

    // Compter le total
    const { count } = await supabase
      .from("admin_donations")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", user.id);

    return NextResponse.json({
      success: true,
      donations: enrichedDonations,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
