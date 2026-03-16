import { useAuth } from '../hooks/useAuth';
import { useHomebaseData } from '../hooks/useHomebaseData';
import { YourTimeThisMonth } from '../components/homebase/YourTimeThisMonth';
import { YourJourney } from '../components/homebase/YourJourney';
import { format } from 'date-fns';

export function HomebasePage() {
  const { effectiveUser } = useAuth();
  const { monthlyHours, teamHours, goals, reviews, loading } = useHomebaseData(effectiveUser?.id);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--accent-teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!effectiveUser) {
    return <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading your profile…</div>;
  }

  const firstName = effectiveUser.name.split(' ')[0];

  // Team collective hours this month
  const now = new Date();
  const teamThisMonth = teamHours.filter(h => h.year === now.getFullYear() && h.month === now.getMonth() + 1);
  const totalTeamBillable = teamThisMonth.reduce((sum, h) => sum + h.billableHours, 0);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {format(now, 'EEEE, MMMM d')}
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Hey, {firstName}.</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          Here's where things stand this month.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Time This Month */}
        <YourTimeThisMonth monthlyHours={monthlyHours} profile={effectiveUser} />

        {/* Your Journey */}
        <YourJourney profile={effectiveUser} goals={goals} reviews={reviews} />

        {/* Team Collective */}
        {totalTeamBillable > 0 && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Team Billable Hours This Month</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, color: 'var(--accent-teal)' }}>{totalTeamBillable.toFixed(0)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>across {teamThisMonth.length} designers</div>
            </div>
          </div>
        )}

        {/* Bio */}
        {effectiveUser.bio && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Your Profile</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{effectiveUser.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
