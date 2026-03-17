import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

type PageMode = 'login' | 'forgot' | 'reset';

export function LoginPage() {
  const [mode, setMode] = useState<PageMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, session, role } = useAuth();
  const navigate = useNavigate();

  // Redirect after successful login (not in reset mode)
  useEffect(() => {
    if (session && role && mode !== 'reset') {
      if (role === 'admin' || role === 'supervisor') navigate('/today', { replace: true });
      else navigate('/homebase', { replace: true });
    }
  }, [session, role, mode, navigate]);

  // Detect Supabase PASSWORD_RECOVERY event (fires when reset link is clicked)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setError('');
        setInfo('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError('Invalid email or password. Please try again.');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address.'); return; }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo('Check your email for a password reset link.');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo('Password updated! Signing you in…');
      // Auth state change will redirect automatically
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-primary)' }}>
            Steadfast
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 4, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Designer Pathways
          </div>
        </div>

        <div className="card">
          {/* ── Set new password (recovery mode) ── */}
          {mode === 'reset' && (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>Set new password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Choose a new password for your account.
              </p>
              <form onSubmit={handleSetPassword}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <ErrorBox message={error} />}
                {info && <InfoBox message={info} />}
                <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                  {loading ? 'Saving…' : 'Set password'}
                </button>
              </form>
            </>
          )}

          {/* ── Forgot password ── */}
          {mode === 'forgot' && (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>Reset password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                We'll send a reset link to your email.
              </p>
              <form onSubmit={handleForgotPassword}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@steadfast.design"
                    required
                    autoFocus
                  />
                </div>
                {error && <ErrorBox message={error} />}
                {info && <InfoBox message={info} />}
                <button type="submit" disabled={loading || !!info} style={primaryButtonStyle(loading)}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} style={linkButtonStyle}>
                ← Back to sign in
              </button>
            </>
          )}

          {/* ── Login ── */}
          {mode === 'login' && (
            <>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>Welcome back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Sign in to your account
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@steadfast.design"
                    required
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
                    style={linkButtonStyle}
                  >
                    Forgot password?
                  </button>
                </div>
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
      borderRadius: 8, padding: '10px 14px', marginBottom: 16,
      fontSize: 13, color: 'var(--accent-red)',
    }}>
      {message}
    </div>
  );
}

function InfoBox({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--accent-teal-dim)', border: '1px solid var(--accent-teal)',
      borderRadius: 8, padding: '10px 14px', marginBottom: 16,
      fontSize: 13, color: 'var(--accent-teal)',
    }}>
      {message}
    </div>
  );
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '11px 0', background: 'var(--accent-teal)',
    color: '#0F1117', border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1, transition: 'opacity 0.15s',
  };
}

const linkButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: '8px 0',
  fontSize: 13, color: 'var(--text-subtle)', cursor: 'pointer',
  marginTop: 12, display: 'block',
};
