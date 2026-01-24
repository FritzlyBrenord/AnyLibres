-- ============================================
-- TABLE CLIENT_BALANCE
-- ============================================
-- Gère l'argent des clients (remboursements reçus, dons reçus)
create table public.client_balance (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  available_cents bigint not null default 0,
  pending_withdrawal_cents bigint not null default 0,
  withdrawn_cents bigint not null default 0,
  total_received_cents bigint not null default 0,
  currency text not null default 'EUR'::text,
  preferred_payment_method text null,
  payment_details jsonb null,
  last_withdrawal_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint client_balance_pkey primary key (id),
  constraint client_balance_client_id_key unique (client_id),
  constraint client_balance_client_id_fkey foreign KEY (client_id) references auth.users (id) on delete CASCADE,
  constraint client_balance_available_cents_check check ((available_cents >= 0)),
  constraint client_balance_pending_withdrawal_cents_check check ((pending_withdrawal_cents >= 0)),
  constraint client_balance_withdrawn_cents_check check ((withdrawn_cents >= 0)),
  constraint client_balance_total_received_cents_check check ((total_received_cents >= 0))
) TABLESPACE pg_default;

-- Indexes
create index IF not exists idx_client_balance_client on public.client_balance using btree (client_id) TABLESPACE pg_default;

-- Trigger pour updated_at
create trigger trg_client_balance_updated_at BEFORE
update on client_balance for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================
-- TABLE ADMIN_BALANCE (PLATFORM BALANCE)
-- ============================================
-- Gère les "dons" faits par l'admin au système
create table public.admin_balance (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  available_cents bigint not null default 0,
  total_donated_cents bigint not null default 0,
  total_refunded_cents bigint not null default 0,
  currency text not null default 'EUR'::text,
  metadata jsonb null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint admin_balance_pkey primary key (id),
  constraint admin_balance_admin_id_key unique (admin_id),
  constraint admin_balance_admin_id_fkey foreign KEY (admin_id) references auth.users (id) on delete CASCADE,
  constraint admin_balance_available_cents_check check ((available_cents >= 0)),
  constraint admin_balance_total_donated_cents_check check ((total_donated_cents >= 0)),
  constraint admin_balance_total_refunded_cents_check check ((total_refunded_cents >= 0))
) TABLESPACE pg_default;

-- Indexes
create index IF not exists idx_admin_balance_admin on public.admin_balance using btree (admin_id) TABLESPACE pg_default;

-- Trigger pour updated_at
create trigger trg_admin_balance_updated_at BEFORE
update on admin_balance for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================
-- TABLE TRANSACTIONS (pour tracer les mouvements)
-- ============================================
-- Trace tous les mouvements d'argent (remboursements, dons, retraits)
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  transaction_type text not null,
  from_user_id uuid null,
  to_user_id uuid not null,
  amount_cents bigint not null,
  currency text not null default 'EUR'::text,
  status text not null default 'pending'::text,
  description text null,
  related_refund_id uuid null,
  related_order_id uuid null,
  payment_method text null,
  payment_reference text null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_from_user_id_fkey foreign KEY (from_user_id) references auth.users (id) on delete SET NULL,
  constraint transactions_to_user_id_fkey foreign KEY (to_user_id) references auth.users (id) on delete CASCADE,
  constraint transactions_related_refund_id_fkey foreign KEY (related_refund_id) references refunds (id) on delete SET NULL,
  constraint transactions_related_order_id_fkey foreign KEY (related_order_id) references orders (id) on delete SET NULL,
  constraint transactions_amount_cents_check check ((amount_cents > 0)),
  constraint transactions_type_check check (
    transaction_type = any (
      array[
        'refund'::text,
        'admin_donation'::text,
        'withdrawal'::text,
        'manual_adjustment'::text
      ]
    )
  ),
  constraint transactions_status_check check (
    status = any (
      array[
        'pending'::text,
        'processing'::text,
        'completed'::text,
        'failed'::text,
        'cancelled'::text
      ]
    )
  )
) TABLESPACE pg_default;

-- Indexes pour transactions
create index IF not exists idx_transactions_from_user on public.transactions using btree (from_user_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_to_user on public.transactions using btree (to_user_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_type on public.transactions using btree (transaction_type) TABLESPACE pg_default;
create index IF not exists idx_transactions_status on public.transactions using btree (status) TABLESPACE pg_default;
create index IF not exists idx_transactions_created on public.transactions using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists idx_transactions_refund on public.transactions using btree (related_refund_id) TABLESPACE pg_default;

-- Trigger pour updated_at
create trigger trg_transactions_updated_at BEFORE
update on transactions for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================
-- MODIFIER REFUNDS - Ajouter colonne transaction_id
-- ============================================
-- ALTER TABLE refunds ADD COLUMN transaction_id uuid null;
-- ALTER TABLE refunds ADD CONSTRAINT refunds_transaction_id_fkey 
--   FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour envoyer de l'argent d'un client à un autre
create or replace function transfer_money(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount_cents bigint,
  p_transaction_type text,
  p_description text,
  p_refund_id uuid default null
)
returns table (success boolean, message text, transaction_id uuid) as $$
declare
  v_transaction_id uuid;
  v_from_balance bigint;
begin
  -- Valider le montant
  if p_amount_cents <= 0 then
    return query select false, 'Amount must be greater than 0', null::uuid;
    return;
  end if;

  -- Vérifier le solde si from_user_id existe
  if p_from_user_id is not null then
    select available_cents into v_from_balance
    from client_balance where client_id = p_from_user_id;
    
    if v_from_balance is null or v_from_balance < p_amount_cents then
      return query select false, 'Insufficient balance', null::uuid;
      return;
    end if;
  end if;

  -- Créer la transaction
  insert into transactions (
    transaction_type,
    from_user_id,
    to_user_id,
    amount_cents,
    status,
    description,
    related_refund_id
  ) values (
    p_transaction_type,
    p_from_user_id,
    p_to_user_id,
    p_amount_cents,
    'completed',
    p_description,
    p_refund_id
  ) returning id into v_transaction_id;

  -- Déduire du compte de source si applicable
  if p_from_user_id is not null then
    update client_balance
    set available_cents = available_cents - p_amount_cents
    where client_id = p_from_user_id;
  end if;

  -- Ajouter au compte de destination
  update client_balance
  set available_cents = available_cents + p_amount_cents,
      total_received_cents = total_received_cents + p_amount_cents
  where client_id = p_to_user_id;

  return query select true, 'Transfer completed successfully', v_transaction_id;
end;
$$ language plpgsql;

-- Fonction pour initialiser client_balance pour un nouveau client
create or replace function init_client_balance()
returns trigger as $$
begin
  insert into client_balance (client_id) values (new.id)
  on conflict (client_id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Trigger pour créer automatiquement client_balance quand un user est créé
-- (À mettre en place après création du user dans auth.users)

-- ============================================
-- FIN DU SCRIPT
-- ============================================
