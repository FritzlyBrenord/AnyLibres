// ============================================================================
// TYPES: API Responses - Types communs pour les réponses API
// ============================================================================

// Réponse API générique
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Réponse paginée
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Réponse API avec pagination
export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  message?: string;
  error?: string;
}