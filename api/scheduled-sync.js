// Vercel API route — triggered hourly by Vercel Cron (configured in vercel.json).
// Reads Timely + ClickUp credentials from Supabase api_credentials and syncs both.

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getApiCreds(supabase, service) {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('credentials')
    .eq('service', service)
    .eq('is_configured', true)
    .maybeSingle();
  if (error) console.error(`getApiCreds(${service}):`, error.message);
  return data?.credentials ?? null;
}

async function syncTimely(supabase, token, accountId) {
  const errors = [];
  let synced = 0;
  const allEvents = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const res = await fetch(
      `https://api.timelyapp.com/1.1/${accountId}/events?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    );
    if (!res.ok) { errors.push(`Timely API error: ${res.status}`); break; }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allEvents.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  if (errors.length) return { synced, errors };

  const { data: profiles } = await supabase.from('profiles').select('id, email');
  const emailToId = {};
  for (const p of (profiles ?? [])) emailToId[p.email.toLowerCase()] = p.id;

  const grouped = {};
  for (const event of allEvents) {
    const email = event.user?.email?.toLowerCase();
    if (!email) continue;
    const date = new Date(event.day);
    if (isNaN(date.getTime())) continue;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${email}-${year}-${month}`;
    const hours = (event.duration?.hours ?? 0) + (event.duration?.minutes ?? 0) / 60;
    const billable = event.billed === true || event.billable === true;
    if (!grouped[key]) grouped[key] = { email, year, month, totalHours: 0, billableHours: 0, internalHours: 0 };
    grouped[key].totalHours += hours;
    if (billable) grouped[key].billableHours += hours;
    else grouped[key].internalHours += hours;
  }

  for (const entry of Object.values(grouped)) {
    const designerId = emailToId[entry.email];
    if (!designerId) continue;
    const billablePercent = entry.totalHours > 0 ? Math.round((entry.billableHours / entry.totalHours) * 100) : 0;
    const { error } = await supabase.from('monthly_hours_summary').upsert({
      designer_id: designerId, year: entry.year, month: entry.month,
      total_hours: Math.round(entry.totalHours * 100) / 100,
      billable_hours: Math.round(entry.billableHours * 100) / 100,
      internal_hours: Math.round(entry.internalHours * 100) / 100,
      billable_percent: billablePercent, logging_days: 0, internal_breakdown: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'designer_id,year,month' });
    if (error) errors.push(`Upsert ${entry.email}: ${error.message}`);
    else synced++;
  }

  await supabase.from('app_settings').upsert(
    { key: 'timely_last_sync', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );

  return { synced, errors };
}

async function syncClickUp(supabase, apiKey, teamId) {
  const errors = [];
  let synced = 0;
  let page = 0;
  const allTasks = [];

  while (true) {
    const res = await fetch(
      `https://api.clickup.com/api/v2/team/${teamId}/task?page=${page}&include_closed=true&subtasks=true&per_page=100`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) { errors.push(`ClickUp API error: ${res.status}`); break; }
    const json = await res.json();
    const tasks = json.tasks ?? [];
    allTasks.push(...tasks);
    if (tasks.length < 100) break;
    page++;
  }

  const { data: profiles } = await supabase.from('profiles').select('id, email');
  const emailToId = {};
  for (const p of (profiles ?? [])) emailToId[p.email.toLowerCase()] = p.id;

  for (const task of allTasks) {
    const dueDate = task.due_date ? new Date(Number(task.due_date)) : null;
    const completedDate = task.date_closed ? new Date(Number(task.date_closed)) : null;
    if (!dueDate) continue;
    const wasLate = !!(completedDate && completedDate > dueDate);
    const daysLate = wasLate ? Math.ceil((completedDate.getTime() - dueDate.getTime()) / 86400000) : 0;

    for (const assignee of (task.assignees ?? [])) {
      const email = assignee.email?.toLowerCase();
      const designerId = email ? emailToId[email] : null;
      if (!designerId) continue;
      const { error } = await supabase.from('clickup_deadlines').upsert({
        clickup_task_id: task.id, designer_id: designerId,
        task_name: task.name ?? 'Untitled',
        due_date: dueDate.toISOString().slice(0, 10),
        completed_date: completedDate ? completedDate.toISOString().slice(0, 10) : null,
        was_late: wasLate, days_late: daysLate, clickup_url: task.url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clickup_task_id,designer_id' });
      if (error) errors.push(`ClickUp upsert ${task.id}: ${error.message}`);
      else synced++;
    }
  }

  await supabase.from('app_settings').upsert(
    { key: 'clickup_last_sync', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );

  return { synced, errors };
}

export default async function handler(req, res) {
  // Accepts GET (from Vercel Cron) or POST (manual trigger from UI)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  const [timelyCreds, clickupCreds] = await Promise.all([
    getApiCreds(supabase, 'timely'),
    getApiCreds(supabase, 'clickup'),
  ]);

  const timelyToken   = timelyCreds?.access_token;
  const timelyAccount = timelyCreds?.account_id;
  const clickupKey    = clickupCreds?.api_key;
  const clickupTeam   = clickupCreds?.team_id;
  const syncLog = { timely: null, clickup: null, errors: [] };

  if (timelyToken && timelyAccount) {
    try {
      syncLog.timely = await syncTimely(supabase, timelyToken, timelyAccount);
      console.log('Timely sync:', syncLog.timely.synced, 'records,', syncLog.timely.errors.length, 'errors');
    } catch (e) {
      syncLog.errors.push(`Timely sync failed: ${e.message}`);
    }
  } else {
    syncLog.errors.push('Timely credentials not configured in api_credentials — skipping');
  }

  if (clickupKey && clickupTeam) {
    try {
      syncLog.clickup = await syncClickUp(supabase, clickupKey, clickupTeam);
      console.log('ClickUp sync:', syncLog.clickup.synced, 'records,', syncLog.clickup.errors.length, 'errors');
    } catch (e) {
      syncLog.errors.push(`ClickUp sync failed: ${e.message}`);
    }
  } else {
    syncLog.errors.push('ClickUp credentials not configured in api_credentials — skipping');
  }

  return res.status(200).json(syncLog);
}
