import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react()],
  // no base property needed for Netlify
})
```

**Step 2 — Confirm your `_redirects` file exists**

In your `public/` folder, there should be a file called `_redirects` with exactly this content:
```
/*    /index.html   200
```
If it's missing, create it. This is what makes React Router work on Netlify.

**Step 3 — Connect to Netlify**

1. Go to **netlify.com** and sign up or log in with your GitHub account
2. Click **"Add new site" → "Import an existing project"**
3. Select **GitHub** and authorize Netlify
4. Find and select your `designer-pathways-app` repository
5. Build settings should auto-detect — confirm they are:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **"Deploy site"**

**Step 4 — Add your environment variables**

Once deployed, go to **Site settings → Environment variables** and add:
```
VITE_SUPABASE_URL        → your Supabase project URL
VITE_SUPABASE_ANON_KEY   → your Supabase anon key
