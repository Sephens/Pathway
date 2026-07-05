# Pathway — Job Application Tracker

A Vite + React app with real accounts and cross-device sync via Supabase, deployable to Vercel.

## 1. Create your Supabase project (free)

1. Go to https://supabase.com → New project. Pick any name/region, wait ~2 minutes for it to spin up.
2. In the dashboard, open **SQL Editor → New query**, paste in the contents of `supabase-setup.sql` (included in this project), and click **Run**. This creates the table that stores your data and the storage bucket for uploaded documents, both locked down so only you can read your own rows/files.
3. Go to **Project Settings → API** and copy two values: **Project URL** and the **anon public** key.
4. (Optional, recommended while testing) Go to **Authentication → Settings** and turn off "Confirm email" so you can sign up and start using the app immediately without checking your inbox.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the Supabase values from step 1:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`), sign up with an email + password, and you're in. Sign in with the same account from any other browser or device and you'll see the same data.

## 4. Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel login
vercel
```

Accept the defaults (Vercel auto-detects Vite). Then add your environment variables so the *deployed* site can reach Supabase too:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

### Option B — GitHub + Vercel dashboard

1. Push this folder to a new GitHub repo:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, import the repo (Framework preset: Vite, auto-detected).
3. Before deploying, expand **Environment Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Click **Deploy**.

Once it's live, sign up from your phone and your laptop with the same email — same board, same data, on both.

## 5. Enabling AI Assist (optional)

The AI Assist panel (cover letters, follow-ups, resume bullets) needs a server-side Anthropic API key — it calls a small serverless function already included at `api/generate.js`, which Vercel deploys automatically.

1. Get a key at https://console.anthropic.com
2. In Vercel: **Settings → Environment Variables** → add `ANTHROPIC_API_KEY` (no `VITE_` prefix — this one stays server-side)
3. Redeploy

Skip this and the rest of the app works the same — only the "Generate" button shows a friendly error.

## Data & files

- All application/contact/company/template/event/wishlist data autosaves to your Supabase account (a single JSON row per user) about a second after you stop typing.
- Uploaded documents go to Supabase Storage under a per-user folder, so resumes/cover letters follow you across devices too.
- The Export/Import buttons still work as a manual JSON backup if you ever want a local copy.

## Project structure

```
├── api/
│   └── generate.js        # Serverless function proxying Anthropic API calls
├── src/
│   ├── App.jsx             # The entire tracker (dashboard, pipeline, calendar, etc.)
│   ├── Auth.jsx             # Sign in / sign up screen
│   ├── lib/supabaseClient.js
│   └── main.jsx             # React entry point
├── supabase-setup.sql       # Run once in the Supabase SQL editor
├── index.html
├── package.json
└── vite.config.js
```
