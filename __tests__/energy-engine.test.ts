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
 *   Vision insights  — applyVisionOverrides adjusts severities/descriptions; skipped when confidence is 'none'
 */

import { runEnergyEngine } from '../lib/analysis/energy-engine'
import type { AuditInput } from '../lib/analysis/energy-engine'
import type { VisionInsights } from '../lib/analysis/hf-vision'
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

// ─── Vision insights overrides ────────────────────────────────────────────────

function findArea(problemAreas: ReturnType<typeof runEnergyEngine>['problemAreas'], id: string) {
  const area = problemAreas.find((p) => p.id === id)
  expect(area).toBeDefined()
  return area!
}

const OLD_BUILDING_INPUT: AuditInput = {
  ...BASE_INPUT,
  buildYear: 1975,
  hvacInstallYear: 2015,
}

const NEWER_BUILDING_INPUT: AuditInput = {
  ...BASE_INPUT,
  buildYear: 1995,
  hvacInstallYear: 2015,
}

describe('runEnergyEngine — vision insights overrides', () => {
  it('skips applyVisionOverrides entirely when confidence is "none"', () => {
    const noVision = runEnergyEngine(OLD_BUILDING_INPUT)
    const withNoneVision = runEnergyEngine({
      ...OLD_BUILDING_INPUT,
      visionInsights: {
        hasOldWindows: true,
        hasSinglePaneWindows: true,
        hasOldAcUnit: true,
        hasDirtyEquipment: true,
        hasFluorescentLighting: true,
        hasOldLighting: true,
        hasRoofDamage: true,
        hasCracks: true,
        hasMould: true,
        hasGoodInsulation: true,
        rawCaptions: [],
        imagesAnalyzed: 0,
        confidence: 'none',
        skippedReason: 'no usable images',
      },
    })

    const before = findArea(noVision.problemAreas, 'pa-windows')
    const after = findArea(withNoneVision.problemAreas, 'pa-windows')
    expect(after.severity).toBe(before.severity)
    expect(after.description).toBe(before.description)
  })

  it('elevates severities and appends evidence for high-confidence findings', () => {
    const vi: VisionInsights = {
      hasOldWindows: false,
      hasSinglePaneWindows: true,
      hasOldAcUnit: true,
      hasDirtyEquipment: true,
      hasFluorescentLighting: true,
      hasOldLighting: false,
      hasRoofDamage: true,
      hasCracks: true,
      hasMould: true,
      hasGoodInsulation: false,
      rawCaptions: ['single-pane glass visible', 'cracked exterior wall', 'roof damage visible'],
      imagesAnalyzed: 3,
      confidence: 'high',
    }

    const baseline = runEnergyEngine(OLD_BUILDING_INPUT)
    const { problemAreas } = runEnergyEngine({ ...OLD_BUILDING_INPUT, visionInsights: vi })

    // Single-pane windows photographic evidence escalates to critical.
    expect(findArea(problemAreas, 'pa-windows').severity).toBe('critical')

    // Roof damage escalates to critical.
    expect(findArea(problemAreas, 'pa-roof').severity).toBe('critical')

    // Cracks escalate the wall problem area to high and append evidence.
    const walls = findArea(problemAreas, 'pa-walls')
    expect(walls.severity).toBe('high')
    expect(walls.description).toContain('cracks')

    // Old AC unit escalates medium HVAC severity to high; dirty equipment
    // appends servicing guidance and increases the estimated loss.
    const hvac = findArea(problemAreas, 'pa-hvac')
    const baselineHvac = findArea(baseline.problemAreas, 'pa-hvac')
    expect(hvac.severity).toBe('high')
    expect(hvac.description).toContain('dirty filters or fouled coils')
    expect(hvac.estimatedLossKwh).toBeGreaterThan(baselineHvac.estimatedLossKwh)

    // Cracks + mould escalate infiltration severity and note moisture ingress.
    const infiltration = findArea(problemAreas, 'pa-infiltration')
    expect(infiltration.severity).toBe('high')
    expect(infiltration.description).toContain('Mould detected')

    // Fluorescent lighting confirms the lighting problem area and appends evidence.
    const lighting = findArea(problemAreas, 'pa-lighting')
    expect(lighting.severity).toBe('medium')
    expect(lighting.description).toContain('Fluorescent tube fittings confirmed')
  })

  it('downgrades severity when photos show good insulation, and old-window evidence elevates a medium-severity window rating', () => {
    const vi: VisionInsights = {
      hasOldWindows: true,
      hasSinglePaneWindows: false,
      hasOldAcUnit: false,
      hasDirtyEquipment: false,
      hasFluorescentLighting: false,
      hasOldLighting: false,
      hasRoofDamage: false,
      hasCracks: false,
      hasMould: false,
      hasGoodInsulation: true,
      rawCaptions: ['double glazing visible', 'insulation visible in attic'],
      imagesAnalyzed: 2,
      confidence: 'low',
    }

    const { problemAreas } = runEnergyEngine({ ...NEWER_BUILDING_INPUT, visionInsights: vi })

    // Baseline windows severity is 'medium'; hasOldWindows bumps it to 'high',
    // then hasGoodInsulation downgrades 'high' back to 'medium' and prefixes
    // the description with a note about likely glazing upgrades.
    const windows = findArea(problemAreas, 'pa-windows')
    expect(windows.severity).toBe('medium')
    expect(windows.description).toContain('Photos suggest some glazing upgrades may already be present.')
  })
})

// ─── HVAC/lighting description edge cases ─────────────────────────────────────

describe('runEnergyEngine — HVAC/lighting description edge cases', () => {
  it('falls back to generic "HVAC system" wording when hvacType is empty, for an old unit', () => {
    const { problemAreas } = runEnergyEngine({
      ...BASE_INPUT,
      hvacType: '',
      buildYear: 1975,
      hvacInstallYear: 2010,
    })

    const hvac = findArea(problemAreas, 'pa-hvac')
    expect(hvac.severity).toBe('high')
    expect(hvac.description).toContain('The HVAC system')
    expect(hvac.description).toContain('years old')
  })

  it('omits the age clause and reports medium severity for a recently installed, inefficient HVAC type', () => {
    const { problemAreas, roadmapItems } = runEnergyEngine({
      ...BASE_INPUT,
      hvacType: 'window_ac',
      buildYear: 2010,
      hvacInstallYear: 2020,
    })

    const hvac = findArea(problemAreas, 'pa-hvac')
    expect(hvac.severity).toBe('medium')
    expect(hvac.title).toBe('HVAC System Below Optimal Efficiency')
    expect(hvac.description).not.toContain('years old')

    const hvacRoadmap = roadmapItems.find((r) => r.id === 'ri-hvac')
    expect(hvacRoadmap).toBeDefined()
    expect(hvacRoadmap!.description).toContain('window_ac')

    // A 2010 build is below the "medium" lighting cutoff (2015) but at/above
    // the "low" cutoff (2000), so lighting severity should be 'low'.
    const lighting = findArea(problemAreas, 'pa-lighting')
    expect(lighting.severity).toBe('low')
  })

  it('omits the install-year clause from the contractor brief when hvacInstallYear is not provided', () => {
    const { contractorBrief } = runEnergyEngine({ ...BASE_INPUT, hvacInstallYear: null })
    expect(contractorBrief).not.toContain('installed')
  })
})
