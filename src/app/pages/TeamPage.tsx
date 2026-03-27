import { useState, useEffect } from 'react';
import { useTeamData } from '../hooks/useTeamData';
import { DesignerCard } from '../components/team/DesignerCard';
import { StatusCounters } from '../components/team/StatusCounters';
import { getAppSettings } from '../lib/api';
import { useSyncVersion } from '../contexts/SyncContext';

function useLastSynced() {
  const syncVersion = useSyncVersion();
  const [lastSync, setLastSync] = useState<string | null>(null);
  useEffect(() => {
    getAppSettings(['timely_last_sync', 'clickup_last_sync']).then(s => {
      const t = s.timely_last_sync ?? null;
      const c = s.clickup_last_sync ?? null;
      // Show the most recent of the two
      if (t && c) setLastSync(t > c ? t : c);
      else setLastSync(t ?? c ?? null);
    });
  }, [syncVersion]);
  return lastSync;
}

function LastSyncedChip({ isoString }: { isoString: string }) {
  const mins = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  const label = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
  return (
    <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
      Last synced {label}
    </span>
  );
}

export function TeamPage() {
  const { members, loading, error } = useTeamData();
  const lastSync = useLastSynced();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading team…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Team</h1>
          {lastSync && <LastSyncedChip isoString={lastSync} />}
        </div>
        <StatusCounters scores={members.map((m) => m.score)} />
      </div>

      {/* Grid */}
      {members.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          No active designers found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {members.map(({ profile, score, hours }) => {
            const current = hours.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)[0];
            return (
              <DesignerCard
                key={profile.id}
                profile={profile}
                score={score}
                currentMonth={current}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
