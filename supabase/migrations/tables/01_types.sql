-- =====================================================
-- CUSTOM TYPES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'CAD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('client', 'provider', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_visibility AS ENUM ('public', 'private', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('order', 'message', 'review', 'system', 'payment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;