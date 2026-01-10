// app/(protected)/Provider/Accueil/page.tsx
// Page d'accueil premium pour devenir prestataire
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import {
  Loader2,
  CheckCircle2,
  Star,
  TrendingUp,
  Users,
  ArrowRight,
  Briefcase,
  Award,
  DollarSign,
  Zap,
  Shield,
  Clock,
  Globe,
  Target,
  Rocket,
  Sparkles,
  BarChart3,
  HeartHandshake,
  BadgeCheck,
  LucideIcon,
  Sparkle,
  Target as TargetIcon,
  Users as UsersIcon,
  Award as AwardIcon,
  Clock as ClockIcon,
  Globe as GlobeIcon,
  BarChart as BarChartIcon,
  Heart as HeartIcon,
  Shield as ShieldIcon,
  Zap as ZapIcon,
  Eye,
  MessageSquare,
  CreditCard,
  Palette,
  Code,
  Megaphone,
  PenTool,
  Camera,
  Music,
  BookOpen,
  Brain,
  Languages,
  PieChart,
} from "lucide-react";
// Import manquant pour les icônes
import { Settings, Crown, ShieldCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function ProviderAccueilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAlreadyProvider, setIsAlreadyProvider] = useState(false);
  const [stats, setStats] = useState({
    totalProviders: 3500,
    totalEarnings: 1850000,
    avgRating: 4.9,
    successRate: 97,
  });

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (!user) {
        router.push("/auth/signin?redirect=/Provider/Accueil");
        return;
      }

      try {
        const supabase = createClient();

        // Récupérer le profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        // Si déjà provider, rediriger vers le dashboard
        if (profile?.role === "provider") {
          setIsAlreadyProvider(true);
          router.push("/Provider/dashboard");
        }
      } catch (error) {
        console.error("Error checking provider status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkProviderStatus();
    }
  }, [user, authLoading, router]);

  const handleGetStarted = () => {
    router.push("/Provider/Accueil/formulaire");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-white/70" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-white/20 animate-ping"></div>
        </div>
      </div>
    );
  }

  if (isAlreadyProvider) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <Header variant="solid" />

      {/* Hero Section Élite */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Background Elements - Subtle */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-900/10 to-indigo-900/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-900/5 via-indigo-900/5 to-purple-900/5 rounded-full blur-3xl"></div>

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px),
                            linear-gradient(to bottom, #fff 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Elite Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-8 group hover:border-white/20 transition-colors"
          >
            <div className="relative">
              <Sparkle className="w-4 h-4 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400/20 blur-sm"></div>
            </div>
            <span className="text-sm font-medium text-white/90">
              Communauté d&apos;élite • {stats.totalProviders}+ membres
            </span>
          </motion.div>

          {/* Main Heading with Gradient Glow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="block text-white">ÉLEVEZ VOTRE</span>
                <span className="block mt-2">
                  <span className="relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 blur-xl opacity-50"></span>
                    <span className="relative bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                      ACTIVITÉ
                    </span>
                  </span>
                </span>
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 blur-3xl -z-10"></div>
            </div>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/60 text-center max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Plateforme premium pour les professionnels qui visent
            l&apos;excellence. Transformez votre expertise en succès durable.
          </motion.p>

          {/* Premium CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleGetStarted}
              className="group relative px-12 py-6 bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-purple-600/90 text-white text-lg font-semibold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 via-indigo-600/50 to-purple-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative flex items-center gap-3">
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Commencer maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => {
                const featuresSection = document.getElementById("features");
                featuresSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group px-8 py-4 border border-white/20 text-white/80 text-lg font-semibold rounded-2xl hover:border-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                Découvrir les avantages
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>

          {/* Premium Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24"
          >
            <StatCard
              value={`${(stats.totalEarnings / 1000000).toFixed(1)}M€`}
              label="Revenus générés"
              icon={<DollarSign className="w-5 h-5" />}
              description="Pour notre communauté"
            />
            <StatCard
              value={stats.avgRating}
              label="Note moyenne"
              icon={<Star className="w-5 h-5" />}
              description="Excellence garantie"
            />
            <StatCard
              value={`${stats.totalProviders}+`}
              label="Experts actifs"
              icon={<Users className="w-5 h-5" />}
              description="Communauté sélective"
            />
            <StatCard
              value={`${stats.successRate}%`}
              label="Taux de réussite"
              icon={<TrendingUp className="w-5 h-5" />}
              description="Satisfaction client"
            />
          </motion.div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section
        id="features"
        className="py-24 px-4 bg-gradient-to-b from-white/5 via-transparent to-transparent"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full mb-6"
            >
              <AwardIcon className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">
                Pourquoi nous choisir
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Une plateforme conçue pour les{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                professionnels
              </span>
            </h2>

            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Des outils avancés et une infrastructure premium pour propulser
              votre activité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Sécurité maximale"
              description="Paiements cryptés, protection avancée et garantie de satisfaction"
              gradient="from-blue-500/20 to-cyan-500/20"
              borderColor="border-blue-500/30"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Croissance accélérée"
              description="Algorithmes intelligents pour maximiser votre visibilité"
              gradient="from-purple-500/20 to-pink-500/20"
              borderColor="border-purple-500/30"
            />
            <FeatureCard
              icon={<GlobeIcon className="w-8 h-8" />}
              title="Portée internationale"
              description="Accédez à des clients premium du monde entier"
              gradient="from-emerald-500/20 to-green-500/20"
              borderColor="border-emerald-500/30"
            />
            <FeatureCard
              icon={<ClockIcon className="w-8 h-8" />}
              title="Flexibilité totale"
              description="Travaillez à votre rythme, définissez vos propres conditions"
              gradient="from-orange-500/20 to-red-500/20"
              borderColor="border-orange-500/30"
            />
            <FeatureCard
              icon={<BarChartIcon className="w-8 h-8" />}
              title="Analytics premium"
              description="Tableaux de bord détaillés avec insights prédictifs"
              gradient="from-indigo-500/20 to-purple-500/20"
              borderColor="border-indigo-500/30"
            />
            <FeatureCard
              icon={<HeartIcon className="w-8 h-8" />}
              title="Support prioritaire"
              description="Équipe dédiée disponible 24/7 pour vous accompagner"
              gradient="from-rose-500/20 to-pink-500/20"
              borderColor="border-rose-500/30"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pour tous les{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                talents
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Quel que soit votre domaine d&apos;expertise, nous avons la
              solution adaptée
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <CategoryCard
              icon={<Palette className="w-6 h-6" />}
              title="Design"
              color="from-purple-500 to-pink-500"
            />
            <CategoryCard
              icon={<Code className="w-6 h-6" />}
              title="Développement"
              color="from-blue-500 to-cyan-500"
            />
            <CategoryCard
              icon={<Megaphone className="w-6 h-6" />}
              title="Marketing"
              color="from-green-500 to-emerald-500"
            />
            <CategoryCard
              icon={<PenTool className="w-6 h-6" />}
              title="Rédaction"
              color="from-orange-500 to-yellow-500"
            />
            <CategoryCard
              icon={<Brain className="w-6 h-6" />}
              title="Consulting"
              color="from-indigo-500 to-purple-500"
            />
            <CategoryCard
              icon={<Camera className="w-6 h-6" />}
              title="Photographie"
              color="from-rose-500 to-pink-500"
            />
            <CategoryCard
              icon={<Music className="w-6 h-6" />}
              title="Musique"
              color="from-violet-500 to-purple-500"
            />
            <CategoryCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Éducation"
              color="from-blue-500 to-indigo-500"
            />
            <CategoryCard
              icon={<Languages className="w-6 h-6" />}
              title="Traduction"
              color="from-teal-500 to-green-500"
            />
            <CategoryCard
              icon={<PieChart className="w-6 h-6" />}
              title="Analyse"
              color="from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Process Section Élite */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-full mb-6"
            >
              <TargetIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">
                Notre processus
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Votre succès en{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                3 étapes
              </span>
            </h2>

            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Un parcours simplifié pour lancer et développer votre activité
            </p>
          </div>

          <div className="relative">
            {/* Timeline élégante */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-y-1/2"></div>
            <div className="hidden lg:block absolute top-1/2 left-1/3 w-8 h-8 -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-md opacity-50"></div>
            </div>
            <div className="hidden lg:block absolute top-1/2 left-2/3 w-8 h-8 -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-md opacity-50"></div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <ProcessStep
                number="01"
                title="Inscription élite"
                description="Créez votre profil professionnel avec notre assistant premium"
                icon={<User className="w-6 h-6" />}
                delay={0.1}
                gradient="from-purple-500 to-pink-500"
              />
              <ProcessStep
                number="02"
                title="Personnalisation"
                description="Configurez vos services, tarifs et conditions uniques"
                icon={<Settings className="w-6 h-6" />}
                delay={0.2}
                gradient="from-indigo-500 to-purple-500"
              />
              <ProcessStep
                number="03"
                title="Lancement"
                description="Commencez à recevoir des commandes et développez votre réputation"
                icon={<Rocket className="w-6 h-6" />}
                delay={0.3}
                gradient="from-blue-500 to-cyan-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Élite */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ils nous font{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                confiance
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Découvrez les témoignages de nos prestataires stars
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Alexandre R."
              role="Architecte Cloud Senior"
              testimonial="La qualité des clients et des projets sur AnyLibre est exceptionnelle. J'ai triplé mes revenus en un an."
              revenue="€85,000+"
              avatarColor="from-blue-500 to-cyan-500"
            />
            <TestimonialCard
              name="Sophie L."
              role="Designer UX/UI"
              testimonial="L'interface est sublime et les outils sont puissants. Une véritable différence pour mon activité."
              revenue="€62,000+"
              avatarColor="from-purple-500 to-pink-500"
            />
            <TestimonialCard
              name="Thomas M."
              role="Consultant IA"
              testimonial="Le support est réactif et professionnel. Une plateforme qui comprend vraiment les besoins des experts."
              revenue="€120,000+"
              avatarColor="from-emerald-500 to-green-500"
            />
          </div>
        </div>
      </section>

      {/* Final CTA Élite */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 p-12 text-center border border-white/10 shadow-2xl backdrop-blur-sm"
          >
            {/* Background Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              {/* Animated Icon */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Crown className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Prêt pour l&apos;excellence ?
              </h2>

              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                Rejoignez la plateforme premium des professionnels.
                <br />
                Élevez votre activité avec des outils conçus pour réussir.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center gap-3">
                    <Crown className="w-5 h-5" />
                    Commencer gratuitement
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => router.push("/Provider/faq")}
                  className="group px-8 py-4 border border-white/20 text-white/80 text-lg font-semibold rounded-2xl hover:border-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    Questions fréquentes
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              {/* Guarantee Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Sécurité bancaire</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Support 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <BadgeCheck className="w-4 h-4 text-purple-400" />
                  <span>Garantie satisfaction</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Composant Stat Card Premium
interface StatCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

function StatCard({ value, label, icon, description }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="text-left">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm font-medium text-white/90">{label}</div>
          <div className="text-xs text-white/60 mt-1">{description}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant Feature Card Premium
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  borderColor,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border ${borderColor} hover:border-white/30 transition-all duration-500 overflow-hidden`}
    >
      {/* Hover Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
      ></div>

      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
        {title}
      </h3>
      <p className="text-white/60 leading-relaxed group-hover:text-white/70 transition-colors">
        {description}
      </p>

      {/* Hover Line */}
      <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-white/50 to-transparent transform -translate-x-1/2 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
    </motion.div>
  );
}

// Composant Category Card
interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  color: string;
}

function CategoryCard({ icon, title, color }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-gradient-to-br ${color}/10 backdrop-blur-sm rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer`}
    >
      <div className="text-center">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div className="text-sm font-medium text-white/90">{title}</div>
      </div>
    </motion.div>
  );
}

// Composant Process Step Premium
interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  gradient: string;
}

function ProcessStep({
  number,
  title,
  description,
  icon,
  delay,
  gradient,
}: ProcessStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group">
        {/* Number Badge */}
        <div className="absolute -top-4 -left-4">
          <div className="relative">
            <div
              className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl`}
            >
              {number}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-white mb-6 ml-4 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/60 leading-relaxed group-hover:text-white/70 transition-colors">
          {description}
        </p>

        {/* Connector Line (desktop only) */}
        <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/10 to-transparent"></div>
      </div>
    </motion.div>
  );
}

// Composant Testimonial Premium
interface TestimonialCardProps {
  name: string;
  role: string;
  testimonial: string;
  revenue: string;
  avatarColor: string;
}

function TestimonialCard({
  name,
  role,
  testimonial,
  revenue,
  avatarColor,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500"
    >
      {/* Revenue Badge */}
      <div className="absolute -top-3 -right-3">
        <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full">
          <span className="text-xs font-medium text-emerald-300">
            {revenue}
          </span>
        </div>
      </div>

      {/* Quote Icon */}
      <div className="text-4xl text-white/10 mb-4">"</div>

      {/* Testimonial */}
      <p className="text-white/80 text-lg italic mb-6 leading-relaxed group-hover:text-white/90 transition-colors">
        {testimonial}
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor}`}
        ></div>
        <div>
          <div className="font-bold text-white">{name}</div>
          <div className="text-sm text-white/60">{role}</div>
        </div>
      </div>
    </motion.div>
  );
}
