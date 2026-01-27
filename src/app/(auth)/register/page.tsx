"use client";
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Award,
  TrendingUp,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useSafeLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [stats, setStats] = useState<any>(null);

  // Password validation state
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const [passwordScore, setPasswordScore] = useState(0);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

  // Check password strength
  useEffect(() => {
    const { password } = formData;
    const criteria = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordCriteria(criteria);

    // Calculate score (0-5)
    const score = Object.values(criteria).filter(Boolean).length;
    setPasswordScore(score);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation stricte
    if (passwordScore < 5) {
      setError(
        "Le mot de passe ne respecte pas tous les critères de sécurité.",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
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
            t?.auth?.register?.form?.errorGeneric ||
            "Une erreur est survenue",
        );
        setLoading(false);
        return;
      }

      window.location.href = "/home";
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        t?.auth?.register?.form?.errorRegister ||
          "Une erreur est survenue lors de l'inscription",
      );
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordScore <= 2) return "bg-red-500";
    if (passwordScore <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordScore <= 2) return "Faible";
    if (passwordScore <= 4) return "Moyen";
    return "Fort";
  };

  return (
    <div className="min-h-screen relative p-0 lg:p-20 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Motif de fond amélioré */}
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
        {/* Section gauche - Avantages de la plateforme */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
          <div className="max-w-xl">
            {/* Logo et nom */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">AnyLibre</h1>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                {t?.auth?.register?.tagline ||
                  "Rejoignez des milliers de freelances et clients qui font confiance à AnyLibre"}
              </p>
            </div>

            {/* Avantages */}
            <div className="space-y-6 mb-12">
              {(
                t?.auth?.register?.benefits || [
                  {
                    title: "Inscription gratuite",
                    desc: "Créez votre compte en quelques minutes et accédez à toutes les fonctionnalités",
                  },
                  {
                    title: "Paiements sécurisés",
                    desc: "Vos transactions sont protégées avec notre système de paiement sécurisé",
                  },
                  {
                    title: "Support 24/7",
                    desc: "Notre équipe est disponible pour vous accompagner à tout moment",
                  },
                  {
                    title: "Projets variés",
                    desc: "Accédez à des milliers de projets dans tous les domaines",
                  },
                ]
              ).map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div
                    className={`w-10 h-10 ${
                      index === 0
                        ? "bg-green-500/20"
                        : index === 1
                          ? "bg-blue-500/20"
                          : index === 2
                            ? "bg-purple-500/20"
                            : "bg-pink-500/20"
                    } rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <Check
                      className={`w-5 h-5 ${
                        index === 0
                          ? "text-green-400"
                          : index === 1
                            ? "text-blue-400"
                            : index === 2
                              ? "text-purple-400"
                              : "text-pink-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Statistiques compactes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats?.providers || "50K+"}
                </div>
                <div className="text-sm text-gray-400">
                  {t?.auth?.register?.stats?.freelances || "Freelances"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats?.projects || "10K+"}
                </div>
                <div className="text-sm text-gray-400">
                  {t?.auth?.register?.stats?.projects || "Projets"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats?.satisfaction || "4.9★"}
                </div>
                <div className="text-sm text-gray-400">
                  {t?.auth?.register?.stats?.satisfaction || "Satisfaction"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire d'inscription */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">AnyLibre</h1>
            </div>

            {/* Carte d'inscription */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {t?.auth?.register?.form?.title || "Créer un compte"}
                </h2>
                <p className="text-gray-300">
                  {t?.auth?.register?.form?.subtitle ||
                    "Rejoignez AnyLibre dès aujourd'hui"}
                </p>
              </div>

              {/* Form Container */}
              <div className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/20 backdrop-blur-sm p-4 border border-red-400/30">
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                )}

                {/* Prénom et Nom sur la même ligne */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-200 mb-2"
                    >
                      {t?.auth?.register?.form?.firstNameLabel || "Prénom"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder={
                          t?.auth?.register?.form?.firstNamePlaceholder ||
                          "Jean"
                        }
                      />
                    </div>
                  </div>

                  {/* Nom */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-200 mb-2"
                    >
                      {t?.auth?.register?.form?.lastNameLabel || "Nom"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        placeholder={
                          t?.auth?.register?.form?.lastNamePlaceholder ||
                          "Dupont"
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    {t?.auth?.register?.form?.emailLabel || "Adresse email"}
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
                        t?.auth?.register?.form?.emailPlaceholder ||
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
                    {t?.auth?.register?.form?.passwordLabel || "Mot de passe"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="block w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder={
                        t?.auth?.register?.form?.passwordPlaceholder ||
                        "••••••••"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="mt-3 space-y-2">
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordScore / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    {t?.auth?.register?.form?.confirmPasswordLabel ||
                      "Confirmer le mot de passe"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="block w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      placeholder={
                        t?.auth?.register?.form?.confirmPasswordPlaceholder ||
                        "••••••••"
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || passwordScore < 5}
                  className="group relative w-full flex items-center justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 mt-6 grayscale disabled:grayscale-0"
                >
                  {loading ? (
                    t?.auth?.register?.form?.submitting ||
                    "Inscription en cours..."
                  ) : (
                    <>
                      {t?.auth?.register?.form?.submitButton || "S'inscrire"}
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
                      {t?.auth?.register?.form?.divider || "ou"}
                    </span>
                  </div>
                </div>

                {/* Link to Login */}
                <div className="text-center">
                  <p className="text-gray-300">
                    {t?.auth?.register?.form?.hasAccount ||
                      "Vous avez déjà un compte ?"}{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {t?.auth?.register?.form?.loginLink || "Se connecter"}
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>
                {t?.auth?.register?.form?.termsText ||
                  "En créant un compte, vous acceptez nos"}{" "}
                <Link
                  href="/terms"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {t?.auth?.register?.form?.termsLink ||
                    "Conditions d'utilisation"}
                </Link>{" "}
                {t?.auth?.register?.form?.andText || "et notre"}{" "}
                <Link
                  href="/privacy"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {t?.auth?.register?.form?.privacyLink ||
                    "Politique de confidentialité"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
