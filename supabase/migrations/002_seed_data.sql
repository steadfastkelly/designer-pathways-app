-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Data — Run AFTER creating auth users in Supabase Auth dashboard
-- Replace UUIDs below with the actual UUIDs from auth.users
-- ─────────────────────────────────────────────────────────────────────────────

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create accounts for each email below
-- 3. Copy their UUIDs and replace the placeholders
-- 4. Run this script in the SQL editor

-- Example structure (replace with real UUIDs):
/*
INSERT INTO profiles (id, email, name, role, external_title, pathway_level, pathway_track, hire_date, region,
  scheduled_hours_per_week, schedule_type, location_city, location_state, personality_mbti, personality_enneagram, bio)
VALUES
  -- Kelly Phillips (admin)
  ('KELLY_UUID', 'kelly@steadfast.design', 'Kelly Phillips', 'admin', 'Creative Director',
   'creative_director', 'leader', '2020-06-01', 'Southeast', 36, 'standard',
   'Taylors', 'SC', null, null,
   'Creative Director leading the design team. CrossFit amateur and multi-tasking aficionado.'),

  -- Tori Allen (supervisor)
  ('TORI_UUID', 'tori@steadfast.design', 'Tori Allen', 'supervisor', 'Director of People & Projects',
   null, null, '2021-09-20', 'Southeast', 36, 'standard',
   'Youngsville', 'NC', null, null,
   'The glue that keeps everything running smoothly.'),

  -- Kayla Johnson
  ('KAYLA_UUID', 'kayla@steadfast.design', 'Kayla Johnson', 'designer', 'Design Lead',
   'design_lead', 'teacher', '2023-03-08', 'Midwest', 36, 'standard',
   'Oklahoma City', 'OK', null, null,
   'Design Lead focused on design efficiency, process and visual quality. Meticulous photographer on the side.'),

  -- Joy Rhine
  ('JOY_UUID', 'joy@steadfast.design', 'Joy Rhine', 'designer', 'Senior Graphic Designer',
   'strategic_designer', 'builder', '2025-10-14', 'Midwest', 36, 'standard',
   'Grand Rapids', 'MI', 'ENFP', '7w8',
   'Newest Senior Designer. Thrives on collaboration, positivity, and challenge.'),

  -- Jen Reynolds (PUMP Act — 23hr/week)
  ('JEN_UUID', 'jen@steadfast.design', 'Jen Reynolds', 'designer', 'Senior Designer',
   'mindful_designer', 'builder', '2020-10-26', 'Southeast', 23, 'pump_act',
   'Greenville', 'SC', null, null,
   'Resident branding and packaging queen. Returns full-time June 2026.'),

  -- Rachel Barton
  ('RACHEL_UUID', 'rachel@steadfast.design', 'Rachel Barton', 'designer', 'Graphic Designer',
   'strategic_designer', 'builder', '2021-04-16', 'Southeast', 36, 'standard',
   'Charlotte', 'NC', null, null,
   'Brings illustration expertise and production design efficiency.'),

  -- Miranda Byrd
  ('MIRANDA_UUID', 'miranda@steadfast.design', 'Miranda Byrd', 'designer', 'Designer',
   'mindful_designer', 'builder', '2024-03-25', 'Midwest', 36, 'standard',
   'Kansas City', 'MO', null, null,
   'Expertise in layout, typography, data visualization. Old house lover.'),

  -- Carson Long
  ('CARSON_UUID', 'carson@steadfast.design', 'Carson Long', 'designer', 'Designer',
   'mindful_designer', 'builder', '2024-03-25', 'Southeast', 36, 'standard',
   'Greenville', 'SC', null, null,
   'Detail-oriented and determined. Passionate about web, branding, coding.'),

  -- Jack Walgamuth
  ('JACK_UUID', 'jack@steadfast.design', 'Jack Walgamuth', 'designer', 'Designer',
   'mindful_designer', 'builder', '2025-04-28', 'Midwest', 36, 'standard',
   'Minneapolis', 'MN', null, null,
   '6+ years experience in branding, illustration, web design.');

-- Compensation history (replace designer UUIDs)
INSERT INTO compensation_history (designer_id, salary, effective_date, notes) VALUES
  ('KELLY_UUID', 95000, '2020-06-01', 'Starting salary'),
  ('KELLY_UUID', 105000, '2022-01-01', 'Annual review'),
  ('KELLY_UUID', 115000, '2024-01-01', 'Annual review'),
  ('KAYLA_UUID', 65000, '2023-03-08', 'Starting salary'),
  ('KAYLA_UUID', 72000, '2024-01-01', 'Promoted to Design Lead'),
  ('KAYLA_UUID', 76000, '2025-01-01', 'Annual review'),
  ('JOY_UUID', 120000, '2025-10-14', 'Starting salary — signed with bonus'),
  ('JEN_UUID', 76000, '2020-10-26', 'Starting salary'),
  ('JEN_UUID', 80000, '2024-01-01', 'Annual review'),
  ('RACHEL_UUID', 68000, '2021-04-16', 'Starting salary'),
  ('RACHEL_UUID', 74000, '2025-01-01', 'Annual review'),
  ('MIRANDA_UUID', 62000, '2024-03-25', 'Starting salary'),
  ('CARSON_UUID', 60000, '2024-03-25', 'Starting salary'),
  ('JACK_UUID', 70000, '2025-04-28', 'Starting salary');

-- Joy Rhine bonuses
INSERT INTO bonus_records (designer_id, amount, bonus_type, payout_date, is_paid, notes) VALUES
  ('JOY_UUID', 5000, 'signing', '2025-11-20', true, 'First half of signing bonus'),
  ('JOY_UUID', 5000, 'signing', '2026-03-14', false, 'Second half at end of 90-day period'),
  ('JOY_UUID', 5000, 'performance', '2026-03-14', false, '90-day performance bonus');
*/
