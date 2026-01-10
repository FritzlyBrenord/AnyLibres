-- Vérifier TOUS les triggers qui pourraient appeler create_provider_earning

-- 1. Triggers sur la table 'orders'
SELECT
  'Triggers sur orders' as info,
  tgname as trigger_name,
  proname as function_name,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'orders'::regclass
ORDER BY tgname;

-- 2. Triggers sur la table 'provider_earnings'
SELECT
  'Triggers sur provider_earnings' as info,
  tgname as trigger_name,
  proname as function_name,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'provider_earnings'::regclass
ORDER BY tgname;

-- 3. Chercher toutes les fonctions qui appellent create_provider_earning
SELECT
  'Fonctions appelant create_provider_earning' as info,
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE prosrc LIKE '%create_provider_earning%'
AND proname != 'create_provider_earning';
