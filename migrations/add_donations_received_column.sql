-- Migration: Ajouter la colonne donations_received_cents aux tables client_balance et provider_balance
-- Date: 2026-01-17

-- Ajouter colonne donations_received_cents à provider_balance
ALTER TABLE public.provider_balance
ADD COLUMN IF NOT EXISTS donations_received_cents BIGINT NOT NULL DEFAULT 0
CHECK (donations_received_cents >= 0);

-- Ajouter colonne donations_received_cents à client_balance
ALTER TABLE public.client_balance
ADD COLUMN IF NOT EXISTS donations_received_cents BIGINT NOT NULL DEFAULT 0
CHECK (donations_received_cents >= 0);

-- Créer la table admin_donations pour l'historique des dons (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.admin_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'provider')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT admin_donations_pkey PRIMARY KEY (id)
);

-- Index pour rechercher les dons par admin ou recipient
CREATE INDEX IF NOT EXISTS idx_admin_donations_admin ON public.admin_donations(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_donations_recipient ON public.admin_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_admin_donations_created_at ON public.admin_donations(created_at DESC);

-- Commentaires
COMMENT ON COLUMN public.provider_balance.donations_received_cents IS 'Total des dons reçus de l''admin en centimes';
COMMENT ON COLUMN public.client_balance.donations_received_cents IS 'Total des dons reçus de l''admin en centimes';
COMMENT ON TABLE public.admin_donations IS 'Historique des dons effectués par les administrateurs';
