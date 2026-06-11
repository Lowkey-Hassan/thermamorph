'use client'

import { Mountain, TreePine, Waves, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VANISHING_VOICES, type VanishingVoice } from '@/lib/landing/climate-data'

const ICONS: Record<string, typeof Mountain> = {
  gangotri: Mountain,
  amazon: TreePine,
  coral: Waves,
}

const VOICE_THEME: Record<string, { glow: string; ring: string; text: string; bg: string; bar: string }> = {
  gangotri: {
    glow: 'rgba(56,189,248,0.18)',
    ring: 'ring-sky-400/30',
    text: 'text-sky-300',
    bg: 'bg-sky-500/10',
    bar: 'from-sky-400 to-cyan-300',
  },
  amazon: {
    glow: 'rgba(52,211,153,0.18)',
    ring: 'ring-emerald-400/30',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    bar: 'from-emerald-400 to-lime-300',
  },
  coral: {
    glow: 'rgba(251,113,133,0.18)',
    ring: 'ring-rose-400/30',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    bar: 'from-orange-400 to-rose-400',
  },
}

/**
 * IDEA 5 — VOICE OF THE VANISHING
 *
 * First-person testimonials from things that are disappearing — the
 * Gangotri Glacier, the Amazon rainforest, the world's coral reefs —
 * delivered as a dying voice would speak: short, plain, factual. Every
 * statistic is sourced (see lib/landing/climate-data.ts). The grammar
 * stays calm. That's what makes it land.
 */
export function VanishingVoices() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {VANISHING_VOICES.map((voice: VanishingVoice, i) => {
        const Icon = ICONS[voice.id] ?? Quote
        const theme = VOICE_THEME[voice.id]
        return (
          <div
            key={voice.id}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 animate-fade-in-up',
              `animate-delay-${Math.min((i + 1) * 100, 300)}`
            )}
            style={{ boxShadow: `0 0 60px -15px ${theme.glow}` }}
          >
            {/* Ambient breathing glow */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl animate-voice-breathe"
              style={{ background: theme.glow }}
            />
            <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', theme.bar)} />

            <div className="relative flex items-start gap-4 mb-4">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1', theme.bg, theme.ring)}>
                <Icon className={cn('h-5 w-5', theme.text)} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white">{voice.name}</p>
                <p className="text-xs text-slate-400">{voice.location}</p>
              </div>
              <div className={cn('ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tabular-nums', theme.bg, theme.text)}>
                {voice.stat}
              </div>
            </div>

            <div className="relative space-y-2.5 mb-4">
              {voice.quote.map((line, idx) => (
                <p
                  key={idx}
                  className={cn(
                    'text-[15px] sm:text-base leading-relaxed text-slate-200 italic',
                    idx === 0 && 'font-semibold not-italic text-white'
                  )}
                >
                  {idx === voice.quote.length - 1 ? (
                    <>
                      {line}
                      <span className="animate-caret-blink text-slate-500 not-italic">|</span>
                    </>
                  ) : (
                    `“${line}”`
                  )}
                </p>
              ))}
            </div>

            <p className="relative text-[11px] text-slate-500 leading-relaxed border-t border-white/10 pt-3">
              Source: {voice.source}
            </p>
          </div>
        )
      })}
    </div>
  )
}
