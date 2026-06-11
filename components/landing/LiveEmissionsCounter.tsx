'use client'

import { useEffect, useRef, useState } from 'react'
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
    <div className="relative mx-auto max-w-2xl text-center" data-burst>
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping bg-[var(--tm-orange)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 bg-[var(--tm-orange)]" />
        </span>
        <p className="eyebrow">Live · right now, worldwide</p>
      </div>

      <div className="hero-counter leading-none" style={{ fontSize: 'clamp(2.5rem, 9vw, 6.5rem)' }}>
        {display}
        <span className="ml-2 align-baseline" style={{ fontSize: '0.35em', color: '#c98a5c' }}>
          t CO&#8322;
        </span>
      </div>

      <p className="eyebrow mx-auto mt-4 max-w-md" style={{ fontSize: '0.8rem', letterSpacing: '0.25em' }}>
        emitted globally since you opened this page
      </p>

      <p className="mono mt-4 text-xs text-[var(--tm-ash)]">
        It never stops. The world adds another tonne roughly every{' '}
        <span className="text-[var(--tm-orange)]">{(1 / GLOBAL_CO2_TOTAL_TONNES_PER_SECOND).toFixed(3)}s</span>.
      </p>

      {/* EKG-style baseline with sweeping scanner, recolored to the burning palette */}
      <div className="relative mx-auto mt-6 h-10 max-w-md overflow-hidden border border-[#3a2a1f] bg-black/60">
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0,20 L60,20 L75,20 L85,4 L95,36 L105,12 L115,28 L125,20 L160,20 L300,20 L312,20 L322,4 L332,36 L342,12 L352,28 L362,20 L400,20"
            fill="none"
            stroke="var(--tm-orange)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
        <div className="absolute top-0 bottom-0 w-16 animate-ekg-sweep bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
      </div>

      <p className="mono mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-[#666]">
        ~{GLOBAL_CO2_TOTAL_TONNES_PER_SECOND.toLocaleString('en-US')} t/s total &middot; ~
        {GLOBAL_CO2_FOSSIL_TONNES_PER_SECOND.toLocaleString('en-US')} t/s fossil fuels &amp; cement
      </p>
      <p className="mono mx-auto mt-2 max-w-md text-[10px] leading-relaxed text-[#555]">{CO2_RATE_SOURCE}</p>
    </div>
  )
}
