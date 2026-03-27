// Validates stored Timely or ClickUp credentials by making a lightweight API
// call server-side. Used by the "Test Connection" buttons in Settings UI.
// Reads credentials from api_credentials via the service role key (bypasses RLS).

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const body = req.body ?? {};
  const { service } = body;
  if (service !== 'timely' && service !== 'clickup') {
    return res.status(400).json({ ok: false, message: 'service must be "timely" or "clickup"' });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (e) {
    return res.status(500).json({ ok: false, message: `Server misconfiguration: ${e.message}` });
  }

  const { data, error } = await supabase
    .from('api_credentials')
    .select('credentials')
    .eq('service', service)
    .eq('is_configured', true)
    .maybeSingle();

  if (error) {
    return res.status(200).json({ ok: false, message: `Could not read credentials: ${error.message}` });
  }
  if (!data) {
    return res.status(200).json({ ok: false, message: 'Credentials not found — save them in Settings first.' });
  }

  const creds = data.credentials;

  try {
    if (service === 'timely') {
      if (!creds.access_token || !creds.account_id) {
        return res.json({ ok: false, message: 'Timely credentials incomplete — make sure Account ID and access token are saved.' });
      }
      const r = await fetch(
        `https://api.timelyapp.com/1.1/${creds.account_id}/events?per_page=1&page=1`,
        { headers: { Authorization: `Bearer ${creds.access_token}`, Accept: 'application/json' } },
      );
      if (r.status === 401) {
        return res.json({ ok: false, message: 'Timely token is invalid or expired. Re-connect Timely in Settings (click "Connect Timely" again).' });
      }
      if (!r.ok) {
        return res.json({ ok: false, message: `Timely API returned ${r.status} — check your Account ID.` });
      }
      return res.json({ ok: true, message: 'Timely connection verified.' });
    } else {
      if (!creds.api_key || !creds.team_id) {
        return res.json({ ok: false, message: 'ClickUp credentials incomplete — make sure API token and Team ID are saved.' });
      }
      const r = await fetch(
        `https://api.clickup.com/api/v2/team/${creds.team_id}/task?page=0&per_page=1`,
        { headers: { Authorization: creds.api_key } },
      );
      if (r.status === 401) {
        return res.json({ ok: false, message: 'ClickUp API key is invalid. Check Settings → My Apps in ClickUp.' });
      }
      if (r.status === 404) {
        return res.json({ ok: false, message: 'ClickUp Team ID not found. Check the number in your ClickUp URL.' });
      }
      if (!r.ok) {
        return res.json({ ok: false, message: `ClickUp API returned ${r.status}.` });
      }
      return res.json({ ok: true, message: 'ClickUp connection verified.' });
    }
  } catch (e) {
    return res.status(502).json({ ok: false, message: `Network error reaching ${service} API: ${e instanceof Error ? e.message : String(e)}` });
  }
}
