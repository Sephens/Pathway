# Pathway — Job Application Tracker

A Vite + React app. This is the same tracker from the Claude artifact, wired up as a real standalone project you can run locally and deploy to Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel login
vercel
```

Answer the prompts (link to a new project, accept the defaults — Vercel auto-detects Vite). When it finishes you'll get a live URL. Run `vercel --prod` to push to your production domain.

### Option B — GitHub + Vercel dashboard

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, import the repo.
3. Framework preset: **Vite** (auto-detected). Leave build command (`npm run build`) and output directory (`dist`) as default.
4. Click **Deploy**.

## Enabling the AI Assist features (optional)

The AI Assist panel (cover letters, follow-ups, resume bullets) needs a server-side Anthropic API key — it can't call Anthropic directly from the browser in a real deployment (no key, and CORS blocks it).

This project already includes a serverless function at `api/generate.js` that Vercel deploys automatically. To activate it:

1. Get an API key at https://console.anthropic.com
2. In your Vercel project: **Settings → Environment Variables** → add
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key
3. Redeploy (`vercel --prod`, or push a new commit).

If you skip this step, the rest of the app works exactly the same — only the "Generate" button in AI Assist will show an error.

## Data persistence

All application, contact, and template data lives in React state in the browser tab — it resets on refresh. Use the **Export** button in the top bar (or Settings tab) to download a JSON backup, and **Import** to restore it. If you want permanent storage across devices, the natural next step is adding a small database (e.g. Vercel Postgres or Supabase) and swapping the `useState` calls for API calls — ask Claude if you'd like help wiring that up.

## Project structure

```
├── api/
│   └── generate.js       # Serverless function proxying Anthropic API calls
├── src/
│   ├── App.jsx           # The entire tracker (dashboard, pipeline, calendar, etc.)
│   └── main.jsx          # React entry point
├── index.html
├── package.json
└── vite.config.js
```
