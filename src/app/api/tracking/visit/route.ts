import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { path, userAgent } = body;

        // Obtenir l'IP du visiteur (Next.js headers)
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

        let geoData = {
            country: ip === "::1" || ip === "127.0.0.1" ? "Localhost" : "Unknown",
            city: ip === "::1" || ip === "127.0.0.1" ? "Environnement de Test" : "Unknown",
            region: "Unknown",
            latitude: 0,
            longitude: 0
        };

        // Obtenir la géolocalisation via api.ipify ou ipapi.co (Exemple gratuit sans clé nécessaire pour démo)
        try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
            if (geoRes.ok) {
                const data = await geoRes.json();
                geoData = {
                    country: data.country_name || "Unknown",
                    city: data.city || "Unknown",
                    region: data.region || "Unknown",
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0
                };
            }
        } catch (e) {
            console.error("Geo API failed:", e);
        }

        // Si c'est en localhost, vérifier s'il existe déjà un log pour éviter les doublons
        if (ip === "::1" || ip === "127.0.0.1") {
            const { data: existingLocalhost } = await supabase
                .from('visitor_logs')
                .select('id')
                .or(`ip_address.eq.::1,ip_address.eq.127.0.0.1`)
                .limit(1);

            if (existingLocalhost && existingLocalhost.length > 0) {
                return NextResponse.json({ success: true, message: "Localhost already tracked" });
            }
        }

        // Insérer dans Supabase
        const { error } = await supabase
            .from('visitor_logs')
            .insert({
                ip_address: ip,
                country: geoData.country,
                city: geoData.city,
                region: geoData.region,
                latitude: geoData.latitude,
                longitude: geoData.longitude,
                user_agent: userAgent,
                path: path || '/'
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Tracking Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
