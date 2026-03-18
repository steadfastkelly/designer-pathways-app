/**
 * POST /.netlify/functions/save-setting
 * Saves a key/value pair to app_settings using the service role key,
 * bypassing RLS. Used until profiles are seeded and RLS starts working.
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { key: settingKey, value } = body;
  if (!settingKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing key' }) };
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: settingKey, value: value ?? '', updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
