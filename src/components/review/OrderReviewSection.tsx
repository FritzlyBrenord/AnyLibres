"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react";
import ReviewForm from "./ReviewForm";
import ReviewDisplay from "./ReviewDisplay";
import { motion, AnimatePresence } from "framer-motion";

interface OrderReviewSectionProps {
  orderId: string;
  orderStatus: string;
  isClient: boolean; // true if current user is the client
}

export default function OrderReviewSection({
  orderId,
  orderStatus,
  isClient,
}: OrderReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const canReview =
    isClient &&
    (orderStatus === "delivered" || orderStatus === "completed") &&
    !hasReviewed;

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

        // Check if current user has already reviewed
        if (isClient) {
          const userReview = data.reviews?.find(
            (r: any) => r.reviewer_type === "client"
          );
          setHasReviewed(!!userReview);
        }
      } else {
        setError(data.error || "Erreur lors du chargement des avis");
      }
    } catch (err: any) {
      setError("Impossible de charger les avis");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setHasReviewed(true);
    fetchReviews();
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Avis et évaluations
          </h2>
          <p className="text-gray-600 mt-1">
            {reviews.length > 0
              ? `${reviews.length} ${reviews.length > 1 ? "avis" : "avis"}`
              : "Aucun avis pour le moment"}
          </p>
        </div>

        {/* Review Button (only for clients who haven't reviewed yet) */}
        {canReview && !showReviewForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReviewForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Star className="w-5 h-5" />
            Laisser un avis
          </motion.button>
        )}
      </div>

      {/* Status Messages */}
      {!canReview && isClient && orderStatus !== "completed" && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900">
              Évaluation non disponible
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Vous pourrez laisser un avis une fois la commande livrée.
            </p>
          </div>
        </div>
      )}

      {hasReviewed && isClient && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Merci pour votre avis !
            </p>
            <p className="text-sm text-green-700 mt-1">
              Votre évaluation a été publiée avec succès.
            </p>
          </div>
        </div>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ReviewForm
              orderId={orderId}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowReviewForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Reviews Display */}
      {!showReviewForm && <ReviewDisplay reviews={reviews} showAllRatings />}
    </div>
  );
}
