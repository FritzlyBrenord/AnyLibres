-- =====================================================
-- TABLE: profiles
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  email TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  role role_enum NOT NULL DEFAULT 'client',
  locale TEXT DEFAULT 'fr',
  currency currency_code DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  notification_settings JSONB DEFAULT '{"emailOrders": true, "pushEnabled": false, "emailMessages": true, "emailPromotions": true}',
  preferences JSONB DEFAULT '{"darkMode": false, "compactView": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_username_key UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;