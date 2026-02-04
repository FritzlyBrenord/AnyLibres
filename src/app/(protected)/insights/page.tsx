// ============================================================================
// PAGE: AI User Insights - Analyse comportementale IA
// Route protégée: /insights
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  TrendingUp,
  Brain,
  Target,
  Clock,
  Sparkles,
  BarChart3,
  Eye,
  Search,
  Heart,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartBackButton } from "@/components/common/SmartBackButton";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface AnalysisData {
  behavioralProfile: string;
  engagementScore: number;
  totalActivities: number;
  uniqueDays: number;
  topCategories: Array<{ name: string; count: number; score: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  timePatterns: {
    peak_hour: number;
    peak_day: string;
    most_active_time: string;
  };
  insights: Array<{
    insight_type: string;
    title: string;
    description: string;
    priority: string;
  }>;
  stats?: {
    totalSpentCents: number;
    ordersCount: number;
    reviewsCount: number;
    providerSales: number;
  };
}

const profileDescriptions = {
  explorer: {
    title: "Explorateur",
    desc: "Vous aimez découvrir de nouveaux services et parcourir diverses catégories",
    color: "from-blue-500 to-indigo-600",
    icon: "🔭",
  },
  researcher: {
    title: "Chercheur",
    desc: "Vous effectuez beaucoup de recherches avant de prendre une décision",
    color: "from-purple-500 to-violet-600",
    icon: "🔬",
  },
  decisive: {
    title: "Décisif",
    desc: "Vous savez ce que vous voulez et passez rapidement à l'action",
    color: "from-green-500 to-emerald-600",
    icon: "⚡",
  },
  comparison_shopper: {
    title: "Comparateur",
    desc: "Vous comparez attentivement avant de faire un choix",
    color: "from-amber-500 to-orange-600",
    icon: "⚖️",
  },
  impulsive: {
    title: "Spontané",
    desc: "Vous faites confiance à votre instinct et agissez rapidement",
    color: "from-pink-500 to-rose-600",
    icon: "🎯",
  },
  new_user: {
    title: "Nouveau",
    desc: "Bienvenue! Explorez la plateforme pour obtenir plus d'insights",
    color: "from-slate-500 to-gray-600",
    icon: "👋",
  },
};

export default function InsightsPage() {
  const router = useRouter();
  const { t } = useSafeLanguage();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const response = await fetch("/api/ai/analyze");
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">{t.insights.loading}</p>
        </div>
      </div>
    );
  }

  const profile = analysis
    ? {
        title: t.insights.profileTypes[analysis.behavioralProfile as keyof typeof t.insights.profileTypes]?.title || t.insights.profileTypes.new_user.title,
        desc: t.insights.profileTypes[analysis.behavioralProfile as keyof typeof t.insights.profileTypes]?.desc || t.insights.profileTypes.new_user.desc,
        color: profileDescriptions[analysis.behavioralProfile as keyof typeof profileDescriptions]?.color || profileDescriptions.new_user.color,
        icon: profileDescriptions[analysis.behavioralProfile as keyof typeof profileDescriptions]?.icon || profileDescriptions.new_user.icon
      }
    : {
        title: t.insights.profileTypes.new_user.title,
        desc: t.insights.profileTypes.new_user.desc,
        color: profileDescriptions.new_user.color,
        icon: profileDescriptions.new_user.icon
      };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header variant="solid" />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <SmartBackButton
                  label={t.insights.hero.back}
                  variant="minimal"
                  className="text-white"
                />
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400/20 to-pink-400/20 backdrop-blur-sm border border-purple-400/30 rounded-full text-purple-200 text-sm font-semibold mb-6">
                  <Brain className="w-5 h-5" />
                  {t.insights.hero.badge}
                </div>
                <div></div>
              </div>

              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
                {t.insights.hero.title.replace('{highlight}', '')}{" "}
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                  {t.insights.hero.highlight}
                </span>
              </h1>

              <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                {t.insights.hero.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Profile Card */}
        {analysis && (
          <section className="py-12 -mt-16 relative z-10">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-200">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div
                      className={`w-32 h-32 rounded-full bg-gradient-to-br ${profile.color} flex items-center justify-center text-6xl shadow-xl`}
                    >
                      {profile.icon}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {t.insights.profile.title.replace('{type}', profile.title)}
                      </h2>
                      <p className="text-lg text-slate-600 mb-4">
                        {profile.desc}
                      </p>

                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="px-4 py-2 bg-purple-50 rounded-lg">
                          <div className="text-sm text-slate-600">
                            {t.insights.profile.engagementScore}
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(analysis.engagementScore * 100)}%
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                          <div className="text-sm text-slate-600">
                            {t.insights.profile.orders}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {analysis.stats?.ordersCount || 0}
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-green-50 rounded-lg">
                          <div className="text-sm text-slate-600">
                            {t.insights.profile.spent}
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {analysis.stats?.totalSpentCents
                              ? (analysis.stats.totalSpentCents / 100).toLocaleString('fr-HT', { style: 'currency', currency: 'HTG' })
                              : t.insights.profile.zeroBalance}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                   {analysis.stats && (
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-8">
                      <div className="text-center">
                        <div className="text-slate-500 text-sm mb-1">{t.insights.profile.reviews}</div>
                        <div className="font-bold text-xl text-slate-800">{analysis.stats.reviewsCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500 text-sm mb-1">{t.insights.profile.activeDays}</div>
                        <div className="font-bold text-xl text-slate-800">{analysis.uniqueDays}</div>
                      </div>
                       <div className="text-center">
                        <div className="text-slate-500 text-sm mb-1">{t.insights.profile.totalActivities}</div>
                        <div className="font-bold text-xl text-slate-800">{analysis.totalActivities}</div>
                      </div>
                       <div className="text-center">
                        <div className="text-slate-500 text-sm mb-1">{t.insights.profile.providerSales}</div>
                        <div className="font-bold text-xl text-slate-800">{analysis.stats.providerSales}</div>
                      </div>
                    </div>
                   )}

                </div>
              </div>
            </div>
          </section>
        )}

        {analysis && (
          <>
            {/* Top Categories */}
            {analysis.topCategories && analysis.topCategories.length > 0 && (
              <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t.insights.categories.title}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.topCategories.map((cat, index) => (
                        <div
                          key={index}
                          className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg text-slate-900">
                              {cat.name}
                            </h3>
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                              {cat.count} {t.insights.categories.views}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all"
                              style={{ width: `${cat.score * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <section className="py-12 bg-slate-50">
                <div className="container mx-auto px-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t.insights.personalized.title}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {analysis.insights.map((insight, index) => (
                        <div
                          key={index}
                          className={`p-6 rounded-2xl border-l-4 ${
                            insight.priority === "high"
                              ? "bg-purple-50 border-purple-500"
                              : insight.priority === "medium"
                              ? "bg-blue-50 border-blue-500"
                              : "bg-slate-50 border-slate-300"
                          }`}
                        >
                          <h3 className="font-bold text-lg text-slate-900 mb-2">
                            {insight.title}
                          </h3>
                          <p className="text-slate-700">
                            {insight.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Time Patterns */}
            {analysis.timePatterns && (
              <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t.insights.habits.title}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-center">
                        <div className="text-5xl mb-4">🕐</div>
                        <h3 className="font-semibold text-slate-900 mb-2">
                          {t.insights.habits.peakHour}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {analysis.timePatterns.most_active_time}
                        </p>
                      </div>
                      <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl text-center">
                        <div className="text-5xl mb-4">📅</div>
                        <h3 className="font-semibold text-slate-900 mb-2">
                          {t.insights.habits.favoriteDay}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {analysis.timePatterns.peak_day}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
