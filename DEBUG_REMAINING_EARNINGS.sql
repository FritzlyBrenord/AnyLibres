-- Voir les earnings pending restants
SELECT
  pe.id,
  pe.user_id,
  pe.provider_id,
  pe.order_id,
  pe.status,
  pe.net_amount_cents / 100.0 as amount_usd,
  pe.created_at,
  -- Vérifier si user_id existe
  CASE
    WHEN pe.user_id IS NULL THEN '❌ user_id NULL'
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = pe.user_id) THEN '✅ user_id valide'
    ELSE '❌ user_id invalide'
  END as user_id_check,
  -- Vérifier la balance
  pb.pending_cents / 100.0 as balance_pending_usd,
  pb.available_cents / 100.0 as balance_available_usd
FROM provider_earnings pe
LEFT JOIN provider_balance pb ON pb.provider_id = pe.user_id
WHERE pe.status = 'pending'
ORDER BY pe.created_at DESC;

-- Essayer de libérer manuellement avec la fonction SQL
-- Remplacez les valeurs ci-dessous avec les IDs trouvés ci-dessus
/*
SELECT admin_release_pending_funds(
  'METTRE_LE_USER_ID_ICI'::uuid,
  88000  -- ou le montant en centimes
);
*/
