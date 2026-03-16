import type { DesignerScore } from '../../types';

interface Props {
  scores: DesignerScore[];
}

export function StatusCounters({ scores }: Props) {
  const onTrack = scores.filter(s => s.status === 'on_track').length;
  const watch = scores.filter(s => s.status === 'watch').length;
  const action = scores.filter(s => s.status === 'action_needed').length;

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {[
        { label: 'On Track', count: onTrack, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
        { label: 'Watch', count: watch, color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
        { label: 'Action Needed', count: action, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
      ].map(({ label, count, color, bg }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: bg }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 500, color }}>{count}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
