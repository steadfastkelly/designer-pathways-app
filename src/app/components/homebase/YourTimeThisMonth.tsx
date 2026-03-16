import type { MonthlyHoursSummary, Profile } from '../../types';
import { format } from 'date-fns';

interface Props {
  monthlyHours: MonthlyHoursSummary[];
  profile: Profile;
}

function getPaceMessage(pace: number): string {
  if (pace >= 0.90) return "You're pacing well this month. Keep doing what you're doing.";
  if (pace >= 0.70) return "You're building steadily. There's still plenty of time to keep the momentum going.";
  return "It looks like things might be a bit lighter this month. If there's anything affecting your workflow, your next 1:1 is a good time to talk through it.";
}

export function YourTimeThisMonth({ monthlyHours, profile }: Props) {
  const now = new Date();
  const currentMonth = monthlyHours.find(h => h.year === now.getFullYear() && h.month === now.getMonth() + 1);
  const targetMonthlyHours = (profile.scheduledHoursPerWeek * 52) / 12;
  const pace = currentMonth ? currentMonth.billableHours / targetMonthlyHours : 0;
  const paceMessage = getPaceMessage(pace);

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Your Time This Month — {format(now, 'MMMM yyyy')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Hours', value: currentMonth?.totalHours.toFixed(1) ?? '—' },
          { label: 'Billable Hours', value: currentMonth?.billableHours.toFixed(1) ?? '—', accent: true },
          { label: 'Billable %', value: currentMonth ? `${currentMonth.billablePercent.toFixed(0)}%` : '—' },
          { label: 'Logging Days', value: currentMonth?.loggingDays.toString() ?? '—' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 500, color: accent ? 'var(--accent-teal)' : 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 10 }}>
        {paceMessage}
      </p>
    </div>
  );
}
