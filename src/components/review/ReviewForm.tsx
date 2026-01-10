"use client";

import { useState } from "react";
import { Star, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ orderId, onSuccess, onCancel }: ReviewFormProps) {
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    quality: 0,
    deadline: 0,
  });
  const [hoveredRatings, setHoveredRatings] = useState({
    overall: 0,
    communication: 0,
    quality: 0,
    deadline: 0,
  });
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const ratingCategories = [
    {
      key: "overall",
      label: "Note globale",
      description: "Évaluation générale de votre expérience",
      icon: "⭐",
    },
    {
      key: "communication",
      label: "Communication",
      description: "Réactivité et clarté des échanges",
      icon: "💬",
    },
    {
      key: "quality",
      label: "Qualité du travail",
      description: "Professionnalisme et résultat final",
      icon: "✨",
    },
    {
      key: "deadline",
      label: "Respect des délais",
      description: "Ponctualité de la livraison",
      icon: "⏰",
    },
  ];

  const handleStarClick = (category: string, value: number) => {
    setRatings({ ...ratings, [category]: value });
  };

  const handleStarHover = (category: string, value: number) => {
    setHoveredRatings({ ...hoveredRatings, [category]: value });
  };

  const handleStarLeave = (category: string) => {
    setHoveredRatings({ ...hoveredRatings, [category]: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (ratings.overall === 0) {
      setError("Veuillez donner une note globale");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Votre commentaire doit contenir au moins 10 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          rating_overall: ratings.overall,
          rating_communication: ratings.communication || ratings.overall,
          rating_quality: ratings.quality || ratings.overall,
          rating_deadline: ratings.deadline || ratings.overall,
          title: title.trim() || null,
          comment: comment.trim(),
          reviewer_type: "client",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de l'avis");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Merci pour votre avis !
        </h3>
        <p className="text-gray-600">
          Votre évaluation a été publiée avec succès.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Évaluez votre expérience
        </h2>
        <p className="text-purple-100">
          Votre avis aide les autres clients à faire le bon choix
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Rating Categories */}
        <div className="space-y-5">
          {ratingCategories.map((category) => (
            <div
              key={category.key}
              className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200 hover:border-purple-200 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-semibold text-gray-900">
                      {category.label}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive =
                    star <=
                    (hoveredRatings[category.key as keyof typeof hoveredRatings] ||
                      ratings[category.key as keyof typeof ratings]);

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(category.key, star)}
                      onMouseEnter={() => handleStarHover(category.key, star)}
                      onMouseLeave={() => handleStarLeave(category.key)}
                      className="transition-all duration-200 transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          isActive
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  );
                })}
                {ratings[category.key as keyof typeof ratings] > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {ratings[category.key as keyof typeof ratings]}/5
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de votre avis (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Résumez votre expérience en quelques mots"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre commentaire <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience en détail. Qu'avez-vous particulièrement apprécié ? Y a-t-il des points à améliorer ?"
            rows={6}
            required
            minLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 10 caractères - {comment.length}/500
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || ratings.overall === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publier mon avis
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
