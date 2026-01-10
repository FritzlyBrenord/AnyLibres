-- ============================================================================
-- SCHEMA: User Behavioral Tracking & AI Recommendations
-- Tables pour analyser le comportement utilisateur et générer des recommandations IA
-- ============================================================================

-- 1. TABLE: user_activity_log
-- Enregistre toutes les actions de l'utilisateur
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Type d'activité
  activity_type TEXT NOT NULL CHECK (
    activity_type IN (
      'view_service', 'view_provider', 'search', 'favorite',
      'unfavorite', 'order', 'message', 'review', 'share',
      'click', 'scroll', 'hover', 'filter', 'sort'
    )
  ),

  -- Données de l'activité
  entity_type TEXT CHECK (entity_type IN ('service', 'provider', 'category', 'search', 'other')),
  entity_id UUID,
  entity_data JSONB, -- Données supplémentaires (titre, catégorie, prix, etc.)

  -- Métadonnées
  search_query TEXT,
  filters_applied JSONB,
  duration_seconds INTEGER, -- Temps passé sur la page
  scroll_depth INTEGER, -- Pourcentage de scroll (0-100)

  -- Contexte
  page_url TEXT,
  referrer_url TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX idx_user_activity_entity ON public.user_activity_log(entity_type, entity_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity_log(created_at DESC);

-- 2. TABLE: user_preferences
-- Préférences et intérêts de l'utilisateur (calculés par IA)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Catégories préférées (avec scores)
  favorite_categories JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"category_id": "uuid", "name": "Logo Design", "score": 0.85, "views": 42}]

  -- Fourchette de prix préférée
  preferred_price_min INTEGER,
  preferred_price_max INTEGER,
  preferred_currency TEXT DEFAULT 'EUR',

  -- Prestataires préférés
  favorite_providers JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"provider_id": "uuid", "score": 0.9, "interactions": 12}]

  -- Tags/mots-clés fréquents
  frequent_keywords JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"keyword": "logo", "count": 25}, {"keyword": "design", "count": 18}]

  -- Comportement de recherche
  search_patterns JSONB DEFAULT '{}'::jsonb,
  -- Format: {"time_of_day": "evening", "avg_results_viewed": 5, "typical_filters": [...]}

  -- Score d'engagement (calculé)
  engagement_score DECIMAL(3,2) DEFAULT 0.0 CHECK (engagement_score >= 0 AND engagement_score <= 1),

  -- IA - Profil comportemental
  behavioral_profile TEXT CHECK (
    behavioral_profile IN (
      'explorer', 'decisive', 'researcher', 'impulsive', 'comparison_shopper'
    )
  ),

  -- Timestamps
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- 3. TABLE: ai_recommendations
-- Recommandations générées par IA pour chaque utilisateur
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Service recommandé
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,

  -- Score de recommandation (0-1)
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Raison de la recommandation
  recommendation_reason TEXT NOT NULL CHECK (
    recommendation_reason IN (
      'similar_to_viewed', 'popular_in_category', 'matching_search',
      'provider_favorite', 'price_match', 'trending', 'collaborative_filtering',
      'ai_predicted'
    )
  ),

  -- Métadonnées
  reason_details JSONB, -- Détails sur pourquoi ce service est recommandé

  -- Performance
  shown_count INTEGER DEFAULT 0,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE, -- A passé commande
  converted_at TIMESTAMPTZ,

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL, -- Expiration de la recommandation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_service_id ON public.ai_recommendations(service_id);
CREATE INDEX idx_ai_recommendations_score ON public.ai_recommendations(confidence_score DESC);
CREATE INDEX idx_ai_recommendations_expires ON public.ai_recommendations(expires_at);

-- 4. TABLE: user_insights
-- Insights et analyses générés par IA
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Type d'insight
  insight_type TEXT NOT NULL CHECK (
    insight_type IN (
      'spending_pattern', 'category_interest', 'provider_loyalty',
      'search_behavior', 'engagement_trend', 'recommendation'
    )
  ),

  -- Contenu de l'insight
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insight_data JSONB, -- Données structurées

  -- Visualisation
  chart_type TEXT CHECK (chart_type IN ('bar', 'line', 'pie', 'radar', 'heatmap')),
  chart_data JSONB,

  -- Importance
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Action suggérée
  suggested_action TEXT,
  action_url TEXT,

  -- Statut
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_insights_user_id ON public.user_insights(user_id);
CREATE INDEX idx_user_insights_type ON public.user_insights(insight_type);
CREATE INDEX idx_user_insights_priority ON public.user_insights(priority);

-- 5. TABLE: search_history
-- Historique des recherches pour analyse
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,

  -- Recherche
  query TEXT NOT NULL,
  filters JSONB,
  sort_by TEXT,

  -- Résultats
  results_count INTEGER,
  results_clicked INTEGER DEFAULT 0,

  -- Contexte
  location TEXT,
  device_type TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_search_history_query ON public.search_history(query);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

-- Trigger pour user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- FUNCTIONS: Calculer le score d'engagement
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0.0;
  v_activity_count INTEGER;
  v_unique_days INTEGER;
  v_avg_duration DECIMAL;
  v_conversion_rate DECIMAL;
BEGIN
  -- Compter les activités des 30 derniers jours
  SELECT COUNT(*), COUNT(DISTINCT DATE(created_at)), AVG(COALESCE(duration_seconds, 0))
  INTO v_activity_count, v_unique_days, v_avg_duration
  FROM user_activity_log
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Score basé sur l'activité (max 0.4)
  v_score := v_score + LEAST(v_activity_count / 100.0, 0.4);

  -- Score basé sur la régularité (max 0.3)
  v_score := v_score + LEAST(v_unique_days / 30.0 * 0.3, 0.3);

  -- Score basé sur la durée moyenne (max 0.2)
  v_score := v_score + LEAST(v_avg_duration / 300.0 * 0.2, 0.2);

  -- Score basé sur les conversions (max 0.1)
  SELECT COUNT(*) FILTER (WHERE activity_type = 'order')::DECIMAL / NULLIF(COUNT(*), 0)
  INTO v_conversion_rate
  FROM user_activity_log
  WHERE user_id = p_user_id;

  v_score := v_score + COALESCE(v_conversion_rate * 0.1, 0);

  RETURN LEAST(v_score, 1.0);
END;
$$ LANGUAGE plpgsql;