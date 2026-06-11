'use client'

import { useId } from 'react'
import { HeartPulse, Plane, TreePine, Clock, Users, Flame, Sparkles } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import {
  calcLifetimeLedger,
  co2ToFlights,
  co2ToTreeYears,
  co2ToBudgetMultiple,
  carbonScoreToBodyState,
  CARBON_BODY_COPY,
  KG_CO2_PERSONAL_BUDGET_PER_YEAR,
  type CarbonBodyState,
} from '@/lib/analysis/carbon-equivalents'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface CarbonRealityCheckProps {
  annualCo2Kg: number
  carbonScore: number
  buildYear: number
}

interface BodyStyle {
  text: string
  bg: string
  ring: string
  bar: string
  hex: string
  gradient: string
  glow: boolean
}

const BODY_STYLES: Record<CarbonBodyState, BodyStyle> = {
  thriving: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    bar: 'bg-emerald-500',
    hex: '#10b981',
    gradient: 'from-emerald-500/10 via-transparent to-transparent',
    glow: false,
  },
  strained: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    bar: 'bg-amber-500',
    hex: '#f59e0b',
    gradient: 'from-amber-500/10 via-transparent to-transparent',
    glow: false,
  },
  distressed: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500/20',
    bar: 'bg-orange-500',
    hex: '#f97316',
    gradient: 'from-orange-500/10 via-transparent to-transparent',
    glow: true,
  },
  critical: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
    bar: 'bg-red-500',
    hex: '#ef4444',
    gradient: 'from-red-500/10 via-transparent to-transparent',
    glow: true,
  },
}

const GLOW_VARS: Record<CarbonBodyState, React.CSSProperties> = {
  thriving: { '--glow-color': 'rgba(16,185,129,0.30)', '--glow-color-end': 'rgba(16,185,129,0)' } as React.CSSProperties,
  strained: { '--glow-color': 'rgba(245,158,11,0.30)', '--glow-color-end': 'rgba(245,158,11,0)' } as React.CSSProperties,
  distressed: { '--glow-color': 'rgba(249,115,22,0.35)', '--glow-color-end': 'rgba(249,115,22,0)' } as React.CSSProperties,
  critical: { '--glow-color': 'rgba(239,68,68,0.35)', '--glow-color-end': 'rgba(239,68,68,0)' } as React.CSSProperties,
}

/**
 * "Carbon Reality Check" — the product's emotional centerpiece. Translates the
 * audit's raw numbers into three visceral, hard-to-ignore framings, each backed
 * by a small data visualization:
 *
 *  1. Carbon Body  — animated radial gauge of the 0-100 carbon score, as "vitals"
 *  2. Lifetime Ledger — area chart of cumulative CO2 emitted since construction
 *  3. The Inheritance — bar comparison vs. one person's fair-share carbon budget
 *
 * All numbers come from lib/analysis/carbon-equivalents.ts — this file is pure
 * presentation, with Recharts visualizations layered on top.
 */
export function CarbonRealityCheck({ annualCo2Kg, carbonScore, buildYear }: CarbonRealityCheckProps) {
  const gradientId = useId()
  const bodyState = carbonScoreToBodyState(carbonScore)
  const bodyCopy = CARBON_BODY_COPY[bodyState]
  const styles = BODY_STYLES[bodyState]

  const ledger = calcLifetimeLedger(annualCo2Kg, buildYear)
  const lifetimeFlights = co2ToFlights(ledger.lifetimeCo2Kg)
  const annualTreeYears = co2ToTreeYears(annualCo2Kg)
  const budgetMultiple = co2ToBudgetMultiple(annualCo2Kg)

  // Build a cumulative-emissions trajectory from construction year to today.
  const ledgerData = Array.from({ length: ledger.ageYears }, (_, i) => {
    const year = buildYear + i + 1
    return {
      year,
      tonnes: Number((((annualCo2Kg * (i + 1)) / 1000)).toFixed(2)),
    }
  })

  // "This building" vs. one person's sustainable annual budget, in tonnes.
  const inheritanceData = [
    { name: 'This building', tonnes: Number((annualCo2Kg / 1000).toFixed(2)), fill: styles.hex },
    { name: 'Fair-share budget', tonnes: Number((KG_CO2_PERSONAL_BUDGET_PER_YEAR / 1000).toFixed(2)), fill: '#94a3b8' },
  ]

  // Gauge: full-circle radial bar, 0-100 score mapped to a 360deg sweep.
  const gaugeData = [{ name: 'score', value: Math.min(100, Math.max(0, carbonScore)), fill: styles.hex }]

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/5 bg-white/[0.03] bg-gradient-to-br overflow-hidden lg:col-span-2 animate-fade-in-up',
        styles.gradient,
        'animate-gradient-shift'
      )}
    >
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg', styles.bg, styles.glow && 'animate-glow-pulse')}
              style={GLOW_VARS[bodyState]}
            >
              <Flame className={cn('h-3.5 w-3.5', styles.text)} />
            </span>
            Carbon Reality Check
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            What these numbers actually mean — beyond the spreadsheet
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Sparkles className="h-3 w-3 animate-float" />
          Our highlight
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">

        {/* 1. Carbon Body: animated radial gauge */}
        <div className="p-6 animate-fade-in-up animate-delay-100">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-4', styles.bg, styles.ring)}>
              <HeartPulse className={cn('h-4 w-4', styles.text, styles.glow && 'animate-pulse')} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Building vitals</p>
              <p className={cn('text-sm font-bold', styles.text)}>{bodyCopy.label}</p>
            </div>
          </div>

          <div className="relative h-36 w-36 mx-auto mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="72%"
                outerRadius="100%"
                barSize={11}
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={cn('text-3xl font-black tabular-nums', styles.text)}>{carbonScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">carbon score</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">{bodyCopy.description}</p>
        </div>

        {/* 2. Lifetime Ledger: cumulative emissions area chart */}
        <div className="p-6 animate-fade-in-up animate-delay-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-4 ring-white/[0.02]">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Since {buildYear} ({ledger.ageYears} years)</p>
              <p className="text-sm font-bold text-slate-100">Lifetime Ledger</p>
            </div>
          </div>

          <p className="text-2xl font-black text-white mb-1 tabular-nums">
            {formatNumber(ledger.lifetimeCo2Tonnes)} <span className="text-sm font-medium text-slate-500">tonnes CO2</span>
          </p>

          {ledgerData.length > 1 && (
            <div className="h-24 -ml-2 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ledgerData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`ledger-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={styles.hex} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={styles.hex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <Tooltip
                    formatter={(value: number) => [`${formatNumber(value)} t CO2`, 'Cumulative']}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', backgroundColor: '#1e293b', color: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tonnes"
                    stroke={styles.hex}
                    strokeWidth={2}
                    fill={`url(#ledger-${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="text-sm text-slate-400 leading-relaxed flex items-start gap-1.5">
            <Plane className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
            This building has emitted the equivalent of{' '}
            <strong className="text-white">{formatNumber(lifetimeFlights)} domestic flights</strong>{' '}
            since it was built — and counting, every single year it stays unfixed.
          </p>
        </div>

        {/* 3. The Inheritance: bar comparison vs fair-share budget */}
        <div className="p-6 animate-fade-in-up animate-delay-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-4 ring-blue-500/20">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Per year, ongoing</p>
              <p className="text-sm font-bold text-slate-100">The Inheritance</p>
            </div>
          </div>

          <p className="text-2xl font-black text-white mb-1 tabular-nums">
            {budgetMultiple.toFixed(1)}x <span className="text-sm font-medium text-slate-500">a fair-share budget</span>
          </p>

          <div className="h-24 -ml-2 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inheritanceData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#1e293b" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}t`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={88} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${formatNumber(value)} t CO2/yr`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', backgroundColor: '#1e293b', color: '#e2e8f0' }}
                />
                <Bar dataKey="tonnes" radius={[0, 4, 4, 0]} barSize={16}>
                  {inheritanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed flex items-start gap-1.5">
            <TreePine className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
            This single building consumes about{' '}
            <strong className="text-white">{budgetMultiple.toFixed(1)}x one person&rsquo;s</strong>{' '}
            sustainable annual carbon budget — and would need{' '}
            <strong className="text-white">{formatNumber(annualTreeYears)} mature trees</strong>{' '}
            growing for a full year just to absorb this year&rsquo;s emissions.
          </p>
        </div>

      </div>
    </div>
  )
}
