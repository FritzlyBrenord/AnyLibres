-- Assigner la commande à votre compte (en utilisant user_id comme référence)
UPDATE public.orders
SET client_id = '8d30fed0-76ba-43d7-876c-0f81f39c63cd' -- Votre user_id Supabase
WHERE id = '49f13e35-4004-4669-a824-a9ebc2d1cc36';

-- Nota : Si cela échoue encore, assurez-vous qu'une entrée existe dans profiles avec user_id = '8d30fed0-76ba-43d7-876c-0f81f39c63cd'
-- Si non, créez-la :
-- INSERT INTO public.profiles (user_id, email, role) VALUES ('8d30fed0-76ba-43d7-876c-0f81f39c63cd', 'votre@email.com', 'client');
