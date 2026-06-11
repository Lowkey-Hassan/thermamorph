'use client'

import { useEffect, useRef } from 'react'

/**
 * ThermaMorph "raw / brutal" particle system.
 *
 * A full-viewport canvas overlay that spawns leaf and ember particles:
 *  - a cursor trail of leaves that crumble from green -> yellow -> orange -> ash
 *  - a slow drift of embers rising from the bottom of the screen
 *  - bursts of leaves whenever the pointer enters an element marked
 *    `data-burst` (cards, buttons, etc.)
 *
 * Ported from thermamorph-emotional-landing.html. Pure canvas + RAF, no
 * external deps, object-pooled so it never allocates after mount.
 */

type ParticleType = 'leaf' | 'ember'

interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rotation: number
  rotSpeed: number
  type: ParticleType
}

const POOL_SIZE = 240
const GRAVITY = 2.6 // px/s^2-ish, scaled
const DRAG = 0.985 // per 60fps frame

// Leaf goes green -> yellow -> orange -> ash.
const LEAF_STOPS: { t: number; c: [number, number, number] }[] = [
  { t: 0, c: [76, 175, 80] }, // green
  { t: 0.33, c: [245, 166, 35] }, // yellow
  { t: 0.66, c: [232, 87, 10] }, // orange
  { t: 1, c: [85, 85, 85] }, // ash
]

// Embers are already burning: orange -> deep red -> ash.
const EMBER_STOPS: { t: number; c: [number, number, number] }[] = [
  { t: 0, c: [255, 140, 60] },
  { t: 0.5, c: [180, 40, 10] },
  { t: 1, c: [70, 70, 70] },
]

function colorAt(stops: { t: number; c: [number, number, number] }[], t: number): [number, number, number] {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (clamped >= a.t && clamped <= b.t) {
      const f = (clamped - a.t) / (b.t - a.t)
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
      ]
    }
  }
  return stops[stops.length - 1].c
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Respect reduced-motion preferences: render nothing, but keep the
    // element in the DOM for layout consistency.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resizeCanvas() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth * DPR
      canvas.height = window.innerHeight * DPR
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Object pool
    const pool: Particle[] = []
    for (let i = 0; i < POOL_SIZE; i++) {
      pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1.8,
        size: 5,
        rotation: 0,
        rotSpeed: 0,
        type: 'leaf',
      })
    }

    function spawn(x: number, y: number, opts: Partial<Particle> & { angle?: number; speed?: number }) {
      const p = pool.find((q) => !q.active)
      if (!p) return
      const angle = opts.angle != null ? opts.angle : Math.random() * Math.PI * 2
      const speed = opts.speed != null ? opts.speed : 1 + Math.random() * 3
      p.active = true
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = 0
      p.maxLife = opts.maxLife || 1.8
      p.size = opts.size || 5
      p.rotation = Math.random() * Math.PI * 2
      p.rotSpeed = (Math.random() - 0.5) * 6
      p.type = opts.type || 'leaf'
    }

    function spawnLeafBurst(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        spawn(x, y, {
          type: 'leaf',
          angle: Math.random() * Math.PI * 2,
          speed: 1.5 + Math.random() * 4.5,
          size: 5 + Math.random() * 6,
          maxLife: 1.5 + Math.random() * 0.7,
        })
      }
    }

    function spawnEmber() {
      spawn(Math.random() * window.innerWidth, window.innerHeight + 12, {
        type: 'ember',
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.7,
        speed: 0.4 + Math.random() * 0.9,
        size: 2 + Math.random() * 2.5,
        maxLife: 2.6 + Math.random() * 2.2,
      })
    }

    function drawLeaf(p: Particle, color: [number, number, number], alpha: number, scale: number) {
      if (scale <= 0 || alpha <= 0 || !ctx) return
      const s = p.size * scale
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.quadraticCurveTo(s * 0.85, -s * 0.15, 0, s)
      ctx.quadraticCurveTo(-s * 0.85, -s * 0.15, 0, -s)
      ctx.fill()
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.22})`
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.lineTo(0, s)
      ctx.stroke()
      ctx.restore()
    }

    function drawEmber(p: Particle, color: [number, number, number], alpha: number, scale: number) {
      if (scale <= 0 || alpha <= 0 || !ctx) return
      const r = Math.max(p.size * scale, 0.1)
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
      grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`)
      grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
      ctx.fill()
    }

    let lastTime = performance.now()
    let rafId = 0
    function animate(now: number) {
      if (!ctx) return
      const dtSec = Math.min((now - lastTime) / 1000, 0.05)
      const steps = dtSec * 60 // normalize to "frames" for drag/rotation feel
      lastTime = now

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const p of pool) {
        if (!p.active) continue
        p.life += dtSec
        const t = p.life / p.maxLife
        if (t >= 1) {
          p.active = false
          continue
        }

        // physics
        p.vy += GRAVITY * dtSec
        const dragF = Math.pow(DRAG, steps)
        p.vx *= dragF
        p.vy *= dragF
        p.x += p.vx * steps
        p.y += p.vy * steps

        // rotation, erratic near death
        const rotMul = t > 0.7 ? 4 : 1
        p.rotation += p.rotSpeed * rotMul * dtSec

        // color ramp
        const stops = p.type === 'leaf' ? LEAF_STOPS : EMBER_STOPS
        const color = colorAt(stops, t)

        // size / alpha: gentle shrink, then crumble + puff, then gone
        let scale: number
        let alpha: number
        if (t < 0.8) {
          scale = 1 - t * 0.25
          alpha = 1
        } else {
          const ft = (t - 0.8) / 0.2 // 0..1 over final 20% of life
          const base = 1 - 0.8 * 0.25
          const puff = ft < 0.35 ? 1 + ft * 1.6 : (1 + 0.35 * 1.6) * (1 - (ft - 0.35) / 0.65)
          scale = base * Math.max(puff, 0)
          alpha = 1 - ft
        }

        if (p.type === 'leaf') drawLeaf(p, color, alpha, scale)
        else drawEmber(p, color, alpha, scale)
      }

      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    // Cursor trail (desktop only)
    let lastEmit = 0
    function handleMouseMove(e: MouseEvent) {
      const now = performance.now()
      if (now - lastEmit < 55) return
      lastEmit = now
      const count = 6 + Math.floor(Math.random() * 5) // 6-10
      for (let i = 0; i < count; i++) {
        spawn(e.clientX, e.clientY, {
          type: 'leaf',
          angle: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 2.2,
          size: 4 + Math.random() * 5,
          maxLife: 1.5 + Math.random() * 0.6,
        })
      }
    }
    if (!isTouch) window.addEventListener('mousemove', handleMouseMove)

    // Idle ember drift, always running
    const emberInterval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      spawnEmber()
      if (Math.random() < 0.6) spawnEmber()
    }, 220)

    // Hover / touch bursts on any [data-burst] element, via capture-phase
    // delegation (mouseenter doesn't bubble, but IS observable in capture).
    let lastBurst = 0
    function handleBurst(e: Event) {
      const target = e.target as HTMLElement | null
      const el = target?.closest('[data-burst]') as HTMLElement | null
      if (!el) return
      const now = performance.now()
      if (now - lastBurst < 500) return
      lastBurst = now
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      spawnLeafBurst(cx, cy, 20 + Math.floor(Math.random() * 11))
    }
    document.addEventListener('mouseenter', handleBurst, true)
    document.addEventListener('touchstart', handleBurst, { capture: true, passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resizeCanvas)
      if (!isTouch) window.removeEventListener('mousemove', handleMouseMove)
      window.clearInterval(emberInterval)
      document.removeEventListener('mouseenter', handleBurst, true)
      document.removeEventListener('touchstart', handleBurst, true)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] h-screen w-screen"
    />
  )
}
