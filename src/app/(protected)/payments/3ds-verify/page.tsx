"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

/**
 * Page de vérification 3D Secure (MODE SIMULATION)
 *
 * En mode mock, cette page simule la vérification 3D Secure
 * En mode production (Stripe/PayPal), l'utilisateur serait redirigé
 * vers la page du provider (Stripe, PayPal, etc.)
 */
export default function ThreeDSecureVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    // Simulation de vérification 3D Secure (2 secondes)
    const verifyTimer = setTimeout(async () => {
      try {
        // Appeler l'API pour finaliser le paiement après 3DS
        const response = await fetch("/api/payments/complete-3ds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
        } else {
          console.error("Erreur finalisation 3DS:", data.error);
          setStatus("error");
        }
      } catch (error) {
        console.error("Erreur vérification 3DS:", error);
        setStatus("error");
      }
    }, 2000);

    return () => clearTimeout(verifyTimer);
  }, [orderId]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      // Redirection après que le countdown soit terminé
      router.push(`/checkout/confirmation/${orderId}`);
    }
  }, [status, countdown, orderId, router]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Erreur de vérification
          </h2>
          <p className="text-slate-600 mb-6">
            Une erreur s'est produite lors de la vérification 3D Secure
          </p>
          <button
            onClick={() => router.push("/services")}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Retour aux services
          </button>
        </div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-purple-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Vérification 3D Secure
          </h2>
          <p className="text-slate-600 mb-6">
            Vérification de votre paiement en cours...
          </p>
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Vérification réussie !
        </h2>
        <p className="text-slate-600 mb-2">
          Votre paiement a été vérifié avec succès
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Redirection dans {countdown} seconde{countdown > 1 ? "s" : ""}...
        </p>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span className="text-sm text-slate-600">Traitement du paiement...</span>
        </div>
      </div>
    </div>
  );
}
