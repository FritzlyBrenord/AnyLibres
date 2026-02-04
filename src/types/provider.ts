// ============================================================================
// TYPES: Provider - Version complète professionnelle
// ============================================================================

// Sous-types pour la structure Provider
export interface Location {
  city?: string;
  country?: string;
  address?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

export interface Language {
  code: string;
  level: 'native' | 'fluent' | 'intermediate' | 'basic';
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description?: string;
  image_url?: string;
  project_url?: string;
  technologies?: string[];
  completed_at?: string;
}

// Type principal Provider avec toutes les informations
export interface ProviderProfile {
  id: string;
  profile_id: string;

  // Relations
  profile?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };

  // Informations professionnelles
  company_name?: string | null;
  profession?: string | null;
  tagline?: string | null;
  about?: string | null;
  experience_years: number | null;

  // Catégories et compétences
  categories: string[];
  skills: string[];

  // Localisation
  location: Location | null;

  // Portfolio
  portfolio: PortfolioItem[];

  // Langues
  languages: Language[];

  // Statistiques et réputation
  rating: number;
  total_reviews: number;
  completed_orders_count: number;
  canceled_orders_count: number;
  response_time_hours: number | null;

  // Tarification
  hourly_rate: number | null;
  starting_price: number | null;

  // Disponibilité et statut
  availability: 'available' | 'busy' | 'offline';
  is_active: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';

  // Métadonnées
  created_at: string;
  updated_at: string | null;
}

// Filtres pour rechercher des providers
export interface ProviderFilters {
  skills?: string[];
  categories?: string[];
  minRating?: number;
  maxHourlyRate?: number;
  availability?: string[];
  languages?: string[];
  location?: string;
  isVerified?: boolean;
  searchQuery?: string;
}

// Props pour les composants
export interface ProviderCardProps {
  provider: ProviderProfile;
  className?: string;
  onClick?: (provider: ProviderProfile) => void;
  showContactButton?: boolean;
}

export interface ProviderListProps {
  providers: ProviderProfile[];
  loading?: boolean;
  onProviderClick?: (provider: ProviderProfile) => void;
  filters?: ProviderFilters;
}

// Types pour les formulaires
export type CreateProviderInput = Omit<
  ProviderProfile,
  'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'completed_orders_count' | 'canceled_orders_count'
>;

export type UpdateProviderInput = Partial<CreateProviderInput>;

// Statistiques détaillées du provider
export interface ProviderStats {
  total_services: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  total_earnings?: number;
  response_rate?: number;
  on_time_delivery_rate?: number;
}