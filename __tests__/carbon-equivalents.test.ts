/**
 * Unit tests — lib/analysis/carbon-equivalents.ts
 *
 * Coverage:
 *   Equivalence conversions — flights, tree-years, resident-years, car-km
 *   Lifetime ledger          — age clamping, cumulative totals
 *   Inheritance budget share — multiple calculation
 *   Carbon body state        — score-to-state thresholds + copy presence
 */

import {
  KG_CO2_PER_DOMESTIC_FLIGHT,
  KG_CO2_ABSORBED_PER_TREE_PER_YEAR,
  KG_CO2_PER_INDIAN_RESIDENT_PER_YEAR,
  KG_CO2_PER_CAR_KM,
  KG_CO2_PERSONAL_BUDGET_PER_YEAR,
  co2ToFlights,
  co2ToTreeYears,
  co2ToResidentYears,
  co2ToCarKm,
  calcLifetimeLedger,
  co2ToBudgetMultiple,
  carbonScoreToBodyState,
  CARBON_BODY_COPY,
} from '../lib/analysis/carbon-equivalents'

// ─── Equivalence conversions ───────────────────────────────────────────────

describe('co2ToFlights', () => {
  it('converts kg CO2 to a number of domestic flights', () => {
    expect(co2ToFlights(KG_CO2_PER_DOMESTIC_FLIGHT)).toBe(1)
    expect(co2ToFlights(KG_CO2_PER_DOMESTIC_FLIGHT * 10)).toBe(10)
  })

  it('returns 0 for 0 kg CO2', () => {
    expect(co2ToFlights(0)).toBe(0)
  })
})

describe('co2ToTreeYears', () => {
  it('converts kg CO2 to mature-tree-years needed to absorb it', () => {
    expect(co2ToTreeYears(KG_CO2_ABSORBED_PER_TREE_PER_YEAR)).toBe(1)
    expect(co2ToTreeYears(KG_CO2_ABSORBED_PER_TREE_PER_YEAR * 5)).toBe(5)
  })

  it('is positive for any positive CO2 input', () => {
    expect(co2ToTreeYears(1234)).toBeGreaterThan(0)
  })
})

describe('co2ToResidentYears', () => {
  it('converts kg CO2 to average-resident-years', () => {
    expect(co2ToResidentYears(KG_CO2_PER_INDIAN_RESIDENT_PER_YEAR)).toBe(1)
  })
})

describe('co2ToCarKm', () => {
  it('converts kg CO2 to km driven by an average car', () => {
    expect(co2ToCarKm(KG_CO2_PER_CAR_KM)).toBe(1)
    expect(co2ToCarKm(KG_CO2_PER_CAR_KM * 100)).toBeCloseTo(100)
  })
})

// ─── Lifetime ledger ────────────────────────────────────────────────────────

describe('calcLifetimeLedger', () => {
  it('multiplies annual CO2 by building age in years', () => {
    const ledger = calcLifetimeLedger(1000, 2016, 2026)
    expect(ledger.ageYears).toBe(10)
    expect(ledger.lifetimeCo2Kg).toBe(10000)
    expect(ledger.lifetimeCo2Tonnes).toBe(10)
  })

  it('clamps age to a minimum of 1 year for a brand-new building', () => {
    const ledger = calcLifetimeLedger(1000, 2026, 2026)
    expect(ledger.ageYears).toBe(1)
    expect(ledger.lifetimeCo2Kg).toBe(1000)
  })

  it('clamps age to a minimum of 1 year for a future build year', () => {
    const ledger = calcLifetimeLedger(1000, 2030, 2026)
    expect(ledger.ageYears).toBe(1)
  })

  it('defaults currentYear to the real current year when omitted', () => {
    const expectedAge = new Date().getFullYear() - 2010
    const ledger = calcLifetimeLedger(500, 2010)
    expect(ledger.ageYears).toBe(expectedAge)
  })
})

// ─── Inheritance — budget share ────────────────────────────────────────────

describe('co2ToBudgetMultiple', () => {
  it('returns 1 when annual CO2 equals the personal budget', () => {
    expect(co2ToBudgetMultiple(KG_CO2_PERSONAL_BUDGET_PER_YEAR)).toBe(1)
  })

  it('returns >1 when emissions exceed the personal budget', () => {
    expect(co2ToBudgetMultiple(KG_CO2_PERSONAL_BUDGET_PER_YEAR * 4.5)).toBeCloseTo(4.5)
  })

  it('returns <1 for very low-emission buildings', () => {
    expect(co2ToBudgetMultiple(KG_CO2_PERSONAL_BUDGET_PER_YEAR / 2)).toBeCloseTo(0.5)
  })
})

// ─── Carbon Body state ──────────────────────────────────────────────────────

describe('carbonScoreToBodyState', () => {
  it('maps low scores to "thriving"', () => {
    expect(carbonScoreToBodyState(0)).toBe('thriving')
    expect(carbonScoreToBodyState(29)).toBe('thriving')
  })

  it('maps mid-low scores to "strained"', () => {
    expect(carbonScoreToBodyState(30)).toBe('strained')
    expect(carbonScoreToBodyState(54)).toBe('strained')
  })

  it('maps mid-high scores to "distressed"', () => {
    expect(carbonScoreToBodyState(55)).toBe('distressed')
    expect(carbonScoreToBodyState(79)).toBe('distressed')
  })

  it('maps high scores to "critical"', () => {
    expect(carbonScoreToBodyState(80)).toBe('critical')
    expect(carbonScoreToBodyState(97)).toBe('critical')
  })

  it('has copy defined for every state', () => {
    const states = ['thriving', 'strained', 'distressed', 'critical'] as const
    for (const state of states) {
      expect(CARBON_BODY_COPY[state].label.length).toBeGreaterThan(0)
      expect(CARBON_BODY_COPY[state].description.length).toBeGreaterThan(0)
    }
  })
})
