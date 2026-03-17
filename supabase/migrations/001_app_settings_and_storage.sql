-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: App Settings table + Supabase Storage for avatars
-- Run this in your Supabase SQL Editor at:
--   https://hkcycyfixhrshlxqdkna.supabase.co → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. App Settings table ────────────────────────────────────────────────────
-- Stores API credentials and sync metadata (Timely, ClickUp).
-- Only accessible by authenticated admin users via RLS.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write settings
CREATE POLICY "Admins can manage settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── 2. Avatar Storage bucket ─────────────────────────────────────────────────
-- Run this in the Supabase dashboard:
--   Storage → New bucket → Name: "avatars" → Public: ON
--   Or uncomment the SQL below if your Supabase version supports it:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload their own avatar
-- (upsert into avatars/{user_id}.ext)
-- CREATE POLICY "Users can upload their avatar"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'avatars');

-- Allow public read of all avatars
-- CREATE POLICY "Public avatar read"
--   ON storage.objects
--   FOR SELECT
--   TO public
--   USING (bucket_id = 'avatars');

-- Allow authenticated users to update/delete avatars
-- CREATE POLICY "Admins can manage avatars"
--   ON storage.objects
--   FOR ALL
--   TO authenticated
--   USING (bucket_id = 'avatars');


-- ── 3. Ensure profiles has avatar_url column ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;


-- ── 4. Ensure clickup_deadlines has clickup_task_id + designer_id unique ─────
-- Needed for upsert conflict resolution during ClickUp sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clickup_deadlines_task_designer_unique'
  ) THEN
    ALTER TABLE public.clickup_deadlines
      ADD CONSTRAINT clickup_deadlines_task_designer_unique
      UNIQUE (clickup_task_id, designer_id);
  END IF;
END $$;


-- ── 5. Ensure monthly_hours_summary has designer+year+month unique ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_hours_summary_designer_year_month_unique'
  ) THEN
    ALTER TABLE public.monthly_hours_summary
      ADD CONSTRAINT monthly_hours_summary_designer_year_month_unique
      UNIQUE (designer_id, year, month);
  END IF;
END $$;
