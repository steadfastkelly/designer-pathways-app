import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTodayData } from '../hooks/useTodayData';
import { useAuth } from '../hooks/useAuth';
import { useSyncVersion } from '../contexts/SyncContext';
import { getAppSettings } from '../lib/api';
import { TeamHealthIndicator } from '../components/today/TeamHealthIndicator';
import { AttentionCard } from '../components/today/AttentionCard';
import { ComingUpList } from '../components/today/ComingUpList';

function useLastSynced() {
  const syncVersion = useSyncVersion();
  const [lastSync, setLastSync] = useState<string | null>(null);
  useEffect(() => {
    getAppSettings(['timely_last_sync', 'clickup_last_sync']).then(s => {
      const t = s.timely_last_sync ?? null;
      const c = s.clickup_last_sync ?? null;
      if (t && c) setLastSync(t > c ? t : c);
      else setLastSync(t ?? c ?? null);
    });
  }, [syncVersion]);
  return lastSync;
}

export function TodayPage() {
  const { teamHealth, attentionItems, comingUp, loading, error, refetch } = useTodayData();
  const { effectiveUser } = useAuth();
  const lastSync = useLastSynced();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading team data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>Error loading data: {error}</p>
      </div>
    );
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = effectiveUser?.name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: 32, fontWeight: 400, marginBottom: 6 }}>
            {greeting}, {firstName}
          </h1>
          <button
            onClick={refetch}
            title="Refresh data"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '8px 4px', marginTop: 4 }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          {lastSync && (
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
              · Last synced {(() => {
                const mins = Math.round((Date.now() - new Date(lastSync).getTime()) / 60000);
                return mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
              })()}
            </span>
          )}
        </div>
      </div>

      {/* Team Health */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 12, color: 'var(--text-primary)' }}>
          Team Health
        </h2>
        <TeamHealthIndicator health={teamHealth} />
      </section>

      {/* Who Needs Attention */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 12, color: 'var(--text-primary)' }}>
          Who Needs My Attention
        </h2>
        {(attentionItems ?? []).length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No immediate attention items — all looking good!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(attentionItems ?? []).map((item) => (
              <AttentionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Coming Up */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 12, color: 'var(--text-primary)' }}>
          Coming Up (Next 30 Days)
        </h2>
        <ComingUpList items={comingUp ?? []} />
      </section>
    </div>
  );
}
