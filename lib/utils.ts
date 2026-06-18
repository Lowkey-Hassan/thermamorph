import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function scoreToColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 45) return 'text-amber-600';
  return 'text-red-600';
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Validate a post-login/auth redirect target.
 *
 * Only same-origin, relative paths are allowed (must start with a single
 * `/`, never `//` or `/\` which browsers treat as protocol-relative URLs).
 * Falls back to `fallback` for anything else, preventing open-redirect
 * attacks via crafted `?next=` query parameters.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
