-- ============================================================================
-- Vue: v_admin_balances - Simplifie l'affichage des balances pour l'admin
-- ============================================================================

CREATE OR REPLACE VIEW v_admin_balances AS
SELECT
  pb.id,
  pb.provider_id,
  pb.available_cents,
  pb.pending_cents,
  pb.withdrawn_cents,
  pb.total_earned_cents,
  pb.currency,
  pb.last_withdrawal_at,
  pb.created_at,
  pb.updated_at,
  pb.is_frozen,
  u.email as provider_email,
  COALESCE(prov.company_name, prof.display_name, u.email, 'N/A') as provider_name
FROM provider_balance pb
LEFT JOIN auth.users u ON u.id = pb.provider_id
LEFT JOIN profiles prof ON prof.user_id = pb.provider_id
LEFT JOIN providers prov ON prov.profile_id = prof.id
ORDER BY pb.total_earned_cents DESC;

COMMENT ON VIEW v_admin_balances IS 'Vue simplifiée des balances pour l''interface admin (avec noms et emails)';

-- Test de la vue
SELECT * FROM v_admin_balances LIMIT 5;
