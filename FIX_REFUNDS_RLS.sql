-- ============================================================================
-- CORRECTION URGENTE: Ajouter RLS Policies à la table REFUNDS
-- ============================================================================
-- 🔴 PROBLÈME: Erreur 500 "Failed to create refund request"
-- 🔧 SOLUTION: Ajouter les politiques Row Level Security manquantes

-- ============================================================================
-- 1. ACTIVER RLS SUR LA TABLE REFUNDS
-- ============================================================================
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLITIQUES RLS - SELECT (Lecture)
-- ============================================================================

-- Politique: Les clients peuvent voir leurs demandes de remboursement
DROP POLICY IF EXISTS "Clients can view their refunds" ON public.refunds;
CREATE POLICY "Clients can view their refunds"
  ON public.refunds FOR SELECT
  USING (client_id = auth.uid());

-- Politique: Les providers peuvent voir les remboursements concernant leurs commandes
DROP POLICY IF EXISTS "Providers can view refunds for their orders" ON public.refunds;
CREATE POLICY "Providers can view refunds for their orders"
  ON public.refunds FOR SELECT
  USING (provider_id = auth.uid());

-- ============================================================================
-- 3. POLITIQUES RLS - INSERT (Création)
-- ============================================================================

-- Politique: Les clients peuvent demander un remboursement pour leurs commandes payées
DROP POLICY IF EXISTS "Clients can request refunds for their orders" ON public.refunds;
CREATE POLICY "Clients can request refunds for their orders"
  ON public.refunds FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.client_id = auth.uid()
      AND orders.payment_status = 'succeeded'
    )
  );

-- ============================================================================
-- 4. POLITIQUES RLS - UPDATE (Modification)
-- ============================================================================

-- Politique: Les clients peuvent mettre à jour leurs demandes de remboursement (avant approbation)
DROP POLICY IF EXISTS "Clients can update their pending refunds" ON public.refunds;
CREATE POLICY "Clients can update their pending refunds"
  ON public.refunds FOR UPDATE
  USING (
    client_id = auth.uid()
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status IN ('pending', 'rejected')
  );

-- ============================================================================
-- REMARQUES IMPORTANTES
-- ============================================================================
-- Les administrateurs accèdent à la table refunds via bypass RLS dans l'API
-- Voir: src/app/api/admin/refunds/route.ts
-- 
-- Pour l'accès admin, utilisez:
-- const supabase = createClient({ admin: true })
-- ou
-- supabase.rpc('admin_function_name')
--
-- Politiques limitées (pas UPDATE/DELETE admin ici) pour forcer validation côté API

-- ============================================================================
-- 5. VÉRIFICATION APRÈS APPLICATION
-- ============================================================================

-- Exécutez ces requêtes pour vérifier:

-- ✅ Vérifier que RLS est activé
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'refunds';

-- ✅ Lister toutes les politiques
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies WHERE tablename = 'refunds' ORDER BY policyname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
