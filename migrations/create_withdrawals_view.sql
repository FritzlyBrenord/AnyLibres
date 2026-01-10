-- ============================================================================
-- Vue: v_admin_withdrawals - Simplifie l'affichage des retraits pour l'admin
-- ============================================================================

CREATE OR REPLACE VIEW v_admin_withdrawals AS
SELECT
  pw.id,
  pw.provider_id,
  pw.amount_cents,
  pw.fee_cents,
  pw.net_amount_cents,
  pw.currency,
  pw.status,
  pw.payment_method_type,
  pw.payment_method_details,
  pw.created_at as requested_at,
  pw.processed_at,
  pw.completed_at,
  pw.failed_at,
  pw.notes,
  pw.admin_notes,
  pw.external_transaction_id,
  u.email as provider_email,
  COALESCE(prov.company_name, prof.display_name, u.email, 'N/A') as provider_name
FROM provider_withdrawals pw
LEFT JOIN auth.users u ON u.id = pw.provider_id
LEFT JOIN profiles prof ON prof.user_id = pw.provider_id
LEFT JOIN providers prov ON prov.profile_id = prof.id
ORDER BY pw.created_at DESC;

COMMENT ON VIEW v_admin_withdrawals IS 'Vue simplifiée des retraits pour l''interface admin';

-- Test de la vue
SELECT * FROM v_admin_withdrawals LIMIT 5;
