// ============================================================================
// PAGE: À Propos - AnyLibre
// Page institutionnelle premium avec images et storytelling - MULTI-LANGUES
// ============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Target,
  Heart,
  Shield,
  TrendingUp,
  Award,
  Globe,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  DollarSign,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { LiveStats } from "@/components/about/LiveStats";
import { LiveStatsImpressive } from "@/components/about/LiveStatsImpressive";

export default function AboutPage() {
  const { t } = useLanguageContext();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header variant="solid" />

      <main className="flex-1 ">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-20 lg:py-32 overflow-hidden">
          {/* Effets de fond */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                {t?.about?.hero?.badge || 'Notre Histoire'}
              </div>

              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6">
                {t?.about?.hero?.title || 'Connecter les Talents avec les'}{" "}
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  {t?.about?.hero?.titleHighlight || 'Opportunités'}
                </span>
              </h1>

              <p className="text-xl text-slate-200 mb-8 leading-relaxed">
                {t?.about?.hero?.subtitle || 'AnyLibre est la première plateforme haïtienne dédiée à connecter les entreprises avec les meilleurs freelances et professionnels indépendants.'}
              </p>

              {/* Statistiques Hero - Live */}
              <LiveStats />
            </div>
          </div>
        </section>

        {/* NOTRE HISTOIRE */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Texte */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                    <Building2 className="w-4 h-4" />
                    {t?.about?.story?.badge || 'Notre Origine'}
                  </div>

                  <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-6">
                    {t?.about?.story?.title || 'Une Vision pour Transformer le Marché du Travail en Haïti'}
                  </h2>

                  <div className="space-y-4 text-slate-600 leading-relaxed">
                    <p>
                      {t?.about?.story?.paragraph1 || 'Fondée en 2023, AnyLibre est née d\'une vision simple mais puissante : démocratiser l\'accès aux opportunités professionnelles en Haïti et créer un écosystème où le talent rencontre l\'opportunité.'}
                    </p>
                    <p>
                      {t?.about?.story?.paragraph2 || 'Dans un monde de plus en plus digitalisé, nous avons constaté que de nombreux professionnels talentueux haïtiens peinaient à trouver des clients, tandis que les entreprises cherchaient désespérément des experts qualifiés.'}
                    </p>
                    <p>
                      {t?.about?.story?.paragraph3 || 'Aujourd\'hui, AnyLibre est devenue la plateforme de référence, connectant des milliers de freelances avec des entreprises locales et internationales, facilitant plus de 10 000 projets réussis.'}
                    </p>
                  </div>

                  {/* Points forts */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {t?.about?.story?.highlights?.verified?.title || 'Vérifiés'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t?.about?.story?.highlights?.verified?.desc || 'Tous nos freelances'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {t?.about?.story?.highlights?.secure?.title || 'Sécurisé'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t?.about?.story?.highlights?.secure?.desc || 'Paiements 100%'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="relative">
                  <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Placeholder image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-24 h-24 text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">{t?.about?.story?.teamPhoto || 'Team Photo'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Badges flottants */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">98%</div>
                        <div className="text-sm text-slate-600">
                          {t?.about?.story?.satisfaction || 'Satisfaction'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold mb-4">
                  <Target className="w-4 h-4" />
                  {t?.about?.mission?.badge || 'Notre Raison d\'Être'}
                </div>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
                  {t?.about?.mission?.title || 'Mission & Vision'}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Mission */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-slate-900 mb-4">
                    {t?.about?.mission?.missionTitle || 'Notre Mission'}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t?.about?.mission?.missionText || 'Démocratiser l\'accès aux opportunités professionnelles en connectant les talents haïtiens avec des clients du monde entier. Nous créons un écosystème transparent, sécurisé et équitable où chacun peut réussir.'}
                  </p>
                </div>

                {/* Vision */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-slate-900 mb-4">
                    {t?.about?.mission?.visionTitle || 'Notre Vision'}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t?.about?.mission?.visionText || 'Devenir la plateforme de référence en Haïti et dans la Caraïbe pour le travail indépendant, en permettant à chaque professionnel de vivre de sa passion et à chaque entreprise de trouver les meilleurs talents.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALEURS */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4">
                  <Heart className="w-4 h-4" />
                  {t?.about?.values?.badge || 'Ce Qui Nous Guide'}
                </div>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
                  {t?.about?.values?.title || 'Nos Valeurs Fondamentales'}
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  {t?.about?.values?.subtitle || 'Des principes qui définissent notre culture et guident chacune de nos actions'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Shield,
                    color: "from-blue-500 to-indigo-600",
                    index: 0,
                  },
                  {
                    icon: Users,
                    color: "from-purple-500 to-pink-600",
                    index: 1,
                  },
                  {
                    icon: Zap,
                    color: "from-amber-500 to-orange-600",
                    index: 2,
                  },
                  {
                    icon: Heart,
                    color: "from-red-500 to-rose-600",
                    index: 3,
                  },
                ].map((value, idx) => (
                  <div
                    key={idx}
                    className="group bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {t?.about?.values?.items?.[value.index]?.title || ''}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {t?.about?.values?.items?.[value.index]?.desc || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STATISTIQUES IMPRESSIONNANTES */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
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

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">
                  {t?.about?.stats?.title || 'AnyLibre en Chiffres'}
                </h2>
                <p className="text-slate-200 text-lg">
                  {t?.about?.stats?.subtitle || 'Des résultats qui parlent d\'eux-mêmes'}
                </p>
              </div>

              <LiveStatsImpressive />
            </div>
          </div>
        </section>

        {/* ÉQUIPE */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                  <Users className="w-4 h-4" />
                  {t?.about?.team?.badge || 'Notre Équipe'}
                </div>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
                  {t?.about?.team?.title || 'Les Visages Derrière AnyLibre'}
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  {t?.about?.team?.subtitle || 'Une équipe passionnée et dévouée à votre succès'}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { name: "Jean-Pierre Duval", index: 0 },
                  { name: "Marie Cherisier", index: 1 },
                  { name: "Frantz Joseph", index: 2 },
                ].map((member, idx) => (
                  <div
                    key={idx}
                    className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Photo placeholder */}
                    <div className="relative h-80 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <Users className="w-24 h-24 text-slate-400" />
                    </div>
                    {/* Info */}
                    <div className="p-6">
                      <h3 className="font-bold text-xl text-slate-900 mb-1">
                        {member.name}
                      </h3>
                      <p className="text-indigo-600 font-semibold mb-2">
                        {t?.about?.team?.members?.[member.index]?.role || ''}
                      </p>
                      <p className="text-slate-600 text-sm">{t?.about?.team?.members?.[member.index]?.desc || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TÉMOIGNAGES */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold mb-4">
                  <Star className="w-4 h-4" />
                  {t?.about?.testimonials?.badge || 'Témoignages'}
                </div>
                <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
                  {t?.about?.testimonials?.title || 'Ce Que Disent Nos Utilisateurs'}
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { name: "Sophie Laurent", index: 0 },
                  { name: "Marc Antoine", index: 1 },
                  { name: "Clara Joseph", index: 2 },
                ].map((testimonial, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
                  >
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-6 leading-relaxed">
                      "{t?.about?.testimonials?.items?.[testimonial.index]?.text || ''}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t?.about?.testimonials?.items?.[testimonial.index]?.role || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
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

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-6">
                {t?.about?.cta?.title || 'Prêt à Rejoindre Notre Communauté ?'}
              </h2>
              <p className="text-xl text-slate-200 mb-8">
                {t?.about?.cta?.subtitle || 'Que vous soyez freelance ou entreprise, AnyLibre vous accompagne vers le succès'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold shadow-2xl border-0"
                  >
                    {t?.about?.cta?.startButton || 'Commencer Gratuitement'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/explorer">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  >
                    {t?.about?.cta?.exploreButton || 'Explorer les Services'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
