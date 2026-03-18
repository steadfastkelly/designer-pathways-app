/**
 * POST /.netlify/functions/save-api-credentials
 * Writes API credentials to Netlify environment variables so they are
 * available in process.env for the scheduled sync function.
 * Also mirrors values to Supabase app_settings for the UI to display.
 *
 * Required Netlify env vars (set manually in Netlify dashboard):
 *   NETLIFY_ACCESS_TOKEN  — personal access token from netlify.com/user/applications
 *   NETLIFY_SITE_ID       — site ID from Netlify dashboard → Site configuration → General
 *   SUPABASE_SERVICE_ROLE_KEY — for Supabase writes
 */

const { createClient } = require('@supabase/supabase-js');

const ENV_VAR_MAP = {
  timely: {
    client_id:     'TIMELY_CLIENT_ID',
    client_secret: 'TIMELY_CLIENT_SECRET',
    account_id:    'TIMELY_ACCOUNT_ID',
    access_token:  'TIMELY_ACCESS_TOKEN',
  },
  clickup: {
    api_key: 'CLICKUP_API_KEY',
    team_id: 'CLICKUP_TEAM_ID',
  },
};

async function writeNetlifyEnvVar(siteId, token, key, value) {
  const base = `https://api.netlify.com/api/v1/sites/${siteId}/env`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const payload = { key, values: [{ value, context: 'all' }] };

  // PATCH updates an existing variable — body must include key + values array
  const patchRes = await fetch(`${base}/${key}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  if (patchRes.ok) return { key, ok: true };

  // If not found (404), create it with POST
  if (patchRes.status === 404) {
    const postRes = await fetch(base, {
      method: 'POST',
      headers,
      body: JSON.stringify([payload]),
    });
    if (postRes.ok) return { key, ok: true };
    const postErr = await postRes.text().catch(() => '');
    return { key, ok: false, status: postRes.status, error: postErr };
  }

  const patchErr = await patchRes.text().catch(() => '');
  return { key, ok: false, status: patchRes.status, error: patchErr };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!netlifyToken || !siteId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'NETLIFY_ACCESS_TOKEN and NETLIFY_SITE_ID must be set in Netlify env vars' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { service, credentials } = body;
  const mapping = ENV_VAR_MAP[service];
  if (!mapping || !credentials) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing service or credentials' }) };
  }

  // Write each credential to Netlify env vars
  const results = await Promise.all(
    Object.entries(credentials)
      .filter(([, v]) => v != null && v !== '')
      .map(([credKey, value]) => {
        const envKey = mapping[credKey];
        if (!envKey) return Promise.resolve({ key: credKey, ok: true, skipped: true });
        return writeNetlifyEnvVar(siteId, netlifyToken, envKey, String(value));
      })
  );

  const failed = results.filter(r => !r.ok && !r.skipped);
  if (failed.length > 0) {
    console.error('[save-api-credentials] Netlify env var write failures:', JSON.stringify(failed));
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Some env vars failed to save',
        failed,
        hint: 'Check that NETLIFY_ACCESS_TOKEN has write:env_vars scope and NETLIFY_SITE_ID is correct',
      }),
    };
  }

  // Mirror to Supabase app_settings so the UI can read them back
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all(
      Object.entries(credentials)
        .filter(([, v]) => v != null && v !== '')
        .map(([credKey, value]) => {
          const settingKey = `${service}_${credKey}`;
          return supabase
            .from('app_settings')
            .upsert({ key: settingKey, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
        })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, saved: Object.keys(credentials) }),
  };
};
