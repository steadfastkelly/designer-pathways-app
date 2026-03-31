// Vercel API route — triggered hourly by Vercel Cron (configured in vercel.json).
// Also accepts POST from the "Sync Now" UI buttons.
// Reads Timely + ClickUp credentials from Supabase api_credentials and syncs both.

import { createClient } from '@supabase/supabase-js';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Fetch with automatic retry on network errors and 429 rate-limit responses.
async function safeFetch(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await sleep(1000 * (i + 1));
        continue;
      }
      return res; // caller checks res.ok
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(500 * (i + 1));
    }
  }
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

async function parseJsonFromResponse(res, sourceLabel) {
  const raw = await res.text();
  if (!raw.trim()) {
    return {
      ok: false,
      error: `${sourceLabel} parse error: empty response body (HTTP ${res.status})`,
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    const payloadPreview = raw.slice(0, 200).replace(/\s+/g, ' ').trim();
    return {
      ok: false,
      error: `${sourceLabel} parse error: invalid JSON (HTTP ${res.status}) payload="${payloadPreview || '<empty>'}"`,
    };
  }
}

// ─── Timely ──────────────────────────────────────────────────────────────────

async function refreshTimelyToken(supabase, creds) {
  const { app_id, app_secret, refresh_token } = creds;
  if (!refresh_token || !app_id || !app_secret) return null;
  const res = await fetch('https://api.timelyapp.com/1.1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', client_id: app_id, client_secret: app_secret, refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.access_token) return null;
  const updated = { ...creds, access_token: data.access_token, ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}) };
  await supabase.from('api_credentials').upsert(
    { service: 'timely', credentials: updated, is_configured: true, updated_at: new Date().toISOString() },
    { onConflict: 'service' },
  );
  return data.access_token;
}

async function syncTimely(supabase, creds) {
  const errors = [];
  let synced = 0;
  const allEvents = [];
  let page = 1;
  const perPage = 1000;
  let token = creds.access_token;
  const accountId = creds.account_id;
  let refreshed = false;

  while (true) {
    let res;
    try {
      res = await safeFetch(
        `https://api.timelyapp.com/1.1/${accountId}/events?per_page=${perPage}&page=${page}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
      );
    } catch (err) {
      errors.push(`Timely fetch/network error (page ${page}): ${err.message}`);
      break;
    }

    if (res.status === 401 && !refreshed) {
      const newToken = await refreshTimelyToken(supabase, creds);
      if (newToken) { token = newToken; refreshed = true; continue; }
      errors.push('Timely access token expired and refresh failed — re-connect Timely in Settings');
      break;
    }
    if (!res.ok) { errors.push(`Timely HTTP error (page ${page}): ${res.status}`); break; }

    const parsed = await parseJsonFromResponse(res, `Timely page ${page}`);
    if (!parsed.ok) { errors.push(parsed.error); break; }

    const data = parsed.data;
    if (!Array.isArray(data) || data.length === 0) break;
    allEvents.push(...data);
    if (data.length < perPage) break;
    page++;
    await sleep(200);
  }

  if (errors.length) return { synced, errors };

  const diagnostics = {
    totalEventsFetched: allEvents.length,
    matchedEvents: 0,
    unmatchedEvents: {
      total: 0,
      byReason: {
        missingIdentity: 0,
        unknownUser: 0,
        badDate: 0,
      },
    },
  };

  const normalizeEmail = (value) => {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return normalized || null;
  };

  const normalizeTimelyUserId = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().toLowerCase();
    return normalized || null;
  };

  const upsertIdSet = (map, key, designerId) => {
    if (!key || !designerId) return;
    map[key] = designerId;
  };

  const addPotentialTimelyIds = (bucket, candidate) => {
    if (candidate === null || candidate === undefined) return;
    if (Array.isArray(candidate)) {
      for (const item of candidate) addPotentialTimelyIds(bucket, item);
      return;
    }
    const normalized = normalizeTimelyUserId(candidate);
    if (normalized) bucket.add(normalized);
  };

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, timely_user_id, timely_user_ids, external_ids');

  let profileRows = profiles;
  if (profilesError) {
    // Backward compatibility with schemas that don't yet include optional Timely identity fields.
    const { data: fallbackProfiles, error: fallbackProfilesError } = await supabase
      .from('profiles')
      .select('id, email');
    if (fallbackProfilesError) throw new Error(`Failed to fetch profiles: ${fallbackProfilesError.message}`);
    profileRows = fallbackProfiles;
  }

  const emailToDesignerId = {};
  const timelyUserIdToDesignerId = {};

  for (const p of (profileRows ?? [])) {
    const email = normalizeEmail(p.email);
    if (email) emailToDesignerId[email] = p.id;

    const potentialIds = new Set();
    addPotentialTimelyIds(potentialIds, p.timely_user_id);
    addPotentialTimelyIds(potentialIds, p.timely_user_ids);
    addPotentialTimelyIds(potentialIds, p.external_ids?.timely?.user_id);
    addPotentialTimelyIds(potentialIds, p.external_ids?.timely?.user_ids);

    for (const timelyUserId of potentialIds) upsertIdSet(timelyUserIdToDesignerId, timelyUserId, p.id);
  }

  // Optional mapping table support: ignore missing-table errors for deployments that do not have it yet.
  const { data: timelyMappings, error: timelyMappingsError } = await supabase
    .from('timely_user_mappings')
    .select('profile_id, timely_user_id');
  if (!timelyMappingsError && Array.isArray(timelyMappings)) {
    for (const mapping of timelyMappings) {
      upsertIdSet(timelyUserIdToDesignerId, normalizeTimelyUserId(mapping.timely_user_id), mapping.profile_id);
    }
  }

  const extractTimelyIdentity = (event) => {
    const emailCandidates = [
      event?.user?.email,
      event?.email,
      event?.user_email,
      event?.person?.email,
      event?.owner?.email,
    ];
    const timelyUserIdCandidates = [
      event?.user_id,
      event?.user?.id,
      event?.user?.user_id,
      event?.person_id,
      event?.person?.id,
      event?.owner_id,
      event?.owner?.id,
    ];

    const email = emailCandidates.map(normalizeEmail).find(Boolean) ?? null;
    const timelyUserId = timelyUserIdCandidates.map(normalizeTimelyUserId).find(Boolean) ?? null;
    return { email, timelyUserId };
  };

  const grouped = {};
  for (const event of allEvents) {
    const { email, timelyUserId } = extractTimelyIdentity(event);
    if (!email && !timelyUserId) {
      diagnostics.unmatchedEvents.total++;
      diagnostics.unmatchedEvents.byReason.missingIdentity++;
      continue;
    }

    const designerId = (email ? emailToDesignerId[email] : null) || (timelyUserId ? timelyUserIdToDesignerId[timelyUserId] : null);
    if (!designerId) {
      diagnostics.unmatchedEvents.total++;
      diagnostics.unmatchedEvents.byReason.unknownUser++;
      continue;
    }

    const date = new Date(event.day);
    if (isNaN(date.getTime())) {
      diagnostics.unmatchedEvents.total++;
      diagnostics.unmatchedEvents.byReason.badDate++;
      continue;
    }

    diagnostics.matchedEvents++;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${designerId}-${year}-${month}`;
    const hours = (event.duration?.hours ?? 0) + (event.duration?.minutes ?? 0) / 60;
    const billable = event.billed === true || event.billable === true;
    if (!grouped[key]) grouped[key] = { designerId, identity: email || timelyUserId || 'unknown', year, month, totalHours: 0, billableHours: 0, internalHours: 0 };
    grouped[key].totalHours += hours;
    if (billable) grouped[key].billableHours += hours;
    else grouped[key].internalHours += hours;
  }

  for (const entry of Object.values(grouped)) {
    const billablePercent = entry.totalHours > 0 ? Math.round((entry.billableHours / entry.totalHours) * 100) : 0;
    const { error } = await supabase.from('monthly_hours_summary').upsert({
      designer_id: entry.designerId, year: entry.year, month: entry.month,
      total_hours: Math.round(entry.totalHours * 100) / 100,
      billable_hours: Math.round(entry.billableHours * 100) / 100,
      internal_hours: Math.round(entry.internalHours * 100) / 100,
      billable_percent: billablePercent, logging_days: 0, internal_breakdown: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'designer_id,year,month' });
    if (error) errors.push(`Upsert ${entry.identity}: ${error.message}`);
    else synced++;
  }

  if (diagnostics.unmatchedEvents.total > 0) {
    const { missingIdentity, unknownUser, badDate } = diagnostics.unmatchedEvents.byReason;
    errors.push(
      `Unmatched Timely events: ${diagnostics.unmatchedEvents.total} (missing identity: ${missingIdentity}, unknown user: ${unknownUser}, bad date: ${badDate})`,
    );
  }

  await supabase.from('app_settings').upsert(
    { key: 'timely_last_sync', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );

  return { synced, errors, diagnostics };
}

// ─── ClickUp ─────────────────────────────────────────────────────────────────

async function syncClickUp(supabase, apiKey, teamId) {
  const errors = [];
  let synced = 0;
  let page = 0;
  let hasMore = true;

  const { data: profiles } = await supabase.from('profiles').select('id, email');
  const emailToId = {};
  for (const p of (profiles ?? [])) {
    if (p.email) emailToId[p.email.toLowerCase()] = p.id;
  }

  while (hasMore) {
    let json;
    let res;
    try {
      res = await safeFetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?page=${page}&include_closed=true&subtasks=true&per_page=100`,
        { headers: { Authorization: apiKey } },
      );
    } catch (err) {
      errors.push(`ClickUp fetch/network error (page ${page}): ${err.message}`);
      break;
    }

    if (!res.ok) {
      errors.push(`ClickUp HTTP error (page ${page}): ${res.status}`);
      break;
    }

    const parsed = await parseJsonFromResponse(res, `ClickUp page ${page}`);
    if (!parsed.ok) { errors.push(parsed.error); break; }
    json = parsed.data;

    const tasks = json.tasks ?? [];
    // Use ClickUp's last_page signal; fall back to task count check
    hasMore = json.last_page !== true && tasks.length === 100;
    page++;

    const batch = [];
    for (const task of tasks) {
      try {
        const dueDate = task.due_date ? new Date(Number(task.due_date)) : null;
        const completedDate = task.date_closed ? new Date(Number(task.date_closed)) : null;
        if (!dueDate) continue;
        const wasLate = !!(completedDate && completedDate > dueDate);
        const daysLate = wasLate ? Math.ceil((completedDate.getTime() - dueDate.getTime()) / 86400000) : 0;
        for (const assignee of (task.assignees ?? [])) {
          const email = assignee.email?.toLowerCase();
          const designerId = email ? emailToId[email] : null;
          if (!designerId) continue;
          batch.push({
            clickup_task_id: task.id, designer_id: designerId,
            task_name: task.name ?? 'Untitled',
            due_date: dueDate.toISOString().slice(0, 10),
            completed_date: completedDate ? completedDate.toISOString().slice(0, 10) : null,
            was_late: wasLate, days_late: daysLate, clickup_url: task.url ?? null,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        errors.push(`Task processing error ${task.id}: ${err.message}`);
      }
    }

    if (batch.length > 0) {
      const { error } = await supabase
        .from('clickup_deadlines')
        .upsert(batch, { onConflict: 'clickup_task_id,designer_id' });
      if (error) errors.push(`Batch upsert failed: ${error.message}`);
      else synced += batch.length;
    }

    await sleep(200); // be polite to the ClickUp API
  }

  await supabase.from('app_settings').upsert(
    { key: 'clickup_last_sync', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );

  return { synced, errors };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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

  const clickupKey  = clickupCreds?.api_key;
  const clickupTeam = clickupCreds?.team_id;
  const syncLog = { timely: null, clickup: null, errors: [] };

  if (timelyCreds?.access_token && timelyCreds?.account_id) {
    try {
      syncLog.timely = await syncTimely(supabase, timelyCreds);
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
