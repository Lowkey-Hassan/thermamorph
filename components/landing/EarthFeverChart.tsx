'use client'

import { useEffect, useRef, useState } from 'react'
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

interface FeverDotProps {
  cx?: number
  cy?: number
  index?: number
}

/**
 * IDEA 4 — EARTH'S FEVER CHART
 *
 * The planet's global temperature anomaly (NASA GISTEMP, 1880-2024),
 * presented as a bedside vitals monitor. The framing is deliberate: a
 * +1.28°C anomaly sounds abstract. A patient running a 38.3°C fever that
 * has been climbing for 50 years, with no sign of breaking, is not.
 *
 * The earth isn't dying. It's sick. And the chart below is its chart.
 * Restyled to the brutal navy/blue->amber->red palette, with the line
 * draw-in and the 2024 dot's pulse gated behind scroll-into-view.
 */
export function EarthFeverChart() {
  const latest = EARTH_FEVER_DATA[EARTH_FEVER_DATA.length - 1]
  const [inView, setInView] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.35 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const renderFeverDot = (props: FeverDotProps) => {
    const { cx, cy, index } = props
    if (index !== EARTH_FEVER_DATA.length - 1 || cx == null || cy == null) {
      return <circle key={index} cx={cx ?? 0} cy={cy ?? 0} r={0} fill="none" />
    }
    return (
      <circle
        key={index}
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--tm-orange)"
        className={inView ? 'fever-dot-pulse' : ''}
      />
    )
  }

  return (
    <div
      ref={wrapRef}
      data-burst
      className="relative mx-auto max-w-4xl border border-[#1c2533] bg-[#060912] overflow-hidden"
    >
      {/* Monitor header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c2533] bg-black/50 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-[#3b82f6] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-[#3b82f6]" />
          </span>
          <p className="eyebrow" style={{ color: '#6b8cb8' }}>
            Vitals monitor &middot; patient: Earth
          </p>
        </div>
        <p className="mono text-[11px] text-[#45506a]">NASA GISTEMP v4 &middot; 1880&ndash;2024</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px]">
        {/* Chart */}
        <div className="p-4 sm:p-6">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EARTH_FEVER_DATA} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="feverLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="55%" stopColor="#f5a623" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1c2533" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: '#45506a', fontFamily: 'Courier New, monospace' }}
                  axisLine={{ stroke: '#1c2533' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#45506a', fontFamily: 'Courier New, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
                  width={42}
                />
                <ReferenceLine y={0} stroke="#2a3344" strokeDasharray="4 6" />
                <Tooltip
                  formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}°C`, 'Anomaly']}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    background: '#0a0e18',
                    border: '1px solid #1c2533',
                    borderRadius: '0px',
                    fontSize: '12px',
                    fontFamily: 'Courier New, monospace',
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="anomaly"
                  stroke="url(#feverLine)"
                  strokeWidth={3}
                  dot={renderFeverDot}
                  activeDot={{ r: 4, fill: '#ef4444' }}
                  isAnimationActive={inView}
                  animationDuration={2200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p
            className={`mono mt-3 text-[0.75rem] tracking-wide text-[#ff8a5c] transition-opacity duration-1000 ${inView ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: inView ? '2.2s' : '0s' }}
          >
            {latest.year} &middot; +{latest.anomaly.toFixed(2)}&deg;C — hottest year ever recorded, NASA GISS
          </p>
          <p className="mt-3 text-[11px] text-[#45506a] leading-relaxed">{FEVER_CHART_SOURCE}</p>
        </div>

        {/* Vitals readout */}
        <div className="border-t lg:border-t-0 lg:border-l border-[#1c2533] bg-black/40 p-5 flex flex-col justify-center gap-5">
          <div>
            <p className="eyebrow mb-1" style={{ fontSize: '0.65rem', color: 'var(--tm-orange)' }}>
              Current reading
            </p>
            <p className="hero-counter leading-none" style={{ fontSize: '2.25rem' }}>
              {EARTH_FEVER_TEMP_C.toFixed(2)}
              <span className="text-base text-[var(--tm-ash)]">&deg;C</span>
            </p>
            <p className="mono mt-1 text-[11px] text-[#666]">
              Baseline {NORMAL_HUMAN_TEMP_C.toFixed(1)}&deg;C + {latest.anomaly.toFixed(2)}&deg;C anomaly
            </p>
          </div>

          <div>
            <p className="eyebrow mb-1" style={{ fontSize: '0.65rem' }}>
              Status
            </p>
            <p className="mono text-sm font-bold" style={{ color: '#ff8a5c' }}>
              Fever — rising, {latest.year}
            </p>
            <p className="mt-1 text-[11px] text-[#888] leading-relaxed">
              {latest.year} was the warmest year ever recorded. The last ten years are the ten warmest
              ever measured.
            </p>
          </div>

          <div className="border border-[#3a2a1f] bg-[var(--tm-earth1)]/20 p-3">
            <p className="text-[11px] text-[#e8c4ad] leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
              A doctor who watched a patient&rsquo;s temperature climb steadily for 50 years, with every
              decade hotter than the last, would not call it normal. They would call it a symptom.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
