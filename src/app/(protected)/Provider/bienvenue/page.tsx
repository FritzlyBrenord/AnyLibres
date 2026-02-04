// app/(protected)/Provider/bienvenue/page.tsx
// Page de bienvenue après inscription provider
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  Trophy,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export default function ProviderBienvenuePage() {
  const { t } = useSafeLanguage();
  const tb = t.providerBienvenue;
  const router = useRouter();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Lancer les confettis
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#9333ea", "#ec4899", "#8b5cf6"],
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#9333ea", "#ec4899", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Compte à rebours pour la redirection
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/Provider/TableauDeBord");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  const handleGoToDashboard = () => {
    router.push("/Provider/TableauDeBord");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl mb-6 animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {tb.congratulations}
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-xl text-white/90 mb-2">
            {tb.subtitle}
          </p>
          <p className="text-white/75">
            {tb.adventure}
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <BenefitCard
            icon={<Star className="w-6 h-6" />}
            title={tb.benefits.createServices.title}
            description={tb.benefits.createServices.description}
          />
          <BenefitCard
            icon={<Trophy className="w-6 h-6" />}
            title={tb.benefits.receiveOrders.title}
            description={tb.benefits.receiveOrders.description}
          />
          <BenefitCard
            icon={<Target className="w-6 h-6" />}
            title={tb.benefits.growActivity.title}
            description={tb.benefits.growActivity.description}
          />
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 text-lg font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            {tb.dashboardButton}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-white/75 text-sm mt-4">
            {t('providerBienvenue.redirect', { 
              count: countdown, 
              plural: countdown > 1 ? 's' : '' 
            })}
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">
            {tb.nextSteps.title}
          </h3>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <span>{tb.nextSteps.step1}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <span>
                {tb.nextSteps.step2}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <span>
                {tb.nextSteps.step3}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/75">{description}</p>
    </div>
  );
}
