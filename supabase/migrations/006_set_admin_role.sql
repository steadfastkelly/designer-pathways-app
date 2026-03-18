-- Grant admin role to Kelly's account
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Update the profiles table role
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'c3c2b02f-5c81-4762-9e7d-54cd9a1ab2b0';

-- 2. Update auth.users app metadata (used by some auth checks)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE id = 'c3c2b02f-5c81-4762-9e7d-54cd9a1ab2b0';
