import { Link } from 'react-router-dom';
import type { Profile, DesignerScore, MonthlyHoursSummary } from '../../types';
import { PATHWAY_LEVEL_LABELS } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export function getAvatarColor(name: string): string {
  const colors = ['#55aaaa', '#796f8e', '#b19a67', '#4ade80', '#60a5fa', '#f87171'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, avatarUrl, size = 48 }: { name: string; avatarUrl?: string; size?: number }) {
  const safeName = name || '?';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={safeName}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, display: 'block',
          boxShadow: '0 0 0 2px var(--bg-card)',
        }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  const color = getAvatarColor(safeName);
  const initials = safeName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#1a1e24', flexShrink: 0,
      fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  );
}

const STATUS_COLORS = {
  on_track: 'var(--accent-green)',
  watch: 'var(--accent-amber)',
  action_needed: 'var(--accent-red)',
};

const STATUS_LABELS = {
  on_track: 'On Track',
  watch: 'Watch',
  action_needed: 'Action Needed',
};

interface Props {
  profile: Profile;
  score: DesignerScore;
  currentMonth?: MonthlyHoursSummary;
}

export function DesignerCard({ profile, score, currentMonth }: Props) {
  const { role } = useAuth();
  const isClickable = role === 'admin' || role === 'supervisor';
  const statusColor = STATUS_COLORS[score.status];

  const card = (
    <div
      className="card"
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'border-color 0.15s, transform 0.1s',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
      onMouseEnter={e => isClickable && ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-accent)')}
      onMouseLeave={e => isClickable && ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size={48} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {profile.externalTitle ?? '—'}
            </div>
          </div>
        </div>
        {/* Status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexShrink: 0 }}>
          <div className="status-dot" style={{ background: statusColor }} />
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
            {STATUS_LABELS[score.status]}
          </span>
        </div>
      </div>

      {/* Pathway Level */}
      {profile.pathwayLevel && (
        <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
          {PATHWAY_LEVEL_LABELS[profile.pathwayLevel]}
          {profile.pathwayTrack && ` · ${profile.pathwayTrack.charAt(0).toUpperCase() + profile.pathwayTrack.slice(1)}`}
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3 }}>Billable %</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>
            {currentMonth ? `${currentMonth.billablePercent.toFixed(0)}%` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3 }}>Billable hrs</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>
            {currentMonth ? currentMonth.billableHours.toFixed(0) : '—'}
          </div>
        </div>
      </div>

      {/* Region */}
      {profile.region && (
        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
          {profile.locationCity ? `${profile.locationCity}, ${profile.locationState ?? ''} · ` : ''}{profile.region}
        </div>
      )}
    </div>
  );

  if (!isClickable) return card;
  return <Link to={`/team/${profile.id}`} style={{ textDecoration: 'none' }}>{card}</Link>;
}
