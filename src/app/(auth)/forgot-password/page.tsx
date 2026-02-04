"use client";

import { useState } from "react";
import Link from "next/link";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export default function ForgotPasswordPage() {
  const { t } = useSafeLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t?.auth?.forgotPassword?.errorGeneric || "Une erreur est survenue");
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : (t?.auth?.forgotPassword?.errorGeneric || "Une erreur est survenue"));
    } finally {
      setLoading(false);
    }
  };

  // Icônes SVG
  const MailIcon = () => (
    <svg
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const LoaderIcon = () => (
    <svg
      className="animate-spin h-5 w-5 text-slate-900"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const AlertCircleIcon = () => (
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg
      className="w-5 h-5 text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );

  const SparklesIcon = () => (
    <svg 
      className="w-4 h-4 ml-2" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      
       {/* Fond animé / Textures */}
       <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Effets lumineux */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Card Glassmorphism */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-6 transform rotate-3 hover:rotate-6 transition-transform">
              <MailIcon />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              {t?.auth?.forgotPassword?.title || "Mot de passe oublié ?"}
            </h2>
            <p className="text-slate-300">
              {t?.auth?.forgotPassword?.subtitle || "Entrez votre email pour recevoir le lien de réinitialisation."}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
              <AlertCircleIcon />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
              <CheckCircleIcon />
              <p className="text-sm text-green-200">
                {t?.auth?.forgotPassword?.successMessage || "Email envoyé avec succès ! Vérifiez votre boîte mail (et vos spams)."}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200 ml-1"
              >
                {t?.auth?.forgotPassword?.emailLabel || "Adresse email"}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t?.auth?.forgotPassword?.emailPlaceholder || "jean.dupont@example.com"}
                required
                disabled={loading}
                className="block w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center group"
            >
              {loading ? (
                <>
                  <LoaderIcon />
                  <span className="ml-2">{t?.auth?.forgotPassword?.submitting || "Envoi en cours..."}</span>
                </>
              ) : (
                <>
                  {t?.auth?.forgotPassword?.submitButton || "Envoyer le lien"}
                  <SparklesIcon />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
            >
              <ArrowLeftIcon />
              <span className="ml-2">{t?.auth?.forgotPassword?.backToLogin || "Retour à la connexion"}</span>
            </Link>
          </div>
        </div>
        
        {/* Copyright discret */}
        <p className="text-center text-slate-500 text-xs mt-8">
            © {new Date().getFullYear()} AnyLibre. Sécurisé & Confidentiel.
        </p>
      </div>
    </div>
  );
}
