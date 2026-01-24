-- Assigner la commande au compte utilisateur actuel pour pouvoir tester la médiation
UPDATE public.orders
SET client_id = '8d30fed0-76ba-43d7-876c-0f81f39c63cd' -- Votre ID actuel
WHERE id = '49f13e35-4004-4669-a824-a9ebc2d1cc36'; -- ID de la commande liée au litige

-- Vérification
SELECT id, client_id, provider_id FROM public.orders WHERE id = '49f13e35-4004-4669-a824-a9ebc2d1cc36';
