import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent-red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={28} color="var(--accent-red)" />
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Access Restricted</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          You don't have permission to view this page.
        </p>
        <Link to="/" style={{ display: 'inline-block', padding: '9px 20px', background: 'var(--accent-teal)', color: '#0F1117', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
