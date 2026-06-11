'use client'

import { Coffee, Car, Snowflake, Plane, type LucideIcon } from 'lucide-react'
import { EVERYDAY_CONFESSIONS, type ConfessionItem } from '@/lib/landing/climate-data'

const ICONS: Record<ConfessionItem['icon'], LucideIcon> = {
  coffee: Coffee,
  car: Car,
  snowflake: Snowflake,
  plane: Plane,
}

/**
 * IDEA 2 — EVERYDAY CONFESSIONS
 *
 * Four moments everyone recognises — chai, the commute, the AC, the flight —
 * each broken into one verifiable "truth" and one piece of context that
 * turns it from relatable into unsettling. Real numbers, real sources,
 * deliberately ordered from "barely anything" to "this one flight undid
 * years of small choices."
 *
 * Restyled as a raw-edged 2x2 grid on a dark earth-toned ground: orange
 * Courier New stat, hover = orange border + glow + leaf burst.
 */
export function EverydayConfessions() {
  return (
    <div className="confessions-grid mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
      {EVERYDAY_CONFESSIONS.map((item) => {
        const Icon = ICONS[item.icon]
        return (
          <div
            key={item.id}
            data-burst
            className="group relative border border-[#2c2925] bg-[#0f0d08] p-7 text-left transition-all duration-[400ms] ease-out hover:-translate-y-1 hover:border-[var(--tm-orange)] hover:shadow-[0_0_45px_rgba(232,87,10,0.22)]"
          >
            <Icon className="mb-5 h-5 w-5 text-[var(--tm-ash)]" />

            <p className="eyebrow mb-3" style={{ fontSize: '0.7rem' }}>
              {item.moment}
            </p>

            <p className="hero-counter mb-4 leading-tight" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)' }}>
              {item.headline}
            </p>

            <p className="mb-2 text-base leading-snug text-[#ddd]" style={{ fontFamily: 'Georgia, serif' }}>
              {item.truth}
            </p>
            <p className="mb-3 text-sm leading-relaxed text-[#999]">{item.context}</p>

            <p className="mono text-[0.68rem] leading-relaxed text-[var(--tm-ash)]">{item.source}</p>
          </div>
        )
      })}
    </div>
  )
}
