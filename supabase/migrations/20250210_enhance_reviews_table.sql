-- =====================================================
-- Migration: Enhance reviews table for Fiverr-like system
-- =====================================================

-- Drop existing reviews table if needed
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create enhanced reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  reviewer_id UUID NOT NULL, -- Who is leaving the review (client or provider)
  reviewee_id UUID NOT NULL, -- Who is receiving the review (provider or client)
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('client', 'provider')),

  -- Multi-criteria ratings (1-5 stars each)
  rating_overall SMALLINT NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_communication SMALLINT CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_quality SMALLINT CHECK (rating_quality >= 1 AND rating_quality <= 5),
  rating_deadline SMALLINT CHECK (rating_deadline >= 1 AND rating_deadline <= 5),

  -- Review content
  title TEXT,
  comment TEXT NOT NULL,

  -- Provider response
  response TEXT,
  response_date TIMESTAMPTZ,

  -- Visibility control (Fiverr system: visible after both reviews or 10 days)
  is_visible BOOLEAN DEFAULT FALSE,
  made_public_at TIMESTAMPTZ,

  -- Metadata
  helpful_count INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_unique_per_order_reviewer UNIQUE (order_id, reviewer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON public.reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Anyone can view visible reviews
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
CREATE POLICY "Anyone can view visible reviews"
  ON public.reviews FOR SELECT
  USING (is_visible = true);

-- Policy 2: Users can view their own reviews (even if not visible yet)
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Policy 3: Clients can create reviews for completed orders
DROP POLICY IF EXISTS "Clients can create reviews" ON public.reviews;
CREATE POLICY "Clients can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    reviewer_type = 'client' AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.client_id = auth.uid()
      AND orders.status IN ('delivered', 'completed')
    )
  );

-- Policy 4: Providers can create reviews for orders where they are the provider
DROP POLICY IF EXISTS "Providers can create reviews" ON public.reviews;
CREATE POLICY "Providers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    reviewer_type = 'provider' AND
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.providers p ON p.id = o.provider_id
      WHERE o.id = order_id
      AND p.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy 5: Providers can update their response
DROP POLICY IF EXISTS "Providers can update review response" ON public.reviews;
CREATE POLICY "Providers can update review response"
  ON public.reviews FOR UPDATE
  USING (
    reviewee_id = auth.uid() AND
    reviewer_type = 'client'
  )
  WITH CHECK (
    reviewee_id = auth.uid()
  );

-- Function to automatically make reviews visible after 10 days
CREATE OR REPLACE FUNCTION auto_make_reviews_visible()
RETURNS TRIGGER AS $$
BEGIN
  -- Make review visible if:
  -- 1. Both client and provider have reviewed, OR
  -- 2. 10 days have passed since creation

  IF NEW.is_visible = FALSE THEN
    -- Check if both parties have reviewed
    IF EXISTS (
      SELECT 1 FROM public.reviews
      WHERE order_id = NEW.order_id
      AND reviewer_id != NEW.reviewer_id
    ) THEN
      NEW.is_visible := TRUE;
      NEW.made_public_at := NOW();

      -- Also make the other review visible
      UPDATE public.reviews
      SET is_visible = TRUE, made_public_at = NOW()
      WHERE order_id = NEW.order_id AND reviewer_id != NEW.reviewer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to make reviews visible
DROP TRIGGER IF EXISTS trigger_auto_make_reviews_visible ON public.reviews;
CREATE TRIGGER trigger_auto_make_reviews_visible
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_make_reviews_visible();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Cron job placeholder comment (to be setup in Supabase dashboard)
-- Schedule a job to make reviews visible after 10 days:
-- SELECT cron.schedule(
--   'make-reviews-visible',
--   '0 0 * * *', -- Daily at midnight
--   $$
--   UPDATE public.reviews
--   SET is_visible = TRUE, made_public_at = NOW()
--   WHERE is_visible = FALSE
--   AND created_at < NOW() - INTERVAL '10 days';
--   $$
-- );
