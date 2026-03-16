import { Link } from 'react-router-dom';
import { AlertCircle, Clock, FileCheck, DollarSign, TrendingDown, Activity } from 'lucide-react';
import type { AttentionItem, AttentionPriority } from '../../types';

const PRIORITY_CONFIG: Record<AttentionPriority, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  'utilization-red': { color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', icon: TrendingDown, label: 'Utilization' },
  'pip-checkin': { color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)', icon: Activity, label: 'PIP Check-in' },
  'missed-deadline': { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', icon: Clock, label: 'Missed Deadline' },
  'review-due': { color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)', icon: FileCheck, label: 'Review Due' },
  'bonus-due': { color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', icon: DollarSign, label: 'Bonus Due' },
  'utilization-yellow': { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', icon: AlertCircle, label: 'Utilization Watch' },
  'blocker-pattern': { color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)', icon: AlertCircle, label: 'Blockers' },
};

export function AttentionCard({ item }: { item: AttentionItem }) {
  const { color, bg, icon: Icon, label } = PRIORITY_CONFIG[item.priority];
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          {label}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.5 }}>
          {item.message}
        </p>
        {item.actionPath && (
          <Link
            to={item.actionPath}
            style={{ fontSize: 12, color, fontWeight: 600, textDecoration: 'none' }}
          >
            {item.actionLabel ?? 'View'} →
          </Link>
        )}
      </div>
    </div>
  );
}
