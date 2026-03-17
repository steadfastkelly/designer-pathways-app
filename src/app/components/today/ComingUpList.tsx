import { format, parseISO } from 'date-fns';
import { Calendar, DollarSign, Activity, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ComingUpItem } from '../../types';

const TYPE_CONFIG = {
  review: { icon: Calendar, color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
  bonus: { icon: DollarSign, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  pip: { icon: Activity, color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
  cycle: { icon: RotateCcw, color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
};

export function ComingUpList({ items }: { items: ComingUpItem[] }) {
  const safeItems = items ?? [];
  if (safeItems.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
          Nothing coming up in the next 30 days.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {safeItems.map((item) => {
        const { icon: Icon, color, bg } = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.review;
        return (
          <div
            key={item.id}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>
                {item.description}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                {format(parseISO(item.date), 'MMM d, yyyy')}
              </div>
            </div>
            {item.designerId && (
              <Link
                to={`/team/${item.designerId}`}
                style={{ fontSize: 12, color, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
              >
                View →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
