import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  accent?: 'emerald' | 'blue' | 'amber' | 'red' | 'slate';
}

const accentStyles = {
  emerald: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/10 text-amber-400',
  red: 'bg-red-500/10 text-red-400',
  slate: 'bg-white/5 text-slate-400',
};

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  accent = 'slate',
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/5 bg-white/[0.03] p-5 flex items-start gap-4',
        className
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            'shrink-0 rounded-lg p-2.5',
            accentStyles[accent]
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-400 truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white leading-tight">
          {value}
          {unit && (
            <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>
          )}
        </p>
        {delta && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              delta.positive ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {delta.positive ? '↓' : '↑'} {delta.value}
          </p>
        )}
      </div>
    </div>
  );
}
