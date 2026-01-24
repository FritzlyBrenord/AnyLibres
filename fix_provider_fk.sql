-- Supprimer la contrainte fautive qui cause l'erreur à la création de commande
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_provider_id_profiles_fkey;

-- Optionnel: Si vous voulez vraiment cette contrainte, assurez-vous que tous les providers ont un profil
-- Mais pour l'instant, supprimons-la pour débloquer la création de commandes
