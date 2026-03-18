# Designer Pathways — Task Board

## Done ✓
- [x] Migrate deployment config from Netlify to Vercel (vercel.json, removed netlify.toml + _redirects)
- [x] Store API credentials in Supabase api_credentials table
- [x] Fix 406 errors on profiles table (.single() → .maybeSingle())
- [x] Timely OAuth 2.0 flow with correct /1.1/ versioned endpoints
- [x] Hourly sync via scheduled function (credentials from Supabase)
- [x] Seed all 14 team members via seed-users function
- [x] Login page with forgot password + password reset flow

## Pending — Kelly to complete in browser

### Vercel Setup (one-time)
1. Go to vercel.com → Add New Project → Import Git Repository
2. Select `designer-pathways-app` from GitHub
3. Framework Preset: **Vite** (auto-detected)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` → your Supabase service role key
7. Click Deploy

### After first Vercel deploy
- Go to Supabase → Authentication → URL Configuration
- Add your Vercel URL to **Allowed Redirect URLs** (e.g. `https://designer-pathways-app.vercel.app/**`)
- Update **Site URL** to your Vercel URL

### Supabase SQL to run (if not done already)
Run in Supabase Dashboard → SQL Editor:

**Migration 005** — api_credentials table (from supabase/migrations/005_api_credentials.sql)
**Migration 006** — Grant Kelly admin role (from supabase/migrations/006_set_admin_role.sql)

### Re-enter credentials after deploy
After Vercel is live, go to Settings → Timely Integration and ClickUp Integration
and save credentials once — they persist in Supabase api_credentials.

## Pending — Engineering

### Migrate Netlify Functions → Vercel API Routes
The app's serverless functions currently live in `netlify/functions/` and use
CommonJS `exports.handler` format. Vercel expects functions in `api/` directory
using ES module `export default` format.

Functions to migrate:
- `netlify/functions/timely-token.js` → `api/timely-token.js`
- `netlify/functions/timely-events.js` → `api/timely-events.js`
- `netlify/functions/scheduled-sync.js` → `api/scheduled-sync.js`
- `netlify/functions/seed-users.js` → `api/seed-users.js`
- `netlify/functions/save-api-credentials.js` → can be deleted (replaced by Supabase direct writes)
- `netlify/functions/save-setting.js` → can be deleted (replaced by Supabase direct writes)

After migrating, add cron to vercel.json:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "crons": [{ "path": "/api/scheduled-sync", "schedule": "0 * * * *" }]
}
```

Update all fetch calls in frontend from `/.netlify/functions/X` → `/api/X`.
