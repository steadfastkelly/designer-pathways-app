import { format, parseISO } from 'date-fns';
import { Edit2, Calendar, MapPin } from 'lucide-react';
import { Avatar } from '../team/DesignerCard';
import type { Profile, DesignerScore } from '../../types';
import { PATHWAY_LEVEL_LABELS } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const STATUS_LABELS = { on_track: 'On Track', watch: 'Watch', action_needed: 'Action Needed' };
const STATUS_COLORS = { on_track: 'var(--accent-green)', watch: 'var(--accent-amber)', action_needed: 'var(--accent-red)' };

interface Props {
  profile: Profile;
  score: DesignerScore;
  onEdit: () => void;
}

export function ProfileHeader({ profile, score, onEdit }: Props) {
  const { role } = useAuth();
  const statusColor = STATUS_COLORS[score.status];

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <Avatar name={profile.name} size={64} />
        <div>
          <h1 style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 4 }}>{profile.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
            {profile.externalTitle ?? '—'}
            {profile.pathwayLevel && (
              <span style={{ marginLeft: 10, color: 'var(--text-subtle)', fontSize: 12 }}>
                · {PATHWAY_LEVEL_LABELS[profile.pathwayLevel]}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="status-dot" style={{ background: statusColor }} />
              <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{STATUS_LABELS[score.status]}</span>
            </div>
            {/* Location */}
            {profile.locationCity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-subtle)' }}>
                <MapPin size={12} />
                {profile.locationCity}{profile.locationState ? `, ${profile.locationState}` : ''}
              </div>
            )}
            {/* Hire Date */}
            {profile.hireDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-subtle)' }}>
                <Calendar size={12} />
                Since {format(parseISO(profile.hireDate), 'MMM yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      {role === 'admin' && (
        <button
          onClick={onEdit}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-accent)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-teal)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
        >
          <Edit2 size={14} />
          Edit Profile
        </button>
      )}
    </div>
  );
}
