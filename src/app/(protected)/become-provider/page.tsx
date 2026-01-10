// app/(protected)/become-provider/page.tsx
// Page pour devenir prestataire
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function BecomeProviderPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Rediriger vers la connexion si non authentifié
        router.push("/auth/signin?redirect=/become-provider");
      } else {
        // Rediriger vers l'accueil Provider
        router.push("/Provider/Accueil");
      }
    }
  }, [user, loading, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirection...</p>
      </div>
    </div>
  );
}