/**
 * Unit tests — lib/utils.ts
 *
 * Coverage:
 *   cn             — merges class names, dedupes conflicting Tailwind utilities
 *   formatNumber   — locale formatting with configurable decimal places
 *   formatCurrency — USD currency formatting, no decimals
 *   scoreToGrade   — A/B/C/D/F boundaries at 90/75/60/45
 *   scoreToColor   — emerald/amber/red boundaries at 70/45
 *   truncate       — string truncation with ellipsis, edge cases at exact length
 *   safeRedirectPath — only same-origin relative paths pass through, else fallback
 */

import { cn, formatNumber, formatCurrency, scoreToGrade, scoreToColor, truncate, safeRedirectPath } from '../lib/utils'

describe('cn', () => {
  it('joins simple class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz')
  })

  it('dedupes conflicting Tailwind utilities, keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('merges arrays and objects via clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })
})

describe('formatNumber', () => {
  it('formats with thousands separators and no decimals by default', () => {
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('rounds to the requested number of decimals', () => {
    expect(formatNumber(1234.5)).toBe('1,235')
  })

  it('respects an explicit decimals argument', () => {
    expect(formatNumber(1234.5, 1)).toBe('1,234.5')
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatCurrency', () => {
  it('formats whole-dollar amounts with a $ prefix and no decimals', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('rounds fractional amounts to the nearest dollar', () => {
    expect(formatCurrency(1234.5)).toBe('$1,235')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('scoreToGrade', () => {
  it('returns A for scores >= 90', () => {
    expect(scoreToGrade(100)).toBe('A')
    expect(scoreToGrade(90)).toBe('A')
  })

  it('returns B for scores in [75, 90)', () => {
    expect(scoreToGrade(89.99)).toBe('B')
    expect(scoreToGrade(75)).toBe('B')
  })

  it('returns C for scores in [60, 75)', () => {
    expect(scoreToGrade(74.99)).toBe('C')
    expect(scoreToGrade(60)).toBe('C')
  })

  it('returns D for scores in [45, 60)', () => {
    expect(scoreToGrade(59.99)).toBe('D')
    expect(scoreToGrade(45)).toBe('D')
  })

  it('returns F for scores below 45', () => {
    expect(scoreToGrade(44.99)).toBe('F')
    expect(scoreToGrade(0)).toBe('F')
  })
})

describe('scoreToColor', () => {
  it('returns emerald for scores >= 70', () => {
    expect(scoreToColor(100)).toBe('text-emerald-600')
    expect(scoreToColor(70)).toBe('text-emerald-600')
  })

  it('returns amber for scores in [45, 70)', () => {
    expect(scoreToColor(69.99)).toBe('text-amber-600')
    expect(scoreToColor(45)).toBe('text-amber-600')
  })

  it('returns red for scores below 45', () => {
    expect(scoreToColor(44.99)).toBe('text-red-600')
    expect(scoreToColor(0)).toBe('text-red-600')
  })
})

describe('truncate', () => {
  it('returns the original string when shorter than the limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns the original string when exactly at the limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and appends an ellipsis when longer than the limit', () => {
    expect(truncate('hello world', 5)).toBe