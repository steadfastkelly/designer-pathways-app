-- Adds unique constraint on compensation_history(designer_id, effective_date)
-- so the seed function can safely upsert without duplicates.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'compensation_history_designer_date_unique'
  ) THEN
    ALTER TABLE public.compensation_history
      ADD CONSTRAINT compensation_history_designer_date_unique
      UNIQUE (designer_id, effective_date);
  END IF;
END $$;
