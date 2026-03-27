-- Seed the Timely incremental-sync cursor setting.
-- Uses a day string so the scheduled sync can request an explicit date range.
INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('timely_sync_cursor', '1970-01-01', now())
ON CONFLICT (key) DO NOTHING;
