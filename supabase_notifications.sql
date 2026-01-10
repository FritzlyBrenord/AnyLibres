-- Création du type ENUM pour les types de notifications
create type notification_type as enum ('order', 'message', 'payment', 'system', 'review', 'delivery');

-- Création de la table notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Index pour optimiser les requêtes par utilisateur et statut de lecture
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_read on notifications(read);

-- Politique RLS (Row Level Security) pour s'assurer que les utilisateurs ne voient que leurs propres notifications
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- (Optionnel) Suppression si nécessaire, sinon à restreindre
create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);
