import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart2, Settings, Home, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAllProfiles } from '../lib/api';
import { useState, useEffect } from 'react';
import type { Profile } from '../types';

function getAvatarColor(name: string): string {
  const colors = ['#2DD4BF', '#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const color = getAvatarColor(name);
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#0F1117', flexShrink: 0,
      fontFamily: 'Instrument Sans, sans-serif',
    }}>
      {initials}
    </div>
  );
}

export function Navigation() {
  const { role, profile, effectiveRole, previewMode, previewAs } = useAuth();
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      getAllProfiles().then(p => setDesigners(p.filter(d => d.isActive && d.role === 'designer')));
    }
  }, [role]);

  const adminLinks = [
    { to: '/today', label: 'Today', icon: LayoutDashboard },
    { to: '/team', label: 'Team', icon: Users },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const designerLinks = [
    { to: '/homebase', label: 'Homebase', icon: Home },
  ];

  const links = effectiveRole === 'designer' ? designerLinks
    : effectiveRole === 'supervisor' ? adminLinks.slice(1, 3)
    : adminLinks;

  return (
    <nav style={{
      width: 220, minHeight: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '0', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Steadfast
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2, fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Designer Pathways
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ padding: '12px 12px', flex: 1 }}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg-card)' : 'transparent',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Preview As (admin only) */}
      {role === 'admin' && !previewMode && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderRadius: 8, cursor: 'pointer', fontSize: 13,
              color: 'var(--text-muted)', position: 'relative',
              background: showPreviewDropdown ? 'var(--bg-card)' : 'transparent',
            }}
            onClick={() => setShowPreviewDropdown(v => !v)}
          >
            <Eye size={14} />
            <span>Preview As</span>
          </div>
          {showPreviewDropdown && (
            <div style={{
              position: 'absolute', bottom: 60, left: 220, width: 200,
              background: 'var(--bg-surface)', border: '1px solid var(--border-accent)',
              borderRadius: 10, padding: 8, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {designers.map(d => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  }}
                  onClick={() => { previewAs(d); setShowPreviewDropdown(false); navigate('/homebase'); }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={d.name} size={24} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{d.externalTitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile section */}
      {profile && (
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={profile.name} size={32} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{profile.role}</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
