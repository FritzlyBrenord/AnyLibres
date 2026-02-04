-- ============================================================================
-- Migration: Création de la table visitor_logs
-- Date: 2026-02-04
-- Description: Table pour stocker les statistiques de visite (IP, Géo, UA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    country TEXT,
    city TEXT,
    region TEXT,
    latitude FLOAT,
    longitude FLOAT,
    user_agent TEXT,
    path TEXT DEFAULT '/',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index pour accélérer les recherches par IP et par date
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON public.visitor_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON public.visitor_logs(created_at);

-- Activer RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view visitor logs" 
ON public.visitor_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin', 'moderator', 'support', 'finance', 'content_manager')
    )
);

-- Politique : N'importe qui peut insérer (via l'API tracking)
-- Note: On pourrait restreindre cela à une fonction service-role si nécessaire, 
-- mais pour un tracking anonyme simple, INSERT est ouvert.
CREATE POLICY "Public can insert visitor logs" 
ON public.visitor_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Politique : Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete visitor logs" 
ON public.visitor_logs
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin')
    )
);
