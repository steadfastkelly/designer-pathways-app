import { useTeamData } from '../hooks/useTeamData';
import { DesignerCard } from '../components/team/DesignerCard';
import { StatusCounters } from '../components/team/StatusCounters';

export function TeamPage() {
  const { members, loading, error } = useTeamData();

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
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Team</h1>
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
