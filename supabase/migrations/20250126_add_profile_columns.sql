-- Migration: Add missing columns to profiles table
-- Date: 2025-01-26

-- Add location column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
  END IF;
END $$;

-- Add website column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;
END $$;

-- Add email_verified column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add phone_verified column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
  END IF;
END $$;