-- =====================================================
-- MIGRATION INITIALE: AnyLibre Database Schema
-- Date: 2025-01-26
-- Description: Schema complet pour marketplace freelance
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'CAD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('client', 'provider', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_visibility AS ENUM ('public', 'private', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('order', 'message', 'review', 'system', 'payment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  email TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  role role_enum NOT NULL DEFAULT 'client',
  locale TEXT DEFAULT 'fr',
  currency currency_code DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  notification_settings JSONB DEFAULT '{"emailOrders": true, "pushEnabled": false, "emailMessages": true, "emailPromotions": true}',
  preferences JSONB DEFAULT '{"darkMode": false, "compactView": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_username_key UNIQUE (username)
);

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  icon TEXT,
  image_url TEXT,
  services_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_key_key UNIQUE (key)
);

-- =====================================================
-- TABLE: currencies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.currencies (
  code currency_code NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  rate_to_usd NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT currencies_pkey PRIMARY KEY (code)
);

-- =====================================================
-- TABLE: providers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  company_name TEXT,
  profession TEXT,
  tagline TEXT,
  about TEXT,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages JSONB DEFAULT '[{"code": "fr", "level": "native"}]',
  portfolio JSONB DEFAULT '[]',
  location JSONB DEFAULT '{}',
  availability TEXT DEFAULT 'available',
  verification_status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  experience_years INTEGER,
  starting_price NUMERIC,
  hourly_rate NUMERIC,
  response_time_hours INTEGER,
  completed_orders_count INTEGER DEFAULT 0,
  canceled_orders_count INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT providers_pkey PRIMARY KEY (id),
  CONSTRAINT providers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: services
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  title JSONB NOT NULL,
  description JSONB,
  short_description JSONB,
  base_price_cents BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL DEFAULT 'USD',
  price_min_cents BIGINT,
  price_max_cents BIGINT,
  delivery_time_days INTEGER,
  revisions_included INTEGER DEFAULT 1,
  max_revisions INTEGER,
  extras JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'published',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  cover_image TEXT,
  categories UUID[] DEFAULT ARRAY[]::UUID[],
  popularity BIGINT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count BIGINT DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  orders_count BIGINT DEFAULT 0,
  cancel_rate NUMERIC DEFAULT 0,
  visibility service_visibility NOT NULL DEFAULT 'public',
  faq JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  total_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  message TEXT,
  delivery_deadline TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT orders_total_cents_check CHECK (total_cents >= 0)
);

COMMENT ON COLUMN public.orders.status IS 'pending | paid | in_progress | delivered | revision_requested | completed | cancelled | refunded';
COMMENT ON COLUMN public.orders.payment_status IS 'pending | processing | succeeded | failed | refunded | cancelled';

-- =====================================================
-- TABLE: order_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  service_id UUID NOT NULL,
  title TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal_cents BIGINT NOT NULL,
  selected_extras JSONB DEFAULT '[]',

  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_subtotal_cents_check CHECK (subtotal_cents >= 0)
);

-- =====================================================
-- TABLE: order_deliveries
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  external_link TEXT,
  message TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT order_deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_deliveries_file_size_check CHECK (file_size_bytes >= 0)
);

-- =====================================================
-- TABLE: order_revisions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_id UUID,
  revision_number INTEGER NOT NULL DEFAULT 1,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT order_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT order_revisions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_revisions_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.order_deliveries(id) ON DELETE SET NULL,
  CONSTRAINT order_revisions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID,
  service_id UUID NOT NULL,
  client_id UUID NOT NULL,
  provider_id UUID,
  rating SMALLINT NOT NULL,
  title TEXT,
  comment TEXT,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- =====================================================
-- TABLE: favorites
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  service_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT favorites_unique UNIQUE (client_id, service_id)
);

-- =====================================================
-- TABLE: conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  unread_count JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: messages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  text TEXT,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT,
  content TEXT NOT NULL,
  action_url TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: promotions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_id UUID,
  description JSONB,
  discount_percent NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: reports
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_type TEXT NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: user_activity_log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_data JSONB,
  search_query TEXT,
  filters_applied JSONB,
  duration_seconds INTEGER,
  scroll_depth INTEGER,
  page_url TEXT,
  referrer_url TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: user_preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  behavioral_profile TEXT,
  search_patterns JSONB DEFAULT '{}',
  frequent_keywords JSONB DEFAULT '[]',
  favorite_providers JSONB DEFAULT '[]',
  favorite_categories JSONB DEFAULT '[]',
  preferred_currency TEXT DEFAULT 'EUR',
  preferred_price_min INTEGER,
  preferred_price_max INTEGER,
  engagement_score NUMERIC DEFAULT 0.0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- =====================================================
-- TABLE: search_history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID,
  query TEXT,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT search_history_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: user_insights
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  chart_type TEXT,
  chart_data JSONB,
  insight_data JSONB,
  suggested_action TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_insights_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLE: ai_recommendations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  confidence_score NUMERIC NOT NULL,
  reason_details JSONB,
  recommendation_reason TEXT NOT NULL,
  shown_count INTEGER DEFAULT 0,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_providers_profile_id ON public.providers(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_order_id ON public.order_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_revisions_order_id ON public.order_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON public.favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: Orders
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (client_id = auth.uid() OR provider_id = auth.uid());

-- =====================================================
-- RLS POLICIES: Order Items
-- =====================================================
DROP POLICY IF EXISTS "Users can view order items of their orders" ON public.order_items;
CREATE POLICY "Users can view order items of their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update order status on delivery
CREATE OR REPLACE FUNCTION update_order_status_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET status = 'delivered', updated_at = NOW()
  WHERE id = NEW.order_id AND status = 'in_progress';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_on_delivery ON public.order_deliveries;
CREATE TRIGGER trigger_update_order_status_on_delivery
  AFTER INSERT ON public.order_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_order_status_on_delivery();

-- Trigger: Update order status on revision
CREATE OR REPLACE FUNCTION update_order_status_on_revision()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET status = 'revision_requested', updated_at = NOW()
  WHERE id = NEW.order_id AND status = 'delivered';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_on_revision ON public.order_revisions;
CREATE TRIGGER trigger_update_order_status_on_revision
  AFTER INSERT ON public.order_revisions
  FOR EACH ROW EXECUTE FUNCTION update_order_status_on_revision();

-- =====================================================
-- SEED DATA: Currencies
-- =====================================================
INSERT INTO public.currencies (code, symbol, name, rate_to_usd) VALUES
  ('USD', '$', 'US Dollar', 1.0),
  ('EUR', '€', 'Euro', 0.92),
  ('GBP', '£', 'British Pound', 0.79),
  ('CAD', 'CA$', 'Canadian Dollar', 1.36)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================