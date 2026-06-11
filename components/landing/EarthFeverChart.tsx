'use client'

import { Activity, Thermometer } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  EARTH_FEVER_DATA,
  FEVER_CHART_SOURCE,
  NORMAL_HUMAN_TEMP_C,
  EARTH_FEVER_TEMP_C,
} from '@/lib/landing/climate-data'

/**
 * IDEA 4 — EARTH'S FEVER CHART
 *
 * The planet's global temperature anomaly (NASA GISTEMP, 1880-2024),
 * presented as a bedside vitals monitor. The framing is deliberate: a
 * +1.28°C anomaly sounds abstract. A patient running a 38.3°C fever that
 * has been climbing for 50 years, with no sign of breaking, is not.
 *
 * The earth isn't dying. It's sick. And the chart below is its chart.
 */
export function EarthFeverChart() {
  const latest = EARTH_FEVER_DATA[EARTH_FEVER_DATA.length - 1]

  return (
    <div className="relative mx-auto max-w-4xl rounded-2xl border border-emerald-500/20 bg-slate-950 overflow-hidden shadow-2xl shadow-black/40">
      {/* Monitor header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 bg-black/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            Vitals Monitor &middot; Patient: Earth
          </p>
        </div>
        <p className="text-[11px] font-mono text-slate-500">NASA GISTEMP v4 &middot; 1880&ndash;2024</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px]">
        {/* Chart */}
        <div className="p-4 sm:p-6">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EARTH_FEVER_DATA} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="feverLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="55%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
                  width={42}
                />
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}°C`, 'Anomaly']}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="anomaly"
                  stroke="url(#feverLine)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#ef4444' }}
                  isAnimationActive
                  animationDuration={2200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{FEVER_CHART_SOURCE}</p>
        </div>

        {/* Vitals readout */}
        <div className="border-t lg:border-t-0 lg:border-l border-emerald-500/20 bg-black/30 p-5 flex flex-col justify-center gap-5">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
              <Thermometer className="h-3 w-3" /> Current reading
            </p>
            <p className="text-4xl font-black tabular-nums text-white leading-none">
              {EARTH_FEVER_TEMP_C.toFixed(2)}<span className="text-xl text-slate-400">&deg;C</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Baseline {NORMAL_HUMAN_TEMP_C.toFixed(1)}&deg;C + {latest.anomaly.toFixed(2)}&deg;C anomaly
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
              <Activity className="h-3 w-3" /> Status
            </p>
            <p className="text-sm font-bold text-red-300">
              Fever — rising, {latest.year}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {latest.year} was the warmest year ever recorded. The last ten years are the ten warmest
              ever measured.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-[11px] text-red-200 leading-relaxed">
              A doctor who watched a patient&rsquo;s temperature climb steadily for 50 years, with every
              decade hotter than the last, would not call it normal. They would call it a symptom.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
