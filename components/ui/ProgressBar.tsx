import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'yellow' | 'red' | 'blue' | 'slate';
  className?: string;
  animated?: boolean;
}

const trackHeight = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

const fillColor = {
  emerald: 'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'emerald',
  className,
  animated = false,
}: ProgressBarProps) {
  const pct = Math.round(Math.min(100, Math.max(0, (value / max) * 100)));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
          {showValue && <span className="text-sm text-slate-400">{pct}%</span>}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-white/10', trackHeight[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-500',
            trackHeight[size],
            fillColor[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

// ─── Score ring (circular) ───────────────────────────────────────────────────

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 10, label, className }: ScoreRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  // carbonScore is 0-100 where HIGHER = WORSE (more carbon-intensive), so the
  // "good" color band is at the low end of the scale.
  const color =
    score <= 35 ? '#10b981' : // emerald
    score <= 60 ? '#f59e0b' : // amber
    '#ef4444';                 // red

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
    </div>
  );
}
