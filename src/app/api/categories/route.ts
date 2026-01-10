// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "fr";

    // Récupérer toutes les catégories
    const { data: categories, error } = await supabase
      .from("categories")
      .select(`
        id,
        key,
        name,
        description,
        image_url,
        icon,
        services_count,
        created_at,
        updated_at
      `)
      .order("name->>fr", { ascending: true }); // Tri par nom français

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transformer les données pour extraire les noms selon la locale
    const transformedCategories = categories?.map(category => {
      // Gérer le champ name qui est en JSONB
      let nameValue = "Sans nom";
      
      if (typeof category.name === 'object' && category.name !== null) {
        // Si c'est un objet JSONB, prendre la valeur selon la locale
        nameValue = category.name[locale] || category.name.fr || category.name.en || Object.values(category.name)[0] || 'Sans nom';
      } else if (typeof category.name === 'string') {
        // Si c'est une string (cas de secours)
        try {
          const parsedName = JSON.parse(category.name);
          nameValue = parsedName[locale] || parsedName.fr || parsedName.en || Object.values(parsedName)[0] || 'Sans nom';
        } catch {
          nameValue = category.name;
        }
      }

      // Gérer la description de la même manière
      let descriptionValue = "";
      if (category.description) {
        if (typeof category.description === 'object') {
          descriptionValue = category.description[locale] || category.description.fr || category.description.en || '';
        } else if (typeof category.description === 'string') {
          try {
            const parsedDesc = JSON.parse(category.description);
            descriptionValue = parsedDesc[locale] || parsedDesc.fr || parsedDesc.en || '';
          } catch {
            descriptionValue = category.description;
          }
        }
      }

      return {
        id: category.id,
        key: category.key,
        name: nameValue,
        description: descriptionValue,
        image_url: category.image_url,
        icon: category.icon,
        services_count: category.services_count || 0,
        created_at: category.created_at,
        updated_at: category.updated_at
      };
    }) || [];

    console.log("Categories loaded:", transformedCategories.length); // Debug

    return NextResponse.json({ 
      success: true, 
      categories: transformedCategories 
    });

  } catch (err: any) {
    console.error("Error in GET /api/categories:", err);
    return NextResponse.json(
      { 
        success: false, 
        message: err.message,
        categories: [] // Retourner un tableau vide en cas d'erreur
      }, 
      { status: 500 }
    );
  }
}