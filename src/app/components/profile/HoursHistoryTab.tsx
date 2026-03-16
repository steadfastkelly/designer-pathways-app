import { useState } from 'react';

import type { MonthlyHoursSummary } from '../../types';

interface Props { monthlyHours: MonthlyHoursSummary[]; }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function HoursHistoryTab({ monthlyHours }: Props) {
  const [period, setPeriod] = useState<3 | 6 | 12 | 24>(12);
  const [yearOverYear, setYearOverYear] = useState(false);

  const sorted = [...monthlyHours].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );
  const displayHours = sorted.slice(0, period);
  const currentYear = new Date().getFullYear();

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
    background: active ? 'var(--accent-teal)' : 'transparent',
    color: active ? '#0F1117' : 'var(--text-muted)',
    border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-accent)'}`,
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {([3, 6, 12, 24] as const).map(n => (
            <button key={n} style={btnStyle(period === n)} onClick={() => setPeriod(n)}>{n}mo</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={yearOverYear} onChange={e => setYearOverYear(e.target.checked)} style={{ accentColor: 'var(--accent-teal)' }} />
          Annual Review Mode
        </label>
      </div>

      {yearOverYear ? (
        <YoYView hours={sorted} currentYear={currentYear} />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Month', 'Total Hrs', 'Billable Hrs', 'Internal Hrs', 'Billable %', 'Logging Days'].map(h => (
                <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayHours.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>
                  {MONTH_NAMES[row.month - 1]} {row.year}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{row.totalHours.toFixed(1)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--accent-teal)' }}>{row.billableHours.toFixed(1)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{row.internalHours.toFixed(1)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{row.billablePercent.toFixed(1)}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{row.loggingDays}</td>
              </tr>
            ))}
            {displayHours.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>No hours data available.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GrowthIndicator({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return <span style={{ color: 'var(--text-subtle)' }}>—</span>;
  const delta = ((current - prev) / prev) * 100;
  const isUp = delta > 1;
  const isDown = delta < -1;
  return (
    <span style={{ color: isUp ? 'var(--accent-green)' : isDown ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
      {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function YoYView({ hours, currentYear }: { hours: MonthlyHoursSummary[]; currentYear: number }) {
  const thisYear = hours.filter(h => h.year === currentYear);
  const lastYear = hours.filter(h => h.year === currentYear - 1);
  const months = [1,2,3,4,5,6,7,8,9,10,11,12].filter(m =>
    thisYear.some(h => h.month === m) || lastYear.some(h => h.month === m)
  );

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</th>
          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentYear - 1} Billable%</th>
          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentYear} Billable%</th>
          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Growth</th>
          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours {currentYear - 1}</th>
          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours {currentYear}</th>
        </tr>
      </thead>
      <tbody>
        {months.map(m => {
          const curr = thisYear.find(h => h.month === m);
          const prev = lastYear.find(h => h.month === m);
          return (
            <tr key={m} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>{MONTH_NAMES[m-1]}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-muted)' }}>{prev ? `${prev.billablePercent.toFixed(1)}%` : '—'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{curr ? `${curr.billablePercent.toFixed(1)}%` : '—'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                {curr && prev ? <GrowthIndicator current={curr.billablePercent} prev={prev.billablePercent} /> : '—'}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-muted)' }}>{prev ? prev.billableHours.toFixed(0) : '—'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{curr ? curr.billableHours.toFixed(0) : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

