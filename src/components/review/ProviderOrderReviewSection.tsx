"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import ReviewDisplay from "./ReviewDisplay";
import ProviderReviewResponse from "./ProviderReviewResponse";
import { motion } from "framer-motion";

interface ProviderOrderReviewSectionProps {
  orderId: string;
  orderStatus: string;
}

export default function ProviderOrderReviewSection({
  orderId,
  orderStatus,
}: ProviderOrderReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [orderId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?order_id=${orderId}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || "Erreur lors du chargement des avis");
      }
    } catch (err: any) {
      setError("Impossible de charger les avis");
    } finally {
      setLoading(false);
    }
  };

  const clientReview = reviews.find((r) => r.reviewer_type === "client");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Avis du client
        </h2>
        <p className="text-gray-600 mt-1">
          {clientReview
            ? "Le client a laissé un avis sur cette commande"
            : "Le client n'a pas encore laissé d'avis"}
        </p>
      </div>

      {/* Status Messages */}
      {!clientReview && orderStatus !== "completed" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">En attente d'évaluation</p>
            <p className="text-sm text-blue-700 mt-1">
              Le client pourra laisser un avis une fois la commande livrée.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Client Review */}
      {clientReview && (
        <div className="space-y-4">
          {/* Review Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= clientReview.rating_overall
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(clientReview.created_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {clientReview.rating_overall.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">sur 5</p>
              </div>
            </div>

            {/* Review Title */}
            {clientReview.title && (
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                {clientReview.title}
              </h4>
            )}

            {/* Review Comment */}
            <p className="text-gray-700 leading-relaxed mb-4">
              {clientReview.comment}
            </p>

            {/* Detailed Ratings */}
            {(clientReview.rating_communication ||
              clientReview.rating_quality ||
              clientReview.rating_deadline) && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                {clientReview.rating_communication && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Communication</div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">
                        {clientReview.rating_communication}
                      </span>
                    </div>
                  </div>
                )}
                {clientReview.rating_quality && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Qualité</div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">
                        {clientReview.rating_quality}
                      </span>
                    </div>
                  </div>
                )}
                {clientReview.rating_deadline && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Délais</div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">
                        {clientReview.rating_deadline}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provider Response Section */}
            {clientReview.response && !expandedReviewId ? (
              <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-900">
                        Votre réponse
                      </span>
                      {clientReview.response_date && (
                        <span className="text-xs text-blue-700">
                          {new Date(clientReview.response_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {clientReview.response}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {!expandedReviewId && (
                  <button
                    onClick={() => setExpandedReviewId(clientReview.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Répondre à cet avis
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Response Form */}
          {expandedReviewId === clientReview.id && (
            <ProviderReviewResponse
              reviewId={clientReview.id}
              existingResponse={clientReview.response}
              onSuccess={() => {
                setExpandedReviewId(null);
                fetchReviews();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
