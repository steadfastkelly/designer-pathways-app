// Proxies the Timely OAuth token exchange server-side to avoid CORS.
// After a successful exchange, also persists credentials to Netlify env vars
// and Supabase so the scheduled sync and UI both have what they need.

const { createClient } = require('@supabase/supabase-js');

async function writeNetlifyEnvVar(key, value) {
  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_ACCESS_TOKEN;
  if (!siteId || !token) return; // silently skip if not configured

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const base = `https://api.netlify.com/api/v1/sites/${siteId}/env`;

  const patch = await fetch(`${base}/${key}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ value, context: 'all' }),
  });
  if (!patch.ok && patch.status === 404) {
    await fetch(base, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ key, values: [{ value, context: 'all' }] }]),
    });
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { code, client_id, client_secret, redirect_uri, account_id } = body;
  if (!code || !client_id || !client_secret || !redirect_uri) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  try {
    const res = await fetch('https://api.timelyapp.com/1.1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ grant_type: 'authorization_code', client_id, client_secret, code, redirect_uri }),
    });

    const data = await res.json();

    if (data.access_token) {
      // Persist to Netlify env vars (sync source of truth)
      await Promise.all([
        writeNetlifyEnvVar('TIMELY_CLIENT_ID', client_id),
        writeNetlifyEnvVar('TIMELY_CLIENT_SECRET', client_secret),
        writeNetlifyEnvVar('TIMELY_ACCESS_TOKEN', data.access_token),
        account_id ? writeNetlifyEnvVar('TIMELY_ACCOUNT_ID', account_id) : Promise.resolve(),
      ]);

      // Mirror to Supabase so the UI can read them back
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const pairs = [
          ['timely_client_id', client_id],
          ['timely_client_secret', client_secret],
          ['timely_access_token', data.access_token],
        ];
        if (account_id) pairs.push(['timely_account_id', account_id]);
        await Promise.all(pairs.map(([k, v]) =>
          supabase.from('app_settings').upsert(
            { key: k, value: v, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
        ));
      }
    }

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
    };
  }
};
