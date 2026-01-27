"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Award,
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useSafeLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        t?.auth?.login?.form?.successMessage ||
          "Compte créé avec succès ! Vous pouvez maintenant vous connecter."
      );
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(
          data.error ||
            t?.auth?.login?.form?.errorGeneric ||
            "Une erreur est survenue"
        );
        setLoading(false);
        return;
      }

      window.location.href = "/home";
    } catch (err) {
      console.error("Login error:", err);
      setError(
        t?.auth?.login?.form?.errorLogin ||
          "Une erreur est survenue lors de la connexion"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden p-0 lg:p-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Motif de fond amélioré */}
      <div className="absolute inset-0 opacity-10 ">
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

      <div className="relative min-h-screen flex">
        {/* Section gauche - Informations de la plateforme */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
          <div className="">
            {/* Logo et nom */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">AnyLibre</h1>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                {t?.auth?.login?.tagline ||
                  "La plateforme qui connecte les talents aux opportunités"}
              </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {stats?.providers || "50K+"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t?.auth?.login?.stats?.freelances || "Freelances actifs"}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {stats?.projects || "10K+"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t?.auth?.login?.stats?.projects || "Projets réalisés"}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {stats?.satisfaction || "4.9/5"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t?.auth?.login?.stats?.satisfaction || "Satisfaction client"}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {stats?.successRate || "98%"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t?.auth?.login?.stats?.successRate || "Taux de succès"}
                </p>
              </div>
            </div>

            {/* Témoignages */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <p className="text-gray-300 mb-2 italic">
                    "
                    {t?.auth?.login?.testimonial?.text ||
                      "AnyLibre m'a permis de trouver des missions en parfait accord avec mes compétences. Interface intuitive et clients sérieux !"}
                    "
                  </p>
                  <p className="text-sm text-gray-400">
                    {t?.auth?.login?.testimonial?.author ||
                      "Marie L. - Designer UI/UX"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire de connexion */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">AnyLibre</h1>
            </div>

            {/* Carte de connexion */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {t?.auth?.login?.form?.title || "Bon retour !"}
                </h2>
                <p className="text-gray-300">
                  {t?.auth?.login?.form?.subtitle ||
                    "Connectez-vous pour accéder à votre espace"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {successMessage && (
                  <div className="rounded-xl bg-green-500/20 backdrop-blur-sm p-4 border border-green-400/30">
                    <p className="text-sm text-green-100">{successMessage}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/20 backdrop-blur-sm p-4 border border-red-400/30">
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    {t?.auth?.login?.form?.emailLabel || "Adresse email"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder={
                        t?.auth?.login?.form?.emailPlaceholder ||
                        "jean.dupont@example.com"
                      }
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    {t?.auth?.login?.form?.passwordLabel || "Mot de passe"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder={
                        t?.auth?.login?.form?.passwordPlaceholder || "••••••••"
                      }
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t?.auth?.login?.form?.forgotPassword ||
                      "Mot de passe oublié ?"}
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  {loading ? (
                    t?.auth?.login?.form?.submitting || "Connexion en cours..."
                  ) : (
                    <>
                      {t?.auth?.login?.form?.submitButton || "Se connecter"}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-gray-400">
                      {t?.auth?.login?.form?.divider || "ou"}
                    </span>
                  </div>
                </div>

                {/* Link to Register */}
                <div className="text-center">
                  <p className="text-gray-300">
                    {t?.auth?.login?.form?.noAccount ||
                      "Vous n'avez pas de compte ?"}{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {t?.auth?.login?.form?.createAccount || "Créer un compte"}
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Footer links */}
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>
                {t?.auth?.login?.form?.termsText ||
                  "En vous connectant, vous acceptez nos"}{" "}
                <Link
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {t?.auth?.login?.form?.termsLink ||
                    "Conditions d'utilisation"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
