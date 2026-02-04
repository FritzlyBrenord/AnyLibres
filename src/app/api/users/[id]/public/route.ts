import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { id } = params;

    try {
        // 1. Essayer de trouver par user_id (le plus probable pour un client_id venant d'une commande)
        let { data: profile, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, display_name, avatar_url, role, user_id")
            .eq("user_id", id)
            .single();

        // 2. Si pas trouvé, essayer par id (clé primaire)
        if (!profile && error) {
            const { data: profileById, error: errorById } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, display_name, avatar_url, role, user_id")
                .eq("id", id)
                .single();

            if (profileById) {
                profile = profileById;
                error = null;
            }
        }

        if (error || !profile) {
            // Fallback: Check if it's a provider
            const { data: provider, error: providerError } = await supabase
                .from("provider_profiles")
                .select("id, profile_id, first_name, last_name, display_name, avatar_url")
                .eq("profile_id", id)
                .single();

            if (provider) {
                return NextResponse.json({
                    id: provider.id,
                    profile_id: provider.profile_id,
                    first_name: provider.first_name,
                    last_name: provider.last_name,
                    display_name: provider.display_name,
                    avatar_url: provider.avatar_url,
                    role: 'provider'
                });
            }

            console.error("Error fetching profile:", error);
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (err) {
        console.error("Internal Server Error:", err);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
