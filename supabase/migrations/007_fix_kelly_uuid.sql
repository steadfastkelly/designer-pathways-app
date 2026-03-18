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

DO $$
DECLARE
  v_auth_id  UUID;
  v_old_id   UUID;
BEGIN
  SELECT id INTO v_auth_id FROM auth.users        WHERE email = 'kelly@steadfast.design';
  SELECT id INTO v_old_id  FROM public.profiles   WHERE email = 'kelly@steadfast.design';

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found for kelly@steadfast.design — cannot fix';
  END IF;

  IF v_old_id IS NULL THEN
    RAISE EXCEPTION 'No profiles row found for kelly@steadfast.design — cannot fix';
  END IF;

  IF v_auth_id = v_old_id THEN
    -- UUIDs already match; just guarantee role is correct.
    UPDATE public.profiles SET role = 'admin' WHERE id = v_auth_id;
    RAISE NOTICE 'UUIDs already match (%). Ensured role = admin.', v_auth_id;
    RETURN;
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
