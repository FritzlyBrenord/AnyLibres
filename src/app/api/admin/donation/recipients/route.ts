import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RecipientProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
}

// GET /api/admin/donation/recipients - Chercher clients ou providers par nom/email
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'client' ou 'provider'
    const search = searchParams.get("search");

    if (!type || !["client", "provider"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    if (!search || search.trim().length < 1) {
      return NextResponse.json({
        success: true,
        recipients: [],
      });
    }

    // Rechercher dans profiles avec first_name et last_name
    let query = supabase
      .from("profiles")
      .select("id, user_id, email, first_name, last_name, display_name, avatar_url");

    if (type === "client") {
      query = query.eq("role", "client");
    } else if (type === "provider") {
      query = query.eq("role", "provider");
    }

    // Recherche par email, first_name, last_name ou display_name
    const searchPattern = `%${search}%`;
    query = query.or(
      `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},display_name.ilike.${searchPattern}`
    );

    query = query.limit(20);

    const { data: recipients, error } = await query;

    if (error) {
      console.error("Error fetching recipients:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch recipients" },
        { status: 500 }
      );
    }

    // Formater les résultats avec le nom complet
    // IMPORTANT: On utilise user_id car les tables de balance et admin_donations 
    // référencent auth.users(id) et non profiles(id).
    console.log(`[RECIPIENTS] Found ${recipients?.length || 0} results for "${search}"`);

    const formattedRecipients = ((recipients || []) as any[]).map((r: any) => {
      // Force l'utilisation de user_id comme identifiant principal
      const authId = r.user_id;
      console.log(`- Recipient: ${r.email}, profile_id=${r.id}, auth_user_id=${authId}`);

      return {
        id: authId, // C'est cet ID qui sera envoyé au POST /api/admin/donation
        email: r.email,
        display_name:
          r.display_name ||
          [r.first_name, r.last_name].filter(Boolean).join(" ") ||
          r.email,
        avatar_url: r.avatar_url,
        first_name: r.first_name,
        last_name: r.last_name,
      };
    });

    return NextResponse.json({
      success: true,
      recipients: formattedRecipients,
    });
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
