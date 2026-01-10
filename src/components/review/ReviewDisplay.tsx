"use client";

import { useState } from "react";
import { Star, ThumbsUp, MessageSquare, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Review {
  id: string;
  rating_overall: number;
  rating_communication?: number;
  rating_quality?: number;
  rating_deadline?: number;
  title?: string;
  comment: string;
  response?: string;
  response_date?: string;
  created_at: string;
  is_visible: boolean;
  reviewer?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface ReviewDisplayProps {
  reviews: Review[];
  showAllRatings?: boolean;
}

export default function ReviewDisplay({
  reviews,
  showAllRatings = false,
}: ReviewDisplayProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun avis pour le moment
        </h3>
        <p className="text-gray-600">
          Soyez le premier à partager votre expérience !
        </p>
      </div>
    );
  }

  // Calculate average ratings
  const avgOverall =
    reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length;
  const avgCommunication = showAllRatings
    ? reviews.reduce((sum, r) => sum + (r.rating_communication || 0), 0) /
      reviews.length
    : 0;
  const avgQuality = showAllRatings
    ? reviews.reduce((sum, r) => sum + (r.rating_quality || 0), 0) /
      reviews.length
    : 0;
  const avgDeadline = showAllRatings
    ? reviews.reduce((sum, r) => sum + (r.rating_deadline || 0), 0) /
      reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {avgOverall.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(avgOverall)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {reviews.length} {reviews.length > 1 ? "avis" : "avis"}
            </p>
          </div>

          {showAllRatings && (
            <div className="flex-1 space-y-3">
              <RatingBar
                label="Communication"
                value={avgCommunication}
                icon="💬"
              />
              <RatingBar label="Qualité" value={avgQuality} icon="✨" />
              <RatingBar
                label="Respect des délais"
                value={avgDeadline}
                icon="⏰"
              />
            </div>
          )}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} index={index} />
        ))}
      </div>
    </div>
  );
}

function RatingBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">
            {value.toFixed(1)}/5
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [showResponse, setShowResponse] = useState(true);

  const reviewerName =
    review.reviewer?.display_name ||
    `${review.reviewer?.first_name || ""} ${
      review.reviewer?.last_name || ""
    }`.trim() ||
    "Client anonyme";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
    >
      {/* Review Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {review.reviewer?.avatar_url ? (
            <Image
              src={review.reviewer.avatar_url}
              alt={reviewerName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">{reviewerName}</h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating_overall
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(review.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
      )}

      {/* Review Comment */}
      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

      {/* Detailed Ratings */}
      {(review.rating_communication ||
        review.rating_quality ||
        review.rating_deadline) && (
        <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-xl">
          {review.rating_communication && (
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Communication</div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">
                  {review.rating_communication}
                </span>
              </div>
            </div>
          )}
          {review.rating_quality && (
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Qualité</div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">
                  {review.rating_quality}
                </span>
              </div>
            </div>
          )}
          {review.rating_deadline && (
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Délais</div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">
                  {review.rating_deadline}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provider Response */}
      {review.response && showResponse && (
        <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Réponse du prestataire
                </span>
                {review.response_date && (
                  <span className="text-xs text-blue-700">
                    {new Date(review.response_date).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">
                {review.response}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
