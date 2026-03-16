import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { MonthlyHoursSummary, CoachingNote, ClickupDeadline, Profile } from '../../types';

import { getDesignerScore, getBillableTarget } from '../../lib/scoring';

interface Props {
  profile: Profile;
  monthlyHours: MonthlyHoursSummary[];
  coachingNotes: CoachingNote[];
  deadlines: ClickupDeadline[];
}

const CATEGORY_COLORS: Record<string, string> = {
  billable_hours: '#EF4444', logging_accuracy: '#F59E0B', deadlines: '#F59E0B',
  communication: '#3B82F6', conduct: '#7C3AED', pathway_progression: '#2DD4BF',
  workload: '#10B981', general: '#8B8FA8',
};

function MetricTile({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, fontWeight: 500, color: color ?? 'var(--text-primary)' }}>{value}</div>
      {subValue && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subValue}</div>}
    </div>
  );
}

export function OverviewTab({ profile, monthlyHours, coachingNotes, deadlines }: Props) {
  const score = getDesignerScore(profile, monthlyHours, deadlines);
  const target = getBillableTarget(profile.email, profile);
  const current = monthlyHours[0];

  // Build 90-day chart data from monthly hours (week-level not available, use monthly)
  const chartData = monthlyHours.slice(0, 6).reverse().map(h => ({
    label: format(new Date(h.year, h.month - 1), 'MMM yy'),
    billable: parseFloat(h.billablePercent.toFixed(1)),
    hours: parseFloat(h.billableHours.toFixed(1)),
    month: `${h.year}-${String(h.month).padStart(2, '0')}`,
  }));

  // Coaching note reference lines (by month)
  const coachingByMonth: Record<string, { category: string; count: number }> = {};
  for (const note of coachingNotes) {
    const m = note.createdAt.substring(0, 7);
    if (!coachingByMonth[m]) coachingByMonth[m] = { category: note.category, count: 0 };
    coachingByMonth[m].count++;
  }

  const deadlineTotal = deadlines.length;
  const designerFault = deadlines.filter(d => d.wasLate && d.attribution === 'designer').length;
  const onTimeRate = deadlineTotal > 0 ? ((deadlineTotal - designerFault) / deadlineTotal * 100) : 100;

  const STATUS_LABELS = { on_track: 'On Track', watch: 'Watch', action_needed: 'Action Needed' };
  const STATUS_COLORS = { on_track: 'var(--accent-green)', watch: 'var(--accent-amber)', action_needed: 'var(--accent-red)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        <MetricTile
          label="Overall Status"
          value={STATUS_LABELS[score.status]}
          color={STATUS_COLORS[score.status]}
        />
        <MetricTile
          label="Billable % This Month"
          value={current ? `${current.billablePercent.toFixed(0)}%` : '—'}
          subValue={!target.exempt ? `Target: ${target.min}–${target.max}%` : 'Exempt'}
        />
        <MetricTile
          label="Billable Hours"
          value={current ? current.billableHours.toFixed(0) : '—'}
          subValue="this month"
        />
        <MetricTile
          label="Deadline On-Time"
          value={`${onTimeRate.toFixed(0)}%`}
          subValue={`${deadlineTotal} total tracked`}
        />
        <MetricTile
          label="Logging Days"
          value={current ? String(current.loggingDays) : '—'}
          subValue="this month"
        />
        <MetricTile
          label="Score"
          value={score.overallScore.toFixed(2)}
          subValue="weighted performance"
          color="var(--accent-teal)"
        />
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>About</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
        </div>
      )}

      {/* 90-Day Trend Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Billable % Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>Last {chartData.length} months · Vertical lines = coaching conversations</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }}
                itemStyle={{ color: 'var(--accent-teal)' }}
              />
              {/* Target line */}
              {!target.exempt && (
                <ReferenceLine y={target.min} stroke="var(--accent-amber)" strokeDasharray="4 4" label={{ value: 'Target', fill: 'var(--accent-amber)', fontSize: 10 }} />
              )}
              {/* Coaching note markers */}
              {chartData.filter(d => coachingByMonth[d.month]).map(d => (
                <ReferenceLine
                  key={d.month}
                  x={d.label}
                  stroke={CATEGORY_COLORS[coachingByMonth[d.month].category] ?? 'var(--accent-violet)'}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              ))}
              <Line
                type="monotone" dataKey="billable" stroke="var(--accent-teal)"
                strokeWidth={2} dot={{ fill: 'var(--accent-teal)', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Personality */}
      {(profile.personalityMbti || profile.personalityEnneagram) && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Working Style</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {profile.personalityMbti && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 2 }}>MBTI</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: 'var(--accent-teal)' }}>{profile.personalityMbti}</div>
              </div>
            )}
            {profile.personalityEnneagram && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 2 }}>Enneagram</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: 'var(--accent-violet)' }}>{profile.personalityEnneagram}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
