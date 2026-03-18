-- Fix: ensure profiles.id = auth.users.id for kelly@steadfast.design
-- so that auth_user_role() returns 'admin' and the RLS policies on
-- api_credentials and app_settings allow writes.
--
-- Root cause: 006_set_admin_role.sql used a hardcoded UUID that does not
-- match Kelly's actual auth.users.id. auth_user_role() queries
--   SELECT role FROM profiles WHERE id = auth.uid()
-- so if those UUIDs differ it returns NULL and every admin-gated write fails.
--
-- This migration is idempotent. If the UUIDs already match it simply
-- re-confirms role = 'admin' and exits.
--
-- NOTE: looks up the old profile by its UUID (from 006_set_admin_role.sql)
-- rather than by email, because the live profiles table has no email column.

DO $$
DECLARE
  v_auth_id  UUID;
  v_old_id   UUID := 'c3c2b02f-5c81-4762-9e7d-54cd9a1ab2b0'; -- hardcoded in 006
BEGIN
  -- Get Kelly's real auth UUID from the auth schema (always has email).
  SELECT id INTO v_auth_id FROM auth.users WHERE email = 'kelly@steadfast.design';

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found for kelly@steadfast.design — cannot fix';
  END IF;

  -- Case 1: Profile already exists at the correct auth UUID → just ensure role.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_auth_id) THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_auth_id;
    RAISE NOTICE 'Profile already at correct UUID (%). Ensured role = admin.', v_auth_id;
    RETURN;
  END IF;

  -- Case 2: No profile at the correct UUID. Check for the old hardcoded one.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_old_id) THEN
    RAISE EXCEPTION
      'No profile found at auth UUID (%) or old hardcoded UUID (%). '
      'Run: SELECT id, role FROM public.profiles LIMIT 20; to inspect.',
      v_auth_id, v_old_id;
  END IF;

  -- UUIDs differ: update all child-table FK references BEFORE touching
  -- profiles.id, because none of the FKs carry ON UPDATE CASCADE.
  UPDATE public.monthly_hours_summary SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.timely_snapshots      SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.clickup_deadlines     SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.clickup_deadlines     SET attribution_set_by = v_auth_id WHERE attribution_set_by = v_old_id;
  UPDATE public.coaching_notes        SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.coaching_notes        SET author_id          = v_auth_id WHERE author_id          = v_old_id;
  UPDATE public.reflection_entries    SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.value_multipliers     SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.value_multipliers     SET added_by           = v_auth_id WHERE added_by           = v_old_id;
  UPDATE public.review_records        SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.performance_goals     SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.compensation_history  SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.bonus_records         SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;
  UPDATE public.pip_records           SET designer_id        = v_auth_id WHERE designer_id        = v_old_id;

  -- Now safe to update the PK: no child row references v_old_id anymore,
  -- and v_auth_id already exists in auth.users (satisfying the FK).
  UPDATE public.profiles
  SET    id   = v_auth_id,
         role = 'admin'
  WHERE  id   = v_old_id;

  RAISE NOTICE 'Fixed profiles.id % → % for kelly@steadfast.design', v_old_id, v_auth_id;
END $$;
