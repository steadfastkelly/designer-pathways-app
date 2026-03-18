# Lessons Learned

## Netlify → Vercel Migration
- Netlify uses `public/_redirects` (or `netlify.toml` `[[redirects]]`) for SPA routing
- Vercel uses `vercel.json` `"rewrites"` for SPA routing — `{ "source": "/(.*)", "destination": "/index.html" }`
- Both use `VITE_` prefix for environment variables in Vite projects — no code changes needed
- Netlify functions use `exports.handler` (CommonJS); Vercel functions use `export default` (ESM) in `api/` directory
- Supabase allowed redirect URLs must be updated whenever the deployment URL changes
- Vercel scheduled functions (cron jobs) are configured in `vercel.json` under `"crons"`, pointing to an `api/` route

## Credential Storage
- Netlify env vars cannot be written at runtime from serverless functions on the free plan
- Correct approach: store credentials in a Supabase table (`api_credentials`) with admin-only RLS
- Scheduled sync functions can read from Supabase using the service role key (bypasses RLS)
- Browser clients write to Supabase using the anon key + user's JWT session (RLS enforced)

## Supabase RLS
- `auth_user_role()` function must exist before any policy that calls it — if missing, all queries on that table fail
- `.single()` returns a 406 error when zero rows exist — always use `.maybeSingle()` for nullable lookups
- Service role key bypasses all RLS — only use it server-side (Netlify/Vercel functions), never in the browser
- Profiles table must be seeded for `auth_user_role()` to return a value — without it, all admin-gated writes fail silently

## Timely OAuth
- Timely API requires `/1.1/` version prefix: `https://api.timelyapp.com/1.1/oauth/authorize`
- Token exchange must happen server-side to avoid CORS
- OAuth redirects navigate away from the page — use `sessionStorage` to carry credentials through the redirect
- After OAuth completes, detect `?state=timely&code=` on page load to auto-resume the flow
