import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, CheckSquare, ExternalLink, Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTeamData } from '../hooks/useTeamData';
import { useBumpSyncVersion } from '../contexts/SyncContext';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/team/DesignerCard';
import { PATHWAY_LEVEL_LABELS } from '../types';
import { getJsonApiErrorMessage, readJsonSafely } from '../lib/http';
import {
  getAppSettings,
  getApiCredentials, upsertApiCredentials,
  syncTimelyData, syncClickUpData,
} from '../lib/api';

type TabId = 'profiles' | 'timely' | 'clickup';

const S: React.CSSProperties = {};


export function SettingsPage() {
  const params = new URLSearchParams(window.location.search);
  const isTimelyCallback = params.get('state') === 'timely' && !!params.get('code');
  const [activeTab, setActiveTab] = useState<TabId>(isTimelyCallback ? 'timely' : 'profiles');
  const { members, loading } = useTeamData();

  const tabs = [
    { id: 'profiles' as TabId, label: 'Profile Management', icon: Users },
    { id: 'timely' as TabId, label: 'Timely Integration', icon: Clock },
    { id: 'clickup' as TabId, label: 'ClickUp Integration', icon: CheckSquare },
  ];

  void S;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Integrations, user management, and system configuration
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--bg-surface)', borderRadius: 10, padding: 4, width: 'fit-content',
        border: '1px solid var(--border)',
      }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} style={tabBtn(activeTab === id)} onClick={() => setActiveTab(id)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'profiles' && (
        <ProfilesTab members={members} loading={loading} />
      )}
      {activeTab === 'timely' && <TimelyTab />}
      {activeTab === 'clickup' && <ClickUpTab />}
    </div>
  );
}

// ─── Profiles Tab ──────────────────────────────────────────────────────────────

function ProfilesTab({ members, loading }: { members: ReturnType<typeof useTeamData>['members']; loading: boolean }) {
  const bumpSyncVersion = useBumpSyncVersion();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ seeded: string[]; errors: string[] } | null>(null);

  const handleSeedUsers = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed-users', { method: 'POST' });
      const text = await res.text();
      if (!text.trim()) {
        throw new Error(`Empty response from /api/seed-users (HTTP ${res.status}). Check that SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables.`);
      }
      let data: { seeded: string[]; errors: string[] };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response from /api/seed-users (HTTP ${res.status}): ${text.slice(0, 300)}`);
      }
      setSeedResult(data);
      if (data.seeded?.length > 0) bumpSyncVersion();
    } catch (e) {
      setSeedResult({ seeded: [], errors: [`Seed failed: ${e instanceof Error ? e.message : String(e)}`] });
    }
    setSeeding(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Designer Profiles</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{members.length} active designers</div>
          {members.length === 0 && (
            <button
              onClick={handleSeedUsers}
              disabled={seeding}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--accent-teal)', color: '#0f1117', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: seeding ? 'not-allowed' : 'pointer', opacity: seeding ? 0.7 : 1 }}
            >
              {seeding ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Seeding…</> : 'Seed Team Data'}
            </button>
          )}
        </div>
      </div>
      {seedResult && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: seedResult.errors.length ? 'var(--accent-red-dim)' : 'var(--accent-teal-dim)', border: `1px solid ${seedResult.errors.length ? 'var(--accent-red)' : 'var(--accent-teal)'}`, fontSize: 12 }}>
          {seedResult.seeded.length > 0 && <div style={{ color: 'var(--accent-teal)', marginBottom: 4 }}>Created: {seedResult.seeded.join(', ')}</div>}
          {seedResult.errors.map((e, i) => <div key={i} style={{ color: 'var(--accent-red)' }}>{e}</div>)}
        </div>
      )}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(({ profile }) => (
            <div key={profile.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size={38} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {profile.externalTitle ?? '—'}
                    {profile.pathwayLevel && ` · ${PATHWAY_LEVEL_LABELS[profile.pathwayLevel]}`}
                  </div>
                </div>
              </div>
              <Link
                to={`/team/${profile.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-teal)', textDecoration: 'none', fontWeight: 500 }}
              >
                Edit Profile <ExternalLink size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
        To upload a profile photo, open the designer's profile and click <strong style={{ color: 'var(--text-secondary)' }}>Edit Profile</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Upload Photo</strong>.
      </div>
    </div>
  );
}

// ─── Shared credential field ───────────────────────────────────────────────────

function CredentialField({
  label, value, onChange, placeholder, secret = false, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secret?: boolean; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{hint}</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={secret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: secret ? 40 : 12 }}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', padding: 2, display: 'flex' }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Timely Tab ────────────────────────────────────────────────────────────────

const TIMELY_REDIRECT_URI = `${window.location.origin}/settings`;

function TimelyTab() {
  const bumpSyncVersion = useBumpSyncVersion();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load saved credentials from api_credentials table
  useEffect(() => {
    getApiCredentials('timely').then(creds => {
      if (!creds) return;
      if (creds.app_id) setClientId(creds.app_id);
      if (creds.app_secret) setClientSecret(creds.app_secret);
      if (creds.account_id) setAccountId(creds.account_id);
      if (creds.access_token) setAccessToken(creds.access_token);
    });
    getAppSettings(['timely_last_sync']).then(s => {
      if (s.timely_last_sync) setLastSync(s.timely_last_sync);
    });
  }, []);

  // Handle OAuth callback — Timely redirects back here with ?code=XXX&state=timely
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state === 'timely') {
      window.history.replaceState({}, '', '/settings');
      setConnecting(true);

      // Read credentials from sessionStorage (set by handleConnect before redirect)
      // Fall back to DB if sessionStorage is empty
      const stored = sessionStorage.getItem('timely_oauth_creds');
      sessionStorage.removeItem('timely_oauth_creds');

      const resolveCredentials = stored
        ? Promise.resolve(JSON.parse(stored) as { client_id: string; client_secret: string; account_id: string })
        : getApiCredentials('timely').then(creds => ({
            client_id: creds?.app_id ?? '',
            client_secret: creds?.app_secret ?? '',
            account_id: creds?.account_id ?? '',
          }));

      resolveCredentials.then(async creds => {
        if (!creds.client_id || !creds.client_secret) {
          setConnectError('Credentials not found. Please re-enter your Application ID and Secret and try connecting again.');
          setConnecting(false);
          return;
        }
        // Restore fields from what we have
        setClientId(creds.client_id);
        setClientSecret(creds.client_secret);
        if (creds.account_id) setAccountId(creds.account_id);

        try {
          // timely-token handles both exchange AND persistence (Supabase api_credentials table)
          const res = await fetch('/api/timely-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: creds.client_id,
              client_secret: creds.client_secret,
              account_id: creds.account_id,
              code,
              redirect_uri: TIMELY_REDIRECT_URI,
            }),
          });
          const parsed = await readJsonSafely<{ access_token?: string; error?: string; message?: string }>(res);
          if (parsed.parseError) {
            throw new Error(getJsonApiErrorMessage(parsed));
          }
          if (!res.ok) {
            throw new Error(getJsonApiErrorMessage(parsed));
          }
          if (parsed.data?.access_token) {
            setAccessToken(parsed.data.access_token);
            // timely-token already persisted to api_credentials; update local state only
          } else {
            setConnectError(`Timely did not return an access token. Response: ${JSON.stringify(parsed.data)}`);
          }
        } catch (e) {
          setConnectError(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
        }
        setConnecting(false);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const updates: Record<string, string> = {
      app_id: clientId,
      app_secret: clientSecret,
      account_id: accountId,
    };
    if (accessToken) updates.access_token = accessToken;
    const ok = await upsertApiCredentials('timely', updates);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setConnectError('Save failed — make sure your profile has admin role in Supabase.');
    }
    setSaving(false);
  };

  const handleConnect = async () => {
    if (!clientId || !clientSecret || !accountId) return;
    // Store credentials in sessionStorage so they survive the OAuth redirect
    sessionStorage.setItem('timely_oauth_creds', JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      account_id: accountId,
    }));
    const authUrl = `https://api.timelyapp.com/1.1/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(TIMELY_REDIRECT_URI)}&state=timely`;
    window.location.href = authUrl;
  };

  const handleSync = useCallback(async () => {
    if (!accessToken || !accountId) return;
    setSyncing(true);
    setSyncResult(null);
    const result = await syncTimelyData(accessToken, accountId);
    setSyncResult(result);
    setSyncing(false);
    if (result.errors.length === 0) {
      setLastSync(new Date().toISOString());
      bumpSyncVersion();
    }
  }, [accessToken, accountId, bumpSyncVersion]);

  const handleDisconnect = async () => {
    setAccessToken('');
    await upsertApiCredentials('timely', { access_token: '' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'timely' }),
      });
      const parsed = await readJsonSafely<{ ok?: boolean; message?: string; error?: string }>(res);
      if (parsed.parseError) {
        setTestResult({ ok: false, message: getJsonApiErrorMessage(parsed) });
      } else if (!res.ok) {
        setTestResult({ ok: false, message: getJsonApiErrorMessage(parsed) });
      } else {
        setTestResult({
          ok: Boolean(parsed.data?.ok),
          message: typeof parsed.data?.message === 'string' ? parsed.data.message : 'Connection test completed.',
        });
      }
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    }
    setTesting(false);
  };

  const isConfigured = !!(clientId && clientSecret && accountId);
  const isConnected = !!accessToken;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-teal-dim)', border: '1px solid var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Clock size={20} color="var(--accent-teal)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Timely Integration</h2>
            <ConnectionBadge connected={isConnected} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Syncs billable and internal hours per designer from Timely via OAuth. Create an API application in Timely to get started.
          </p>
        </div>
      </div>

      {/* Connecting status */}
      {connecting && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-teal)', fontSize: 13 }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Completing Timely connection…
        </div>
      )}
      {connectError && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', fontSize: 13, color: 'var(--accent-red)' }}>
          {connectError}
        </div>
      )}

      {/* OAuth app credentials */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          OAuth Application Credentials
        </div>
        <CredentialField
          label="Application ID"
          value={clientId}
          onChange={setClientId}
          placeholder="Your Timely Application ID"
          hint="Timely → API → My Applications"
        />
        <CredentialField
          label="Application Secret"
          value={clientSecret}
          onChange={setClientSecret}
          placeholder="Your Timely Application Secret"
          secret
          hint="Timely → API → My Applications"
        />
        <CredentialField
          label="Account ID"
          value={accountId}
          onChange={setAccountId}
          placeholder="e.g. 123456"
          hint="The number in your Timely URL"
        />

        {/* Callback URL reminder */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Callback URL (paste this into Timely)</div>
          <code style={{ fontSize: 12, color: 'var(--accent-teal)', fontFamily: 'DM Mono, monospace' }}>{TIMELY_REDIRECT_URI}</code>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: saved ? 'var(--accent-green-dim)' : 'var(--bg-surface)',
              color: saved ? 'var(--accent-green)' : 'var(--text-primary)',
              border: `1px solid ${saved ? 'var(--accent-green)' : 'var(--border-accent)'}`,
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleConnect}
            disabled={!isConfigured}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: isConfigured ? 'var(--accent-teal)' : 'var(--bg-surface)',
              color: isConfigured ? '#0f1117' : 'var(--text-subtle)',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: isConfigured ? 'pointer' : 'not-allowed',
            }}
          >
            <ExternalLink size={14} />
            {isConnected ? 'Reconnect Timely' : 'Connect Timely'}
          </button>
          {isConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'var(--bg-inner)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
          {isConnected && (
            <button
              onClick={handleTest}
              disabled={testing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: 'var(--bg-inner)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: testing ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCircle size={14} />
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
          )}
          {isConnected && (
            <button onClick={handleDisconnect} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text-subtle)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              Disconnect
            </button>
          )}
        </div>
        {testResult && (
          <div style={{ marginTop: 10, fontSize: 12, color: testResult.ok ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {testResult.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {testResult.message}
          </div>
        )}
        {lastSync && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-subtle)' }}>
            Last synced: {new Date(lastSync).toLocaleString()}
          </div>
        )}
      </div>

      {syncResult && <SyncResult result={syncResult} />}

      <FeatureCard title="What This Sync Does" features={[
        'Fetches all time entries from Timely and groups by designer + month',
        'Calculates total, billable, and internal hours per month',
        'Saves to monthly_hours_summary — used for utilization scoring',
        'Re-running sync updates existing records (safe to run repeatedly)',
        'Goes back through all available Timely history on first sync',
      ]} />

      <SetupGuide steps={[
        'In Timely, go to API → My Applications → New Application',
        `Set the Callback URL to exactly: ${TIMELY_REDIRECT_URI}`,
        'Copy the Application ID and Secret into the fields above',
        'Copy your Account ID from the Timely URL (timelyapp.com/XXXXXX)',
        'Click Save, then Connect Timely — you\'ll be redirected to authorise',
        'After authorising, click Sync Now to pull all historical data',
      ]} />
    </div>
  );
}

// ─── ClickUp Tab ───────────────────────────────────────────────────────────────

function ClickUpTab() {
  const bumpSyncVersion = useBumpSyncVersion();
  const [apiKey, setApiKey] = useState('');
  const [teamId, setTeamId] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    getApiCredentials('clickup').then(creds => {
      if (!creds) return;
      if (creds.api_key) setApiKey(creds.api_key);
      if (creds.team_id) setTeamId(creds.team_id);
    });
    getAppSettings(['clickup_last_sync']).then(s => {
      if (s.clickup_last_sync) setLastSync(s.clickup_last_sync);
    });
  }, []);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const ok = await upsertApiCredentials('clickup', { api_key: apiKey, team_id: teamId });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError('Save failed — make sure your profile has admin role in Supabase.');
    }
    setSaving(false);
  };

  const handleSync = useCallback(async () => {
    if (!apiKey || !teamId) return;
    setSyncing(true);
    setSyncResult(null);
    const result = await syncClickUpData(apiKey, teamId);
    setSyncResult(result);
    setSyncing(false);
    if (result.errors.length === 0) {
      setLastSync(new Date().toISOString());
      bumpSyncVersion();
    }
  }, [apiKey, teamId, bumpSyncVersion]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'clickup' }),
      });
      const parsed = await readJsonSafely<{ ok?: boolean; message?: string; error?: string }>(res);
      if (parsed.parseError) {
        setTestResult({ ok: false, message: getJsonApiErrorMessage(parsed) });
      } else if (!res.ok) {
        setTestResult({ ok: false, message: getJsonApiErrorMessage(parsed) });
      } else {
        setTestResult({
          ok: Boolean(parsed.data?.ok),
          message: typeof parsed.data?.message === 'string' ? parsed.data.message : 'Connection test completed.',
        });
      }
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    }
    setTesting(false);
  };

  const isConnected = !!(apiKey && teamId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-violet-dim)', border: '1px solid var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckSquare size={20} color="var(--accent-violet)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>ClickUp Integration</h2>
            <ConnectionBadge connected={isConnected} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Syncs task deadline data to track on-time delivery. Enter your personal API token and Workspace (Team) ID.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          API Credentials
        </div>
        <CredentialField
          label="Personal API Token"
          value={apiKey}
          onChange={setApiKey}
          placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          secret
          hint="Settings → My Apps → API Token"
        />
        <CredentialField
          label="Workspace (Team) ID"
          value={teamId}
          onChange={setTeamId}
          placeholder="e.g. 9012345678"
          hint="app.clickup.com/XXXXXXXXXX/…"
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: saved ? 'var(--accent-green-dim)' : 'var(--accent-violet)',
              color: saved ? 'var(--accent-green)' : '#fff',
              border: saved ? '1px solid var(--accent-green)' : 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Credentials'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || !isConnected}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'var(--bg-inner)', color: isConnected ? 'var(--text-secondary)' : 'var(--text-subtle)',
              border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: syncing || !isConnected ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !isConnected}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--bg-inner)', color: isConnected ? 'var(--text-secondary)' : 'var(--text-subtle)',
              border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: testing || !isConnected ? 'not-allowed' : 'pointer',
            }}
          >
            <CheckCircle size={14} />
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
        {saveError && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-red)' }}>{saveError}</div>
        )}
        {testResult && (
          <div style={{ marginTop: 10, fontSize: 12, color: testResult.ok ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {testResult.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {testResult.message}
          </div>
        )}
        {lastSync && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-subtle)' }}>
            Last synced: {new Date(lastSync).toLocaleString()}
          </div>
        )}
      </div>

      {syncResult && <SyncResult result={syncResult} />}

      <FeatureCard title="What This Sync Does" features={[
        'Fetches all tasks from your ClickUp workspace with due dates',
        'Identifies tasks completed after their due date (late delivery)',
        'Records days late and assignee for each late task',
        'Saves to clickup_deadlines — used for deadline performance scoring',
        'Attribution (Designer / Client / Out of Control) can be set from designer profiles',
      ]} />

      <SetupGuide steps={[
        'In ClickUp, go to Settings → My Apps and create a personal API token',
        'Find your Workspace ID in the URL: app.clickup.com/XXXXXXXXXX',
        'Make sure all designers use their Steadfast email in ClickUp',
        'Paste both credentials above and click Save Credentials',
        'Click Sync Now to pull all historical task data',
      ]} />
    </div>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: connected ? 'var(--accent-teal-dim)' : 'var(--bg-inner)',
      color: connected ? 'var(--accent-teal)' : 'var(--text-subtle)',
      border: `1px solid ${connected ? 'var(--accent-teal)' : 'var(--border)'}`,
    }}>
      {connected ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
      {connected ? 'Credentials saved' : 'Not configured'}
    </span>
  );
}

function SyncResult({ result }: { result: { synced: number; errors: string[] } }) {
  const success = result.errors.length === 0;
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 10,
      background: success ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
      border: `1px solid ${success ? 'var(--accent-green)' : 'var(--accent-red)'}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: success ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: result.errors.length > 0 ? 8 : 0 }}>
        {success ? `✓ Sync complete — ${result.synced} records updated` : `Sync finished with ${result.errors.length} error(s) · ${result.synced} records updated`}
      </div>
      {result.errors.length > 0 && (
        <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--accent-red)' }}>
          {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
          {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
        </ul>
      )}
    </div>
  );
}

function FeatureCard({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-teal)', flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SetupGuide({ steps }: { steps: string[] }) {
  return (
    <div className="card" style={{ background: 'rgba(85,170,170,0.04)', border: '1px solid rgba(85,170,170,0.2)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Setup Guide
      </div>
      <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
