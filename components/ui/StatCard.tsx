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
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
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
        'rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex items-start gap-4',
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
        <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 leading-tight">
          {value}
          {unit && (
            <span className="ml-1 text-base font-medium text-slate-400">{unit}</span>
          )}
        </p>
        {delta && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              delta.positive ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {delta.positive ? '↓' : '↑'} {delta.value}
          </p>
        )}
      </div>
    </div>
  );
}
