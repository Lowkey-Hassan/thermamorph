# AI Tool Usage Disclosure

This document satisfies the challenge's **Tool Usage Enforcement** requirement: which tools were used, why they were selected, how prompts evolved, and the division of work between GenAI and the human developer.

---

## 1. Tools Used

| Tool | Role |
|---|---|
| **Claude (Anthropic)**, used via **Cowork** (built on the Claude Agent SDK / Claude Code) | Primary build agent — read/wrote project files directly, ran `npm`/`tsc`/`jest` in a sandboxed shell, and iterated based on real command output |
| **Hugging Face Inference API (BLIP)** | Production feature, not a build tool — provides optional AI image captioning for the in-app vision analysis |
| **Supabase** | Backend-as-a-service for auth, Postgres, RLS, and storage |

---

## 2. Why These Tools Were Selected

- **Claude / Cowork** was chosen over chat-only code generation because the project required *agentic* execution: scaffolding a multi-route Next.js app, wiring a database schema, running `tsc --noEmit` and `jest` to verify correctness, and fixing failures based on the actual tool output rather than guesswork. A plain chat interface would require manually copy-pasting dozens of files and running every command by hand.
- **Hugging Face BLIP** was selected as the vision backend because it has a free inference tier, requires no payment details to evaluate, and is sufficient for generating descriptive captions of uploaded building photos that feed into the rule-based engine.
- **Supabase** was chosen for auth + Postgres + Row Level Security in one free-tier service, avoiding a separate auth provider.

---

## 3. How the Prompting / Build Process Evolved

The build proceeded in stages, each driven by a new prompt that built on the previous output:

1. **Project brief** — a structured spec defined the product (ThermaMorph: AI carbon-footprint audits for buildings), the desktop-first SaaS direction, the 6-step user workflow, and hard constraints (Next.js + TypeScript + Tailwind, mock analysis first, accessibility, loading/error/empty states).
2. **Scaffold pass** — Claude generated the Next.js project structure, shared types, mock analysis logic, reusable UI components, layout shell, and all five core routes (landing, dashboard, audit form, analysis/loading, results).
3. **Backend integration** — follow-up prompts asked for a real Supabase schema, auth middleware, login/signup pages, and CRUD + analyze API routes, replacing the mock data layer.
4. **Domain engine** — a deterministic, rule-based ASHRAE/BREDEM-style energy and carbon engine was requested to replace placeholder numbers, followed by an energy knowledge base and HVAC-age-aware calculations.
5. **Vision integration** — EXIF extraction and a Hugging Face vision module were added to feed real photo signals into the engine.
6. **UX iteration** — the dashboard, results page, sidebar, and landing page were reworked into a polished climate-tech look; a Compare Audits modal and PDF export were added.
7. **Hardening pass** — a dedicated review prompt asked Claude to find and fix security/quality gaps: input validation, mass-assignment protection on API routes, removal of `any` types, and a clean `tsc --noEmit` run.
8. **Compliance pass** — a final review against the challenge rubric identified gaps (boilerplate README, zero tests, missing GitHub instructions, accessibility gaps). Claude wrote the full README, unit tests for the validators and energy engine, ARIA/keyboard accessibility attributes across the UI, and `GITHUB.md`.
9. **Test debugging loop** — `npm test` was run locally by the developer; the failing test output was pasted back to Claude, which corrected field-name mismatches between the test file and the actual `AnalysisResult`/`RoadmapItem`/`ProblemArea` types until all 81 tests passed.

Each stage's prompt was informed by the *output* of the previous stage (build errors, test failures, rubric gaps) — an iterative loop rather than a single one-shot generation.

---

## 4. What GenAI Handled vs. What the Human Designed

| Handled by GenAI (Claude) | Handled by the human (developer) |
|---|---|
| All application code: pages, components, API routes, Supabase client/queries | Overall product concept, vertical selection, and feature priorities |
| The rule-based carbon/energy calculation engine and knowledge base | Reviewing and accepting/rejecting each iteration |
| Database schema and migrations | Creating the Supabase project and Hugging Face account, and supplying real API keys |
| Input validation, auth hardening, accessibility attributes | Running `npm install`, `npm run dev`, `npm test` locally and reporting real results back |
| Unit tests (`__tests__/validators.test.ts`, `__tests__/energy-engine.test.ts`) | Creating the GitHub repository and pushing the final code |
| Documentation: `README.md`, `SETUP.md`, `GITHUB.md`, this file | Deployment to Vercel and final submission |

---

## 5. Verification

- [Final commit history on GitHub](https://github.com/Lowkey-Hassan/thermamorph/commits/main) shows the iterative build described above.
- `npm test` — 99/99 tests passing (validators + energy engine + carbon equivalents).
- `npx tsc --noEmit` — 0 errors.
- See `README.md` §3 ("How the Solution Works") and §4 ("Energy Calculation Model") for the resulting architecture.
