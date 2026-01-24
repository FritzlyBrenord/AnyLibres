-- ============================================================================
-- SCRIPT DE VÉRIFICATION COMPLET APRÈS APPLICATION DE FIX_REFUNDS_RLS.sql
-- ============================================================================
-- Exécutez ces requêtes dans Supabase SQL Editor APRÈS avoir appliqué la fix

-- ============================================================================
-- SECTION 1: VÉRIFIER QUE RLS EST ACTIVÉ
-- ============================================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'refunds'
AND schemaname = 'public';

-- Résultat attendu:
-- tablename | rowsecurity
-- refunds   | true


-- ============================================================================
-- SECTION 2: VÉRIFIER TOUTES LES POLITIQUES RLS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as select_condition,
  with_check as insert_update_condition
FROM pg_policies
WHERE tablename = 'refunds'
AND schemaname = 'public'
ORDER BY policyname;

-- Résultat attendu: 4 lignes
-- - "Clients can request refunds for their orders"
-- - "Clients can update their pending refunds"  
-- - "Clients can view their refunds"
-- - "Providers can view refunds for their orders"


-- ============================================================================
-- SECTION 3: TESTER UN INSERT VALIDE (si données de test existent)
-- ============================================================================

-- D'abord, vérifier qu'une commande payée existe:
SELECT 
  id, 
  client_id, 
  provider_id, 
  total_cents,
  payment_status, 
  status
FROM orders
WHERE payment_status = 'succeeded'
LIMIT 1;

-- Ensuite, si une commande est trouvée, tester l'insertion:
-- (Remplacer les UUIDs par les vrais du résultat ci-dessus)
INSERT INTO public.refunds (
  order_id,
  client_id,
  provider_id,
  amount_cents,
  currency,
  reason,
  status,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,  -- Remplacer par order_id réel
  '22222222-2222-2222-2222-222222222222'::uuid,  -- Remplacer par client_id réel
  '33333333-3333-3333-3333-333333333333'::uuid,  -- Remplacer par provider_id réel
  5000,
  'EUR',
  'client_request',
  'pending',
  NOW(),
  NOW()
)
RETURNING 
  id,
  order_id,
  client_id,
  amount_cents,
  currency,
  status,
  created_at,
  updated_at;

-- ✅ Si pas d'erreur et retour de données = RLS fonctionne correctement
-- ❌ Si erreur "permission denied" = Problème persiste


-- ============================================================================
-- SECTION 4: VÉRIFIER LA TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'refunds'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Doit inclure:
-- id, order_id, client_id, provider_id, amount_cents, currency, 
-- status, reason, reason_details, admin_notes, refund_method, 
-- refund_reference, refunded_at, metadata, created_at, updated_at


-- ============================================================================
-- SECTION 5: VÉRIFIER LES INDEXES
-- ============================================================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'refunds'
AND schemaname = 'public'
ORDER BY indexname;

-- Doit inclure:
-- - idx_refunds_order (order_id)
-- - idx_refunds_client (client_id)
-- - idx_refunds_provider (provider_id)
-- - idx_refunds_status (status)
-- - idx_refunds_created (created_at DESC)
-- - refunds_pkey (PRIMARY KEY)


-- ============================================================================
-- SECTION 6: VÉRIFIER LES CONTRAINTES
-- ============================================================================

SELECT
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints
WHERE table_name = 'refunds'
AND table_schema = 'public'
ORDER BY constraint_name;

-- Doit inclure:
-- - refunds_pkey (PRIMARY KEY)
-- - refunds_order_id_fkey (FOREIGN KEY)
-- - refunds_client_id_fkey (FOREIGN KEY)
-- - refunds_provider_id_fkey (FOREIGN KEY)
-- - refunds_amount_cents_check (amount_cents > 0)
-- - refunds_status_check (status IN valid values)


-- ============================================================================
-- SECTION 7: VÉRIFIER LE TRIGGER
-- ============================================================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'refunds'
ORDER BY trigger_name;

-- Doit inclure:
-- - trg_refunds_updated_at (BEFORE UPDATE)


-- ============================================================================
-- SECTION 8: VÉRIFIER LA FONCTION update_updated_at_column()
-- ============================================================================

SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column'
AND routine_schema = 'public';

-- ✅ Doit retourner une ligne (fonction existe)
-- ❌ Pas de résultat = Fonction manquante (voir FIX ci-dessous)


-- ============================================================================
-- SI FONCTION update_updated_at_column() EST MANQUANTE - CRÉER LA:
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 9: LISTER TOUS LES REFUNDS CRÉÉS (pour vérification)
-- ============================================================================

SELECT
  id,
  order_id,
  client_id,
  provider_id,
  amount_cents,
  currency,
  status,
  reason,
  created_at,
  updated_at
FROM public.refunds
ORDER BY created_at DESC
LIMIT 10;


-- ============================================================================
-- SECTION 10: VÉRIFIER LES FOREIGN KEYS
-- ============================================================================

SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'refunds'
AND table_schema = 'public'
AND referenced_table_name IS NOT NULL
ORDER BY constraint_name;

-- Doit montrer:
-- - refunds.order_id → orders.id (CASCADE)
-- - refunds.client_id → auth.users.id (CASCADE)
-- - refunds.provider_id → auth.users.id (CASCADE)


-- ============================================================================
-- SECTION 11: TEST AVANCÉ - Vérifier RLS fonctionne avec auth.uid()
-- ============================================================================

-- Note: Ces tests nécessitent de configurer la session avec un user ID
-- Dans Supabase, vous pouvez le faire via:
-- SET session.user_id = 'user-uuid-here';

-- Ensuite tester:
-- SELECT * FROM refunds WHERE client_id = auth.uid();
-- → Doit retourner seulement les refunds du user


-- ============================================================================
-- RÉSUMÉ DE VÉRIFICATION RAPIDE
-- ============================================================================

-- Copiez et collez ceci pour un résumé complet:

WITH checks AS (
  SELECT 'RLS Enabled' as check_name, 
    CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'refunds' AND schemaname = 'public') 
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
  UNION ALL
  SELECT 'Policies Exist' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'refunds') >= 4
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
  UNION ALL
  SELECT 'update_updated_at_column() Exists' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'update_updated_at_column') > 0
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
  UNION ALL
  SELECT 'Trigger Exists' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'refunds') > 0
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
  UNION ALL
  SELECT 'Foreign Keys OK' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM information_schema.key_column_usage 
               WHERE table_name = 'refunds' AND referenced_table_name IS NOT NULL) >= 3
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
  UNION ALL
  SELECT 'Indexes OK' as check_name,
    CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'refunds') >= 5
    THEN '✅ PASS' ELSE '❌ FAIL' END as status
)
SELECT * FROM checks;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
