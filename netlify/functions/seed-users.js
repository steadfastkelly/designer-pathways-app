/**
 * POST /.netlify/functions/seed-users
 * Creates all Steadfast team members in Supabase Auth + profiles table.
 * Safe to call multiple times (idempotent — skips existing users).
 * Requires SUPABASE_SERVICE_ROLE_KEY env var in Netlify.
 */

const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const TEMP_PASSWORD = 'Steadfast2026!';

const USERS = [
  {
    email: 'kelly@steadfast.design',
    profile: {
      email: 'kelly@steadfast.design',
      name: 'Kelly Phillips',
      role: 'admin',
      external_title: 'Creative Director',
      pathway_level: 'creative_director',
      pathway_track: 'leader',
      hire_date: '2020-11-12',
      region: 'Southeast',
      location_city: 'Taylors',
      location_state: 'SC',
      phone: '(803) 443-1425',
      birthday: '1900-11-12',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 30,
      billable_target_max: 37,
      billable_target_exempt: true,
      is_active: true,
      personality_notes: 'CrossFit amateur and multi-tasking aficionado. Handles client communication, coordinates project handoffs, provides design review and proofing. Helps with Figma training and aids in onboarding.',
      bio: 'Kelly leads the design team and shapes impactful client projects and campaigns. She defines the overall creative strategy, inspires and mentors designers, drives innovative concepts, and presents confidently to clients.',
      special_circumstances_notes: 'Exempt from billable flagging. Soft billable goal of 10–15h/week. Primary admin and app owner.',
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
      email: 'tori@steadfast.design',
      name: 'Tori Allen',
      role: 'supervisor',
      external_title: 'Director of People & Projects',
      pathway_level: null,
      pathway_track: null,
      hire_date: '2021-06-22',
      region: 'Southeast',
      location_city: 'Youngsville',
      location_state: 'NC',
      phone: '919-208-9977',
      birthday: '1900-08-09',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'The glue. Always-positive cheerleader. Makes a mean charcuterie countertop during team week. First line of awareness on missed deadlines — surfaces issues to Kelly. Manages all Timely corrections and billing operations.',
      bio: 'Tori oversees project resourcing, execution, and team alignment. She manages HR, billing operations, print operations, and event coordination. When our people are thriving, our projects do too.',
      special_circumstances_notes: 'Supervisor role — no pathway level, no performance score, no status indicators. Not included in utilization analysis. Soft billable goal of 10–15h/week. Non-design role.',
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
      email: 'jake@steadfast.design',
      name: 'Jake Dohm',
      role: 'designer',
      external_title: 'Director of Accounts & Development',
      pathway_level: null,
      pathway_track: 'leader',
      hire_date: '2021-09-20',
      region: 'Southeast',
      location_city: 'Wake Forest',
      location_state: 'NC',
      phone: '(919) 819-2874',
      birthday: '1900-02-10',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Not as good at Spikeball as Ben (allegedly). Manages all client communication on the development side. Coordinates developer schedules. Potential future admin for the Designer Pathways app.',
      bio: 'Jake leads client relationships and digital strategy within the healthcare sector. He serves as a strategic partner, driving client growth and overseeing the web development team to deliver innovative digital solutions.',
      special_circumstances_notes: 'Leadership role. Soft billable goal of 10–15h/week. Not on the design pathway system. Future candidate for admin access to Designer Pathways.',
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
      email: 'taylor@steadfast.design',
      name: 'Taylor Tsantles',
      role: 'designer',
      external_title: 'President & Chief Strategist',
      pathway_level: null,
      pathway_track: 'leader',
      hire_date: '2018-01-01',
      region: 'Southeast',
      location_city: 'Wake Forest',
      location_state: 'NC',
      phone: '919-610-5308',
      birthday: '1900-02-26',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Our fearless leader — the Michael Scott of Steadfast. He\'s the reason we\'re all here. Big picture guy for client strategy and design. Involved in pathway advancement conversations for senior promotions.',
      bio: 'Taylor leads the strategic planning, execution, and new business growth at Steadfast. He defines the overall strategic vision, inspires cross-functional teams, and drives innovative strategic solutions.',
      special_circumstances_notes: 'Founder/President. Not evaluated on the Designer Pathway system. Consulted on senior promotions alongside Kelly.',
    },
    compensation: [
      { effective_date: '2018-01-01', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'brittney@steadfast.design',
    profile: {
      email: 'brittney@steadfast.design',
      name: 'Brittney Austin',
      role: 'designer',
      external_title: 'Account Manager',
      pathway_level: null,
      pathway_track: null,
      hire_date: '2025-05-19',
      region: 'Southeast',
      location_city: 'Greenville',
      location_state: 'SC',
      phone: '(864) 270-6383',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'People-loving problem solver with a decade of managing projects and processes. Streamlines chaos and builds client joy. Background in e-commerce, real estate, and nonprofit.',
      bio: 'Brittney is a front-line relationship builder, strategic partner, and project owner. She works to ensure clients\' needs are met while coordinating with the team to carry out projects successfully.',
      special_circumstances_notes: 'Account Management role — not evaluated on the Designer Pathway system. Billable hours tracked separately from design team goal.',
    },
    compensation: [
      { effective_date: '2025-05-19', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'rebecca@steadfast.design',
    profile: {
      email: 'rebecca@steadfast.design',
      name: 'Rebecca Lippert',
      role: 'designer',
      external_title: 'Account Manager',
      pathway_level: null,
      pathway_track: null,
      hire_date: '2025-03-17',
      region: 'Southeast',
      location_city: 'High Point',
      location_state: 'NC',
      phone: '262-804-0931',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Builds strong relationships with warmth and problem solving. Values open communication and thrives in collaborative, project-focused environments. Always seeking improvement and growth.',
      bio: 'Rebecca is a front-line relationship builder, strategic partner, and project owner. She develops a strong understanding of client business and market factors while maintaining a strong, non-aggressive leadership style.',
      special_circumstances_notes: 'Account Management role — not evaluated on the Designer Pathway system.',
    },
    compensation: [
      { effective_date: '2025-03-17', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'kayla@steadfast.design',
    profile: {
      email: 'kayla@steadfast.design',
      name: 'Kayla Johnson',
      role: 'designer',
      external_title: 'Design Lead',
      pathway_level: 'design_lead',
      pathway_track: 'teacher',
      hire_date: '2023-03-08',
      region: 'Midwest',
      location_city: 'Oklahoma City',
      location_state: 'OK',
      phone: '(251) 654-2131',
      birthday: '1900-08-17',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 60,
      billable_target_max: 68,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Meticulous photographer on the side. Loves relaxing with dogs Hank and June, and unwinding to metal. Focuses on design efficiency, process, and visual quality. Natural management overhead is expected for her Lead role.',
      bio: 'Kayla is our Design Lead, focusing on design efficiency, process and visual quality. As a photographer on the side, she brings meticulous care to her work.',
      special_circumstances_notes: 'Billable target adjusted to 60–68% due to Lead role management overhead. Review and Management hours are naturally elevated.',
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
      email: 'joy@steadfast.design',
      name: 'Joy Rhine',
      role: 'designer',
      external_title: 'Senior Graphic Designer',
      pathway_level: 'strategic_designer',
      pathway_track: 'builder',
      hire_date: '2025-10-14',
      region: 'Midwest',
      location_city: 'Grand Rapids',
      location_state: 'MI',
      phone: '(989) 494-7823',
      birthday: '1900-06-20',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 30,
      billable_target_max: 37,
      billable_target_exempt: true,
      is_active: true,
      personality_mbti: 'ENFP',
      personality_enneagram: '7w8',
      personality_notes: 'Thrives on collaboration, positivity, and challenge — whether designing, running marathons, or climbing mountains around the world. High energy, high output. Responds well to positive challenge and autonomy.',
      bio: 'Joy is our newest Senior Designer skilled in Figma, Adobe, and web platforms. An ENFP 7w8 who thrives on collaboration, positivity, and challenge, whether designing, running marathons, or climbing mountains.',
      special_circumstances_notes: 'Exempt from billable flagging despite 96%+ billable rate. Soft monitoring only. Has three pending/paid bonus records.',
    },
    compensation: [
      { effective_date: '2025-10-14', salary: 120000, notes: 'Starting salary — signed with bonus' },
    ],
    bonuses: [
      { amount: 5000, bonus_type: 'signing', payout_date: '2025-11-20', is_paid: true, notes: 'First half of signing bonus' },
      { amount: 5000, bonus_type: 'signing', payout_date: '2026-03-14', is_paid: false, notes: 'Second half at end of 90-day period' },
      { amount: 5000, bonus_type: 'performance', payout_date: '2026-03-14', is_paid: false, notes: '90-day performance bonus' },
    ],
  },
  {
    email: 'jen@steadfast.design',
    profile: {
      email: 'jen@steadfast.design',
      name: 'Jen Reynolds',
      role: 'designer',
      external_title: 'Senior Designer',
      pathway_level: 'mindful_designer',
      pathway_track: 'builder',
      hire_date: '2020-10-26',
      region: 'Southeast',
      location_city: 'Greenville',
      location_state: 'SC',
      phone: '(864) 373-1560',
      birthday: '1900-09-24',
      scheduled_hours_per_week: 23,
      schedule_type: 'pump_act',
      billable_target_min: 68,
      billable_target_max: 72,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Resident branding and packaging queen. Bringing her print and layout expertise to Steadfast back in 2020, she has excelled at any web design project that comes her way. Also an interior designer if needed. Rachel and Jen are basically twins.',
      bio: 'Jen is the resident branding and packaging queen. Bringing her print and layout expertise to Steadfast since 2020, she has excelled at all web design projects. And if you need an interior designer too, she\'s your girl!',
      special_circumstances_notes: 'PUMP Act accommodation in effect — 23hr/week schedule until May 2026. All expected-hours calculations must use scheduled_hours_per_week = 23. Returns to full-time 36hr/week June 2026. Pathway review scheduled for Q3 2026 post-return.',
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
      email: 'rachel@steadfast.design',
      name: 'Rachel Barton',
      role: 'designer',
      external_title: 'Graphic Designer',
      pathway_level: 'strategic_designer',
      pathway_track: 'builder',
      hire_date: '2021-04-16',
      region: 'Southeast',
      location_city: 'Charlotte',
      location_state: 'NC',
      phone: '(864) 680-1548',
      birthday: '1900-09-21',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 68,
      billable_target_max: 72,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Brings illustration expertise and production design efficiency. Loves collaboration and jumping in to help a fellow designer in need. Rachel and Jen are basically twins. Most accurate logger on the team.',
      bio: 'Rachel brings illustration expertise and production design efficiency to the Steadfast team. She loves collaboration and jumping in to help a fellow designer in need.',
      special_circumstances_notes: 'None. Standard billable target 68–72%. Clean logging record — ideal example for other designers.',
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
      email: 'miranda@steadfast.design',
      name: 'Miranda Byrd',
      role: 'designer',
      external_title: 'Designer',
      pathway_level: 'mindful_designer',
      pathway_track: 'builder',
      hire_date: '2024-03-25',
      region: 'Midwest',
      location_city: 'Kansas City',
      location_state: 'MO',
      phone: '(816) 745-6394',
      birthday: '1900-04-16',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 68,
      billable_target_max: 72,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Old house lover. Excels in finding great eats. Loves puzzles — from jigsaws to historic window repairs. Expertise in layout, typography, data visualization.',
      bio: 'Miranda is one of our newest designers, hired in March 2024. She has expertise in layout, typography, and data visualization. An old house lover who excels in finding great eats and loves puzzles.',
      special_circumstances_notes: 'Currently flagged: billable rate well below 68–72% target. Management hours 3× monthly average. 4+ entries corrected by Tori. Recommend 1:1 coaching conversation about logging expectations before escalating.',
    },
    compensation: [
      { effective_date: '2024-03-25', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'carson@steadfast.design',
    profile: {
      email: 'carson@steadfast.design',
      name: 'Carson Long',
      role: 'designer',
      external_title: 'Designer',
      pathway_level: 'mindful_designer',
      pathway_track: 'builder',
      hire_date: '2024-03-25',
      region: 'Southeast',
      location_city: 'Greenville',
      location_state: 'SC',
      phone: '(919) 928-6149',
      birthday: '1900-04-08',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 68,
      billable_target_max: 72,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Detail-oriented and determined. Passionate about web, branding, and coding. Classic movies, befriending cats, 80s fashion, and a caffeine boost. Coding passion could be channeled — worth exploring dev-adjacent projects.',
      bio: 'Carson was hired in March 2024. She is a detail-oriented and determined designer passionate about web, branding, and coding. In her spare time she enjoys classic movies, befriending cats, 80s fashion, and a caffeine boost.',
      special_circumstances_notes: 'Currently watching: internal hours spike. 3 flagged untagged Internal (2026) entries. Monitor over next 2 weeks before escalating.',
    },
    compensation: [
      { effective_date: '2024-03-25', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'jack@steadfast.design',
    profile: {
      email: 'jack@steadfast.design',
      name: 'Jack Walgamuth',
      role: 'designer',
      external_title: 'Designer',
      pathway_level: 'mindful_designer',
      pathway_track: 'builder',
      hire_date: '2025-04-28',
      region: 'Midwest',
      location_city: 'Minneapolis',
      location_state: 'MN',
      phone: '(612) 743-6137',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_min: 68,
      billable_target_max: 72,
      billable_target_exempt: false,
      is_active: true,
      personality_notes: '6+ years prior experience in branding, illustration, and web design. Strong communicator, driven to learn, thrives in collaborative environments. Classified Mindful by tenure but skill level exceeds pathway position.',
      bio: 'Jack is an experienced designer specializing in branding, illustration and web design with 6+ years of experience. He is a strong communicator, driven to learn, and thrives in collaborative environments.',
      special_circumstances_notes: '6+ years prior experience makes him more advanced than Mindful level suggests. Strong candidate for early pathway advancement to Strategic I. 70% billable rate — exactly on target.',
    },
    compensation: [
      { effective_date: '2025-04-28', salary: 0, notes: 'Starting salary' },
    ],
  },
  {
    email: 'ben@steadfast.design',
    profile: {
      email: 'ben@steadfast.design',
      name: 'Ben Bunze',
      role: 'designer',
      external_title: 'Front End Developer',
      pathway_level: null,
      pathway_track: null,
      hire_date: '2021-06-01',
      region: 'Southeast',
      location_city: 'Winston-Salem',
      location_state: 'NC',
      birthday: '1900-10-02',
      scheduled_hours_per_week: 36,
      schedule_type: 'standard',
      billable_target_exempt: false,
      is_active: true,
      personality_notes: 'Works alongside Drew to bring web and digital design projects to life. Frequently plays in Spikeball tournaments on weekends — reportedly better than Jake.',
      bio: 'Ben is one of our front end developers. He works to bring our web and digital design projects to life on the web.',
      special_circumstances_notes: 'Development team — not on the Designer Pathway system. Out of scope for MVP performance tracking.',
    },
    compensation: [
      { effective_date: '2021-06-01', salary: 0, notes: 'Starting salary' },
    ],
  },
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }

  const results = [];
  const errors = [];

  for (const user of USERS) {
    try {
      // 1. Create auth user (skip if already exists)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
      });

      let userId;
      if (authError) {
        if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
          // User exists — look up their ID
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email === user.email);
          if (!existing) {
            errors.push(`${user.email}: exists in auth but could not look up ID`);
            continue;
          }
          userId = existing.id;
        } else {
          errors.push(`${user.email}: auth error — ${authError.message}`);
          continue;
        }
      } else {
        userId = authData.user.id;
      }

      // 2. Upsert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...user.profile }, { onConflict: 'id' });

      if (profileError) {
        errors.push(`${user.email}: profile error — ${profileError.message}`);
        continue;
      }

      // 3. Insert compensation records (skip if already exist for this user+date)
      for (const comp of (user.compensation || [])) {
        const { error: compError } = await supabase
          .from('compensation_history')
          .upsert(
            { designer_id: userId, ...comp },
            { onConflict: 'designer_id,effective_date' }
          );
        if (compError && !compError.message.includes('duplicate')) {
          errors.push(`${user.email}: compensation error — ${compError.message}`);
        }
      }

      // 4. Insert bonus records for Joy Rhine
      for (const bonus of (user.bonuses || [])) {
        const { error: bonusError } = await supabase
          .from('bonus_records')
          .insert({ designer_id: userId, ...bonus });
        if (bonusError && !bonusError.message.includes('duplicate')) {
          errors.push(`${user.email}: bonus error — ${bonusError.message}`);
        }
      }

      results.push(`✓ ${user.profile.name} (${user.email})`);
    } catch (e) {
      errors.push(`${user.email}: unexpected error — ${e.message}`);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seeded: results, errors }),
  };
};
