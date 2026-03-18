// Diagnostic endpoint — returns env var presence (never values) and runtime info.
// Hit /api/health to confirm Vercel has the required environment variables loaded.

export default function handler(req, res) {
  const check = (name) => {
    const val = process.env[name];
    if (!val) return 'MISSING';
    if (val.length < 10) return 'TOO_SHORT';
    return `present (${val.length} chars)`;
  };

  return res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      VITE_SUPABASE_URL: check('VITE_SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: check('SUPABASE_SERVICE_ROLE_KEY'),
    },
    // Confirm routing: if you can read this, /api/* rewrites are working
    routing: 'api/* rewrite is active',
  });
}
