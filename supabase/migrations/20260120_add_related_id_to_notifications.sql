-- =====================================================
-- TABLE: notifications - Ajout de la colonne related_id
-- =====================================================

-- Ajouter la colonne related_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'related_id'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN related_id UUID;
        
        -- Créer un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_notifications_related_id 
        ON public.notifications(related_id);
    END IF;
END $$;
