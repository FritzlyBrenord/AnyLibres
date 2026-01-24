-- ============================================
-- SYSTÈME DE REMBOURSEMENT COMPLET
-- ============================================

-- 1. Table des demandes de remboursement
create table public.refunds (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  client_id uuid not null,
  provider_id uuid not null,
  amount_cents bigint not null,
  currency text not null default 'EUR'::text,
  status text not null default 'pending'::text,
  reason text not null,
  reason_details text null,
  admin_notes text null,
  refund_method text null,
  refund_reference text null,
  refunded_at timestamp with time zone null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint refunds_pkey primary key (id),
  constraint refunds_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint refunds_client_id_fkey foreign KEY (client_id) references auth.users (id) on delete CASCADE,
  constraint refunds_provider_id_fkey foreign KEY (provider_id) references auth.users (id) on delete CASCADE,
  constraint refunds_amount_cents_check check ((amount_cents > 0)),
  constraint refunds_status_check check (
    status = any (
      array[
        'pending'::text,
        'approved'::text,
        'rejected'::text,
        'processing'::text,
        'completed'::text,
        'failed'::text,
        'cancelled'::text
      ]
    )
  )
) TABLESPACE pg_default;

-- Indexes pour performances
create index IF not exists idx_refunds_order on public.refunds using btree (order_id) TABLESPACE pg_default;
create index IF not exists idx_refunds_client on public.refunds using btree (client_id) TABLESPACE pg_default;
create index IF not exists idx_refunds_provider on public.refunds using btree (provider_id) TABLESPACE pg_default;
create index IF not exists idx_refunds_status on public.refunds using btree (status) TABLESPACE pg_default;
create index IF not exists idx_refunds_created on public.refunds using btree (created_at desc) TABLESPACE pg_default;

-- Trigger pour updated_at
create trigger trg_refunds_updated_at BEFORE
update on refunds for EACH row
execute FUNCTION update_updated_at_column ();

-- 2. Ajouter colonne refund_status dans orders si elle n'existe pas
-- alter table orders add column refund_status text default null;

-- 3. Ajouter colonne refund_id dans provider_earnings si elle n'existe pas
-- alter table provider_earnings add column refund_id uuid null;
-- alter table provider_earnings add constraint provider_earnings_refund_id_fkey 
--   foreign key (refund_id) references refunds (id) on delete set null;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour vérifier si un remboursement est possible
create or replace function can_refund_order(p_order_id uuid)
returns table (can_refund boolean, reason text, pending_amount bigint) as $$
declare
  v_order_status text;
  v_payment_status text;
  v_pending_earning bigint;
  v_provider_id uuid;
begin
  -- Récupérer les infos de la commande
  select status, payment_status, provider_id into v_order_status, v_payment_status, v_provider_id
  from orders where id = p_order_id;
  
  if not found then
    return query select false, 'Order not found', 0::bigint;
    return;
  end if;
  
  -- Vérifier si la commande a été payée
  if v_payment_status != 'succeeded' then
    return query select false, 'Payment not completed', 0::bigint;
    return;
  end if;
  
  -- Récupérer le montant en attente du provider_earnings
  select net_amount_cents into v_pending_earning
  from provider_earnings
  where order_id = p_order_id and status = 'pending';
  
  if v_pending_earning is null then
    v_pending_earning := 0;
  end if;
  
  -- Si déjà payé au provider, remboursement plus difficile
  if v_order_status = 'completed' and v_pending_earning = 0 then
    return query select true, 'Order completed but money still refundable', 0::bigint;
    return;
  end if;
  
  -- Sinon remboursement possible
  return query select true, 'Refund possible', v_pending_earning;
end;
$$ language plpgsql;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
