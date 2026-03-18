// Proxies the Timely OAuth token exchange server-side to avoid CORS.
// After a successful exchange, persists all credentials to the api_credentials
// Supabase table using the service role key (bypasses RLS).

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { code, client_id, client_secret, redirect_uri, account_id } = req.body ?? {};
  if (!code || !client_id || !client_secret || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const tokenRes = await fetch('https://api.timelyapp.com/1.1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ grant_type: 'authorization_code', client_id, client_secret, code, redirect_uri }),
    });

    const data = await tokenRes.json();

    if (data.access_token) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

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
            { onConflict: 'service' },
          );

        if (error) console.error('timely-token: failed to persist credentials:', error.message);
      }
    }

    return res.status(tokenRes.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
