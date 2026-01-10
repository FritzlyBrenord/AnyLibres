-- Voir le code de la fonction auto_schedule_payment_release
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'auto_schedule_payment_release';
