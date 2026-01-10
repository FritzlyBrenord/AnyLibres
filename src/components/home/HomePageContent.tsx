'use client';

import Link from "next/link";
import {
  Search,
  ArrowRight,
  Star,
  Sparkles,
  TrendingUp,
  Folder,
  Users,
  Shield,
  Clock,
  Award,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Service, Category, ProviderProfile } from "@/types";
import { ServiceCard } from "@/components/service/ServiceCard";
import { ProviderCard } from "@/components/service/ProviderCard";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { CategoryCard } from "@/components/category/CategoryCard";

interface HomePageContentProps {
  services: Service[];
  categories: Category[];
  providers: ProviderProfile[];
}

export function HomePageContent({ services, categories, providers }: HomePageContentProps) {
  const { t, getText } = useSafeLanguage();

  return (
    <main className="flex-1">
      {/* HERO SECTION - DESIGN PREMIUM */}
      <section className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Motif de fond amélioré */}
        <div className="absolute inset-0 opacity-10 animate">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Effets lumineux premium */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge premium avec icônes */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 rounded-full text-slate-900 font-bold text-sm mb-6 animate-fade-in shadow-2xl">
              <Star className="w-4 h-4 fill-current" />
              {t.home.hero.badge}
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Titre principal avec dégradé doré */}
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 animate-slide-up">
              {t.home.hero.title}
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent mt-2">
                {t.home.hero.titleHighlight}
              </span>
            </h1>

            <p
              className="text-xl text-slate-100 mb-10 max-w-2xl mx-auto animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              {t.home.hero.subtitle}{" "}
              <span className="font-semibold text-amber-300">
                {t.home.hero.subtitleHighlight}
              </span>
              {t.home.hero.subtitleEnd}
            </p>

            {/* Barre de recherche avec effet glassmorphism */}
            <form
              action="/search"
              method="GET"
              className="max-w-3xl mx-auto animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 border border-white/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    placeholder={t.home.hero.searchPlaceholder}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-lg bg-transparent"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0 shadow-lg"
                >
                  {t.home.hero.searchButton}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>

            {/* Tags populaires avec style premium */}
            <div
              className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <span className="text-slate-300 text-sm font-medium">
                {t.home.hero.popularLabel}
              </span>
              {t.home.hero.popularTags.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${term}`}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm rounded-full transition-all hover:scale-105 border border-white/10"
                >
                  {term}
                </Link>
              ))}
            </div>

            {/* Statistiques impressionnantes */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  10K+
                </div>
                <div className="text-slate-300 text-xs">{t.home.stats.projects}</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  5K+
                </div>
                <div className="text-slate-300 text-xs">{t.home.stats.experts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  98%
                </div>
                <div className="text-slate-300 text-xs">{t.home.stats.satisfied}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator élégant */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* SECTION CATÉGORIES - DESIGN PREMIUM ÉPURÉ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              {t.home.categories.badge}
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
              {t.home.categories.title}
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              {t.home.categories.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category: Category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES POPULAIRES - STYLE MODERNE */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold mb-3">
                <TrendingUp className="w-4 h-4" />
                {t.home.popularServices.badge}
              </div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
                {t.home.popularServices.title}
              </h2>
              <p className="text-slate-600">
                {t.home.popularServices.subtitle}
              </p>
            </div>
            <Link
              href="/search"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {t.home.popularServices.viewAll}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service: Service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/search">
              <Button
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {t.home.popularServices.viewAllServices}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PRESTATAIRES TOP - DESIGN PREMIUM */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 rounded-full text-blue-700 text-sm font-semibold mb-4 shadow-sm">
              <Award className="w-4 h-4" />
              {t.home.topProviders.badge}
            </div>
            <h2 className="font-heading font-bold text-4xl lg:text-5xl text-slate-900 mb-6">
              {t.home.topProviders.title}{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.home.topProviders.titleHighlight}
              </span>
            </h2>
            <p className="text-slate-600 text-xl max-w-3xl mx-auto leading-relaxed">
              {t.home.topProviders.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider: ProviderProfile, index) => (
              <div
                key={provider.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProviderCard key={provider.id} provider={provider} />
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link href="/providers">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0 px-8"
              >
                <Users className="w-5 h-5 mr-2" />
                {t.home.topProviders.viewAll}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION CONFIANCE - STYLE ÉLÉGANT */}
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-3">
              <Shield className="w-4 h-4" />
              {t.home.trust.badge}
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
              {t.home.trust.title}
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              {t.home.trust.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-slate-900">
                {t.home.trust.securePayment.title}
              </h3>
              <p className="text-slate-600">
                {t.home.trust.securePayment.description}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-slate-900">
                {t.home.trust.verifiedProviders.title}
              </h3>
              <p className="text-slate-600">
                {t.home.trust.verifiedProviders.description}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-slate-900">
                {t.home.trust.support247.title}
              </h3>
              <p className="text-slate-600">
                {t.home.trust.support247.description}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-slate-900">
                {t.home.trust.qualityGuarantee.title}
              </h3>
              <p className="text-slate-600">
                {t.home.trust.qualityGuarantee.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - DESIGN ACCORDÉON MODERNE */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold mb-3">
              <CheckCircle className="w-4 h-4" />
              {t.home.faq.badge}
            </div>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
              {t.home.faq.title}
            </h2>
          </div>

          <div className="space-y-4">
            {t.home.faq.questions.map((faq, index) => (
              <details
                key={index}
                className="group p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-slate-900">
                  {faq.q}
                  <CheckCircle className="w-5 h-5 text-amber-500 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/about/faq">
              <Button
                variant="outline"
                className="border-2 border-slate-300 hover:border-slate-400"
              >
                {t.home.faq.viewAll}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL - DESIGN IMPACTANT */}
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

        {/* Effets lumineux */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            {t.home.cta.badge}
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-6">
            {t.home.cta.title}
          </h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            {t.home.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold shadow-2xl border-0"
              >
                {t.home.cta.createAccount}
              </Button>
            </Link>
            <Link href="/search">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                {t.home.cta.exploreServices}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
