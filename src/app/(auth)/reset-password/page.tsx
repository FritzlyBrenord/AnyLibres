"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export default function ResetPasswordStandardPage() {
  const router = useRouter();
  const { t } = useSafeLanguage();
  const [supabase] = useState(() => createClient());

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is authenticated (session established by callback)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         // If no session, maybe the link expired or flow failed.
         setError(t?.auth?.resetPassword?.errorSession || "Session expirée ou invalide. Veuillez redemander un lien.");
      }
      setCheckingAuth(false);
    };
    checkSession();
  }, [supabase, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError(t?.auth?.resetPassword?.errorMatch || "Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t?.auth?.resetPassword?.errorLength || "Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t?.auth?.resetPassword?.errorGeneric || "Une erreur est survenue");
      }

      setSuccess(true);

      // Rediriger vers la page de connexion apres 3 secondes
      setTimeout(() => {
        router.push("/login?password_reset=true");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t?.auth?.resetPassword?.errorGeneric || "Une erreur est survenue"));
    } finally {
      setLoading(false);
    }
  };

  // Icônes SVG
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

  const LockIcon = () => (
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  const AlertCircleIcon = () => (
    <svg
      className="w-6 h-6 text-red-500"
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
      className="w-4 h-4 ml-2"
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

  const EyeIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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

  // Background component for consistency
  const Background = () => (
    <>
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
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-indigo-500/10 rounded-full blur-3xl" />
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-hidden relative">
        <Background />
      
      <div className="z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-6 transform hover:rotate-3 transition-transform">
                <LockIcon />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
                {t?.auth?.resetPassword?.title || "Nouveau mot de passe"}
            </h2>
            <p className="text-slate-300 text-sm">
                {t?.auth?.resetPassword?.subtitle || "Créez votre nouveau mot de passe sécurisé"}
            </p>
            </div>

            {/* Error Alert */}
            {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <div className="flex-shrink-0 mt-1"><AlertCircleIcon/></div>
                <p className="text-sm text-red-200">{error}</p>
            </div>
            )}

            {/* Success Message */}
            {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <CheckCircleIcon />
                <p className="text-sm text-green-200">
                    {t?.auth?.resetPassword?.successMessage || "Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion..."}
                </p>
            </div>
            )}

            {/* Form */}
            {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200 ml-1"
                >
                    {t?.auth?.resetPassword?.passwordLabel || "Nouveau mot de passe"}
                </label>
                <div className="relative">
                    <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t?.auth?.resetPassword?.passwordPlaceholder || "••••••••"}
                    required
                    disabled={loading || success}
                    minLength={8}
                    className="block w-full h-12 px-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all disabled:opacity-50"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none transition-colors"
                    tabIndex={-1}
                    >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-200 ml-1"
                >
                    {t?.auth?.resetPassword?.confirmPasswordLabel || "Confirmer le mot de passe"}
                </label>
                <div className="relative">
                    <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t?.auth?.resetPassword?.confirmPasswordPlaceholder || "••••••••"}
                    required
                    disabled={loading || success}
                    minLength={8}
                    className="block w-full h-12 px-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all disabled:opacity-50"
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none transition-colors"
                    tabIndex={-1}
                    >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || success}
                className="w-full h-12 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center group"
            >
                {loading ? (
                <>
                    <LoaderIcon />
                    <span className="ml-2">{t?.auth?.resetPassword?.submitting || "Réinitialisation..."}</span>
                </>
                ) : (
                <>
                    {t?.auth?.resetPassword?.submitButton || "Réinitialiser le mot de passe"}
                    <SparklesIcon />
                </>
                )}
            </button>
            </form>
            )}

            {/* Back to Login */}
            <div className="mt-8 text-center">
            <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
            >
                <ArrowLeftIcon />
                <span className="ml-2">{t?.auth?.resetPassword?.backToLogin || "Retour à la connexion"}</span>
            </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
