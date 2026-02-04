
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { email } = await request.json();

        // Get the base URL from the request headers or env
        const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

        if (!email) {
            return NextResponse.json({ error: "Email requis" }, { status: 400 });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/api/auth/callback?redirect=/reset-password`,
        });

        if (error) {
            console.error("Forgot Password Error:", error);
            // For security, don't reveal if user exists, but Supabase might behave differently. 
            // Returns 429 if too many requests.
            if (error.status === 429) {
                return NextResponse.json({ error: "Trop de demandes. Veuillez patienter." }, { status: 429 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Forgot Password Server Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
