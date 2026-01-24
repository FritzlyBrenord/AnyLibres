
-- 1. Create the Disputes table (if not exists)
create table if not exists public.disputes (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id),
  opened_by_id uuid not null references public.profiles(user_id),
  reason text not null,
  details text not null,
  status text not null default 'open',
  resolution_type text,
  resolution_note text,
  refund_amount_cents integer,
  admin_id uuid, -- Admin who resolved
  analysis_by_id uuid, -- Admin who started analysis
  analysis_started_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Fix Foreign Key for disputes.opened_by_id
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_opened_by_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER TABLE public.disputes 
      ADD CONSTRAINT disputes_opened_by_id_fkey 
      FOREIGN KEY (opened_by_id) 
      REFERENCES public.profiles(user_id);
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Fix Foreign Keys for orders (client_id, provider_id) to allow joins with profiles
DO $$ 
BEGIN
  -- Add FK for client_id -> profiles(user_id) if not exists
  BEGIN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_client_id_profiles_fkey 
      FOREIGN KEY (client_id) 
      REFERENCES public.profiles(user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; -- Ignore if exists
  WHEN OTHERS THEN NULL; END;

  -- Add FK for provider_id -> profiles(user_id) if not exists
  BEGIN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_provider_id_profiles_fkey 
      FOREIGN KEY (provider_id) 
      REFERENCES public.profiles(user_id);
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL; END;
END $$;

-- 2. Add unique constraint
create unique index if not exists disputes_order_id_idx on public.disputes (order_id) where status = 'open';

-- 3. Enable RLS
alter table public.disputes enable row level security;

-- 4. Policies

-- Policy for VIEWING disputes
drop policy if exists "Users can view disputes for their orders" on public.disputes;
create policy "Users can view disputes for their orders"
  on public.disputes for select
  using (
    -- User is the Client or Provider of the linked Order
    auth.uid() in (
      select client_id from public.orders where id = order_id
      union
      select provider_id from public.orders where id = order_id
    )
    OR 
    -- User is an Admin
    exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'admin'
    )
  );

-- Policy for INSERTING disputes
drop policy if exists "Users can create disputes for their orders" on public.disputes;
create policy "Users can create disputes for their orders"
  on public.disputes for insert
  with check (
    auth.uid() in (
      select client_id from public.orders where id = order_id
      union
      select provider_id from public.orders where id = order_id
    )
  );

-- Policy for UPDATING disputes
drop policy if exists "Users can update their own disputes" on public.disputes;
create policy "Users can update their own disputes"
  on public.disputes for update
  using (
    opened_by_id = auth.uid()
    OR
    exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'admin'
    )
  );
