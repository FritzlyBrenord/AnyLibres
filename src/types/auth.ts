// ============================================================================
// TYPES: Authentication
// ============================================================================

import { CurrencyCode } from './service';

export type RoleEnum = 'client' | 'provider' | 'admin' | string;
export type LocaleCode = 'fr' | 'en' | 'es';

export interface NotificationSettings {
  emailOrders: boolean;
  pushEnabled: boolean;
  emailMessages: boolean;
  emailPromotions: boolean;
}

export interface Preferences {
  darkMode: boolean;
  compactView: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: RoleEnum;
  bio: string | null;
  phone: string | null;
  locale: LocaleCode;
  currency: CurrencyCode;
  is_verified: boolean;
  is_active: boolean;
  notification_settings: NotificationSettings;
  preferences: Preferences;
  created_at: string;
  updated_at: string;
}

// Types pour l'inscription
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
}

// Types pour la connexion
export interface LoginData {
  email: string;
  password: string;
}

// Types pour les réponses
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: Profile;
}