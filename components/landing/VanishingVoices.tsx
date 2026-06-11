'use client'

import { useEffect, useRef, useState } from 'react'
import { Mountain, TreePine, Waves, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VANISHING_VOICES, type VanishingVoice } from '@/lib/landing/climate-data'

const ICONS: Record<string, typeof Mountain> = {
  gangotri: Mountain,
  amazon: TreePine,
  coral: Waves,
}

const TYPE_SPEED_MS = 22

/**
 * IDEA 5 — VOICE OF THE VANISHING
 *
 * First-person testimonials from things that are disappearing — the
 * Gangotri Glacier, the Amazon rainforest, the world's coral reefs —
 * delivered as a dying voice would speak: short, plain, factual. Every
 * statistic is sourced (see lib/landing/climate-data.ts). The grammar
 * stays calm. That's what makes it land.
 *
 * Restyled to pure black, italic Georgia serif, no colour glow — and each
 * block types itself out, line by line, the moment it scrolls into view,
 * ending with a blinking cursor. Soft white text. Devastating.
 */
export function VanishingVoices() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 sm:gap-24">
      {VANISHING_VOICES.map((voice) => (
        <VoiceBlock key={voice.id} voice={voice} />
      ))}
    </div>
  )
}

function VoiceBlock({ voice }: { voice: VanishingVoice }) {
  const Icon = ICONS[voice.id] ?? Quote
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started || lineIndex >= voice.quote.length) return
    const currentLine = voice.quote[lineIndex]
    const timeout = setTimeout(() => {
      if (charCount < currentLine.length) {
        setCharCount((c) => c + 1)
      } else {
        setLineIndex((l) => l + 1)
        setCharCount(0)
      }
    }, TYPE_SPEED_MS)
    return () => clearTimeout(timeout)
  }, [started, lineIndex, charCount, voice.quote])

  const done = lineIndex >= voice.quote.length

  return (
    <div ref={ref} data-burst className="text-left">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-4 w-4 text-[var(--tm-ash)]" />
        <p className="eyebrow" style={{ fontSize: '0.7rem' }}>
          {voice.name} &mdash; {voice.location}
        </p>
        <span className="mono ml-auto shrink-0 text-[11px] text-[var(--tm-orange)]">{voice.stat}</span>
      </div>

      <div className="space-y-3">
        {voice.quote.map((line, idx) => {
          const isActive = idx === lineIndex
          const isPast = idx < lineIndex || done
          const text = isPast ? line : isActive ? line.slice(0, charCount) : ''
          const showCursor = isActive || (done && idx === voice.quote.length - 1)

          return (
            <p
              key={idx}
              className={cn(
                'voice-text',
                idx === 0 ? 'font-semibold not-italic' : 'italic'
              )}
              style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.1rem, 2.6vw, 1.65rem)', lineHeight: 1.85, color: '#f1efe9' }}
            >
              {idx === 0 && text ? text : idx === 0 ? '' : text ? `“${text}”` : ''}
              {showCursor && <span className="tm-cursor">|</span>}
              {!showCursor && !text ? ' ' : null}
            </p>
          )
        })}
      </div>

      <p className="mono mt-5 border-t border-[#2c2925] pt-3 text-[11px] leading-relaxed text-[var(--tm-ash)]">
        Source: {voice.source}
      </p>
    </div>
  )
}
