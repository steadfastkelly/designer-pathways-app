import { useTodayData } from '../hooks/useTodayData';
import { TeamHealthIndicator } from '../components/today/TeamHealthIndicator';
import { AttentionCard } from '../components/today/AttentionCard';
import { ComingUpList } from '../components/today/ComingUpList';

export function TodayPage() {
  const { teamHealth, attentionItems, comingUp, loading, error } = useTodayData();

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

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 400, marginBottom: 6 }}>
          {greeting}, Kelly
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
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
        {attentionItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No immediate attention items — all looking good!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {attentionItems.map((item) => (
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
        <ComingUpList items={comingUp} />
      </section>
    </div>
  );
}
