-- ============================================================================
-- Vérifier si la table withdrawals existe et son contenu
-- ============================================================================

-- 1. Vérifier si la table existe
SELECT
  'Table withdrawals exists?' as check_type,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'withdrawals'
  ) as exists;

-- 2. Si elle existe, voir sa structure
SELECT
  'Structure de withdrawals' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- 3. Compter les retraits
SELECT
  'Nombre de retraits' as info,
  COUNT(*) as total
FROM withdrawals;

-- 4. Voir les derniers retraits (si la table existe)
SELECT
  'Derniers retraits' as info,
  *
FROM withdrawals
ORDER BY requested_at DESC
LIMIT 5;

-- 5. Vérifier les montants retirés dans provider_balance
SELECT
  'Montants retirés dans provider_balance' as info,
  provider_id,
  withdrawn_cents / 100.0 as withdrawn_eur,
  last_withdrawal_at
FROM provider_balance
WHERE withdrawn_cents > 0
ORDER BY withdrawn_cents DESC;
