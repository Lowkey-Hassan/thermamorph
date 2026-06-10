# ThermaMorph — AI-Powered Carbon Footprint Awareness Platform

> **Challenge Vertical:** Carbon Footprint & Climate Action
> **Built with:** Next.js 16, TypeScript, Tailwind CSS, Supabase, ASHRAE 90.1 Rule Engine

---

## 1. Chosen Vertical

**Carbon Footprint Awareness — Buildings & Energy**

Buildings account for 40–60% of a household's total carbon emissions, yet most people have no idea how efficient (or inefficient) their home or office actually is. ThermaMorph targets this gap: it turns a set of phone photos and five form fields into a professional-grade carbon audit — the same analysis that typically costs thousands of dollars from a licensed energy auditor.

---

## 2. Problem Statement Addressed

> *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

| Problem requirement | How ThermaMorph addresses it |
|---|---|
| **Understand** | Carbon score (0–100), grade (A–F), plain-English problem descriptions, energy breakdown chart |
| **Track** | Dashboard with all past audits, Compare modal overlaying multiple buildings on one chart |
| **Reduce** | Prioritised decarbonisation roadmap with cost, CO₂ saving, and ROI per action |
| **Simple actions** | Upload photos → fill 5 fields → get results in under 5 minutes |
| **Personalised insights** | Analysis is specific to building age, location (climate zone), floor area, HVAC type, and install year |

---

## 3. How the Solution Works

### User Flow

```
1. Register / Sign in
2. Create a new audit — enter name, location, build year, floor area, HVAC type
3. Upload photos — windows, walls, roof, AC unit (phone or desktop)
4. Analysis runs automatically (rule-based engine + optional AI vision)
5. Results dashboard — carbon score, energy breakdown, problem areas, roadmap
6. Export PDF report + copy-paste contractor brief
7. Compare across multiple audits on the dashboard
```

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (client + server components)        │
│                                                         │
│  Pages: Landing · Dashboard · Audit Form                │
│         Analysis · Results · Auth                       │
└────────────────┬────────────────────────────────────────┘
                 │ API Routes (/api/audits/*)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Analysis Pipeline                                      │
│                                                         │
│  1. EXIF extractor  → auto-detects GPS from photos      │
│  2. HF BLIP vision  → captions photos, finds signals    │
│  3. ASHRAE engine   → rule-based energy calculation     │
│     • Envelope heat loss (U-values by era)              │
│     • HVAC efficiency (COP by type and age)             │
│     • Climate zone adjustment (HDD/CDD)                 │
│     • Vision override pass (upgrades severity)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Storage + Auth)                 │
│  Tables: audits · analysis_results · problem_areas      │
│          roadmap_items · energy_breakdown · profiles    │
└─────────────────────────────────────────────────────────┘
```

### Energy Calculation Model

The rule-based engine follows ASHRAE 90.1 / BRE BREDEM screening-level methodology:

1. **Era classification** — building construction era determines U-values (pre-1950 → modern)
2. **Envelope heat loss** — steady-state formula: `Q = U × A × ΔT × hours / 1000`
3. **Climate adjustment** — heating/cooling degree days per location
4. **HVAC degradation** — age-based efficiency penalty (0.8%/year, capped at 30%)
5. **Carbon score** — normalised 0–100 relative to best/worst-case intensity for building type
6. **Vision override** — photo analysis (HF BLIP) upgrades severity of flagged issues

---

## 4. Key Features

- **Photo-to-score in minutes** — no expertise required
- **EXIF GPS extraction** — location auto-fills from photo metadata
- **Free AI vision** — Hugging Face BLIP detects cracks, old windows, dirty HVAC from photos
- **ASHRAE-grade modelling** — same framework professional energy auditors use
- **Compare audits** — overlay multiple buildings on one chart
- **Export PDF** — full report with contractor-ready scope of work
- **Zero AI API cost** — rule engine runs entirely server-side; vision is optional free tier

---

## 5. Assumptions Made

| Assumption | Rationale |
|---|---|
| Window-to-wall ratio of 25% | Typical for residential and light commercial |
| Average ceiling height 2.8 m | Standard assumption when floor plan is unknown |
| HVAC age defaults to build year | Conservative — replaced when user provides install year |
| Carbon intensity per grid region | Uses approximate grid carbon factors; not real-time |
| Energy costs in USD | Configurable in `lib/analysis/knowledge-base.ts` |
| 40% of roof available for solar | Conservative estimate accounting for obstructions |
| Results are indicative | A licensed auditor should verify before starting work |

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + RLS + Storage) |
| Charts | Recharts |
| Vision AI | Hugging Face Inference API (BLIP) — free tier |
| EXIF | exifr (client-side, dynamic import) |
| Deployment | Vercel |

---

## 7. Setup & Running Locally

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- (Optional) A free [Hugging Face](https://huggingface.co) account for vision analysis

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/thermamorph.git
cd thermamorph

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase keys

# 4. Run database migrations
# Open Supabase SQL Editor and run:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_hvac_install_year.sql

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

For full deployment instructions see [SETUP.md](./SETUP.md).

---

## 8. Security Practices

- Row Level Security (RLS) enforced in Supabase — users can only access their own audits
- Input validation and allowlist on all API routes (no mass-assignment vulnerabilities)
- UUID validation on all route parameters
- Environment variables never committed (`.env*` in `.gitignore`)
- Server-side analysis — no sensitive keys exposed to the browser

---

## 9. Project Structure

```
thermamorph/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── api/audits/      # REST API routes
│   ├── audit/new/       # Audit creation form
│   ├── dashboard/       # Main dashboard
│   ├── results/[id]/    # Results & export
│   └── analysis/[id]/   # Analysis progress page
├── components/
│   ├── charts/          # Recharts wrappers
│   ├── layout/          # Sidebar, Header, PageWrapper
│   └── ui/              # Button, Badge, Card, etc.
├── lib/
│   ├── analysis/        # Energy engine, vision, EXIF
│   ├── api/             # Auth helper, input validators
│   └── supabase/        # Client, server, DB types, queries
└── supabase/
    └── migrations/      # SQL migration files
```

---

## 10. Evaluation Criteria Mapping

| Criterion | Implementation |
|---|---|
| **Code Quality** | TypeScript strict mode, named constants, JSDoc, no `any` types in UI |
| **Security** | RLS, input allowlisting, UUID guards, no mass-assignment |
| **Efficiency** | Rule engine runs in <1 ms, envelope loss calculated once and reused, deterministic results |
| **Testing** | Unit tests for input validators and energy engine core functions |
| **Accessibility** | ARIA labels on interactive elements, semantic HTML, keyboard navigation |
