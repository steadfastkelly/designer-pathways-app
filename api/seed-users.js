// Creates all Steadfast team members in Supabase Auth + profiles table.
// Safe to call multiple times (idempotent — skips existing users).
// Requires SUPABASE_SERVICE_ROLE_KEY env var.

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const TEMP_PASSWORD = 'Steadfast2026!';

const USERS = [
  {
    email: 'kelly@steadfast.design',
    profile: {
      email: 'kelly@steadfast.design', name: 'Kelly Phillips', role: 'admin',
      external_title: 'Creative Director', pathway_level: 'creative_director', pathway_track: 'leader',
      hire_date: '2020-11-12', region: 'Southeast', location_city: 'Taylors', location_state: 'SC',
      phone: '(803) 443-1425', birthday: '1900-11-12', scheduled_hours_per_week: 36, schedule_type: 'standard',
      billable_target_min: 30, billable_target_max: 37, billable_target_exempt: true, is_active: true,
    },
    compensation: [
      { effective_date: '2020-11-12', salary: 0, notes: 'Starting salary' },
      { effective_date: '2022-01-01', salary: 0, notes: 'Annual review' },
      { effective_date: '2024-01-01', salary: 0, notes: 'Annual review' },
    ],
  },
  {
    email: 'tori@steadfast.design',
    profile: {
      email: 'tori@steadfast.design', name: 'Tori Allen', role: 'supervisor',
      external_title: 'Director of People & Projects', hire_date: '2021-06-22',
      region: 'Southeast', location_city: 'Youngsville', location_state: 'NC',
      phone: '919-208-9977', birthday: '1900-08-09', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_exempt: false, is_active: true,
    },
    compensation: [
      { effective_date: '2021-06-22', salary: 0, notes: 'Starting salary' },
      { effective_date: '2023-01-01', salary: 0, notes: 'Annual review' },
      { effective_date: '2025-01-01', salary: 0, notes: 'Annual review' },
    ],
  },
  {
    email: 'jake@steadfast.design',
    profile: {
      email: 'jake@steadfast.design', name: 'Jake Dohm', role: 'designer',
      external_title: 'Director of Accounts & Development', pathway_track: 'leader',
      hire_date: '2021-09-20', region: 'Southeast', location_city: 'Wake Forest', location_state: 'NC',
      phone: '(919) 819-2874', birthday: '1900-02-10', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_exempt: false, is_active: true,
    },
    compensation: [
      { effective_date: '2021-09-20', salary: 0, notes: 'Starting salary' },
      { effective_date: '2023-01-01', salary: 0, notes: 'Annual review' },
      { effective_date: '2025-01-01', salary: 0, notes: 'Annual review' },
    ],
  },
  {
    email: 'taylor@steadfast.design',
    profile: {
      email: 'taylor@steadfast.design', name: 'Taylor Tsantles', role: 'designer',
      external_title: 'President & Chief Strategist', pathway_track: 'leader',
      hire_date: '2018-01-01', region: 'Southeast', location_city: 'Wake Forest', location_state: 'NC',
      phone: '919-610-5308', birthday: '1900-02-26', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2018-01-01', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'brittney@steadfast.design',
    profile: {
      email: 'brittney@steadfast.design', name: 'Brittney Austin', role: 'designer',
      external_title: 'Account Manager', hire_date: '2025-05-19',
      region: 'Southeast', location_city: 'Greenville', location_state: 'SC',
      phone: '(864) 270-6383', scheduled_hours_per_week: 36, schedule_type: 'standard',
      billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2025-05-19', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'rebecca@steadfast.design',
    profile: {
      email: 'rebecca@steadfast.design', name: 'Rebecca Lippert', role: 'designer',
      external_title: 'Account Manager', hire_date: '2025-03-17',
      region: 'Southeast', location_city: 'High Point', location_state: 'NC',
      phone: '262-804-0931', scheduled_hours_per_week: 36, schedule_type: 'standard',
      billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2025-03-17', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'kayla@steadfast.design',
    profile: {
      email: 'kayla@steadfast.design', name: 'Kayla Johnson', role: 'designer',
      external_title: 'Design Lead', pathway_level: 'design_lead', pathway_track: 'teacher',
      hire_date: '2023-03-08', region: 'Midwest', location_city: 'Oklahoma City', location_state: 'OK',
      phone: '(251) 654-2131', birthday: '1900-08-17', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_min: 60, billable_target_max: 68,
      billable_target_exempt: false, is_active: true,
    },
    compensation: [
      { effective_date: '2023-03-08', salary: 0, notes: 'Starting salary as Designer' },
      { effective_date: '2024-01-01', salary: 0, notes: 'Promoted to Design Lead' },
      { effective_date: '2025-01-01', salary: 0, notes: 'Annual review' },
    ],
  },
  {
    email: 'joy@steadfast.design',
    profile: {
      email: 'joy@steadfast.design', name: 'Joy Rhine', role: 'designer',
      external_title: 'Senior Graphic Designer', pathway_level: 'strategic_designer', pathway_track: 'builder',
      hire_date: '2025-10-14', region: 'Midwest', location_city: 'Grand Rapids', location_state: 'MI',
      phone: '(989) 494-7823', birthday: '1900-06-20', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_min: 30, billable_target_max: 37,
      billable_target_exempt: true, is_active: true,
      personality_mbti: 'ENFP', personality_enneagram: '7w8',
    },
    compensation: [{ effective_date: '2025-10-14', salary: 120000, notes: 'Starting salary — signed with bonus' }],
    bonuses: [
      { amount: 5000, bonus_type: 'signing', payout_date: '2025-11-20', is_paid: true, notes: 'First half of signing bonus' },
      { amount: 5000, bonus_type: 'signing', payout_date: '2026-03-14', is_paid: false, notes: 'Second half at end of 90-day period' },
      { amount: 5000, bonus_type: 'performance', payout_date: '2026-03-14', is_paid: false, notes: '90-day performance bonus' },
    ],
  },
  {
    email: 'jen@steadfast.design',
    profile: {
      email: 'jen@steadfast.design', name: 'Jen Reynolds', role: 'designer',
      external_title: 'Senior Designer', pathway_level: 'mindful_designer', pathway_track: 'builder',
      hire_date: '2020-10-26', region: 'Southeast', location_city: 'Greenville', location_state: 'SC',
      phone: '(864) 373-1560', birthday: '1900-09-24', scheduled_hours_per_week: 23,
      schedule_type: 'pump_act', billable_target_min: 68, billable_target_max: 72,
      billable_target_exempt: false, is_active: true,
    },
    compensation: [
      { effective_date: '2020-10-26', salary: 0, notes: 'Starting salary' },
      { effective_date: '2024-01-01', salary: 0, notes: 'Annual review' },
      { effective_date: '2025-10-01', salary: 0, notes: 'Adjusted for PUMP Act 23hr/week schedule' },
    ],
  },
  {
    email: 'rachel@steadfast.design',
    profile: {
      email: 'rachel@steadfast.design', name: 'Rachel Barton', role: 'designer',
      external_title: 'Graphic Designer', pathway_level: 'strategic_designer', pathway_track: 'builder',
      hire_date: '2021-04-16', region: 'Southeast', location_city: 'Charlotte', location_state: 'NC',
      phone: '(864) 680-1548', birthday: '1900-09-21', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_min: 68, billable_target_max: 72,
      billable_target_exempt: false, is_active: true,
    },
    compensation: [
      { effective_date: '2021-04-16', salary: 0, notes: 'Starting salary' },
      { effective_date: '2023-01-01', salary: 0, notes: 'Annual review' },
      { effective_date: '2025-01-01', salary: 0, notes: 'Annual review' },
    ],
  },
  {
    email: 'miranda@steadfast.design',
    profile: {
      email: 'miranda@steadfast.design', name: 'Miranda Byrd', role: 'designer',
      external_title: 'Designer', pathway_level: 'mindful_designer', pathway_track: 'builder',
      hire_date: '2024-03-25', region: 'Midwest', location_city: 'Kansas City', location_state: 'MO',
      phone: '(816) 745-6394', birthday: '1900-04-16', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_min: 68, billable_target_max: 72,
      billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2024-03-25', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'carson@steadfast.design',
    profile: {
      email: 'carson@steadfast.design', name: 'Carson Long', role: 'designer',
      external_title: 'Designer', pathway_level: 'mindful_designer', pathway_track: 'builder',
      hire_date: '2024-03-25', region: 'Southeast', location_city: 'Greenville', location_state: 'SC',
      phone: '(919) 928-6149', birthday: '1900-04-08', scheduled_hours_per_week: 36,
      schedule_type: 'standard', billable_target_min: 68, billable_target_max: 72,
      billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2024-03-25', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'jack@steadfast.design',
    profile: {
      email: 'jack@steadfast.design', name: 'Jack Walgamuth', role: 'designer',
      external_title: 'Designer', pathway_level: 'mindful_designer', pathway_track: 'builder',
      hire_date: '2025-04-28', region: 'Midwest', location_city: 'Minneapolis', location_state: 'MN',
      phone: '(612) 743-6137', scheduled_hours_per_week: 36, schedule_type: 'standard',
      billable_target_min: 68, billable_target_max: 72, billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2025-04-28', salary: 0, notes: 'Starting salary' }],
  },
  {
    email: 'ben@steadfast.design',
    profile: {
      email: 'ben@steadfast.design', name: 'Ben Bunze', role: 'designer',
      external_title: 'Front End Developer', hire_date: '2021-06-01',
      region: 'Southeast', location_city: 'Winston-Salem', location_state: 'NC',
      birthday: '1900-10-02', scheduled_hours_per_week: 36, schedule_type: 'standard',
      billable_target_exempt: false, is_active: true,
    },
    compensation: [{ effective_date: '2021-06-01', salary: 0, notes: 'Starting salary' }],
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  const results = [];
  const errors = [];

  for (const user of USERS) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email, password: TEMP_PASSWORD, email_confirm: true,
      });

      let userId;
      if (authError) {
        if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email === user.email);
          if (!existing) { errors.push(`${user.email}: exists but could not look up ID`); continue; }
          userId = existing.id;
        } else {
          errors.push(`${user.email}: auth error — ${authError.message}`); continue;
        }
      } else {
        userId = authData.user.id;
      }

      let { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...user.profile }, { onConflict: 'id' });

      if (profileError) {
        // Email unique-constraint violation means a profile already exists with
        // this email but a different UUID (UUID mismatch). Update by email so
        // role and other fields stay current. The profiles.id mismatch must be
        // fixed by running supabase/migrations/007_fix_kelly_uuid.sql.
        const { error: updateError } = await supabase
          .from('profiles')
          .update(user.profile)
          .eq('email', user.email);
        if (updateError) {
          errors.push(`${user.email}: profile — ${updateError.message}`); continue;
        }
        errors.push(`${user.email}: WARNING — UUID mismatch (profiles.id ≠ auth.users.id). Profile fields updated by email. Run migration 007_fix_kelly_uuid.sql in Supabase to fix RLS.`);
      }

      for (const comp of (user.compensation ?? [])) {
        const { error: compError } = await supabase
          .from('compensation_history')
          .upsert({ designer_id: userId, ...comp }, { onConflict: 'designer_id,effective_date' });
        if (compError && !compError.message.includes('duplicate'))
          errors.push(`${user.email}: compensation — ${compError.message}`);
      }

      for (const bonus of (user.bonuses ?? [])) {
        const { error: bonusError } = await supabase
          .from('bonus_records')
          .insert({ designer_id: userId, ...bonus });
        if (bonusError && !bonusError.message.includes('duplicate'))
          errors.push(`${user.email}: bonus — ${bonusError.message}`);
      }

      results.push(`✓ ${user.profile.name} (${user.email})`);
    } catch (e) {
      errors.push(`${user.email}: unexpected — ${e.message}`);
    }
  }

  return res.status(200).json({ seeded: results, errors });
}
