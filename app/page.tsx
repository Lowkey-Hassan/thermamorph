import Link from 'next/link'
import {
  Building2, Zap, Leaf, ArrowRight, CheckCircle, BarChart3, Camera, FileText,
  ChevronRight, HeartPulse, Receipt as ReceiptIcon, Flame, Sprout,
} from 'lucide-react'
import { LiveEmissionsCounter } from '@/components/landing/LiveEmissionsCounter'
import { EarthFeverChart } from '@/components/landing/EarthFeverChart'
import { EverydayConfessions } from '@/components/landing/EverydayConfessions'
import { PlanetReceipt } from '@/components/landing/PlanetReceipt'
import { VanishingVoices } from '@/components/landing/VanishingVoices'
import {
  VineEdge,
  BurnDivider,
  RegrowthDivider,
  LeafyBackdrop,
  BurningBackdrop,
} from '@/components/landing/OrganicDecorations'

const FEATURES = [
  {
    icon: Camera,
    title: 'Photo-to-Score in minutes',
    desc: 'Upload photos of windows, walls, or vents. ThermaMorph reads EXIF GPS, detects building condition from image signals, and generates a precise carbon score — no manual input required.',
    accent: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'ASHRAE-grade energy modelling',
    desc: 'Our rule-based engine uses ASHRAE 90.1 and BRE BREDEM standards — the same frameworks professional energy auditors use — so your results are grounded in real engineering data.',
    accent: 'blue',
  },
  {
    icon: Leaf,
    title: 'Decarbonisation roadmap',
    desc: 'Get a prioritised action plan with realistic ROI timelines, cost ranges, and CO₂ savings for every recommendation. Know exactly what to fix first and why.',
    accent: 'violet',
  },
  {
    icon: FileText,
    title: 'Contractor-ready reports',
    desc: 'Export a scoped PDF report with a copy-paste contractor brief. Send it straight to your building contractor — no translation needed.',
    accent: 'amber',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter building details', desc: 'Location, build year, floor area, and heating system. 2 minutes.' },
  { step: '02', title: 'Upload photos', desc: 'Windows, doors, walls, vents, roof — phone or desktop uploads both work.' },
  { step: '03', title: 'Get your carbon score', desc: 'AI analyses your photos. Our engine models energy loss and assigns a 0–100 carbon score.' },
  { step: '04', title: 'Act on the roadmap', desc: 'A ranked list of improvements, each with cost, CO₂ savings, and ROI timeline.' },
]

const accentClasses: Record<string, { bg: string; icon: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50',  icon: 'text-emerald-600',  ring: 'ring-emerald-200' },
  blue:    { bg: 'bg-blue-50',     icon: 'text-blue-600',     ring: 'ring-blue-200'    },
  violet:  { bg: 'bg-violet-50',   icon: 'text-violet-600',   ring: 'ring-violet-200'  },
  amber:   { bg: 'bg-amber-50',    icon: 'text-amber-600',    ring: 'ring-amber-200'   },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">ThermaMorph</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-500 font-medium">
            <a href="#vitals" className="hover:text-slate-900 transition-colors">The data</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — leafy, alive, framed by a real canopy. The live counter
          (Idea 1) sits front and centre: the number that never stops.
          ══════════════════════════════════════════════════════════════════ */}
      <LeafyBackdrop className="pt-32 pb-20 px-6">
        <VineEdge side="left" />
        <VineEdge side="right" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-b from-emerald-100/70 to-transparent opacity-80 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Powered by ASHRAE 90.1 standards
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
            Understand your building&rsquo;s<br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              carbon footprint
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload photos of your home, office, or commercial building.
            Get a professional carbon score, energy analysis, and a prioritised
            decarbonisation roadmap — in minutes, not months.
          </p>

          {/* IDEA 1 — THE REAL-TIME RECKONING */}
          <div className="mb-10">
            <LiveEmissionsCounter />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 text-sm"
            >
              Start free audit
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Go to dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            {['No credit card required', 'Free to start', 'ASHRAE 90.1 compliant', 'Secure & private'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </section>
      </LeafyBackdrop>

      {/* ── Dashboard preview ── */}
      <section className="pb-24 px-6 pt-20 bg-white relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl shadow-slate-900/30 overflow-hidden relative">
            {/* Glow dots */}
            <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500 opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 bg-blue-500 opacity-10 rounded-full blur-2xl" />

            {/* Mock dashboard rows */}
            <div className="relative grid grid-cols-4 gap-3 mb-4">
              {[
                { l: 'Carbon Score',   v: '72/100', c: 'text-red-400'     },
                { l: 'Annual CO₂',     v: '4.8 t',  c: 'text-amber-400'   },
                { l: 'Energy Cost',    v: '$2,340',  c: 'text-blue-400'    },
                { l: 'Savings Avail.', v: '38%',    c: 'text-emerald-400' },
              ].map(({ l, v, c }) => (
                <div key={l} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs text-slate-500 mb-1">{l}</p>
                  <p className={`text-xl font-black ${c}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Mock chart bars */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-400 mb-3 font-medium">Energy Breakdown by Category</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Space Heating', pct: 72, color: '#ef4444' },
                  { label: 'Cooling',       pct: 48, color: '#f59e0b' },
                  { label: 'Water Heating', pct: 31, color: '#3b82f6' },
                  { label: 'Lighting',      pct: 20, color: '#10b981' },
                  { label: 'Other',         pct: 12, color: '#8b5cf6' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 4 — EARTH'S FEVER CHART
          ══════════════════════════════════════════════════════════════════ */}
      <section id="vitals" className="py-24 px-6 bg-slate-950 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center mb-12">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
            <HeartPulse className="h-3.5 w-3.5" /> The diagnosis
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            The Earth has a chart too.
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Doctors track vitals because a body running a fever for fifty straight years — every
            decade hotter than the last — is telling you something. Below is the planet&rsquo;s
            chart, drawn from NASA&rsquo;s own surface temperature record. The earth isn&rsquo;t
            dying. It&rsquo;s sick. And right now, we&rsquo;re the doctors who keep walking past
            the chart at the foot of the bed.
          </p>
        </div>
        <div className="relative">
          <EarthFeverChart />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 2 — EVERYDAY CONFESSIONS
          ══════════════════════════════════════════════════════════════════ */}
      <LeafyBackdrop className="py-24 px-6" canopy={false}>
        <div className="relative mx-auto max-w-3xl text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">The everyday math</p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            Ordinary mornings, real numbers
          </h2>
          <p className="text-slate-500 leading-relaxed">
            None of this needs a power plant or a factory. It&rsquo;s already happening in your
            kitchen, your commute, your living room — small numbers that, multiplied across a few
            billion mornings, stop being small. Read these slowly. They&rsquo;re about today.
          </p>
        </div>
        <div className="relative">
          <EverydayConfessions />
        </div>
      </LeafyBackdrop>

      {/* The page begins to burn. */}
      <BurnDivider />

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 3 — THE RECEIPT
          ══════════════════════════════════════════════════════════════════ */}
      <BurningBackdrop className="py-24 px-6">
        <div className="relative mx-auto max-w-3xl text-center mb-12">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
            <ReceiptIcon className="h-3.5 w-3.5" /> The bill
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Somebody has to pay for this.
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Every year, the average person on Earth charges roughly 4.7 tonnes of CO&#8322; to the
            atmosphere&rsquo;s tab — and never sees an invoice. So we printed one. Read it the way
            you&rsquo;d read any bill you didn&rsquo;t expect: line by line, then the total.
          </p>
        </div>
        <div className="relative">
          <PlanetReceipt />
        </div>
      </BurningBackdrop>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 5 — VOICE OF THE VANISHING
          ══════════════════════════════════════════════════════════════════ */}
      <BurningBackdrop className="py-24 px-6 border-t border-white/5">
        <div className="relative mx-auto max-w-3xl text-center mb-12">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">
            <Flame className="h-3.5 w-3.5" /> The testimony
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Some things are trying to tell us something.
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Glaciers, rainforests, and reefs don&rsquo;t get a vote, a microphone, or a seat at any
            climate summit. They only have their numbers — measured, year after year, by people
            who climb mountains and dive reefs to record them. So we gave those numbers a voice.
          </p>
        </div>
        <div className="relative">
          <VanishingVoices />
        </div>
      </BurningBackdrop>

      {/* The fire stops. The ground can still regrow. */}
      <RegrowthDivider />

      {/* ══════════════════════════════════════════════════════════════════
          THE TURN — from diagnosis to action
          ══════════════════════════════════════════════════════════════════ */}
      <LeafyBackdrop className="py-24 px-6" canopy={false}>
        <div className="relative mx-auto max-w-3xl text-center mb-14">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">
            <Sprout className="h-3.5 w-3.5" /> The turn
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            None of this is fixed. All of it is fixable.
          </h2>
          <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Scorched ground regrows. Buildings get retrofitted. Grids get cleaner. The fastest way
            to reduce a building&rsquo;s share of all those numbers above is to actually understand
            where its emissions come from — and that&rsquo;s exactly what ThermaMorph does, in
            under five minutes.
          </p>
        </div>

        {/* ── How it works ── */}
        <div id="how" className="relative mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%_-_12px)] w-full h-px border-t-2 border-dashed border-emerald-200 z-0" />
                )}
                <div className="relative z-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-sm font-black mb-4">
                    {step}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LeafyBackdrop>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Features</p>
            <h2 className="text-4xl font-black text-slate-900">Built for buildings, not buzzwords</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, accent }) => {
              const cls = accentClasses[accent]
              return (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-default"
                >
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${cls.bg} ${cls.icon} mb-5 ring-1 ${cls.ring}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-16 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: '< 5 min', l: 'Audit turnaround' },
            { v: 'ASHRAE',  l: '90.1 standard'    },
            { v: '38%',     l: 'Avg savings found' },
            { v: '0',       l: 'API costs'         },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="text-3xl font-black text-white mb-1">{v}</p>
              <p className="text-xs text-slate-400 font-medium">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <LeafyBackdrop className="py-24 px-6">
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200 mb-6">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Your building deserves a score
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Join builders, facility managers, and homeowners who use ThermaMorph
            to understand and reduce their carbon impact.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-10 py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 text-sm"
          >
            Run your first audit — free
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </LeafyBackdrop>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Leaf className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">ThermaMorph</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Zap className="h-3 w-3" />
            Carbon-aware analytics for the built environment
          </div>
        </div>
      </footer>

    </div>
  )
}
