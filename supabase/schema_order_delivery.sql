-- =====================================================
-- TABLES POUR GESTION LIVRAISON ET RÉVISIONS (FREELANCE)
-- =====================================================

-- Table pour les livrables (fichiers, liens envoyés par le prestataire)
DROP TABLE IF EXISTS public.order_deliveries CASCADE;
CREATE TABLE public.order_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_number INTEGER NOT NULL DEFAULT 1, -- Première livraison, révision 1, 2, etc.
  file_url TEXT NULL, -- URL du fichier uploadé (Supabase Storage)
  file_name TEXT NULL, -- Nom original du fichier
  file_type TEXT NULL, -- MIME type: application/pdf, image/png, video/mp4, audio/mp3, etc.
  file_size_bytes BIGINT NULL, -- Taille du fichier en bytes
  external_link TEXT NULL, -- Lien externe (Google Drive, Dropbox, etc.)
  message TEXT NULL, -- Message du prestataire accompagnant la livraison
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT order_deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_deliveries_file_size_check CHECK (file_size_bytes >= 0)
);

-- Index pour recherche rapide
CREATE INDEX idx_order_deliveries_order_id ON public.order_deliveries(order_id);
CREATE INDEX idx_order_deliveries_delivered_at ON public.order_deliveries(delivered_at DESC);

-- Table pour les révisions demandées par le client
DROP TABLE IF EXISTS public.order_revisions CASCADE;
CREATE TABLE public.order_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_id UUID NULL, -- Quelle livraison est concernée (peut être NULL si révision globale)
  revision_number INTEGER NOT NULL DEFAULT 1,
  requested_by UUID NOT NULL, -- Client ID
  reason TEXT NOT NULL, -- Raison de la demande de révision
  details TEXT NULL, -- Détails spécifiques
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, rejected
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,

  CONSTRAINT order_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT order_revisions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_revisions_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.order_deliveries(id) ON DELETE SET NULL,
  CONSTRAINT order_revisions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_order_revisions_order_id ON public.order_revisions(order_id);
CREATE INDEX idx_order_revisions_status ON public.order_revisions(status);

-- Mettre à jour les statuts possibles pour orders
-- Nouveaux statuts: delivered, revision_requested, completed, cancelled, refunded
COMMENT ON COLUMN public.orders.status IS 'pending | paid | in_progress | delivered | revision_requested | completed | cancelled | refunded';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Activer RLS
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_revisions ENABLE ROW LEVEL SECURITY;

-- Policies pour order_deliveries
-- Les clients et prestataires peuvent voir les livrables de leurs commandes
CREATE POLICY "Users can view deliveries of their orders"
  ON public.order_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- Seuls les prestataires peuvent créer des livrables
CREATE POLICY "Providers can insert deliveries for their orders"
  ON public.order_deliveries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_deliveries.order_id
      AND orders.provider_id = auth.uid()
    )
  );

-- Policies pour order_revisions
-- Les clients et prestataires peuvent voir les révisions de leurs commandes
CREATE POLICY "Users can view revisions of their orders"
  ON public.order_revisions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- Seuls les clients peuvent demander des révisions
CREATE POLICY "Clients can request revisions for their orders"
  ON public.order_revisions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- Les prestataires peuvent mettre à jour le statut des révisions
CREATE POLICY "Providers can update revision status"
  ON public.order_revisions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_revisions.order_id
      AND orders.provider_id = auth.uid()
    )
  );

-- =====================================================
-- FONCTIONS TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour automatiquement le statut de la commande
CREATE OR REPLACE FUNCTION update_order_status_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une livraison est créée, passer la commande en statut "delivered"
  UPDATE public.orders
  SET
    status = 'delivered',
    updated_at = NOW()
  WHERE id = NEW.order_id
  AND status = 'in_progress';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur insertion de livraison
DROP TRIGGER IF EXISTS trigger_update_order_status_on_delivery ON public.order_deliveries;
CREATE TRIGGER trigger_update_order_status_on_delivery
  AFTER INSERT ON public.order_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_delivery();

-- Fonction pour mettre à jour le statut quand révision demandée
CREATE OR REPLACE FUNCTION update_order_status_on_revision()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une révision est demandée, passer la commande en statut "revision_requested"
  UPDATE public.orders
  SET
    status = 'revision_requested',
    updated_at = NOW()
  WHERE id = NEW.order_id
  AND status = 'delivered';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur insertion de révision
DROP TRIGGER IF EXISTS trigger_update_order_status_on_revision ON public.order_revisions;
CREATE TRIGGER trigger_update_order_status_on_revision
  AFTER INSERT ON public.order_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_revision();

-- =====================================================
-- BUCKET SUPABASE STORAGE POUR FICHIERS
-- =====================================================

-- Créer le bucket pour les livrables (à exécuter dans Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('order-deliveries', 'order-deliveries', false);

-- Policy pour upload (prestataires seulement)
-- CREATE POLICY "Providers can upload deliveries"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'order-deliveries' AND
--   auth.role() = 'authenticated'
-- );

-- Policy pour téléchargement (clients et prestataires de la commande)
-- CREATE POLICY "Users can download their order deliveries"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'order-deliveries' AND
--   auth.role() = 'authenticated'
-- );