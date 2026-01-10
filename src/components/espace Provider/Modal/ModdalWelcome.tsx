import React, { useState, useEffect } from "react";
import { Check, Plus, Globe, ArrowRight } from "lucide-react";

// Composant Confetti personnalisé
const Confetti = () => {
  // Générer des confettis avec différentes couleurs et positions
  const confettiCount = 50;
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(confettiCount)].map((_, i) => {
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 3;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            className="absolute top-0 animate-confetti"
            style={{
              left: `${left}%`,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              backgroundColor: color,
              animationDelay: `${animationDelay}s`,
              opacity: Math.random() * 0.6 + 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

const WelcomeModal = ({
  formData,
  showWelcomeModal,
  setShowWelcomeModal,
}: any) => {
  const [animateIn, setAnimateIn] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation d'entrée lors du montage
  useEffect(() => {
    if (showWelcomeModal) {
      setTimeout(() => setAnimateIn(true), 10);
      setShowConfetti(true);

      // Masquer les confettis après un certain temps
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showWelcomeModal]);

  // Gestion de la fermeture avec animation
  const closeModal = (callback: any) => {
    setAnimateOut(true);
    setTimeout(() => {
      setAnimateOut(false);
      setAnimateIn(false);
      setShowWelcomeModal(false);
      if (callback) callback();
    }, 300);
  };

  const handlePublishService = () => {
    closeModal(() => {
      console.log("Rediriger vers la page de publication");
    });
  };

  const handleMaybeLater = () => {
    closeModal(() => {
      console.log("Fermer le modal");
    });
  };

  const handleViewGuide = () => {
    closeModal(() => {
      // Navigation vers le guide
      console.log("Rediriger vers le guide d'utilisation");
    });
  };

  if (!showWelcomeModal) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300 ${
        animateIn ? "bg-black/30" : "bg-black/0"
      } ${animateOut ? "bg-black/0" : ""}`}
    >
      {showConfetti && <Confetti />}
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden transition-all duration-300 ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-8"
        } ${animateOut ? "opacity-0 scale-95 translate-y-8" : ""}`}
      >
        {/* Élément décoratif en arrière-plan */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-linear-to-br from-green-300 to-blue-300 opacity-10 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-linear-to-tr from-purple-300 to-pink-300 opacity-10 -ml-16 -mb-16"></div>

        {/* Header avec icône de succès animée */}
        <div className="text-center mb-6 relative">
          <div className="w-20 h-20 bg-linear-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-r from-green-400/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="animate-bounce-subtle">
              <Check className="text-green-600" size={40} strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 border-4 border-white rounded-full opacity-30"></div>
          </div>

          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-blue-600 mb-2">
            Bienvenue sur Anylibre ! 🎉
          </h2>

          <p className="text-xl text-gray-700 font-medium">
            {formData?.firstName || "Prénom"} {formData?.lastName || "Nom"}
          </p>
        </div>

        {/* Message */}
        <div className="bg-linear-to-r from-blue-50 to-green-50 p-5 rounded-xl mb-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-gray-700 text-center font-medium">
            Votre profil freelance a été créé avec succès ! Commencez dès
            maintenant à publier vos services.
          </p>
        </div>

        {/* Actions avec animations au survol */}
        <div className="space-y-3">
          {/* Publier un service maintenant */}
          <button
            onClick={() =>
              (window.location.href = "/TableauDeBord/Service/Nouveau")
            }
            className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md group"
          >
            <div className="mr-2 transition-transform duration-300 group-hover:scale-110">
              <Plus size={20} />
            </div>
            <span>Publier un service maintenant</span>
            <ArrowRight
              className="ml-2 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
              size={18}
            />
          </button>

          {/* Peut-être plus tard */}
          <button
            onClick={() => (window.location.href = "/TableauDeBord")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-medium transition-all duration-300 hover:shadow-sm"
          >
            Peut-être plus tard
          </button>

          {/* Guide d'utilisation */}
          <button
            onClick={handleViewGuide}
            className="w-full border-2 border-blue-400 text-blue-600 hover:bg-blue-50 py-3.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center hover:border-blue-500 hover:shadow-sm group"
          >
            <Globe
              className="mr-2 transition-transform duration-300 group-hover:rotate-12"
              size={18}
            />
            <span>Comment utiliser Anylibre ?</span>
          </button>
        </div>

        {/* Footer info avec style amélioré */}
        <div className="mt-6 bg-gray-50 py-3 px-4 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Vous pouvez toujours publier des services plus tard depuis votre
            <span className="font-medium text-gray-600"> tableau de bord</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
