-- API credentials table — stores Timely + ClickUp credentials in Supabase.
-- Credentials JSONB stores all fields for each service:
--   timely:  { app_id, app_secret, account_id, access_token }
--   clickup: { api_key, team_id }
-- Admin-only via RLS.

CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  credentials JSONB NOT NULL DEFAULT '{}',
  is_configured BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON api_credentials
  FOR ALL USING (auth_user_role() = 'admin');

CREATE TRIGGER update_api_credentials_updated_at
  BEFORE UPDATE ON api_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
