// ============================================================================
// TYPES: Service - Version complète professionnelle
// ============================================================================

import { ProviderProfile } from './provider';

export interface MultiLangText {
  fr?: string;
  en?: string;
  es?: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'HTG';
export type ServiceVisibility = 'public' | 'draft' | 'hidden';
export type ServiceStatus = 'draft' | 'published' | 'archived';

// ============================================================================
// CONFIGURATION DES FRAIS DE PLATEFORME (Platform Fees)
// ============================================================================

/**
 * Configuration des frais de plateforme pour un service
 * Permet une gestion dynamique des frais selon le service, la catégorie, etc.
 */
export interface PlatformFeeConfig {
  /**
   * Pourcentage de frais appliqué (par défaut: 5%)
   * Exemples: 2, 3, 5, 10
   */
  fee_percentage: number;

  /**
   * Type de frais
   * - 'percentage': Pourcentage du montant total
   * - 'fixed': Montant fixe en centimes
   * - 'hybrid': Combinaison des deux
   */
  fee_type: 'percentage' | 'fixed' | 'hybrid';

  /**
   * Montant fixe des frais (en centimes) si fee_type = 'fixed' ou 'hybrid'
   */
  fixed_amount_cents?: number;

  /**
   * Montant minimum de frais (en centimes)
   * Exemple: Si frais calculés < 50 centimes, appliquer 50 centimes minimum
   */
  min_fee_cents?: number;

  /**
   * Montant maximum de frais (en centimes)
   * Exemple: Plafonner les frais à 5000 centimes (50€)
   */
  max_fee_cents?: number;

  /**
   * Qui paie les frais?
   * - 'client': Le client paie les frais (ajouté au total)
   * - 'provider': Le prestataire paie les frais (déduit de son paiement)
   * - 'split': Partagé 50/50
   */
  paid_by: 'client' | 'provider' | 'split';
}

/**
 * Configuration des frais par défaut de la plateforme
 */
export const DEFAULT_PLATFORM_FEE: PlatformFeeConfig = {
  fee_percentage: 5,
  fee_type: 'percentage',
  paid_by: 'client',
  min_fee_cents: 50, // 0.50€ minimum
  max_fee_cents: undefined, // Pas de maximum par défaut
};

export enum ServiceVisibilityEnum {
  PUBLIC = 'public',
  DRAFT = 'draft',
  HIDDEN = 'hidden',
}

// Sous-types pour Service
export interface ServiceExtra {
  id: string;
  title: MultiLangText;
  description?: MultiLangText;
  price_cents: number;
  currency?: CurrencyCode;
  delivery_time_days?: number;
}

export interface FAQItem {
  id: string;
  question: MultiLangText;
  answer: MultiLangText;
}

export interface Requirement {
  id: string;
  description: MultiLangText;
  required: boolean;
}

// Type principal Service
// Dans vos types, assurez-vous d'avoir :
export interface Service {
  id: string;
  provider_id: string;
  title: any; // ou { fr: string; en: string; }
  short_description?: any;
  description?: any;
  base_price_cents: number;
  currency: string;
  price_min_cents?: number;
  price_max_cents?: number;
  delivery_time_days: number;
  revisions_included: number;
  max_revisions?: number;
  extras?: Array<{
    title: string;
    price_cents: number;
    delivery_additional_days: number;
  }>;
  cover_image?: string;
  images: string[];
  categories: string[];
  tags: string[];
  popularity: number;
  rating: number;
  reviews_count: number;
  views_count: number;
  orders_count: number;
  cancel_rate: number;
  visibility: string;
  status: string;
  faq?: Array<{
    question: any;
    answer: any;
  }>;
  location_type?: string[];
  requirements?: Array<{
    id: string;
    type: 'text' | 'file' | 'url';
    description: MultiLangText;
    required: boolean;
  }>;

  /**
   * Configuration des frais de plateforme pour ce service
   * Si absent, utilise DEFAULT_PLATFORM_FEE
   */
  platform_fee_config?: PlatformFeeConfig;
  provider?: {
    id: string;
    about?: string;
    rating: number;
    skills: string[];
    profile: {
      id: string;
      bio: string;
      email: string;
      location: string;
      username?: string;
      last_name: string;
      avatar_url?: string;
      first_name: string;
    };
    tagline: string;
    location: {
      city: string;
      region: string;
      country: string;
      section: string;
    };
    languages: Array<{
      code: string;
      level: string;
    }>;
    portfolio: any[];
    categories: string[];
    profession: string;
    hourly_rate: number;
    is_verified: boolean;
    availability: string;
    company_name: string;
    total_reviews: number;
    starting_price: number;
    experience_years: number;
    response_time_hours: number;
    completed_orders_count: number;
  };
  created_at: string;
  updated_at: string;
}

// Filtres pour rechercher des services
export interface ServiceFilters {
  categories?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  deliveryTime?: number;
  searchQuery?: string;
  providerId?: string;
  visibility?: ServiceVisibility;
}

// Props pour les composants
export interface ServiceCardProps {
  service: Service;
  provider?: ProviderProfile;
  className?: string;
  onClick?: (service: Service) => void;
  showProviderInfo?: boolean;
  locale?: string;
}

export interface ServiceListProps {
  services: Service[];
  loading?: boolean;
  onServiceClick?: (service: Service) => void;
  filters?: ServiceFilters;
}

// Types pour les formulaires
export type CreateServiceInput = Omit<
  Service,
  'id' | 'created_at' | 'updated_at' | 'popularity' | 'rating' | 'reviews_count' | 'views_count' | 'orders_count' | 'cancel_rate'
>;

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface ServiceFormData {
  title: MultiLangText;
  short_description: MultiLangText;
  description: MultiLangText;
  base_price_cents: number;
  currency: CurrencyCode;
  delivery_time_days: number;
  revisions_included: number;
  categories: string[];
  tags: string[];
  cover_image?: string;
  images: string[];
  extras: ServiceExtra[];
  faq: FAQItem[];
  requirements: Requirement[];
}