// ============================================================================
// Component: ProviderReviews - Avis sur le provider
// ============================================================================

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Review, ReviewStats } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface ProviderReviewsProps {
  reviews: (Review & {
    reviewer?: {
      user_id: string;
      display_name?: string;
      avatar_url?: string;
      first_name?: string;
      last_name?: string;
    };
    service?: {
      id: string;
      title: any;
    };
  })[];
  stats: ReviewStats & {
    average_communication?: number;
    average_quality?: number;
    average_deadline?: number;
  };
}

export default function ProviderReviews({ reviews, stats }: ProviderReviewsProps) {
  const { t, getText } = useLanguage();

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 w-8">{rating}★</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Avis clients ({stats.total_reviews})
      </h2>

      {/* Statistiques globales */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
        {/* Note moyenne */}
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {stats.average_rating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(stats.average_rating))}
          </div>
          <div className="text-sm text-gray-600">
            {stats.total_reviews} {t.reviews.totalReviews}
          </div>
        </div>

        {/* Distribution des notes */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating}>
              {renderRatingBar(
                rating,
                stats.rating_distribution[rating as keyof typeof stats.rating_distribution]
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t.reviews.noReviews}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="pb-6 border-b last:border-b-0">
              {/* En-tête de l'avis */}
              <div className="flex items-start gap-4 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {review.reviewer?.avatar_url ? (
                    <Image
                      src={review.reviewer.avatar_url}
                      alt={review.reviewer.display_name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold">
                      {review.reviewer?.display_name?.charAt(0).toUpperCase() ||
                       review.reviewer?.first_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.reviewer?.display_name ||
                         `${review.reviewer?.first_name || ''} ${review.reviewer?.last_name || ''}`.trim() ||
                         'Utilisateur anonyme'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating_overall || review.rating || 0)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Service concerné */}
                  {review.service && (
                    <Link
                      href={`/service/${review.service.id}`}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Service: {getText(review.service.title)}
                    </Link>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              {review.comment && (
                <p className="text-gray-700 leading-relaxed ml-14">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}