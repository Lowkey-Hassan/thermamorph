import { cloneElement, forwardRef, isValidElement, InputHTMLAttributes, ReactElement, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ─── Base styles ──────────────────────────────────────────────────────────────

const baseInput =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-white/[0.02] disabled:text-slate-600 disabled:cursor-not-allowed transition-colors';

// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm font-medium text-slate-300 mb-1.5', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, hint, className, htmlFor, children }: FieldProps) {
  // When there's an error and we know the field's id, link the input to its
  // error message via aria-describedby/aria-invalid so screen readers
  // announce it.
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const content =
    errorId && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          'aria-invalid': true,
          'aria-describedby': errorId,
        })
      : children;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {content}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, className, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          baseInput,
          icon && 'pl-9',
          error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
    </div>
  )
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, placeholder, options, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        baseInput,
        'appearance-none cursor-pointer',
        error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled className="bg-[#0f172a] text-slate-500">
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0f172a] text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = 'Select';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        baseInput,
        'min-h-[100px] resize-y',
        error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
