import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
        }

        const { disputeId, userId, isMuted } = await JSON.parse(await req.text());

        if (!disputeId || !userId) {
            return NextResponse.json({ success: false, error: "Paramètres manquants" }, { status: 400 });
        }

        // Vérifier si l'utilisateur actuel est l'admin de ce litige ou un admin système
        // Dans cet exemple, on simplifie en vérifiant si le rôle de l'utilisateur est admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: "Seul l'administrateur peut effectuer cette action" }, { status: 403 });
        }

        // Mettre à jour l'état de silence dans mediation_presence
        const { error: updateError } = await supabase
            .from("mediation_presence")
            .update({ is_muted: isMuted })
            .eq("dispute_id", disputeId)
            .eq("user_id", userId);

        if (updateError) {
            console.error("Error updating mute status:", updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Error in toggle-mute:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
