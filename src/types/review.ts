// ============================================================================
// TYPES: Review
// ============================================================================

export interface Review {
  id: string;
  service_id: string;
  user_id: string;
  order_id?: string;
  rating: number; // 1-5
  comment?: string;
  helpful_count: number;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
