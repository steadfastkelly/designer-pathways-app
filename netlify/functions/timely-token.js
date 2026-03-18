// Proxies the Timely OAuth token exchange server-side to avoid CORS.
// After a successful exchange, persists all credentials to the api_credentials
// Supabase table using the service role key (bypasses RLS).

const { createClient } = require('@supabase/supabase-js');

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
      // Persist to api_credentials table using service role key (bypasses RLS)
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Read existing so we don't wipe any fields not present in this exchange
        const { data: existing } = await supabase
          .from('api_credentials')
          .select('credentials')
          .eq('service', 'timely')
          .maybeSingle();

        const merged = {
          ...(existing?.credentials ?? {}),
          app_id: client_id,
          app_secret: client_secret,
          access_token: data.access_token,
          ...(account_id ? { account_id } : {}),
        };

        const { error } = await supabase
          .from('api_credentials')
          .upsert(
            { service: 'timely', credentials: merged, is_configured: true, updated_at: new Date().toISOString() },
            { onConflict: 'service' }
          );

        if (error) {
          console.error('timely-token: failed to persist to api_credentials:', error.message);
        }
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
