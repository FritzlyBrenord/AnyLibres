// /app/api/geonames/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  try {
    const { endpoint } = await params;

    // Vérifier que le username existe
    const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME;
    if (!username) {
      console.error("NEXT_PUBLIC_GEONAMES_USERNAME not configured");
      return NextResponse.json(
        { error: "GeoNames username not configured" },
        { status: 500 }
      );
    }

    // Construire l'URL
    const url = new URL(`http://api.geonames.org/${endpoint}`);
    const searchParams = req.nextUrl.searchParams;

    // Ajouter le username
    searchParams.set("username", username);

    // Copier tous les query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    console.log("Fetching GeoNames:", url.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GeoNames API error:", response.status, errorText);
      return NextResponse.json(
        { error: `GeoNames API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Vérifier si GeoNames retourne une erreur dans le JSON
    if (data.status) {
      console.error("GeoNames error:", data);
      return NextResponse.json(
        { error: data.status.message || "GeoNames error" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GeoNames route error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur GeoNames" },
      { status: 500 }
    );
  }
}
