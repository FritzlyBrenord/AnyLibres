"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  Briefcase,
  User,
  Award,
  TrendingUp,
} from "lucide-react";

export default function OnboardingModal({ isOpen, onClose }: any) {
  const [checklist, setChecklist] = useState([
    { id: 1, label: "Compléter votre profil", completed: false, icon: User },
    { id: 2, label: "Ajouter votre portfolio", completed: false, icon: Award },
    {
      id: 3,
      label: "Créer votre premier service",
      completed: false,
      icon: Briefcase,
    },
    {
      id: 4,
      label: "Configurer vos tarifs",
      completed: false,
      icon: TrendingUp,
    },
  ]);

  const toggleChecklistItem = (id: any) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercentage = (completedCount / checklist.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="relative bg-linear-to-r from-blue-600 to-purple-600 p-8 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                Bienvenue sur la plateforme !
              </h2>
              <p className="text-blue-100 mt-1">
                Félicitations pour votre inscription
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Guide rapide */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Comment commencer ?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Pour maximiser vos chances de décrocher vos premières missions,
              complétez votre profil et créez votre premier service. Les clients
              recherchent des freelances avec des profils détaillés et des
              services bien définis.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progression du profil
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Checklist de complétion
            </h3>
            <div className="space-y-3">
              {checklist.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      item.completed
                        ? "bg-green-50 border-green-500 shadow-sm"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          item.completed ? "bg-green-100" : "bg-white"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            item.completed ? "text-green-600" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          item.completed
                            ? "text-green-700 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3">
              <User className="w-6 h-6" />
              Compléter mon profil
            </button>

            <button className="w-full bg-white text-gray-700 border-2 border-gray-300 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3">
              <Briefcase className="w-6 h-6" />
              Créer mon premier service
            </button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Je ferai ça plus tard
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Exemple d'utilisation du composant
function App() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Tableau de bord Freelance
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Ouvrir le guide de bienvenue
        </button>

        <OnboardingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
