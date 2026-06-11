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
import { ParticleCanvas } from '@/components/landing/ParticleCanvas'

const FEATURES = [
  {
    icon: Camera,
    title: 'Photo-to-Score in minutes',
    desc: 'Upload photos of windows, walls, or vents. ThermaMorph reads EXIF GPS, detects building condition from image signals, and generates a precise carbon score — no manual input required.',
  },
  {
    icon: BarChart3,
    title: 'ASHRAE-grade energy modelling',
    desc: 'Our rule-based engine uses ASHRAE 90.1 and BRE BREDEM standards — the same frameworks professional energy auditors use — so your results are grounded in real engineering data.',
  },
  {
    icon: Leaf,
    title: 'Decarbonisation roadmap',
    desc: 'Get a prioritised action plan with realistic ROI timelines, cost ranges, and CO₂ savings for every recommendation. Know exactly what to fix first and why.',
  },
  {
    icon: FileText,
    title: 'Contractor-ready reports',
    desc: 'Export a scoped PDF report with a copy-paste contractor brief. Send it straight to your building contractor — no translation needed.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter building details', desc: 'Location, build year, floor area, and heating system. 2 minutes.' },
  { step: '02', title: 'Upload photos', desc: 'Windows, doors, walls, vents, roof — phone or desktop uploads both work.' },
  { step: '03', title: 'Get your carbon score', desc: 'AI analyses your photos. Our engine models energy loss and assigns a 0–100 carbon score.' },
  { step: '04', title: 'Act on the roadmap', desc: 'A ranked list of improvements, each with cost, CO₂ savings, and ROI timeline.' },
]

const BTN_PRIMARY =
  'mono inline-flex items-center gap-2 border border-[var(--tm-orange)] px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-[var(--tm-orange)] transition-all duration-300 hover:bg-[var(--tm-orange)] hover:text-black hover:shadow-[0_0_50px_rgba(232,87,10,0.4)]'

const BTN_SECONDARY =
  'mono inline-flex items-center gap-2 border border-[#333] px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-[#bbb] transition-all duration-300 hover:border-[var(--tm-ash)] hover:text-white'

export default function LandingPage() {
  return (
    <div className="landing-brutal min-h-screen overflow-x-hidden">
      <ParticleCanvas />

      {/* Wordmark */}
      <div className="eyebrow pointer-events-none fixed left-7 top-6 z-[1000]" style={{ fontSize: '0.75rem' }}>
        ThermaMorph
      </div>

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/5 bg-black/70 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Leaf className="h-4 w-4 text-[var(--tm-orange)]" />
            <span className="mono text-xs tracking-[0.3em] uppercase text-white">ThermaMorph</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 mono text-[11px] uppercase tracking-[0.2em] text-[var(--tm-ash)]">
            <a href="#vitals" className="hover:text-[var(--tm-orange)] transition-colors">The data</a>
            <a href="#how" className="hover:text-[var(--tm-orange)] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[var(--tm-orange)] transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="mono text-[11px] uppercase tracking-[0.2em] text-[var(--tm-ash)] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="mono border border-[var(--tm-orange)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--tm-orange)] transition-all hover:bg-[var(--tm-orange)] hover:text-black"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — the live counter (Idea 1) sits front and centre: the
          number that never stops.
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-black px-6 pb-24 pt-28 text-center">
        <p className="eyebrow mb-12">Live Atmospheric Ledger</p>

        <LiveEmissionsCounter />

        <h1
          className="reveal visible mx-auto mt-16 max-w-4xl font-normal leading-[1.2] text-[#f1efe9]"
          style={{ fontSize: 'clamp(2rem, 6vw, 4.2rem)' }}
        >
          Understand your building&rsquo;s carbon footprint.
        </h1>

        <p className="mono reveal visible mt-5 text-[1.05rem] tracking-wide text-[#bbb]">
          Photos in. Energy loss and CO&#8322; out.{' '}
          <span className="text-[#666]">— ASHRAE 90.1 / BRE BREDEM</span>
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup" className={BTN_PRIMARY} data-burst>
            Start free audit
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/dashboard" className={BTN_SECONDARY}>
            Go to dashboard
          </Link>
        </div>

        <div className="mono mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.15em] text-[var(--tm-ash)]">
          {['No credit card required', 'Free to start', 'ASHRAE 90.1 compliant', 'Secure & private'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-[var(--tm-orange)]" /> {t}
            </span>
          ))}
        </div>

        <div className="scroll-cue mono absolute bottom-8 text-[0.7rem] uppercase tracking-[0.4em] text-[var(--tm-ash)]">
          scroll
        </div>
      </section>

      {/* ── Dashboard preview ── */}
      <section className="relative z-10 bg-[var(--tm-charcoal)] px-6 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-3 text-center" style={{ fontSize: '0.7rem' }}>What you&rsquo;ll see</p>
          <h2 className="mb-10 text-center font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
            A real dashboard, not a brochure.
          </h2>

          <div className="relative overflow-hidden border border-[#2c2925] bg-[#0c0c0c] p-8">
            {/* Glow accents */}
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[var(--tm-orange)] opacity-[0.06] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#3b82f6] opacity-[0.06] blur-2xl" />

            {/* Mock dashboard rows */}
            <div className="relative grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
              {[
                { l: 'Carbon Score', v: '72/100', c: 'text-red-400' },
                { l: 'Annual CO₂', v: '4.8 t', c: 'text-amber-400' },
                { l: 'Energy Cost', v: '$2,340', c: 'text-[#3b82f6]' },
                { l: 'Savings Avail.', v: '38%', c: 'text-[var(--tm-orange)]' },
              ].map(({ l, v, c }) => (
                <div key={l} className="border border-[#2c2925] bg-white/[0.02] p-4">
                  <p className="mono text-[10px] uppercase tracking-[0.15em] text-[var(--tm-ash)] mb-1">{l}</p>
                  <p className={`mono text-xl font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Mock chart bars */}
            <div className="relative border border-[#2c2925] bg-white/[0.02] p-4">
              <p className="mono mb-3 text-[10px] uppercase tracking-[0.15em] text-[var(--tm-ash)]">Energy Breakdown by Category</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Space Heating', pct: 72, color: '#ef4444' },
                  { label: 'Cooling', pct: 48, color: '#f5a623' },
                  { label: 'Water Heating', pct: 31, color: '#3b82f6' },
                  { label: 'Lighting', pct: 20, color: '#4CAF50' },
                  { label: 'Other', pct: 12, color: '#888888' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="mono w-28 shrink-0 text-[11px] text-[var(--tm-ash)]">{label}</span>
                    <div className="h-2 flex-1 overflow-hidden bg-white/5">
                      <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="mono w-8 text-right text-[11px] text-[var(--tm-ash)]">{pct}%</span>
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
      <section id="vitals" className="relative bg-black px-6 py-24">
        <div className="relative mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-2.5" style={{ color: '#6b8cb8' }}>
            <HeartPulse className="h-3.5 w-3.5" /> The diagnosis
          </p>
          <h2 className="mb-4 font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
            The Earth has a chart too.
          </h2>
          <p className="leading-relaxed text-[#999]" style={{ fontFamily: 'Georgia, serif' }}>
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
      <section className="relative bg-[#0f0d08] px-6 py-24">
        <div className="relative mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow mb-4">Everyday Confessions</p>
          <h2 className="mb-4 font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
            Ordinary mornings, real numbers
          </h2>
          <p className="leading-relaxed text-[#999]" style={{ fontFamily: 'Georgia, serif' }}>
            None of this needs a power plant or a factory. It&rsquo;s already happening in your
            kitchen, your commute, your living room — small numbers that, multiplied across a few
            billion mornings, stop being small. Read these slowly. They&rsquo;re about today.
          </p>
        </div>
        <div className="relative">
          <EverydayConfessions />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 3 — THE RECEIPT
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[var(--tm-charcoal2)] px-6 py-24">
        <div className="relative mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-2.5">
            <ReceiptIcon className="h-3.5 w-3.5" /> The bill
          </p>
          <h2 className="mb-4 font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
            Somebody has to pay for this.
          </h2>
          <p className="leading-relaxed text-[#999]" style={{ fontFamily: 'Georgia, serif' }}>
            Every year, the average person on Earth charges roughly 4.7 tonnes of CO&#8322; to the
            atmosphere&rsquo;s tab — and never sees an invoice. So we printed one. Read it the way
            you&rsquo;d read any bill you didn&rsquo;t expect: line by line, then the total.
          </p>
        </div>
        <div className="relative">
          <PlanetReceipt />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 5 — VOICE OF THE VANISHING
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/5 bg-black px-6 py-24">
        <div className="relative mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-2.5">
            <Flame className="h-3.5 w-3.5" /> The testimony
          </p>
          <h2 className="mb-4 font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
            Some things are trying to tell us something.
          </h2>
          <p className="leading-relaxed text-[#999]" style={{ fontFamily: 'Georgia, serif' }}>
            Glaciers, rainforests, and reefs don&rsquo;t get a vote, a microphone, or a seat at any
            climate summit. They only have their numbers — measured, year after year, by people
            who climb mountains and dive reefs to record them. So we gave those numbers a voice.
          </p>
        </div>
        <div className="relative">
          <VanishingVoices />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          THE TURN — from diagnosis to action
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-[var(--tm-charcoal2)] to-[var(--tm-earth1)] px-6 py-24">
        <div className="relative mx-auto mb-14 max-w-2xl text-center">
          <p className="eyebrow mb-4 flex items-center justify-center gap-2.5">
            <Sprout className="h-3.5 w-3.5" /> The turn
          </p>
          <h2 className="mb-4 font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
            None of this is fixed. All of it is fixable.
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-[#ccb9ab]" style={{ fontFamily: 'Georgia, serif' }}>
            Scorched ground regrows. Buildings get retrofitted. Grids get cleaner. The fastest way
            to reduce a building&rsquo;s share of all those numbers above is to actually understand
            where its emissions come from — and that&rsquo;s exactly what ThermaMorph does, in
            under five minutes.
          </p>
        </div>

        {/* ── How it works ── */}
        <div id="how" className="relative mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-px bg-[#2c2925] sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} data-burst className="bg-[#15110d] p-6 transition-colors hover:bg-[#1a1410]">
                <div className="mono mb-4 text-2xl font-bold text-[var(--tm-orange)]">{step}</div>
                <h3 className="mb-2 text-base font-normal text-[#f1efe9]" style={{ fontFamily: 'Georgia, serif' }}>
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-[#999]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative bg-black px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="eyebrow mb-3">Features</p>
            <h2 className="font-normal text-[#f1efe9]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>
              Built for buildings, not buzzwords
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-[#2c2925] md:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                data-burst
                className="group bg-black p-7 transition-all duration-300 hover:bg-[#0f0d08]"
              >
                <Icon className="mb-5 h-5 w-5 text-[var(--tm-ash)] transition-colors group-hover:text-[var(--tm-orange)]" />
                <h3 className="mb-2 text-base font-normal text-[#f1efe9]" style={{ fontFamily: 'Georgia, serif' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#999]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[var(--tm-charcoal)] px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { v: '< 5 min', l: 'Audit turnaround' },
            { v: 'ASHRAE', l: '90.1 standard' },
            { v: '38%', l: 'Avg savings found' },
            { v: '0', l: 'API costs' },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="hero-counter mb-1" style={{ fontSize: '1.75rem' }}>{v}</p>
              <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--tm-ash)]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative flex flex-col items-center justify-center bg-black px-6 py-28 text-center">
        <p className="eyebrow mb-6">ThermaMorph</p>
        <h2
          className="mx-auto mb-12 max-w-2xl font-normal leading-[1.15] text-[#f1efe9]"
          style={{ fontSize: 'clamp(2.2rem, 7vw, 4rem)' }}
        >
          You measured.
          <br />
          Now act.
        </h2>
        <Link href="/signup" className={BTN_PRIMARY} data-burst>
          Run your first audit
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <div className="mono mt-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#444]">
          <Building2 className="h-3 w-3" />
          Carbon-aware analytics for the built environment
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-black px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 mono text-[11px] text-[var(--tm-ash)] sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-[var(--tm-orange)]" />
            <span className="uppercase tracking-[0.2em] text-[#ccc]">ThermaMorph</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--tm-orange)]">
            <Zap className="h-3 w-3" />
            Carbon-aware analytics for the built environment
          </div>
        </div>
      </footer>
    </div>
  )
}
