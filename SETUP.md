# ThermaMorph — Production Setup Guide

Complete steps to get from zero to a live, production ThermaMorph deployment.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is enough to start)
- An [Anthropic](https://console.anthropic.com) account with API access
- A [Vercel](https://vercel.com) account (free hobby tier works)

---

## Step 1 — Install Dependencies

After cloning the repo, run this from the `thermamorph/` folder:

```bash
del package-lock.json     # Windows
npm install
```

---

## Step 2 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users (e.g. Southeast Asia for India).
3. Wait for provisioning (~1 min).

### Run the Database Migration

1. In Supabase Dashboard, go to **SQL Editor**.
2. Open `supabase/migrations/001_initial.sql` from this repo.
3. Paste the full contents and click **Run**.

This creates all tables, indexes, RLS policies, and the new-user trigger.

### Create the Storage Bucket

1. In Supabase Dashboard, go to **Storage**.
2. Click **New Bucket**.
3. Name it exactly: `building-photos`
4. Toggle **Private** ON (not public).
5. Click **Create**.

The storage RLS policies were already applied by the migration SQL.

### Configure Auth Redirect URLs

1. In Supabase Dashboard, go to **Authentication > URL Configuration**.
2. Set **Site URL** to your production domain (e.g. `https://thermamorph.vercel.app`).
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://your-app.vercel.app/auth/callback` (for production)

---

## Step 3 — Set Up Environment Variables

1. Copy the example file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Fill in the values:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > service_role key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/keys](https://console.anthropic.com/keys) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev |

---

## Step 4 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign up for an account, run an audit, upload building photos, and watch Claude analyse them.

---

## Step 5 — Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. On first deploy it will ask you to link a project.

### Option B: GitHub + Vercel Dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Set the **Root Directory** to `thermamorph/` if your repo root is above it.

### Add Environment Variables in Vercel

In your Vercel project dashboard, go to **Settings > Environment Variables** and add all four variables from Step 3.

Also add:
- `NEXT_PUBLIC_SITE_URL` = `https://your-app.vercel.app`

Then redeploy.

---

## Architecture Overview

```
Browser (Next.js)
  |
  ├── /login, /signup          ← Supabase Auth (email/password)
  ├── /dashboard               ← fetches audits from Supabase DB (RLS-scoped)
  ├── /audit/new               ← uploads photos to Supabase Storage, creates audit record
  ├── /analysis/[id]           ← calls POST /api/audits/[id]/analyze, polls for completion
  └── /results/[id]            ← fetches results from Supabase DB

API Routes (Next.js App Router)
  ├── POST /api/audits                      ← create audit
  ├── GET/PATCH/DELETE /api/audits/[id]    ← manage audit + fetch results
  └── POST /api/audits/[id]/analyze        ← triggers Claude vision analysis
        |
        ├── Fetches signed URLs from Supabase Storage
        ├── Downloads images + sends to Claude claude-opus-4-6 with vision
        ├── Parses structured JSON response
        └── Saves results to Supabase (analysis_results, problem_areas, roadmap_items, energy_breakdown)
```

---

## Costs (Approximate)

| Service | Free Tier | Rough cost at scale |
|---|---|---|
| Supabase | 500MB DB, 1GB storage, 5GB bandwidth | $25/mo (Pro) |
| Anthropic Claude | Pay-per-token | ~$0.05-0.15 per audit (Sonnet) or ~$0.50-1.50 (Opus) |
| Vercel | 100GB bandwidth, hobby functions | $20/mo (Pro) for custom domains + longer functions |

For lower per-analysis cost, swap `claude-opus-4-6` for `claude-sonnet-4-6` in `lib/analysis/claude-analysis.ts`.

---

## Switching to claude-sonnet-4-6 (cheaper)

Edit `lib/analysis/claude-analysis.ts`, line 7:

```ts
const MODEL = 'claude-sonnet-4-6'  // was 'claude-opus-4-6'
```

Sonnet is ~10x cheaper and still excellent for structured building analysis.

---

## Troubleshooting

**"Invalid Version" on npm install**
Delete `package-lock.json` first: `del package-lock.json`, then `npm install`.

**Storage upload fails (403)**
Make sure the `building-photos` bucket exists AND the storage RLS policies from the migration SQL were applied. Also verify the bucket is marked as **Private**.

**Analysis times out**
Vercel Hobby has a 60s function timeout. If Claude takes longer (many large images), either:
- Reduce the number of images (the code caps at 10).
- Upgrade to Vercel Pro ($20/mo) which supports 300s timeouts and add `maxDuration: 300` to `vercel.json`.

**Results show mock data**
If you see the old mock analysis, clear your browser cache or do a hard refresh. The results page now fetches from the API.
