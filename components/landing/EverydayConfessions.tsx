'use client'

import { Coffee, Car, Snowflake, Plane, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVERYDAY_CONFESSIONS, type ConfessionItem } from '@/lib/landing/climate-data'

const ICONS: Record<ConfessionItem['icon'], LucideIcon> = {
  coffee: Coffee,
  car: Car,
  snowflake: Snowflake,
  plane: Plane,
}

// Each confession nudges the visual tone one step further from green toward red —
// a quiet version of the page's larger "leafy → burning" arc.
const TONES = [
  {
    ring: 'ring-emerald-200',
    badge: 'bg-emerald-50 text-emerald-600',
    accent: 'text-emerald-600',
    bar: 'from-emerald-400 to-emerald-500',
  },
  {
    ring: 'ring-lime-200',
    badge: 'bg-lime-50 text-lime-700',
    accent: 'text-lime-700',
    bar: 'from-lime-400 to-amber-400',
  },
  {
    ring: 'ring-amber-200',
    badge: 'bg-amber-50 text-amber-600',
    accent: 'text-amber-600',
    bar: 'from-amber-400 to-orange-500',
  },
  {
    ring: 'ring-red-200',
    badge: 'bg-red-50 text-red-600',
    accent: 'text-red-600',
    bar: 'from-orange-500 to-red-600',
  },
]

/**
 * IDEA 2 — EVERYDAY CONFESSIONS
 *
 * Four moments everyone recognises — chai, the commute, the AC, the flight —
 * each broken into one verifiable "truth" and one piece of context that
 * turns it from relatable into unsettling. Real numbers, real sources,
 * deliberately ordered from "barely anything" to "this one flight undid
 * years of small choices."
 */
export function EverydayConfessions() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {EVERYDAY_CONFESSIONS.map((item, i) => {
        const Icon = ICONS[item.icon]
        const tone = TONES[i % TONES.length]
        return (
          <div
            key={item.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 animate-fade-in-up',
              `animate-delay-${Math.min((i + 1) * 100, 300)}`
            )}
          >
            {/* Left accent bar */}
            <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', tone.bar)} />

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 sm:gap-6 items-start pl-2">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-4', tone.badge, tone.ring)}>
                <Icon className={cn('h-5 w-5', tone.accent)} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.moment}</p>
                <p className="text-base sm:text-lg font-semibold text-slate-800 leading-snug mb-2">{item.truth}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.context}</p>
                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">{item.source}</p>
              </div>

              <div className="sm:text-right shrink-0">
                <p className={cn('text-2xl sm:text-3xl font-black tabular-nums leading-none', tone.accent)}>
                  {item.headline}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
