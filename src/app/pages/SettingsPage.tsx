import { useState } from 'react';
import { Users, Clock, CheckSquare, ExternalLink } from 'lucide-react';
import { useTeamData } from '../hooks/useTeamData';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/team/DesignerCard';
import { PATHWAY_LEVEL_LABELS } from '../types';

type TabId = 'profiles' | 'timely' | 'clickup';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profiles');
  const { members, loading } = useTeamData();

  const tabs = [
    { id: 'profiles' as TabId, label: 'Profile Management', icon: Users },
    { id: 'timely' as TabId, label: 'Timely Integration', icon: Clock },
    { id: 'clickup' as TabId, label: 'ClickUp Integration', icon: CheckSquare },
  ];

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 7,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Integrations, user management, and system configuration</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} style={tabBtnStyle(activeTab === id)} onClick={() => setActiveTab(id)}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profiles' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Designer Profiles</h2>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{members.length} active designers</div>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members.map(({ profile }) => (
                <div key={profile.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={profile.name} size={40} />
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
                    View Profile <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timely' && (
        <IntegrationPanel
          title="Timely Integration"
          description="Connect to Timely to automatically sync billable and internal hours for all designers. The app tracks logging accuracy by comparing hourly snapshots."
          icon={<Clock size={24} color="var(--accent-teal)" />}
          envVars={['VITE_TIMELY_APP_ID', 'VITE_TIMELY_SECRET']}
          features={[
            'Syncs billable and internal hours per designer',
            'Detects logging corrections and tracks accuracy',
            'Flags potential mislabeled billable work',
            'Identifies internal hours spikes',
          ]}
        />
      )}

      {activeTab === 'clickup' && (
        <IntegrationPanel
          title="ClickUp Integration"
          description="Connect to ClickUp to track deadline performance. The app identifies tasks that moved to Review status after their due date."
          icon={<CheckSquare size={24} color="var(--accent-violet)" />}
          envVars={['VITE_CLICKUP_API_KEY']}
          features={[
            'Tracks tasks moved to Review after due date',
            'Calculates days late per task',
            'Surfaces attribution requests (Designer / Client / Out of Control)',
            'Feeds into deadline performance score',
          ]}
        />
      )}
    </div>
  );
}

function IntegrationPanel({ title, description, icon, envVars, features }: {
  title: string; description: string; icon: React.ReactNode;
  envVars: string[]; features: string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{description}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Required Environment Variables</div>
        {envVars.map(v => (
          <div key={v} style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 6, fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--accent-teal)', marginBottom: 6 }}>{v}</div>
        ))}
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 10, margin: 0 }}>
          Set these in your Netlify environment variables or local .env file.
        </p>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>What This Integration Does</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {features.map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: 1 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)' }}>
        <div style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600, marginBottom: 6 }}>MVP Note</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Live sync is not implemented in the MVP. Data can be seeded directly into the Supabase database. 
          Integration functions are defined in the codebase and ready for implementation.
        </p>
      </div>
    </div>
  );
}
