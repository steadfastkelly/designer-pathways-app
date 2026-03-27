import { useTeamData } from '../hooks/useTeamData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export function ReportsPage() {
  const { members, loading } = useTeamData();

  const now = new Date();
  const chartData = members.map(({ profile, hours }) => {
    const current = hours.find(h => h.year === now.getFullYear() && h.month === now.getMonth() + 1);
    return {
      name: profile.name.split(' ')[0],
      billable: parseFloat((current?.billableHours ?? 0).toFixed(1)),
      internal: parseFloat((current?.internalHours ?? 0).toFixed(1)),
    };
  });

  const statusCounts = {
    on_track: members.filter(m => m.score.status === 'on_track').length,
    watch: members.filter(m => m.score.status === 'watch').length,
    action_needed: members.filter(m => m.score.status === 'action_needed').length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--accent-teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Team performance overview</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'On Track', count: statusCounts.on_track, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
          { label: 'Watch', count: statusCounts.watch, color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
          { label: 'Action Needed', count: statusCounts.action_needed, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 36, color, marginBottom: 4 }}>{count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Hours Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Billable vs Internal Hours — {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-subtle)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Bar dataKey="billable" name="Billable" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="internal" name="Internal" fill="var(--accent-violet)" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Designer Summary</div>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Designer', 'Level', 'Billable %', 'Billable Hrs', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(({ profile, hours, score }) => {
              const current = hours.find(h => h.year === now.getFullYear() && h.month === now.getMonth() + 1);
              const statusColors = { on_track: 'var(--accent-green)', watch: 'var(--accent-amber)', action_needed: 'var(--accent-red)' };
              const statusLabels = { on_track: 'On Track', watch: 'Watch', action_needed: 'Action Needed' };
              return (
                <tr key={profile.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{profile.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{profile.externalTitle ?? '—'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{current ? `${current.billablePercent.toFixed(0)}%` : '—'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{current ? current.billableHours.toFixed(0) : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColors[score.status] }}>
                      {statusLabels[score.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
