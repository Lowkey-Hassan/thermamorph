'use client'

import { useEffect, useRef, useState } from 'react'
import { Activity, Radio } from 'lucide-react'
import {
  GLOBAL_CO2_TOTAL_TONNES_PER_SECOND,
  GLOBAL_CO2_FOSSIL_TONNES_PER_SECOND,
  CO2_RATE_SOURCE,
} from '@/lib/landing/climate-data'

/**
 * IDEA 1 — THE REAL-TIME RECKONING
 *
 * A live counter that never stops. It starts at zero the moment this page
 * loads and climbs in real time at the world's actual current emission
 * rate (Global Carbon Budget 2024: ~41.6 Gt CO2e/yr ≈ 1,318 tonnes/second).
 *
 * There is no "pause." There is no "reset." The number is exactly as
 * relentless as the thing it represents.
 */
export function LiveEmissionsCounter() {
  const [tonnes, setTonnes] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsedSeconds = (now - startRef.current) / 1000
      setTonnes(elapsedSeconds * GLOBAL_CO2_TOTAL_TONNES_PER_SECOND)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const display = tonnes.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="animate-red-pulse-glow relative rounded-2xl border border-red-500/30 bg-slate-950 px-6 py-7 sm:px-10 sm:py-8 overflow-hidden">
        {/* Faint scanline texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
          }}
        />

        <div className="relative flex items-center justify-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">
            Live · Right now, worldwide
          </p>
        </div>

        <p className="relative text-center text-sm sm:text-base text-slate-400 mb-2">
          Tonnes of CO<sub>2</sub> emitted globally since you opened this page
        </p>

        <p
          key={Math.floor(tonnes)}
          className="relative text-center font-black tabular-nums text-white leading-none animate-count-tick"
          style={{ fontSize: 'clamp(2.75rem, 9vw, 5.5rem)', textShadow: '0 0 40px rgba(239,68,68,0.45)' }}
        >
          {display}
        </p>

        <p className="relative text-center text-xs sm:text-sm text-red-300/80 mt-2 font-medium">
          It never stops. The world adds another tonne roughly every{' '}
          <span className="font-bold text-red-200">
            {(1 / GLOBAL_CO2_TOTAL_TONNES_PER_SECOND).toFixed(3)}s
          </span>
          .
        </p>

        {/* EKG-style baseline with sweeping scanner */}
        <div className="relative mt-5 h-10 overflow-hidden rounded-lg border border-red-500/20 bg-black/40">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0,20 L60,20 L75,20 L85,4 L95,36 L105,12 L115,28 L125,20 L160,20 L300,20 L312,20 L322,4 L332,36 L342,12 L352,28 L362,20 L400,20"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
            />
          </svg>
          <div className="absolute top-0 bottom-0 w-16 animate-ekg-sweep bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
        </div>

        <div className="relative mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            ~{GLOBAL_CO2_TOTAL_TONNES_PER_SECOND.toLocaleString('en-US')} t/s total &middot; ~
            {GLOBAL_CO2_FOSSIL_TONNES_PER_SECOND.toLocaleString('en-US')} t/s fossil fuels &amp; cement
          </span>
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            Source: Global Carbon Budget 2024
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400 leading-relaxed">{CO2_RATE_SOURCE}</p>
    </div>
  )
}
