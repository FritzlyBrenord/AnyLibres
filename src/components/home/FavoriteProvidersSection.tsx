// ============================================================================
// Component: FavoriteProvidersSection - Prestataires favoris
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FavoriteProvidersSection() {
  // Récupère les prestataires populaires puis complète avec leurs stats
  const [providers, setProviders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProviders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/providers/popular");
        const json = await res.json();
        if (!json.success) return setProviders([]);

        const list: any[] = json.data || [];

        // Pour chaque prestataire, récupérer les stats via /api/providers/[id]
        const detailed = await Promise.all(
          list.map(async (p: any) => {
            try {
              const r = await fetch(`/api/providers/${p.id}`);
              const jd = await r.json();
              if (jd.success && jd.data?.stats) {
                return { ...p, stats: jd.data.stats };
              }
            } catch (e) {
              // ignore
            }
            return {
              ...p,
              stats: {
                total_services: 0,
                total_reviews: 0,
                average_rating: p.rating ?? 0,
              },
            };
          })
        );

        // Filtrer pour ne garder que les prestataires ayant au moins 1 avis
        const withReviews = (detailed || []).filter(
          (p) => (p.stats?.total_reviews ?? 0) >= 1
        );

        // Trier du plus fort au plus faible selon average_rating (fallback sur p.rating)
        withReviews.sort(
          (a: any, b: any) =>
            (b.stats?.average_rating ?? b.rating ?? 0) -
            (a.stats?.average_rating ?? a.rating ?? 0)
        );

        if (!cancelled) setProviders(withReviews);
      } catch (err) {
        console.error("Error fetching favorite providers:", err);
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="h-48 bg-white animate-pulse rounded-2xl" />;
  }

  if (!providers || providers.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-700 text-sm font-semibold mb-4">
              <Heart className="w-4 h-4 fill-current" />
              Vos favoris
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
              Prestataires que{" "}
              <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Vous Aimez
              </span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.slice(0, 3).map((provider, index) => (
            <Link
              key={provider.id}
              href={`/provider/${provider.id}`}
              className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {provider.profile?.display_name
                    ? provider.profile.display_name.slice(0, 2).toUpperCase()
                    : provider.company_name?.slice(0, 2).toUpperCase() || "PR"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-purple-600 transition-colors">
                    {provider.profile?.display_name || provider.company_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">
                        {(
                          provider.stats?.average_rating ??
                          provider.rating ??
                          0
                        ).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      • {provider.stats?.total_services ?? 0} services
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Voir le profil
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
