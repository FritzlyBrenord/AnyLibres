-- 1. D'abord, créer votre profil s'il n'existe pas (nécessaire pour la contrainte FK)
INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
VALUES (
  '8d30fed0-76ba-43d7-876c-0f81f39c63cd', -- Votre ID
  'admin@test.com', -- Email placeholder
  'Admin',
  'Test',
  'client' -- On vous met en role client pour tester la médiation
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'client'; -- S'assurer que vous êtes bien client

-- 2. Ensuite, assigner la commande à votre compte
UPDATE public.orders
SET client_id = '8d30fed0-76ba-43d7-876c-0f81f39c63cd'
WHERE id = '49f13e35-4004-4669-a824-a9ebc2d1cc36';

-- 3. Vérification
SELECT o.id, p.first_name, p.role 
FROM public.orders o
JOIN public.profiles p ON o.client_id = p.user_id
WHERE o.id = '49f13e35-4004-4669-a824-a9ebc2d1cc36';
