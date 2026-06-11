'use client'

import { cn } from '@/lib/utils'

/**
 * Visual theme system for the landing page: "Living vs. Burning."
 *
 * The page reads as a single living organism — lush, leafy, and green at
 * the top, where the product offers a way forward — and increasingly
 * scorched toward the middle, where the cost of inaction is laid out in
 * the five idea sections. All effects here are CSS/SVG: layered organic
 * leaf shapes, swaying vines, drifting embers and smoke, and a "burn line"
 * that visually scorches the transition between the two halves.
 *
 * Every particle field below uses a fixed, hand-placed array (not
 * Math.random()) so server and client renders match exactly — no
 * hydration warnings, no popping-in.
 */

// ───────────────────────────── Leaf shapes ─────────────────────────────

const LEAF_PATHS = [
  // broad rounded leaf with center vein
  'M32 2 C54 10 60 34 32 62 C4 34 10 10 32 2 Z',
  // narrower pointed leaf
  'M32 0 C48 14 50 40 32 64 C14 40 16 14 32 0 Z',
  // asymmetric maple-ish leaf
  'M32 2 C46 8 60 22 56 38 C52 54 40 60 32 64 C24 60 12 54 8 38 C4 22 18 8 32 2 Z',
]

interface LeafShapeProps {
  size?: number
  color?: string
  pathIndex?: 0 | 1 | 2
  className?: string
}

export function LeafShape({ size = 40, color = '#34d399', pathIndex = 0, className }: LeafShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d={LEAF_PATHS[pathIndex]} fill={color} opacity={0.92} />
      <path
        d="M32 6 L32 58 M32 24 L20 16 M32 24 L44 16 M32 40 L18 34 M32 40 L46 34"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ───────────────────────── Canopy corner clusters ─────────────────────────

interface CanopyLeaf {
  size: number
  color: string
  pathIndex: 0 | 1 | 2
  top: string
  side: string // left or right offset
  rotate: number
  opacity: number
  swaySpeed: 'animate-leaf-sway' | 'animate-leaf-sway-slow' | 'animate-leaf-sway-fast'
}

const CANOPY_GREENS = ['#34d399', '#22c55e', '#4ade80', '#16a34a', '#86efac', '#10b981']

const LEFT_CANOPY: CanopyLeaf[] = [
  { size: 120, color: '#16a34a', pathIndex: 2, top: '-40px', side: '-50px', rotate: -18, opacity: 0.9, swaySpeed: 'animate-leaf-sway-slow' },
  { size: 80, color: '#22c55e', pathIndex: 0, top: '40px', side: '-10px', rotate: 12, opacity: 0.85, swaySpeed: 'animate-leaf-sway' },
  { size: 60, color: '#4ade80', pathIndex: 1, top: '120px', side: '20px', rotate: -8, opacity: 0.8, swaySpeed: 'animate-leaf-sway-fast' },
  { size: 46, color: '#86efac', pathIndex: 2, top: '10px', side: '70px', rotate: 24, opacity: 0.7, swaySpeed: 'animate-leaf-sway' },
  { size: 90, color: '#10b981', pathIndex: 0, top: '180px', side: '-30px', rotate: 6, opacity: 0.75, swaySpeed: 'animate-leaf-sway-slow' },
]

const RIGHT_CANOPY: CanopyLeaf[] = [
  { size: 110, color: '#16a34a', pathIndex: 1, top: '-30px', side: '-40px', rotate: 16, opacity: 0.9, swaySpeed: 'animate-leaf-sway-slow' },
  { size: 70, color: '#22c55e', pathIndex: 2, top: '50px', side: '0px', rotate: -14, opacity: 0.85, swaySpeed: 'animate-leaf-sway' },
  { size: 56, color: '#4ade80', pathIndex: 0, top: '130px', side: '30px', rotate: 10, opacity: 0.8, swaySpeed: 'animate-leaf-sway-fast' },
  { size: 42, color: '#86efac', pathIndex: 1, top: '0px', side: '60px', rotate: -22, opacity: 0.7, swaySpeed: 'animate-leaf-sway' },
  { size: 84, color: '#10b981', pathIndex: 2, top: '170px', side: '-20px', rotate: -4, opacity: 0.75, swaySpeed: 'animate-leaf-sway-slow' },
]

/**
 * Leafy canopy clusters that frame a section from the left and/or right
 * edges, like branches reaching in from off-screen trees. Use on hero and
 * other "green" sections. Purely decorative — pointer-events disabled.
 */
export function CanopyFrame({ side = 'both' }: { side?: 'left' | 'right' | 'both' }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] overflow-hidden z-0">
      {(side === 'left' || side === 'both') && (
        <div className="absolute -left-10 top-0">
          {LEFT_CANOPY.map((leaf, i) => (
            <div
              key={i}
              className={cn('absolute', leaf.swaySpeed)}
              style={{ top: leaf.top, left: leaf.side, transform: `rotate(${leaf.rotate}deg)`, opacity: leaf.opacity }}
            >
              <LeafShape size={leaf.size} color={leaf.color} pathIndex={leaf.pathIndex} />
            </div>
          ))}
        </div>
      )}
      {(side === 'right' || side === 'both') && (
        <div className="absolute -right-10 top-0">
          {RIGHT_CANOPY.map((leaf, i) => (
            <div
              key={i}
              className={cn('absolute', leaf.swaySpeed)}
              style={{ top: leaf.top, right: leaf.side, transform: `rotate(${leaf.rotate}deg)`, opacity: leaf.opacity }}
            >
              <LeafShape size={leaf.size} color={leaf.color} pathIndex={leaf.pathIndex} />
            </div>
          ))}
        </div>
      )}
      {/* Soft canopy shadow gradient so foliage feels like it's casting light */}
      <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-emerald-900/[0.06] to-transparent" />
    </div>
  )
}

// ───────────────────────────── Vine edges ─────────────────────────────

/**
 * A climbing vine running up one edge of a section, with small leaves
 * sprouting along its length. Grows in on scroll-into-view via CSS
 * animation (animate-vine-grow), then leaves sway gently forever.
 */
export function VineEdge({ side = 'left' }: { side?: 'left' | 'right' }) {
  const leaves: { y: number; size: number; color: string; flip: boolean }[] = [
    { y: 40, size: 30, color: '#22c55e', flip: false },
    { y: 110, size: 24, color: '#4ade80', flip: true },
    { y: 190, size: 32, color: '#16a34a', flip: false },
    { y: 270, size: 22, color: '#86efac', flip: true },
    { y: 350, size: 28, color: '#10b981', flip: false },
  ]

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-0 bottom-0 w-16 sm:w-24 hidden lg:block z-0 animate-vine-grow',
        side === 'left' ? 'left-0' : 'right-0 scale-x-[-1]'
      )}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox="0 0 100 420" preserveAspectRatio="none" className="h-full w-full opacity-70">
        <path
          d="M20 0 C40 60 0 120 24 180 C46 236 6 300 26 360 C40 400 20 410 30 420"
          stroke="#16a34a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {leaves.map((leaf, i) => (
        <div
          key={i}
          className="absolute animate-leaf-sway"
          style={{ top: `${leaf.y}px`, left: i % 2 === 0 ? '8px' : '38px', animationDelay: `${i * 0.6}s` }}
        >
          <LeafShape size={leaf.size} color={leaf.color} pathIndex={(i % 3) as 0 | 1 | 2} className={leaf.flip ? 'scale-x-[-1]' : ''} />
        </div>
      ))}
    </div>
  )
}

// ───────────────────────────── Falling leaves ─────────────────────────────

interface FallingLeafConfig {
  left: string
  size: number
  color: string
  pathIndex: 0 | 1 | 2
  duration: string
  delay: string
  drift: string
}

const FALLING_LEAVES: FallingLeafConfig[] = [
  { left: '4%', size: 22, color: '#4ade80', pathIndex: 0, duration: '16s', delay: '0s', drift: '60px' },
  { left: '14%', size: 16, color: '#86efac', pathIndex: 1, duration: '12s', delay: '3s', drift: '-40px' },
  { left: '26%', size: 26, color: '#22c55e', pathIndex: 2, duration: '19s', delay: '1.5s', drift: '50px' },
  { left: '38%', size: 18, color: '#16a34a', pathIndex: 0, duration: '14s', delay: '5s', drift: '-30px' },
  { left: '52%', size: 20, color: '#4ade80', pathIndex: 1, duration: '17s', delay: '2s', drift: '40px' },
  { left: '64%', size: 24, color: '#86efac', pathIndex: 2, duration: '13s', delay: '6.5s', drift: '-50px' },
  { left: '76%', size: 17, color: '#22c55e', pathIndex: 0, duration: '18s', delay: '4s', drift: '35px' },
  { left: '88%', size: 22, color: '#16a34a', pathIndex: 1, duration: '15s', delay: '0.8s', drift: '-45px' },
]

/** A field of slowly falling, rotating leaves drifting down a section. */
export function FallingLeaves({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden z-0', className)} aria-hidden="true">
      {FALLING_LEAVES.map((leaf, i) => (
        <div
          key={i}
          className="absolute animate-leaf-fall"
          style={
            {
              left: leaf.left,
              top: '-10%',
              animationDuration: leaf.duration,
              animationDelay: leaf.delay,
              '--drift': leaf.drift,
            } as React.CSSProperties
          }
        >
          <LeafShape size={leaf.size} color={leaf.color} pathIndex={leaf.pathIndex} />
        </div>
      ))}
    </div>
  )
}

// ───────────────────────────── Embers & smoke ─────────────────────────────

interface EmberConfig {
  left: string
  size: number
  color: string
  duration: string
  delay: string
  drift: string
}

const EMBERS: EmberConfig[] = [
  { left: '6%', size: 6, color: '#fb923c', duration: '7s', delay: '0s', drift: '-20px' },
  { left: '16%', size: 4, color: '#f87171', duration: '9s', delay: '1.2s', drift: '15px' },
  { left: '27%', size: 8, color: '#fbbf24', duration: '6.5s', delay: '2.4s', drift: '-30px' },
  { left: '39%', size: 5, color: '#f97316', duration: '8s', delay: '0.6s', drift: '10px' },
  { left: '50%', size: 7, color: '#ef4444', duration: '7.5s', delay: '3s', drift: '-15px' },
  { left: '61%', size: 4, color: '#fbbf24', duration: '9.5s', delay: '1.8s', drift: '25px' },
  { left: '73%', size: 6, color: '#fb923c', duration: '6.8s', delay: '2.8s', drift: '-10px' },
  { left: '84%', size: 5, color: '#f87171', duration: '8.6s', delay: '0.3s', drift: '20px' },
  { left: '93%', size: 7, color: '#f97316', duration: '7.2s', delay: '4s', drift: '-25px' },
]

/** A field of glowing embers drifting upward and fading — the "burning" counterpart to FallingLeaves. */
export function EmberField({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden z-0', className)} aria-hidden="true">
      {EMBERS.map((ember, i) => (
        <div
          key={i}
          className="absolute bottom-0 animate-ember-rise rounded-full"
          style={
            {
              left: ember.left,
              width: ember.size,
              height: ember.size,
              background: ember.color,
              boxShadow: `0 0 ${ember.size * 2}px ${ember.size / 1.5}px ${ember.color}`,
              animationDuration: ember.duration,
              animationDelay: ember.delay,
              '--drift': ember.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

const SMOKE_COLUMNS = [
  { left: '12%', size: 140, duration: '22s', delay: '0s', drift: '40px' },
  { left: '40%', size: 180, duration: '28s', delay: '6s', drift: '-50px' },
  { left: '68%', size: 160, duration: '25s', delay: '3s', drift: '30px' },
  { left: '88%', size: 120, duration: '20s', delay: '9s', drift: '-35px' },
]

/** Soft, blurred smoke columns rising and dissipating. */
export function SmokeLayer({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden z-0', className)} aria-hidden="true">
      {SMOKE_COLUMNS.map((s, i) => (
        <div
          key={i}
          className="absolute bottom-0 animate-smoke-drift rounded-full blur-2xl"
          style={
            {
              left: s.left,
              width: s.size,
              height: s.size,
              background: 'radial-gradient(circle, rgba(120,113,108,0.35) 0%, transparent 70%)',
              animationDuration: s.duration,
              animationDelay: s.delay,
              '--drift': s.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// ───────────────────────────── Burn divider ─────────────────────────────

const FLAMES = [
  { left: '4%', size: 38, delay: '0s' },
  { left: '13%', size: 52, delay: '0.3s' },
  { left: '23%', size: 34, delay: '0.6s' },
  { left: '33%', size: 58, delay: '0.15s' },
  { left: '44%', size: 40, delay: '0.45s' },
  { left: '55%', size: 56, delay: '0.75s' },
  { left: '65%', size: 36, delay: '0.2s' },
  { left: '75%', size: 50, delay: '0.5s' },
  { left: '85%', size: 38, delay: '0.35s' },
  { left: '93%', size: 46, delay: '0.65s' },
]

function FlameShape({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" className="animate-flame-flicker" aria-hidden="true">
      <path
        d="M20 2 C28 14 34 20 30 30 C38 28 36 40 26 46 C32 38 24 36 22 42 C20 48 10 48 8 40 C4 32 10 30 8 22 C2 26 4 14 12 10 C8 18 14 18 16 12 C18 6 16 6 20 2 Z"
        fill="url(#flameGrad)"
      />
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * The "burn line" — a full-width transition that visually scorches the
 * boundary between the page's leafy-green half and its red/burning half.
 * A jagged charred edge with a glowing, flickering ember line sits above a
 * row of animated flames; embers drift up into the section above.
 */
export function BurnDivider() {
  return (
    <div className="relative h-28 sm:h-36 w-full overflow-visible" aria-hidden="true">
      {/* Charred jagged silhouette */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full animate-burn-edge"
      >
        <path
          d="M0,40 L60,55 L120,30 L180,60 L240,35 L300,58 L360,28 L420,52 L480,32 L540,60 L600,38
             L660,55 L720,30 L780,58 L840,34 L900,56 L960,30 L1020,52 L1080,36 L1140,58
             L1200,32 L1260,54 L1320,30 L1380,56 L1440,38 L1440,120 L0,120 Z"
          fill="url(#burnGrad)"
        />
        <path
          d="M0,40 L60,55 L120,30 L180,60 L240,35 L300,58 L360,28 L420,52 L480,32 L540,60 L600,38
             L660,55 L720,30 L780,58 L840,34 L900,56 L960,30 L1020,52 L1080,36 L1140,58
             L1200,32 L1260,54 L1320,30 L1380,56 L1440,38"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          opacity="0.8"
        />
        <defs>
          <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>
        </defs>
      </svg>

      {/* Flames sitting on the charred line */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 translate-y-1/3">
        {FLAMES.map((f, i) => (
          <div key={i} style={{ animationDelay: f.delay }} className="animate-flame-flicker">
            <FlameShape size={f.size} />
          </div>
        ))}
      </div>

      {/* Embers rising from the burn line into the section above */}
      <EmberField className="!inset-x-0 !-top-full !h-full" />
    </div>
  )
}

const SPROUTS = [
  { left: '8%', size: 30, delay: '0s' },
  { left: '20%', size: 22, delay: '0.3s' },
  { left: '33%', size: 36, delay: '0.6s' },
  { left: '46%', size: 26, delay: '0.15s' },
  { left: '58%', size: 32, delay: '0.45s' },
  { left: '70%', size: 24, delay: '0.7s' },
  { left: '82%', size: 34, delay: '0.25s' },
  { left: '92%', size: 24, delay: '0.55s' },
]

/**
 * The mirror image of BurnDivider — a charred edge fading back into green,
 * with small sprouts growing upward. Used to transition the page back from
 * the "burning" half toward hope: scorched ground can regrow, and that's
 * the entire premise of the product.
 */
export function RegrowthDivider() {
  return (
    <div className="relative h-28 sm:h-36 w-full overflow-visible" aria-hidden="true">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ transform: 'scaleY(-1)' }}
      >
        <path
          d="M0,40 L60,55 L120,30 L180,60 L240,35 L300,58 L360,28 L420,52 L480,32 L540,60 L600,38
             L660,55 L720,30 L780,58 L840,34 L900,56 L960,30 L1020,52 L1080,36 L1140,58
             L1200,32 L1260,54 L1320,30 L1380,56 L1440,38 L1440,120 L0,120 Z"
          fill="url(#regrowGrad)"
        />
        <path
          d="M0,40 L60,55 L120,30 L180,60 L240,35 L300,58 L360,28 L420,52 L480,32 L540,60 L600,38
             L660,55 L720,30 L780,58 L840,34 L900,56 L960,30 L1020,52 L1080,36 L1140,58
             L1200,32 L1260,54 L1320,30 L1380,56 L1440,38"
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          opacity="0.8"
        />
        <defs>
          <linearGradient id="regrowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#022c22" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Sprouts growing up from the regrown edge */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 translate-y-1/4">
        {SPROUTS.map((s, i) => (
          <div key={i} className="animate-vine-grow" style={{ animationDelay: s.delay }}>
            <LeafShape size={s.size} color={i % 2 === 0 ? '#4ade80' : '#86efac'} pathIndex={(i % 3) as 0 | 1 | 2} />
          </div>
        ))}
      </div>

      <FallingLeaves className="!inset-x-0 !top-0 !h-full" />
    </div>
  )
}

// ───────────────────────────── Section wrapper ─────────────────────────────

/**
 * Wraps a section in the "burning" half of the page: a dark, ember-lit
 * background with rising smoke and embers behind the content.
 */
export function BurningBackdrop({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950', className)}>
      <SmokeLayer />
      <EmberField />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/**
 * Wraps a section in the "living" half of the page: a soft green gradient
 * with a leafy canopy frame and falling leaves behind the content.
 */
export function LeafyBackdrop({ children, className, canopy = true }: { children: React.ReactNode; className?: string; canopy?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50/60', className)}>
      {canopy && <CanopyFrame side="both" />}
      <FallingLeaves />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
