-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Create all missing tables
-- Safe to run even if some objects already exist.
-- The profiles table already exists — this script skips it.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Enum types (safe — ignores duplicates) ───────────────────────────

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'designer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE pathway_level AS ENUM (
  'core_designer', 'mindful_designer', 'strategic_designer',
  'design_lead', 'senior_design_lead', 'associate_creative_director', 'creative_director'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE pathway_track AS ENUM ('builder', 'teacher', 'leader');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE schedule_type AS ENUM ('standard', 'pump_act', 'part_time', 'reduced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE review_type AS ENUM ('45_day', '90_day', 'biannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'met', 'partially_met', 'not_met');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE goal_target_type AS ENUM ('completion', 'metric', 'behavior', 'milestone');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE value_multiplier_category AS ENUM ('craft', 'collaboration', 'leadership', 'technical', 'culture');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE value_multiplier_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE bonus_type AS ENUM ('performance', 'signing', 'milestone');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE coaching_category AS ENUM (
  'billable_hours', 'logging_accuracy', 'deadlines', 'communication',
  'conduct', 'pathway_progression', 'workload', 'general'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── Step 2: Ensure profiles has all required columns ─────────────────────────
-- (The table exists; we only add columns that might be missing)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_mbti TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_enneagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS special_circumstances_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billable_target_min DECIMAL(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billable_target_max DECIMAL(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billable_target_exempt BOOLEAN DEFAULT false;


-- ── Step 3: Helper functions ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ── Step 4: Enable RLS on profiles + ensure policies exist ───────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (auth_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Supervisor read all" ON public.profiles FOR SELECT USING (auth_user_role() = 'supervisor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Designer read own" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── Step 5: Create missing tables ────────────────────────────────────────────

-- monthly_hours_summary
CREATE TABLE IF NOT EXISTS public.monthly_hours_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_hours DECIMAL(8,2) DEFAULT 0,
  billable_hours DECIMAL(8,2) DEFAULT 0,
  internal_hours DECIMAL(8,2) DEFAULT 0,
  billable_percent DECIMAL(5,2) DEFAULT 0,
  internal_breakdown JSONB DEFAULT '{}',
  logging_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(designer_id, year, month)
);

-- timely_snapshots
CREATE TABLE IF NOT EXISTS public.timely_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  entry_date DATE NOT NULL,
  project_name TEXT,
  original_project TEXT,
  current_project TEXT,
  hours DECIMAL(6,2),
  tag TEXT,
  note TEXT,
  was_corrected BOOLEAN DEFAULT false,
  corrected_at TIMESTAMPTZ,
  timely_entry_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clickup_deadlines
CREATE TABLE IF NOT EXISTS public.clickup_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  due_date DATE,
  completed_date DATE,
  was_late BOOLEAN DEFAULT false,
  days_late INTEGER DEFAULT 0,
  attribution TEXT CHECK (attribution IN ('designer', 'client', 'out_of_control')),
  attribution_set_by UUID REFERENCES public.profiles(id),
  attribution_set_at TIMESTAMPTZ,
  attribution_notes TEXT,
  approved_by_kelly BOOLEAN DEFAULT false,
  approval_notes TEXT,
  clickup_task_id TEXT,
  clickup_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- coaching_notes
CREATE TABLE IF NOT EXISTS public.coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  category coaching_category DEFAULT 'general',
  related_cycle_date DATE,
  before_metric_value DECIMAL(8,2),
  after_metric_value DECIMAL(8,2),
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- reflection_entries
CREATE TABLE IF NOT EXISTS public.reflection_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  focus_response TEXT,
  blockers_response TEXT,
  next_steps_response TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- value_multipliers
CREATE TABLE IF NOT EXISTS public.value_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category value_multiplier_category NOT NULL,
  name TEXT NOT NULL,
  context_note TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  added_by UUID REFERENCES public.profiles(id),
  status value_multiplier_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- review_records
CREATE TABLE IF NOT EXISTS public.review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_type review_type NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_rating DECIMAL(3,2),
  kelly_notes TEXT,
  completed_at TIMESTAMPTZ,
  shared_with_designer_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- performance_goals
CREATE TABLE IF NOT EXISTS public.performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.review_records(id),
  description TEXT NOT NULL,
  category TEXT,
  target_date DATE,
  target_type goal_target_type DEFAULT 'completion',
  status goal_status DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- compensation_history
CREATE TABLE IF NOT EXISTS public.compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  salary DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- bonus_records
CREATE TABLE IF NOT EXISTS public.bonus_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bonus_type bonus_type NOT NULL,
  payout_date DATE,
  is_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pip_records
CREATE TABLE IF NOT EXISTS public.pip_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  reason TEXT,
  timeline_days INTEGER DEFAULT 90,
  end_date DATE,
  outcome TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- pip_goals
CREATE TABLE IF NOT EXISTS public.pip_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pip_id UUID REFERENCES public.pip_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  measurable_target TEXT,
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sync_log
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Step 6: Unique constraints (safe — skip if already exist) ─────────────────

DO $$ BEGIN
  ALTER TABLE public.clickup_deadlines
    ADD CONSTRAINT clickup_deadlines_task_designer_unique
    UNIQUE (clickup_task_id, designer_id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN invalid_table_definition THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.monthly_hours_summary
    ADD CONSTRAINT monthly_hours_summary_designer_year_month_unique
    UNIQUE (designer_id, year, month);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN invalid_table_definition THEN NULL; END $$;


-- ── Step 7: Triggers ──────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_hours_updated_at ON public.monthly_hours_summary;
CREATE TRIGGER update_monthly_hours_updated_at
  BEFORE UPDATE ON public.monthly_hours_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coaching_notes_updated_at ON public.coaching_notes;
CREATE TRIGGER update_coaching_notes_updated_at
  BEFORE UPDATE ON public.coaching_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clickup_deadlines_updated_at ON public.clickup_deadlines;
CREATE TRIGGER update_clickup_deadlines_updated_at
  BEFORE UPDATE ON public.clickup_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_records_updated_at ON public.review_records;
CREATE TRIGGER update_review_records_updated_at
  BEFORE UPDATE ON public.review_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_goals_updated_at ON public.performance_goals;
CREATE TRIGGER update_performance_goals_updated_at
  BEFORE UPDATE ON public.performance_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pip_records_updated_at ON public.pip_records;
CREATE TRIGGER update_pip_records_updated_at
  BEFORE UPDATE ON public.pip_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── Step 8: Row Level Security on new tables ──────────────────────────────────

ALTER TABLE public.monthly_hours_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timely_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pip_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pip_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;


-- ── Step 9: RLS Policies ──────────────────────────────────────────────────────

-- monthly_hours_summary
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.monthly_hours_summary FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Supervisor read all" ON public.monthly_hours_summary FOR SELECT USING (auth_user_role() = 'supervisor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read own" ON public.monthly_hours_summary FOR SELECT USING (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- coaching_notes (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.coaching_notes FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- compensation_history (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.compensation_history FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- bonus_records (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.bonus_records FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- pip_records (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.pip_records FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- pip_goals (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.pip_goals FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- sync_log (admin only)
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.sync_log FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- timely_snapshots
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.timely_snapshots FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Supervisor read all" ON public.timely_snapshots FOR SELECT USING (auth_user_role() = 'supervisor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- clickup_deadlines
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.clickup_deadlines FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Supervisor read all" ON public.clickup_deadlines FOR SELECT USING (auth_user_role() = 'supervisor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read own" ON public.clickup_deadlines FOR SELECT USING (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- reflection_entries
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.reflection_entries FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read own" ON public.reflection_entries FOR SELECT USING (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer insert own" ON public.reflection_entries FOR INSERT WITH CHECK (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- value_multipliers
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.value_multipliers FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read own" ON public.value_multipliers FOR SELECT USING (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- review_records
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.review_records FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read shared" ON public.review_records FOR SELECT USING (designer_id = auth.uid() AND shared_with_designer_at IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- performance_goals
DO $$ BEGIN CREATE POLICY "Admin full access" ON public.performance_goals FOR ALL USING (auth_user_role() = 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Designer read own" ON public.performance_goals FOR SELECT USING (designer_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- app_settings (admin only)
DO $$ BEGIN
  CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── Step 10: Verify ───────────────────────────────────────────────────────────
-- Run this at the end to confirm all tables now exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
