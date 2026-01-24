"use client";

import { useEffect, useState } from "react";
import { Shield, LogOut, ChevronDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<{
    admin_id: string;
    impersonated_user: string;
    impersonated_at: string;
    access_token?: string;
    refresh_token?: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession) {
      try {
        const data = JSON.parse(adminSession);
        setImpersonationData(data);
      } catch (error) {
        console.error("Erreur lecture session admin:", error);
      }
    }
  }, []);

  const handleReturnToAdmin = async () => {
    if (!confirm("Voulez-vous retourner à votre session administrateur ?")) {
      return;
    }

    try {
      // Récupérer les tokens admin sauvegardés
      const adminSession = localStorage.getItem("admin_session");
      if (!adminSession) {
        alert("Session administrateur non trouvée");
        return;
      }

      const sessionData = JSON.parse(adminSession);

      if (!sessionData.access_token || !sessionData.refresh_token) {
        console.error("Tokens admin non trouvés");
        localStorage.removeItem("admin_session");
        window.location.href = "/Administrateur";
        return;
      }

      // Créer le client Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Restaurer la session admin avec les tokens sauvegardés
      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      });

      if (error) {
        console.error("Erreur restauration session admin:", error);
        alert("Impossible de restaurer la session administrateur");
        return;
      }

      console.log("[RETURN TO ADMIN] Session restaurée:", data.user?.email);

      // Nettoyer le localStorage
      localStorage.removeItem("admin_session");

      // Rediriger vers la page admin
      window.location.href = "/Admin";
    } catch (error) {
      console.error("Erreur retour admin:", error);
      alert("Erreur lors du retour à la session administrateur");
    }
  };

  if (!impersonationData) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative">
        {/* Bouton compact */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <Shield className="w-4 h-4" />
          <span className="font-semibold text-sm">Mode Admin</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Menu déroulant */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-sm">MODE IMPERSONATION</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Connecté en tant que :
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {impersonationData.impersonated_user}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Depuis :
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(impersonationData.impersonated_at).toLocaleString(
                    "fr-FR",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={handleReturnToAdmin}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Retour à l'admin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay pour fermer le menu */}
      {isOpen && (
        <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
