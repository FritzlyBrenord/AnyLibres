"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/HeaderProvider";
import {
  Star,
  TrendingUp,
  MessageSquare,
  User,
  Calendar,
  Filter,
  Search,
  Award,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ProviderReviewResponse from "@/components/review/ProviderReviewResponse";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

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
  reviewer?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  order?: {
    id: string;
    service_title: string;
    service_id?: string;
  };
}

interface Stats {
  total_reviews: number;
  average_rating: number;
  average_communication: number;
  average_quality: number;
  average_deadline: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  with_response: number;
  without_response: number;
}

export default function ProviderReviewsPage() {
  const { t, language } = useSafeLanguage();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterResponse, setFilterResponse] = useState<
    "all" | "responded" | "pending"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/providers/reviews");
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || t.reviewsPage.error.fetch);
      }
    } catch (err: any) {
      setError(t.reviewsPage.error.generic);
    } finally {
      setLoading(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    // Filter by rating
    if (filterRating && review.rating_overall !== filterRating) return false;

    // Filter by response status
    if (filterResponse === "responded" && !review.response) return false;
    if (filterResponse === "pending" && review.response) return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesComment = review.comment.toLowerCase().includes(search);
      const matchesTitle = review.title?.toLowerCase().includes(search);
      const matchesService = review.order?.service_title
        .toLowerCase()
        .includes(search);
      const matchesReviewer =
        review.reviewer?.display_name?.toLowerCase().includes(search) ||
        review.reviewer?.first_name?.toLowerCase().includes(search) ||
        review.reviewer?.last_name?.toLowerCase().includes(search);

      if (!matchesComment && !matchesTitle && !matchesService && !matchesReviewer)
        return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {t.reviewsPage.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl mt-20">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              {t.reviewsPage.title}
            </h1>
          </div>
          <p className="text-gray-600 ml-15">
            {t.reviewsPage.subtitle}
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics Section */}
        {stats && stats.total_reviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Overall Rating */}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 opacity-80" />
                  <div className="text-5xl font-bold">
                    {stats.average_rating.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.average_rating)
                          ? "fill-yellow-300 text-yellow-300"
                          : "text-white/40"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-purple-100 text-sm">
                  {t.reviewsPage.stats.averageRating.subtitle.replace('{count}', stats.total_reviews.toString())}
                </p>
              </div>

              {/* Total Reviews */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.total_reviews}
                </div>
                <p className="text-gray-600 text-sm">{t.reviewsPage.stats.totalReviews.title}</p>
              </div>

              {/* Response Rate */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.round((stats.with_response / stats.total_reviews) * 100)}%
                </div>
                <p className="text-gray-600 text-sm">
                  {t.reviewsPage.stats.responseRate.title} ({stats.with_response}/{stats.total_reviews})
                </p>
              </div>

              {/* Pending Responses */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  {stats.without_response > 0 && (
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {stats.without_response}
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.without_response}
                </div>
                <p className="text-gray-600 text-sm">{t.reviewsPage.stats.pendingResponse.title}</p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  {t.reviewsPage.stats.distribution.title}
                </h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
                    const percentage =
                      stats.total_reviews > 0
                        ? (count / stats.total_reviews) * 100
                        : 0;

                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm font-medium text-gray-700">
                            {rating}
                          </span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: rating * 0.1 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-end px-2"
                          >
                            {count > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {count}
                              </span>
                            )}
                          </motion.div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Criteria Ratings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  {t.reviewsPage.stats.criteria.title}
                </h3>
                <div className="space-y-4">
                  <CriteriaBar
                    label={t.reviewsPage.stats.criteria.communication}
                    value={stats.average_communication}
                    icon="💬"
                  />
                  <CriteriaBar
                    label={t.reviewsPage.stats.criteria.quality}
                    value={stats.average_quality}
                    icon="✨"
                  />
                  <CriteriaBar
                    label={t.reviewsPage.stats.criteria.deadline}
                    value={stats.average_deadline}
                    icon="⏰"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">{t.reviewsPage.filters.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.reviewsPage.filters.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Filter by Rating */}
              <select
                value={filterRating || ""}
                onChange={(e) =>
                  setFilterRating(e.target.value ? Number(e.target.value) : null)
                }
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="">{t.reviewsPage.filters.rating.all}</option>
                <option value="5">⭐⭐⭐⭐⭐ ({t.reviewsPage.filters.rating.stars.replace('{count}', '5')})</option>
                <option value="4">⭐⭐⭐⭐ ({t.reviewsPage.filters.rating.stars.replace('{count}', '4')})</option>
                <option value="3">⭐⭐⭐ ({t.reviewsPage.filters.rating.stars.replace('{count}', '3')})</option>
                <option value="2">⭐⭐ ({t.reviewsPage.filters.rating.stars.replace('{count}', '2')})</option>
                <option value="1">⭐ ({t.reviewsPage.filters.rating.stars.replace('{count}', '1')})</option>
              </select>

              {/* Filter by Response */}
              <select
                value={filterResponse}
                onChange={(e) =>
                  setFilterResponse(e.target.value as "all" | "responded" | "pending")
                }
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="all">{t.reviewsPage.filters.response.all}</option>
                <option value="responded">{t.reviewsPage.filters.response.responded}</option>
                <option value="pending">{t.reviewsPage.filters.response.pending}</option>
              </select>
            </div>

            {/* Active Filters */}
            {(filterRating || filterResponse !== "all" || searchTerm) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">{t.reviewsPage.filters.activeFilters}</span>
                {filterRating && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1">
                    {t.reviewsPage.filters.rating.stars.replace('{count}', filterRating.toString())}
                    <button
                      onClick={() => setFilterRating(null)}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterResponse !== "all" && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1">
                    {filterResponse === "responded"
                      ? t.reviewsPage.filters.response.responded
                      : t.reviewsPage.filters.response.pending}
                    <button
                      onClick={() => setFilterResponse("all")}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1">
                    "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterRating || filterResponse !== "all"
                  ? t.reviewsPage.empty.filtered.title
                  : t.reviewsPage.empty.none.title}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterRating || filterResponse !== "all"
                  ? t.reviewsPage.empty.filtered.subtitle
                  : t.reviewsPage.empty.none.subtitle}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredReviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={index}
                  isExpanded={expandedReviewId === review.id}
                  onToggleExpand={() =>
                    setExpandedReviewId(
                      expandedReviewId === review.id ? null : review.id
                    )
                  }
                  onResponseSuccess={fetchReviews}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

// Criteria Bar Component
function CriteriaBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {value.toFixed(1)}/5
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 5) * 100}%` }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
        />
      </div>
    </div>
  );
}

// Review Card Component
function ReviewCard({
  review,
  index,
  isExpanded,
  onToggleExpand,
  onResponseSuccess,
}: {
  review: Review;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onResponseSuccess: () => void;
}) {
  const router = useRouter();
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
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="p-6">
        {/* Review Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {review.reviewer?.avatar_url ? (
                <Image
                  src={review.reviewer.avatar_url}
                  alt={reviewerName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {reviewerName}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(review.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.rating_overall
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {review.rating_overall.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Service Info */}
              {review.order && (
                <button
                  onClick={() => router.push(`/Provider/TableauDeBord/Order/${review.order?.id}`)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors mb-3"
                >
                  <Package className="w-4 h-4" />
                  {review.order.service_title}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}

              {/* Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h5>
              )}

              {/* Comment */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Detailed Ratings */}
              {(review.rating_communication ||
                review.rating_quality ||
                review.rating_deadline) && (
                <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-xl">
                  {review.rating_communication && (
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Communication
                      </div>
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

              {/* Response Status */}
              {review.response ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-900">
                          Votre réponse
                        </span>
                        {review.response_date && (
                          <span className="text-xs text-blue-700">
                            {new Date(review.response_date).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {review.response}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onToggleExpand}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Répondre à cet avis
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Response Form */}
        <AnimatePresence>
          {isExpanded && !review.response && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <ProviderReviewResponse
                reviewId={review.id}
                existingResponse={review.response}
                onSuccess={() => {
                  onToggleExpand();
                  onResponseSuccess();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
