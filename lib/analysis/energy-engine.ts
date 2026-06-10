/**
 * ThermaMorph Rule-Based Energy Calculation Engine
 *
 * Implements ASHRAE 90.1 / BRE BREDEM screening-level energy audit methodology.
 * Zero external API dependencies — all calculations are deterministic and testable.
 *
 * Key design decisions:
 *   - All magic numbers are named constants at the top of this file.
 *   - Results are fully deterministic for the same inputs (no Math.random).
 *   - calcEnvelopeLoss() is called once and results are reused.
 *   - Vision overrides are applied after all rule-based calculations.
 */

import {
  getEraKey,
  U_VALUES_BY_ERA,
  BEST_PRACTICE_U_VALUES,
  getHvacProfile,
  detectClimateZone,
  getBuildingTypeProfile,
  getCarbonIntensity,
  getEnergyCostPerKwh,
  RETROFIT_COSTS,
} from './knowledge-base'
import type { AnalysisResult, ProblemArea, RoadmapItem, EnergyBreakdown } from '@/lib/types'
import type { VisionInsights } from './hf-vision'

// ─── Named constants ──────────────────────────────────────────────────────────
// Replacing previously scattered magic numbers for readability and testability.

/** Average floor-to-ceiling height in metres used for volume estimates */
const AVG_CEILING_HEIGHT_M = 2.8

/** Window-to-wall ratio for a typical residential/commercial building */
const WINDOW_TO_WALL_RATIO = 0.25

/** Slight roof area uplift to account for slope / parapet */
const ROOF_AREA_FACTOR = 1.1

/** Typical door area in m² (two standard doors) */
const DOOR_AREA_M2 = 4

/** Infiltration heat-loss coefficient (0.33 Wh/m³K) */
const INFILTRATION_COEFF = 0.33

/** Reference degree-day composite for climate multiplier normalisation (Delhi ≈ 2750) */
const REFERENCE_DEGREE_DAYS = 2750

/** Climate multiplier floor and scaling factor */
const CLIMATE_MULT_BASE  = 0.7
const CLIMATE_MULT_SCALE = 0.3

/** Humidity multiplier floor and scaling factor */
const HUMIDITY_MULT_BASE  = 0.9
const HUMIDITY_MULT_SCALE = 0.1

/** Maximum HVAC age degradation cap (30%) */
const MAX_AGE_DEGRADATION = 0.30

/** Age degradation rate per year of HVAC age */
const AGE_DEGRADATION_RATE = 0.008

/** Carbon score bounds — prevents extreme 0 or 100 values */
const CARBON_SCORE_MIN = 8
const CARBON_SCORE_MAX = 97

/** Carbon score normalisation: best- and worst-case intensity multipliers */
const BEST_CASE_INTENSITY_FACTOR  = 0.60
const WORST_CASE_INTENSITY_FACTOR = 2.50

/** Window U-value thresholds triggering problem-area rules */
const WINDOW_U_MEDIUM   = 2.0
const WINDOW_U_HIGH     = 3.0
const WINDOW_U_CRITICAL = 4.0

/** Roof U-value thresholds */
const ROOF_U_MEDIUM   = 0.5
const ROOF_U_HIGH     = 0.8
const ROOF_U_CRITICAL = 1.2

/** Wall U-value thresholds */
const WALL_U_MEDIUM   = 0.6
const WALL_U_HIGH     = 1.5

/** HVAC multiplier above which an upgrade problem is flagged */
const HVAC_LOAD_MULT_THRESHOLD = 0.9

/** HVAC age (years) above which an age-based problem is flagged */
const HVAC_AGE_WARN_THRESHOLD = 10
const HVAC_AGE_CRIT_THRESHOLD = 15

/** Airtightness (ACH50) above which an infiltration problem is flagged */
const INFILTRATION_ACH50_THRESHOLD      = 5
const INFILTRATION_ACH50_HIGH_THRESHOLD = 10

/** Build year before which a lighting problem is flagged */
const LIGHTING_PROBLEM_YEAR_MEDIUM = 2015
const LIGHTING_PROBLEM_YEAR_LOW    = 2000

/** Maximum percentage of rooftop used for solar PV (footprint fraction) */
const SOLAR_ROOFTOP_FRACTION = 0.40
const SOLAR_ROOFTOP_MAX_M2   = 500
const SOLAR_PANEL_KW_PER_M2  = 0.15    // ~150 W/m² monocrystalline

/** Chart palette (same across engine and UI for consistency) */
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditInput {
  auditId: string
  buildingType: string
  buildYear: number
  /** Floor area in square metres */
  floorArea: number
  location: string
  hvacType: string
  /** Year the current HVAC was installed; falls back to buildYear if not provided */
  hvacInstallYear?: number | null
  /** Not used by the engine directly; present for API signature compatibility */
  imageUrls?: string[]
  /** Structured signals extracted from building photos via HF BLIP captioning */
  visionInsights?: VisionInsights | null
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

interface BuildingGeometry {
  wallArea: number
  netWallArea: number
  windowArea: number
  roofArea: number
  doorArea: number
}

/**
 * Estimate surface areas from floor area using typical aspect-ratio assumptions.
 * All dimensions are in m².
 */
function estimateGeometry(floorArea: number): BuildingGeometry {
  const perimeter  = Math.sqrt(floorArea) * 4
  const wallArea   = perimeter * AVG_CEILING_HEIGHT_M
  const windowArea = wallArea * WINDOW_TO_WALL_RATIO
  const roofArea   = floorArea * ROOF_AREA_FACTOR
  const doorArea   = DOOR_AREA_M2

  return { wallArea, netWallArea: wallArea - windowArea, windowArea, roofArea, doorArea }
}

// ─── Envelope heat-loss ──────────────────────────────────────────────────────

interface EnvelopeLossResult {
  totalKwh: number
  heatingKwh: number
  coolingKwh: number
  infiltrationKwh: number
}

/**
 * Steady-state envelope heat loss / gain (kWh/year).
 *
 * Formula: Q = U × A × ΔT × hours / 1000
 * Solar gain through glazing is approximated by a 1.8× multiplier (SHGC ~0.6 × 3).
 */
function calcEnvelopeLoss(
  floorArea: number,
  uValues: typeof U_VALUES_BY_ERA[string],
  climate: ReturnType<typeof detectClimateZone>
): EnvelopeLossResult {
  const g = estimateGeometry(floorArea)

  const heatingKwh =
    ((uValues.walls * g.netWallArea +
      uValues.roof  * g.roofArea +
      uValues.windows * g.windowArea +
      uValues.floor * floorArea +
      uValues.doors * g.doorArea) *
      climate.heatingDegreeDays * 24) / 1000

  const coolingKwh =
    ((uValues.walls * g.netWallArea +
      uValues.roof  * g.roofArea +
      uValues.windows * g.windowArea * 1.8 + // solar gain factor
      uValues.floor * floorArea) *
      climate.coolingDegreeDays * 24) / 1000

  const buildingVolume  = floorArea * AVG_CEILING_HEIGHT_M
  const infiltrationACH = uValues.airtightness / 20
  const infiltrationKwh =
    (INFILTRATION_COEFF * infiltrationACH * buildingVolume *
      (climate.heatingDegreeDays + climate.coolingDegreeDays * 0.5) * 24) / 1000

  return {
    totalKwh: heatingKwh + coolingKwh + infiltrationKwh,
    heatingKwh,
    coolingKwh,
    infiltrationKwh,
  }
}

// ─── Deterministic jitter ────────────────────────────────────────────────────

/**
 * Produce a stable integer in [min, max] derived from a string seed.
 *
 * Replaces Math.random() so that the same audit always produces the same
 * ROI estimate, making results reproducible and testable.
 * Uses a simple djb2-style hash.
 */
function stableJitter(seed: string, min: number, max: number): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i)
    h = h >>> 0 // keep unsigned 32-bit
  }
  return Math.round(min + (h / 0xffffffff) * (max - min))
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function runEnergyEngine(input: AuditInput): AnalysisResult {
  const currentYear = new Date().getFullYear()

  // Clamp inputs to physically plausible ranges
  const buildYear  = Math.max(1900, Math.min(currentYear, input.buildYear))
  const floorArea  = Math.max(20, Math.min(50_000, input.floorArea))

  // Building age drives envelope era; HVAC age drives equipment degradation
  const hvacInstallYear = input.hvacInstallYear
    ? Math.max(1970, Math.min(currentYear, input.hvacInstallYear))
    : buildYear
  const hvacAge = currentYear - hvacInstallYear

  const era            = getEraKey(buildYear)
  const uValues        = U_VALUES_BY_ERA[era]
  const hvac           = getHvacProfile(input.hvacType)
  const climate        = detectClimateZone(input.location)
  const buildingProfile = getBuildingTypeProfile(input.buildingType)
  const carbonIntensity = getCarbonIntensity(input.location)
  const energyCostPerKwh = getEnergyCostPerKwh(input.location, input.buildingType)

  // ── 1. Envelope loss — calculated once, reused throughout ────────────────
  const envelope     = calcEnvelopeLoss(floorArea, uValues, climate)
  const bestEnvelope = calcEnvelopeLoss(floorArea, BEST_PRACTICE_U_VALUES, climate)
  const envelopePenalty = Math.max(0, (envelope.totalKwh - bestEnvelope.totalKwh) / floorArea)

  // ── 2. Composite energy intensity (kWh/m²/year) ─────────────────────────
  const localDD         = climate.heatingDegreeDays + climate.coolingDegreeDays
  const climateMultiplier  = CLIMATE_MULT_BASE + CLIMATE_MULT_SCALE * (localDD / REFERENCE_DEGREE_DAYS)
  const humidityMultiplier = HUMIDITY_MULT_BASE + HUMIDITY_MULT_SCALE * climate.humidityFactor
  const ageDegradation     = Math.min(MAX_AGE_DEGRADATION, hvacAge * AGE_DEGRADATION_RATE)

  const adjustedIntensity =
    buildingProfile.baseEnergyIntensity *
    climateMultiplier *
    humidityMultiplier *
    hvac.baseLoadMultiplier *
    (1 + ageDegradation) +
    envelopePenalty

  const annualEnergyKwh = Math.round(adjustedIntensity * floorArea)

  // ── 3. Carbon & cost ─────────────────────────────────────────────────────
  const annualCo2Kg          = Math.round(annualEnergyKwh * carbonIntensity)
  const estimatedAnnualCost  = Math.round(annualEnergyKwh * energyCostPerKwh)

  // ── 4. Carbon score (0–100, higher = worse) ──────────────────────────────
  const baseIntensity      = buildingProfile.baseEnergyIntensity
  const bestCaseIntensity  = baseIntensity * BEST_CASE_INTENSITY_FACTOR
  const worstCaseIntensity = baseIntensity * WORST_CASE_INTENSITY_FACTOR
  const rawScore = (adjustedIntensity - bestCaseIntensity) / (worstCaseIntensity - bestCaseIntensity)
  const carbonScore = Math.max(CARBON_SCORE_MIN, Math.min(CARBON_SCORE_MAX, Math.round(rawScore * 100)))

  // ── 5. Potential savings ─────────────────────────────────────────────────
  const potentialSavingsPct = Math.max(10, Math.min(65, Math.round(15 + (carbonScore - 15) * 0.6)))

  // ── 6. Energy breakdown ──────────────────────────────────────────────────
  const breakdownRaw: Record<string, number> = {
    'Heating & Cooling':     buildingProfile.hvacFraction * humidityMultiplier * hvac.baseLoadMultiplier,
    'Lighting':              buildingProfile.lightingFraction,
    'Hot Water':             buildingProfile.hotWaterFraction,
    'Appliances & Equipment': buildingProfile.appliancesFraction,
    'Ventilation':           buildingProfile.ventilationFraction,
  }
  const totalFrac = Object.values(breakdownRaw).reduce((a, b) => a + b, 0)

  const energyBreakdown: EnergyBreakdown[] = Object.entries(breakdownRaw).map(
    ([category, frac], i) => ({
      id:         `eb-${i}`,
      category,
      kwhPerYear: Math.round(annualEnergyKwh * (frac / totalFrac)),
      percentage: Math.round((frac / totalFrac) * 100),
      color:      CHART_COLORS[i % CHART_COLORS.length],
    })
  )

  // ── 7. Problem areas ─────────────────────────────────────────────────────
  const problemAreas = buildProblemAreas({
    input, uValues, hvac, hvacAge, climate, buildingProfile,
    annualEnergyKwh, annualCo2Kg, floorArea, envelope,
  })

  // Apply vision overrides (upgrades severity when photo evidence confirms an issue)
  if (input.visionInsights && input.visionInsights.confidence !== 'none') {
    applyVisionOverrides(problemAreas, input.visionInsights)
  }

  // Sort by estimated energy loss, keep top 6
  problemAreas.sort((a, b) => b.estimatedLossKwh - a.estimatedLossKwh)
  const topProblemAreas = problemAreas.slice(0, 6)

  // ── 8. Decarbonisation roadmap ───────────────────────────────────────────
  const roadmapItems = buildRoadmap({
    input, uValues, hvac, climate, buildingProfile,
    annualEnergyKwh, annualCo2Kg, floorArea,
  })
  roadmapItems.sort((a, b) => b.priority - a.priority)

  // ── 9. Contractor brief ──────────────────────────────────────────────────
  const contractorBrief = generateContractorBrief(input, hvacAge, {
    carbonScore, annualEnergyKwh, annualCo2Kg,
    estimatedAnnualCost, potentialSavingsPct,
    problemAreas: topProblemAreas, roadmapItems, climate,
  })

  return {
    auditId: input.auditId,
    carbonScore,
    annualCo2Kg,
    annualEnergyKwh,
    estimatedAnnualCost,
    potentialSavingsPct,
    problemAreas: topProblemAreas,
    energyBreakdown,
    roadmapItems,
    contractorBrief,
    generatedAt: new Date().toISOString(),
  }
}

// ─── Problem area builder ────────────────────────────────────────────────────

interface ProblemAreaContext {
  input: AuditInput
  uValues: typeof U_VALUES_BY_ERA[string]
  hvac: ReturnType<typeof getHvacProfile>
  hvacAge: number
  climate: ReturnType<typeof detectClimateZone>
  buildingProfile: ReturnType<typeof getBuildingTypeProfile>
  annualEnergyKwh: number
  annualCo2Kg: number
  floorArea: number
  envelope: EnvelopeLossResult
}

function buildProblemAreas(ctx: ProblemAreaContext): ProblemArea[] {
  const {
    input, uValues, hvac, hvacAge, climate, buildingProfile,
    annualEnergyKwh, floorArea,
  } = ctx

  const g      = estimateGeometry(floorArea)
  const hvacKwh = annualEnergyKwh * buildingProfile.hvacFraction
  const areas: ProblemArea[] = []

  // Window glazing
  if (uValues.windows > WINDOW_U_MEDIUM) {
    const penaltyKwh = Math.round(
      (uValues.windows - BEST_PRACTICE_U_VALUES.windows) / uValues.windows * hvacKwh * 0.35
    )
    const severity: ProblemArea['severity'] =
      uValues.windows > WINDOW_U_CRITICAL ? 'critical' :
      uValues.windows > WINDOW_U_HIGH     ? 'high'     : 'medium'

    areas.push({
      id: 'pa-windows',
      title: uValues.windows > WINDOW_U_CRITICAL
        ? 'Single-Glazed Windows — Critical Heat Gain/Loss'
        : 'Inadequate Window Glazing',
      description:
        `Windows have a U-value of ~${uValues.windows} W/m²K, above the ` +
        `${BEST_PRACTICE_U_VALUES.windows} W/m²K best-practice target. ` +
        `Significant heat transfer through the ~${Math.round(g.windowArea)} m² of glazing ` +
        `drives up both heating and cooling loads. Frame seals on this era of construction ` +
        `are also typically degraded.`,
      severity,
      estimatedLossKwh: Math.max(100, penaltyKwh),
      fixCostRange: {
        min: Math.round(g.windowArea * RETROFIT_COSTS.doubleGlazing.minPerM2),
        max: Math.round(g.windowArea * RETROFIT_COSTS.doubleGlazing.maxPerM2),
      },
      location: 'All external windows and glazed openings',
    })
  }

  // Roof/ceiling insulation
  if (uValues.roof > ROOF_U_MEDIUM) {
    const penaltyKwh = Math.round(
      (uValues.roof - BEST_PRACTICE_U_VALUES.roof) / uValues.roof * hvacKwh * 0.25
    )
    const severity: ProblemArea['severity'] =
      uValues.roof > ROOF_U_CRITICAL ? 'critical' :
      uValues.roof > ROOF_U_HIGH     ? 'high'     : 'medium'

    areas.push({
      id: 'pa-roof',
      title: 'Poor Roof/Ceiling Insulation',
      description:
        `Roof U-value of ~${uValues.roof} W/m²K vs the ${BEST_PRACTICE_U_VALUES.roof} W/m²K standard. ` +
        `In hot climates the roof is the largest source of heat gain — solar radiation heats ` +
        `the surface to 60–70°C. Insufficient insulation also promotes condensation in humid climates.`,
      severity,
      estimatedLossKwh: Math.max(80, penaltyKwh),
      fixCostRange: {
        min: Math.round(g.roofArea * RETROFIT_COSTS.roofInsulation.minPerM2),
        max: Math.round(g.roofArea * RETROFIT_COSTS.roofInsulation.maxPerM2),
      },
      location: 'Roof and ceiling cavity',
    })
  }

  // Wall insulation
  if (uValues.walls > WALL_U_MEDIUM) {
    const penaltyKwh = Math.round(
      (uValues.walls - BEST_PRACTICE_U_VALUES.walls) / uValues.walls * hvacKwh * 0.20
    )
    const severity: ProblemArea['severity'] = uValues.walls > WALL_U_HIGH ? 'high' : 'medium'
    const wallReplaceArea = Math.round(g.wallArea * 0.75)

    areas.push({
      id: 'pa-walls',
      title: 'Under-Insulated External Walls',
      description:
        `External wall U-value of ~${uValues.walls} W/m²K. Walls from this era typically lack ` +
        `cavity insulation, conducting heat readily. Thermal bridges at columns and slab edges ` +
        `further reduce effective performance and can cause localised condensation.`,
      severity,
      estimatedLossKwh: Math.max(60, penaltyKwh),
      fixCostRange: {
        min: Math.round(wallReplaceArea * RETROFIT_COSTS.wallInsulation.minPerM2),
        max: Math.round(wallReplaceArea * RETROFIT_COSTS.wallInsulation.maxPerM2),
      },
      location: 'External walls and thermal bridges',
    })
  }

  // HVAC efficiency / age
  if (hvac.baseLoadMultiplier > HVAC_LOAD_MULT_THRESHOLD || hvacAge > HVAC_AGE_WARN_THRESHOLD) {
    const penaltyKwh = Math.round(
      (hvac.baseLoadMultiplier - 0.65) / hvac.baseLoadMultiplier * hvacKwh
    )
    const severity: ProblemArea['severity'] =
      hvac.baseLoadMultiplier > 1.2 || hvacAge > HVAC_AGE_CRIT_THRESHOLD ? 'high' : 'medium'
    const numUnits = Math.max(1, Math.round(floorArea / 30))

    areas.push({
      id: 'pa-hvac',
      title: hvacAge > HVAC_AGE_CRIT_THRESHOLD
        ? 'Ageing HVAC Equipment — Low Efficiency'
        : 'HVAC System Below Optimal Efficiency',
      description:
        `The ${input.hvacType || 'HVAC'} system ` +
        (hvacAge > HVAC_AGE_WARN_THRESHOLD ? `is approximately ${hvacAge} years old and ` : '') +
        `operates below the efficiency of current 5-star BEE-rated equipment. ` +
        `Modern inverter units achieve COP 4.0–5.0 vs the estimated ${hvac.coolingCOP.toFixed(1)} ` +
        `of the current system. Dirty filters and coil fouling add further penalties.`,
      severity,
      estimatedLossKwh: Math.max(100, Math.abs(penaltyKwh)),
      fixCostRange: {
        min: numUnits * RETROFIT_COSTS.splitAcUpgrade.minEach,
        max: numUnits * RETROFIT_COSTS.splitAcUpgrade.maxEach,
      },
      location: 'Mechanical plant room and indoor units',
    })
  }

  // Air infiltration
  if (uValues.airtightness > INFILTRATION_ACH50_THRESHOLD) {
    const buildingVolume = floorArea * AVG_CEILING_HEIGHT_M
    const infiltrationKwh = Math.round(
      uValues.airtightness / 3 * buildingVolume * INFILTRATION_COEFF * 24 *
      (climate.coolingDegreeDays * 0.4 + climate.heatingDegreeDays * 0.6) / 1000
    )
    const openings = Math.max(4, Math.round(Math.sqrt(floorArea) * 0.5))

    areas.push({
      id: 'pa-infiltration',
      title: 'Excessive Air Infiltration & Leakage',
      description:
        `Estimated leakage of ~${uValues.airtightness} ACH₅₀ indicates significant gaps ` +
        `around window frames, door thresholds, and service penetrations. Each air change ` +
        `removes conditioned air and draws in hot/humid outside air, increasing HVAC runtime. ` +
        `In humid climates, infiltration also introduces moisture that can cause mould.`,
      severity: uValues.airtightness > INFILTRATION_ACH50_HIGH_THRESHOLD ? 'high' : 'medium',
      estimatedLossKwh: Math.max(50, infiltrationKwh),
      fixCostRange: {
        min: openings * RETROFIT_COSTS.weatherstripping.minEach,
        max: openings * RETROFIT_COSTS.weatherstripping.maxEach + RETROFIT_COSTS.airSealingAudit.maxEach,
      },
      location: 'Window/door perimeters, service penetrations, floor-wall junctions',
    })
  }

  // Lighting
  if (input.buildYear < LIGHTING_PROBLEM_YEAR_MEDIUM) {
    const lightingKwh = Math.round(annualEnergyKwh * buildingProfile.lightingFraction)
    areas.push({
      id: 'pa-lighting',
      title: 'Inefficient Lighting Installation',
      description:
        `Older buildings commonly retain fluorescent or halogen fittings, consuming 3–5× ` +
        `more energy than equivalent LED luminaires. Modern high-CRI LED panels deliver the ` +
        `same lux levels at 60–80% less wattage. Adding occupancy sensors and daylight ` +
        `dimming provides a further 20–30% reduction.`,
      severity: input.buildYear < LIGHTING_PROBLEM_YEAR_LOW ? 'medium' : 'low',
      estimatedLossKwh: Math.round(lightingKwh * 0.55),
      fixCostRange: {
        min: Math.round(floorArea * RETROFIT_COSTS.ledRetrofit.minPerM2),
        max: Math.round(floorArea * (RETROFIT_COSTS.ledRetrofit.maxPerM2 + RETROFIT_COSTS.lightingControls.minPerM2)),
      },
      location: 'All interior and exterior luminaires',
    })
  }

  return areas
}

// ─── Vision overrides ─────────────────────────────────────────────────────────

/**
 * Upgrade or annotate problem areas based on photographic evidence.
 * Mutates the array in place — only called when confidence !== 'none'.
 */
function applyVisionOverrides(areas: ProblemArea[], vi: VisionInsights): void {
  for (const p of areas) {
    switch (p.id) {
      case 'pa-windows':
        if (vi.hasSinglePaneWindows) {
          p.severity = 'critical'
        } else if (vi.hasOldWindows && p.severity === 'medium') {
          p.severity = 'high'
        }
        if (vi.hasGoodInsulation) {
          // Downgrade if photo evidence suggests upgrades already present
          if (p.severity === 'critical' || p.severity === 'high') p.severity = 'medium'
          p.description = 'Photos suggest some glazing upgrades may already be present. ' + p.description
        }
        break

      case 'pa-hvac':
        if (vi.hasOldAcUnit && p.severity === 'medium') p.severity = 'high'
        if (vi.hasDirtyEquipment) {
          p.description += ' Photographic evidence shows dirty filters or fouled coils — immediate servicing recommended.'
          p.estimatedLossKwh = Math.round(p.estimatedLossKwh * 1.15)
        }
        break

      case 'pa-roof':
        if (vi.hasRoofDamage) p.severity = 'critical'
        break

      case 'pa-walls':
        if (vi.hasCracks) {
          p.severity = 'high'
          p.description += ' Visual inspection detected cracks in the building fabric.'
        }
        break

      case 'pa-infiltration':
        if (vi.hasCracks || vi.hasMould) {
          p.severity = 'high'
          if (vi.hasMould) {
            p.description += ' Mould detected in photos — moisture ingress from air leakage is likely.'
          }
        }
        break

      case 'pa-lighting':
        if (vi.hasFluorescentLighting) {
          p.severity = 'medium'
          p.description += ' Fluorescent tube fittings confirmed in photos.'
        }
        break
    }
  }
}

// ─── Roadmap builder ─────────────────────────────────────────────────────────

interface RoadmapContext {
  input: AuditInput
  uValues: typeof U_VALUES_BY_ERA[string]
  hvac: ReturnType<typeof getHvacProfile>
  climate: ReturnType<typeof detectClimateZone>
  buildingProfile: ReturnType<typeof getBuildingTypeProfile>
  annualEnergyKwh: number
  annualCo2Kg: number
  floorArea: number
}

function buildRoadmap(ctx: RoadmapContext): RoadmapItem[] {
  const { input, uValues, hvac, climate, buildingProfile, annualEnergyKwh, annualCo2Kg, floorArea } = ctx
  const g = estimateGeometry(floorArea)
  const items: RoadmapItem[] = []

  // Air sealing (quick win — always included)
  items.push({
    id: 'ri-sealing',
    title: 'Air Sealing & Weatherstripping',
    description:
      'Seal all gaps around windows, doors, pipe penetrations, and the building perimeter ' +
      'using foam backer rod, silicone caulk, and quality door sweeps. ' +
      'Blower-door pressure test to locate leakage points first. ' +
      'Expected 8–15% HVAC energy reduction for minimal upfront cost.',
    effort: 'quick',
    roiMonths: stableJitter(input.auditId + 'sealing', 6, 12),
    costRange: { min: Math.round(floorArea * 1.5), max: Math.round(floorArea * 5) },
    co2SavingKg: Math.round(annualCo2Kg * 0.08),
    priority: 9,
  })

  // LED retrofit (quick win — always included)
  items.push({
    id: 'ri-led',
    title: 'Full LED Lighting Retrofit',
    description:
      'Replace all fluorescent and halogen fittings with high-efficiency LED luminaires (≥100 lm/W). ' +
      'Install occupancy sensors in low-use areas and daylight-linked dimming for perimeter zones. ' +
      'Target: 60–70% reduction in lighting energy with improved light quality.',
    effort: 'quick',
    roiMonths: stableJitter(input.auditId + 'led', 18, 30),
    costRange: {
      min: Math.round(floorArea * RETROFIT_COSTS.ledRetrofit.minPerM2),
      max: Math.round(floorArea * RETROFIT_COSTS.ledRetrofit.maxPerM2),
    },
    co2SavingKg: Math.round(annualCo2Kg * buildingProfile.lightingFraction * 0.65),
    priority: 8,
  })

  // Roof insulation (medium effort)
  if (uValues.roof > ROOF_U_MEDIUM) {
    items.push({
      id: 'ri-roof',
      title: 'Roof & Ceiling Insulation Upgrade',
      description:
        `Install 100–150 mm of mineral wool or rigid PIR board to achieve U ≤ ${BEST_PRACTICE_U_VALUES.roof} W/m²K. ` +
        `In flat-roof buildings, combine with a reflective cool-roof membrane (SRI ≥ 82) ` +
        `to reduce solar gain by up to 30%. This single measure typically delivers the largest HVAC energy reduction.`,
      effort: 'medium',
      roiMonths: stableJitter(input.auditId + 'roof', 30, 48),
      costRange: {
        min: Math.round(g.roofArea * RETROFIT_COSTS.roofInsulation.minPerM2),
        max: Math.round(g.roofArea * RETROFIT_COSTS.roofInsulation.maxPerM2),
      },
      co2SavingKg: Math.round(annualCo2Kg * buildingProfile.hvacFraction * 0.22),
      priority: 10,
    })
  }

  // HVAC upgrade (medium effort)
  if (hvac.baseLoadMultiplier > HVAC_LOAD_MULT_THRESHOLD) {
    const numUnits = Math.max(1, Math.round(floorArea / 30))
    items.push({
      id: 'ri-hvac',
      title: 'HVAC Upgrade to 5-Star Inverter Units',
      description:
        `Replace existing ${input.hvacType || 'HVAC'} with BEE 5-star inverter units (COP ≥ 4.0). ` +
        `Inverter compressors modulate capacity continuously, eliminating wasteful on/off cycling. ` +
        `Add smart thermostats with occupancy scheduling for a further 15–20% operational saving.`,
      effort: 'medium',
      roiMonths: stableJitter(input.auditId + 'hvac', 36, 60),
      costRange: {
        min: numUnits * RETROFIT_COSTS.splitAcUpgrade.minEach,
        max: numUnits * RETROFIT_COSTS.splitAcUpgrade.maxEach,
      },
      co2SavingKg: Math.round(annualCo2Kg * buildingProfile.hvacFraction * 0.28),
      priority: 9,
    })
  }

  // Window replacement (major)
  if (uValues.windows > WINDOW_U_MEDIUM) {
    items.push({
      id: 'ri-windows',
      title: 'Double-Glazed Window Replacement',
      description:
        `Replace single/old-glazed windows with UPVC double-glazed units ` +
        `(U ≤ 1.6 W/m²K, SHGC ≤ 0.35 for hot climates). Argon-filled IGUs with low-E ` +
        `coating reduce solar heat gain by 50–60%. Prioritise south and west-facing glazing first.`,
      effort: 'major',
      roiMonths: stableJitter(input.auditId + 'windows', 60, 96),
      costRange: {
        min: Math.round(g.windowArea * RETROFIT_COSTS.doubleGlazing.minPerM2),
        max: Math.round(g.windowArea * RETROFIT_COSTS.doubleGlazing.maxPerM2),
      },
      co2SavingKg: Math.round(annualCo2Kg * buildingProfile.hvacFraction * 0.18),
      priority: 7,
    })
  }

  // Solar PV (major)
  const rooftopArea   = Math.min(floorArea * SOLAR_ROOFTOP_FRACTION, SOLAR_ROOFTOP_MAX_M2)
  const solarKwp      = Math.round(rooftopArea * SOLAR_PANEL_KW_PER_M2)
  const solarAnnualKwh = Math.round(solarKwp * climate.solarIrradiance * 0.8)
  const solarOffsetPct = Math.round((solarAnnualKwh / annualEnergyKwh) * 100)

  items.push({
    id: 'ri-solar',
    title: `Rooftop Solar PV Installation (${solarKwp} kWp)`,
    description:
      `Install ${solarKwp} kWp of monocrystalline panels on the available ~${Math.round(rooftopArea)} m² rooftop. ` +
      `At ${climate.solarIrradiance} kWh/m²/year irradiance the system generates ` +
      `~${solarAnnualKwh.toLocaleString()} kWh/year, offsetting ${solarOffsetPct}% of total consumption. ` +
      `Net metering enables export of surplus generation.`,
    effort: 'major',
    roiMonths: stableJitter(input.auditId + 'solar', 72, 96),
    costRange: {
      min: solarKwp * RETROFIT_COSTS.solarPV.minPerKwp,
      max: solarKwp * RETROFIT_COSTS.solarPV.maxPerKwp,
    },
    co2SavingKg: Math.round(solarAnnualKwh * getCarbonIntensity(input.location)),
    priority: 8,
  })

  return items
}

// ─── Contractor brief generator ───────────────────────────────────────────────

interface BriefData {
  carbonScore: number
  annualEnergyKwh: number
  annualCo2Kg: number
  estimatedAnnualCost: number
  potentialSavingsPct: number
  problemAreas: ProblemArea[]
  roadmapItems: RoadmapItem[]
  climate: ReturnType<typeof detectClimateZone>
}

function scoreLabel(score: number): string {
  if (score > 70) return 'POOR'
  if (score > 50) return 'BELOW AVERAGE'
  if (score > 30) return 'AVERAGE'
  return 'GOOD'
}

/**
 * Generate a plain-text Scope of Work document suitable for sending to contractors.
 * Uses a line-array approach for clarity and easy future localisation.
 */
function generateContractorBrief(
  input: AuditInput,
  hvacAge: number,
  data: BriefData
): string {
  const buildingAge = new Date().getFullYear() - input.buildYear
  const SEP = '─────────────────────────────────────────────────────────'
  const lines: string[] = []

  const section = (title: string) => {
    lines.push('', SEP, title, SEP)
  }

  lines.push('SCOPE OF WORK — ENERGY EFFICIENCY RETROFIT')
  lines.push('ThermaMorph Building Energy Audit Report')
  lines.push(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`)

  section('BUILDING OVERVIEW')
  lines.push(`Property:             ${input.buildingType} — ${input.location}`)
  lines.push(`Year of construction: ${input.buildYear} (${buildingAge} years old)`)
  lines.push(`Floor area:           ${input.floorArea} m²`)
  lines.push(`HVAC system:          ${input.hvacType || 'Not specified'}${input.hvacInstallYear ? ` (installed ${input.hvacInstallYear}, ${hvacAge} yrs old)` : ''}`)
  lines.push(`Climate zone:         ${data.climate.name} (${data.climate.coolingDegreeDays} CDD, ${data.climate.heatingDegreeDays} HDD)`)

  section('ENERGY PERFORMANCE SUMMARY')
  lines.push(`Carbon score:         ${data.carbonScore}/100 (${scoreLabel(data.carbonScore)})`)
  lines.push(`Annual energy use:    ${data.annualEnergyKwh.toLocaleString()} kWh/year`)
  lines.push(`Annual CO₂:           ${data.annualCo2Kg.toLocaleString()} kg CO₂e/year`)
  lines.push(`Annual energy cost:   USD ${data.estimatedAnnualCost.toLocaleString()}`)
  lines.push(`Savings potential:    Up to ${data.potentialSavingsPct}% with recommended improvements`)

  section('IDENTIFIED DEFICIENCIES')
  data.problemAreas.forEach((p, i) => {
    lines.push('')
    lines.push(`${i + 1}. ${p.title.toUpperCase()} [${p.severity.toUpperCase()}]`)
    lines.push(`   Location: ${p.location}`)
    lines.push(`   ${p.description}`)
    lines.push(`   Estimated energy loss: ${p.estimatedLossKwh.toLocaleString()} kWh/year`)
    lines.push(`   Remediation cost: USD ${p.fixCostRange.min.toLocaleString()}–${p.fixCostRange.max.toLocaleString()}`)
  })

  section('RECOMMENDED WORKS — PHASED PROGRAMME')

  const phases: Array<[RoadmapItem['effort'], string]> = [
    ['quick',  'PHASE 1 — QUICK WINS (0–3 months)'],
    ['medium', 'PHASE 2 — MEDIUM-TERM IMPROVEMENTS (3–12 months)'],
    ['major',  'PHASE 3 — MAJOR CAPITAL INVESTMENTS (12–36 months)'],
  ]

  for (const [effort, heading] of phases) {
    const items = data.roadmapItems.filter(r => r.effort === effort)
    if (items.length === 0) continue
    lines.push('', heading)
    items.forEach(r => {
      lines.push(`  • ${r.title}`)
      lines.push(`    ${r.description}`)
      lines.push(`    Cost: USD ${r.costRange.min.toLocaleString()}–${r.costRange.max.toLocaleString()} | Payback: ${r.roiMonths} months | CO₂ saving: ${r.co2SavingKg.toLocaleString()} kg/year`)
      lines.push('')
    })
  }

  const totalMin      = data.roadmapItems.reduce((s, r) => s + r.costRange.min, 0)
  const totalMax      = data.roadmapItems.reduce((s, r) => s + r.costRange.max, 0)
  const totalCo2      = data.roadmapItems.reduce((s, r) => s + r.co2SavingKg, 0)
  const annualSaving  = Math.round(data.annualEnergyKwh * data.potentialSavingsPct / 100)
  const costSaving    = Math.round(data.estimatedAnnualCost * data.potentialSavingsPct / 100)

  section('TOTAL INVESTMENT SUMMARY')
  lines.push(`Total programme cost: USD ${totalMin.toLocaleString()}–${totalMax.toLocaleString()}`)
  lines.push(`Annual energy saving: ${annualSaving.toLocaleString()} kWh/year`)
  lines.push(`Annual cost saving:   USD ${costSaving.toLocaleString()}/year`)
  lines.push(`Annual CO₂ reduction: ${totalCo2.toLocaleString()} kg CO₂e/year`)

  section('COMPLIANCE & STANDARDS')
  lines.push('All works should comply with the Energy Conservation Building Code (ECBC) 2017,')
  lines.push('Bureau of Energy Efficiency (BEE) star-labelling requirements, and applicable')
  lines.push('local municipal building regulations. Contractors should hold valid BEE accreditation.')
  lines.push('')
  lines.push('Prepared by ThermaMorph AI Carbon Platform — for indicative purposes only.')
  lines.push('A licensed energy auditor should verify recommendations before commencing works.')

  return lines.join('\n')
}
