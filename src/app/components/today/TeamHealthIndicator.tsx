import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { TeamHealthResult } from '../../types';

interface Props {
  health: TeamHealthResult;
}

const config = {
  green: { icon: CheckCircle, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', label: 'Team On Track' },
  amber: { icon: AlertTriangle, color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', label: 'Attention Needed' },
  red: { icon: XCircle, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', label: 'Immediate Attention' },
};

export function TeamHealthIndicator({ health }: Props) {
  const { icon: Icon, color, bg, label } = config[health.status];
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Team Health — {label}
        </div>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {health.message}
        </p>
      </div>
    </div>
  );
}
