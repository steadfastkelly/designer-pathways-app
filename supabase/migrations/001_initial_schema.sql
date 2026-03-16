-- ─────────────────────────────────────────────────────────────────────────────
-- Designer Pathways — Initial Schema Migration
-- Run this in the Supabase SQL editor after creating your project
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Custom Enum Types ────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'designer');
CREATE TYPE pathway_level AS ENUM (
  'core_designer', 'mindful_designer', 'strategic_designer',
  'design_lead', 'senior_design_lead', 'associate_creative_director', 'creative_director'
);
CREATE TYPE pathway_track AS ENUM ('builder', 'teacher', 'leader');
CREATE TYPE schedule_type AS ENUM ('standard', 'pump_act', 'part_time', 'reduced');
CREATE TYPE review_type AS ENUM ('45_day', '90_day', 'biannual', 'annual');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'met', 'partially_met', 'not_met');
CREATE TYPE goal_target_type AS ENUM ('completion', 'metric', 'behavior', 'milestone');
CREATE TYPE value_multiplier_category AS ENUM ('craft', 'collaboration', 'leadership', 'technical', 'culture');
CREATE TYPE value_multiplier_status AS ENUM ('active', 'inactive');
CREATE TYPE bonus_type AS ENUM ('performance', 'signing', 'milestone');
CREATE TYPE coaching_category AS ENUM (
  'billable_hours', 'logging_accuracy', 'deadlines', 'communication',
  'conduct', 'pathway_progression', 'workload', 'general'
);

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- 1. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'designer',
  external_title TEXT,
  pathway_level pathway_level,
  pathway_track pathway_track,
  hire_date DATE,
  region TEXT,
  scheduled_hours_per_week INTEGER DEFAULT 36,
  schedule_type schedule_type DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  personality_mbti TEXT,
  personality_enneagram TEXT,
  personality_notes TEXT,
  location_city TEXT,
  location_state TEXT,
  phone TEXT,
  birthday DATE,
  bio TEXT,
  special_circumstances_notes TEXT,
  billable_target_min DECIMAL(5,2),
  billable_target_max DECIMAL(5,2),
  billable_target_exempt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. monthly_hours_summary
CREATE TABLE monthly_hours_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- 3. timely_snapshots
CREATE TABLE timely_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- 4. clickup_deadlines
CREATE TABLE clickup_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  due_date DATE,
  completed_date DATE,
  was_late BOOLEAN DEFAULT false,
  days_late INTEGER DEFAULT 0,
  attribution TEXT CHECK (attribution IN ('designer', 'client', 'out_of_control')),
  attribution_set_by UUID REFERENCES profiles(id),
  attribution_set_at TIMESTAMPTZ,
  attribution_notes TEXT,
  approved_by_kelly BOOLEAN DEFAULT false,
  approval_notes TEXT,
  clickup_task_id TEXT,
  clickup_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. coaching_notes
CREATE TABLE coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  category coaching_category DEFAULT 'general',
  related_cycle_date DATE,
  before_metric_value DECIMAL(8,2),
  after_metric_value DECIMAL(8,2),
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. reflection_entries
CREATE TABLE reflection_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  focus_response TEXT,
  blockers_response TEXT,
  next_steps_response TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. value_multipliers
CREATE TABLE value_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category value_multiplier_category NOT NULL,
  name TEXT NOT NULL,
  context_note TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  added_by UUID REFERENCES profiles(id),
  status value_multiplier_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. review_records
CREATE TABLE review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- 9. performance_goals
CREATE TABLE performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  review_id UUID REFERENCES review_records(id),
  description TEXT NOT NULL,
  category TEXT,
  target_date DATE,
  target_type goal_target_type DEFAULT 'completion',
  status goal_status DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. compensation_history
CREATE TABLE compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  salary DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. bonus_records
CREATE TABLE bonus_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bonus_type bonus_type NOT NULL,
  payout_date DATE,
  is_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. pip_records
CREATE TABLE pip_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  reason TEXT,
  timeline_days INTEGER DEFAULT 90,
  end_date DATE,
  outcome TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. pip_goals
CREATE TABLE pip_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pip_id UUID REFERENCES pip_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  measurable_target TEXT,
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. sync_log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── Auto-update Trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_hours_updated_at BEFORE UPDATE ON monthly_hours_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_notes_updated_at BEFORE UPDATE ON coaching_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_goals_updated_at BEFORE UPDATE ON performance_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pip_records_updated_at BEFORE UPDATE ON pip_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clickup_deadlines_updated_at BEFORE UPDATE ON clickup_deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_records_updated_at BEFORE UPDATE ON review_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_hours_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE timely_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE clickup_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Admin full access" ON profiles FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Supervisor read all" ON profiles FOR SELECT USING (auth_user_role() = 'supervisor');
CREATE POLICY "Designer read own" ON profiles FOR SELECT USING (auth.uid() = id);

-- monthly_hours_summary
CREATE POLICY "Admin full access" ON monthly_hours_summary FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Supervisor read all" ON monthly_hours_summary FOR SELECT USING (auth_user_role() = 'supervisor');
CREATE POLICY "Designer read own" ON monthly_hours_summary FOR SELECT USING (designer_id = auth.uid());

-- coaching_notes (admin only)
CREATE POLICY "Admin full access" ON coaching_notes FOR ALL USING (auth_user_role() = 'admin');

-- compensation_history (admin only)
CREATE POLICY "Admin full access" ON compensation_history FOR ALL USING (auth_user_role() = 'admin');

-- bonus_records (admin only)
CREATE POLICY "Admin full access" ON bonus_records FOR ALL USING (auth_user_role() = 'admin');

-- pip_records (admin only)
CREATE POLICY "Admin full access" ON pip_records FOR ALL USING (auth_user_role() = 'admin');

-- pip_goals (admin only)
CREATE POLICY "Admin full access" ON pip_goals FOR ALL USING (auth_user_role() = 'admin');

-- sync_log (admin only)
CREATE POLICY "Admin full access" ON sync_log FOR ALL USING (auth_user_role() = 'admin');

-- timely_snapshots
CREATE POLICY "Admin full access" ON timely_snapshots FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Supervisor read all" ON timely_snapshots FOR SELECT USING (auth_user_role() = 'supervisor');

-- clickup_deadlines
CREATE POLICY "Admin full access" ON clickup_deadlines FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Supervisor read all" ON clickup_deadlines FOR SELECT USING (auth_user_role() = 'supervisor');
CREATE POLICY "Designer read own" ON clickup_deadlines FOR SELECT USING (designer_id = auth.uid());

-- reflection_entries
CREATE POLICY "Admin full access" ON reflection_entries FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Designer read own" ON reflection_entries FOR SELECT USING (designer_id = auth.uid());
CREATE POLICY "Designer insert own" ON reflection_entries FOR INSERT WITH CHECK (designer_id = auth.uid());

-- value_multipliers
CREATE POLICY "Admin full access" ON value_multipliers FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Designer read own" ON value_multipliers FOR SELECT USING (designer_id = auth.uid());

-- review_records
CREATE POLICY "Admin full access" ON review_records FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Designer read shared" ON review_records FOR SELECT USING (designer_id = auth.uid() AND shared_with_designer_at IS NOT NULL);

-- performance_goals
CREATE POLICY "Admin full access" ON performance_goals FOR ALL USING (auth_user_role() = 'admin');
CREATE POLICY "Designer read own" ON performance_goals FOR SELECT USING (designer_id = auth.uid());
