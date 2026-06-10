/**
 * Unit tests — lib/analysis/energy-engine.ts
 *
 * Coverage:
 *   runEnergyEngine  — happy path, field presence, numeric sanity
 *   Carbon score     — always in [8, 97], older buildings score higher
 *   Determinism      — same input always produces identical output
 *   Input clamping   — extreme floor area / build year are clamped gracefully
 *   Building types   — residential, office, warehouse all produce valid results
 *   HVAC age         — install year degrades efficiency correctly
 *   Roadmap          — at least one item; cost and co2_saving are positive
 *   Problem areas    — each has required fields; severity is valid enum value
 *   Contractor brief — non-empty string
 */

import { runEnergyEngine } from '../lib/analysis/energy-engine'
import type { AuditInput } from '../lib/analysis/energy-engine'
import { scoreToGrade } from '../lib/utils'

// ─── Shared fixture ───────────────────────────────────────────────────────────

const BASE_INPUT: AuditInput = {
  auditId:        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  buildingType:   'residential',
  buildYear:      1990,
  floorArea:      150,
  location:       'Chennai',
  hvacType:       'split_ac',
  hvacInstallYear: 2015,
}

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('runEnergyEngine — happy path', () => {
  let result: ReturnType<typeof runEnergyEngine>

  beforeAll(() => {
    result = runEnergyEngine(BASE_INPUT)
  })

  it('returns a result object', () => {
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  it('carbonScore is in [8, 97]', () => {
    expect(result.carbonScore).toBeGreaterThanOrEqual(8)
    expect(result.carbonScore).toBeLessThanOrEqual(97)
  })

  it('grade (derived via scoreToGrade) is one of A–F', () => {
    const grade = scoreToGrade(100 - result.carbonScore)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(grade)
  })

  it('annualCo2Kg is a positive number', () => {
    expect(result.annualCo2Kg).toBeGreaterThan(0)
  })

  it('estimatedAnnualCost is a positive number', () => {
    expect(result.estimatedAnnualCost).toBeGreaterThan(0)
  })

  it('potentialSavingsPct is between 0 and 100', () => {
    expect(result.potentialSavingsPct).toBeGreaterThanOrEqual(0)
    expect(result.potentialSavingsPct).toBeLessThanOrEqual(100)
  })

  it('energyBreakdown sums to ~100%', () => {
    const total = result.energyBreakdown.reduce((s, b) => s + b.percentage, 0)
    expect(total).toBeGreaterThanOrEqual(95)
    expect(total).toBeLessThanOrEqual(105)
  })

  it('contractorBrief is a non-empty string', () => {
    expect(typeof result.contractorBrief).toBe('string')
    expect(result.contractorBrief.length).toBeGreaterThan(50)
  })
})

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('runEnergyEngine — determinism', () => {
  it('produces identical results for identical inputs', () => {
    const a = runEnergyEngine(BASE_INPUT)
    const b = runEnergyEngine(BASE_INPUT)
    expect(a.carbonScore).toBe(b.carbonScore)
    expect(a.annualCo2Kg).toBe(b.annualCo2Kg)
    expect(a.estimatedAnnualCost).toBe(b.estimatedAnnualCost)
  })

  it('different auditId produces the same score (seed only affects jitter)', () => {
    const a = runEnergyEngine({ ...BASE_INPUT, auditId: 'aaaa-1111-aaaa-1111-aaaaaaaaaaaa' })
    const b = runEnergyEngine({ ...BASE_INPUT, auditId: 'bbbb-2222-bbbb-2222-bbbbbbbbbbbb' })
    // Score is purely physics-based — should be identical
    expect(a.carbonScore).toBe(b.carbonScore)
  })
})

// ─── Carbon score ordering ────────────────────────────────────────────────────

describe('runEnergyEngine — carbon score ordering', () => {
  it('older buildings score higher (worse) than newer ones', () => {
    const old  = runEnergyEngine({ ...BASE_INPUT, buildYear: 1950 })
    const new_ = runEnergyEngine({ ...BASE_INPUT, buildYear: 2020 })
    expect(old.carbonScore).toBeGreaterThan(new_.carbonScore)
  })

  it('larger buildings have higher absolute CO₂ than smaller ones', () => {
    const small = runEnergyEngine({ ...BASE_INPUT, floorArea: 50  })
    const large = runEnergyEngine({ ...BASE_INPUT, floorArea: 500 })
    expect(large.annualCo2Kg).toBeGreaterThan(small.annualCo2Kg)
  })
})

// ─── Input clamping ───────────────────────────────────────────────────────────

describe('runEnergyEngine — input clamping', () => {
  it('does not throw for a very old build year (pre-1900)', () => {
    expect(() =>
      runEnergyEngine({ ...BASE_INPUT, buildYear: 1800 })
    ).not.toThrow()
  })

  it('does not throw for a future build year', () => {
    expect(() =>
      runEnergyEngine({ ...BASE_INPUT, buildYear: new Date().getFullYear() + 5 })
    ).not.toThrow()
  })

  it('does not throw for a tiny floor area (1 m²)', () => {
    expect(() =>
      runEnergyEngine({ ...BASE_INPUT, floorArea: 1 })
    ).not.toThrow()
  })

  it('does not throw for a massive floor area (200,000 m²)', () => {
    expect(() =>
      runEnergyEngine({ ...BASE_INPUT, floorArea: 200_000 })
    ).not.toThrow()
  })

  it('returns a valid score even when all fields are edge-case values', () => {
    const result = runEnergyEngine({
      auditId:      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      buildingType: 'office',
      buildYear:    1800,
      floorArea:    1,
      location:     'Unknown City',
      hvacType:     'none',
    })
    expect(result.carbonScore).toBeGreaterThanOrEqual(8)
    expect(result.carbonScore).toBeLessThanOrEqual(97)
  })
})

// ─── Building types ───────────────────────────────────────────────────────────

describe('runEnergyEngine — building types', () => {
  const TYPES = ['residential', 'apartment', 'office', 'retail', 'warehouse', 'school']

  TYPES.forEach(buildingType => {
    it(`produces valid results for type: ${buildingType}`, () => {
      const result = runEnergyEngine({ ...BASE_INPUT, buildingType })
      expect(result.carbonScore).toBeGreaterThanOrEqual(8)
      expect(result.carbonScore).toBeLessThanOrEqual(97)
      expect(result.annualCo2Kg).toBeGreaterThan(0)
    })
  })
})

// ─── HVAC types ───────────────────────────────────────────────────────────────

describe('runEnergyEngine — HVAC types', () => {
  const HVAC_TYPES = ['split_ac', 'central_ac', 'heat_pump', 'gas_boiler', 'district', 'none']

  HVAC_TYPES.forEach(hvacType => {
    it(`produces valid results for hvacType: ${hvacType}`, () => {
      const result = runEnergyEngine({ ...BASE_INPUT, hvacType })
      expect(result.carbonScore).toBeGreaterThanOrEqual(8)
      expect(result.annualCo2Kg).toBeGreaterThan(0)
    })
  })

  it('null hvacInstallYear falls back gracefully', () => {
    expect(() =>
      runEnergyEngine({ ...BASE_INPUT, hvacInstallYear: null })
    ).not.toThrow()
  })

  it('older HVAC increases carbon score vs newer HVAC', () => {
    const old  = runEnergyEngine({ ...BASE_INPUT, hvacInstallYear: 2000 })
    const new_ = runEnergyEngine({ ...BASE_INPUT, hvacInstallYear: 2023 })
    // older equipment is less efficient → higher or equal score
    expect(old.carbonScore).toBeGreaterThanOrEqual(new_.carbonScore)
  })
})

// ─── Problem areas ────────────────────────────────────────────────────────────

describe('runEnergyEngine — problem areas', () => {
  const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical']

  it('returns an array', () => {
    const { problemAreas } = runEnergyEngine(BASE_INPUT)
    expect(Array.isArray(problemAreas)).toBe(true)
  })

  it('every problem area has required fields', () => {
    const { problemAreas } = runEnergyEngine(BASE_INPUT)
    for (const area of problemAreas) {
      expect(typeof area.title).toBe('string')
      expect(area.title.length).toBeGreaterThan(0)
      expect(typeof area.description).toBe('string')
      expect(VALID_SEVERITIES).toContain(area.severity)
      expect(typeof area.estimatedLossKwh).toBe('number')
      expect(area.fixCostRange.min).toBeGreaterThanOrEqual(0)
      expect(area.fixCostRange.max).toBeGreaterThanOrEqual(area.fixCostRange.min)
      expect(typeof area.location).toBe('string')
    }
  })

  it('old building has at least one problem area', () => {
    const { problemAreas } = runEnergyEngine({ ...BASE_INPUT, buildYear: 1950 })
    expect(problemAreas.length).toBeGreaterThan(0)
  })
})

// ─── Roadmap ──────────────────────────────────────────────────────────────────

describe('runEnergyEngine — roadmap', () => {
  it('returns at least one roadmap item', () => {
    const { roadmapItems } = runEnergyEngine(BASE_INPUT)
    expect(roadmapItems.length).toBeGreaterThan(0)
  })

  it('every roadmap item has required fields', () => {
    const { roadmapItems } = runEnergyEngine(BASE_INPUT)
    for (const item of roadmapItems) {
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.costRange.min).toBeGreaterThanOrEqual(0)
      expect(item.costRange.max).toBeGreaterThanOrEqual(item.costRange.min)
      expect(item.co2SavingKg).toBeGreaterThanOrEqual(0)
      expect(['quick', 'medium', 'major']).toContain(item.effort)
    }
  })

  it('items are ordered by descending priority (highest priority first)', () => {
    const { roadmapItems } = runEnergyEngine(BASE_INPUT)
    if (roadmapItems.length > 1) {
      expect(roadmapItems[0].priority).toBeGreaterThanOrEqual(roadmapItems[1].priority)
    }
  })
})

// ─── Energy breakdown ─────────────────────────────────────────────────────────

describe('runEnergyEngine — energyBreakdown', () => {
  it('every breakdown entry has a positive percent', () => {
    const { energyBreakdown } = runEnergyEngine(BASE_INPUT)
    for (const entry of energyBreakdown) {
      expect(entry.percentage).toBeGreaterThan(0)
      expect(typeof entry.category).toBe('string')
    }
  })

  it('no single category exceeds 100%', () => {
    const { energyBreakdown } = runEnergyEngine(BASE_INPUT)
    for (const entry of energyBreakdown) {
      expect(entry.percentage).toBeLessThanOrEqual(100)
    }
  })
})
