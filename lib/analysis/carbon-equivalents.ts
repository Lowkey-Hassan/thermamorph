/**
 * Carbon Equivalents
 *
 * Pure conversion helpers that translate a building's raw CO2 numbers into
 * relatable, human-scale comparisons. The goal is "awareness as an experience" —
 * a kg-CO2 figure means very little to most people; a flight count, a tree
 * count, or a share of their personal carbon budget means a lot more.
 *
 * All reference constants are deliberately conservative, round, well-known
 * figures (cited inline) — they are illustrative comparisons for awareness,
 * not precise lifecycle-assessment numbers.
 */

// ─── Reference constants (illustrative, with sources) ──────────────────────

/** Domestic short-haul flight, ~1,150 km (e.g. Delhi–Mumbai), per passenger.
 *  Source: ICAO carbon calculator / common climate-comms estimate, 80-100 kg CO2. */
export const KG_CO2_PER_DOMESTIC_FLIGHT = 100

/** Mature tree, CO2 absorbed per year.
 *  Source: U.S. EPA / arborday.org estimate, ~21 kg CO2/year. */
export const KG_CO2_ABSORBED_PER_TREE_PER_YEAR = 21

/** Average urban Indian resident, annual CO2 footprint.
 *  Source: commonly cited estimate, ~1.5–2 t CO2/year — midpoint used. */
export const KG_CO2_PER_INDIAN_RESIDENT_PER_YEAR = 1800

/** Average passenger car, CO2 emitted per km.
 *  Source: common climate-comms estimate, ~0.17 kg CO2/km. */
export const KG_CO2_PER_CAR_KM = 0.17

/** "1.5°C-aligned" personal annual carbon budget.
 *  Source: 1.5-degree-lifestyles research (Hot or Cool Institute), which puts
 *  a fair per-person annual footprint target at roughly 2.3 t CO2 by 2030,
 *  declining toward ~0.7 t by 2050. We use the 2030 figure as the benchmark. */
export const KG_CO2_PERSONAL_BUDGET_PER_YEAR = 2300

// ─── Equivalence conversions ────────────────────────────────────────────────

/** Number of domestic flights whose emissions equal the given CO2 amount. */
export function co2ToFlights(kgCo2: number): number {
  return kgCo2 / KG_CO2_PER_DOMESTIC_FLIGHT
}

/** Number of mature trees that would need to grow for one full year to
 *  absorb the given amount of CO2. */
export function co2ToTreeYears(kgCo2: number): number {
  return kgCo2 / KG_CO2_ABSORBED_PER_TREE_PER_YEAR
}

/** Number of "average Indian resident-years" of emissions equal to the
 *  given CO2 amount. */
export function co2ToResidentYears(kgCo2: number): number {
  return kgCo2 / KG_CO2_PER_INDIAN_RESIDENT_PER_YEAR
}

/** Distance (km) an average passenger car would need to drive to emit the
 *  given amount of CO2. */
export function co2ToCarKm(kgCo2: number): number {
  return kgCo2 / KG_CO2_PER_CAR_KM
}

// ─── Lifetime ledger ─────────────────────────────────────────────────────────

export interface LifetimeLedger {
  /** Years the building has been operating (clamped to >= 1). */
  ageYears: number
  /** Total CO2 (kg) emitted over the building's lifetime at the current rate. */
  lifetimeCo2Kg: number
  /** Same total, expressed in metric tonnes. */
  lifetimeCo2Tonnes: number
}

/**
 * Estimate the cumulative CO2 a building has emitted since it was built,
 * assuming (conservatively) it has operated at roughly its current rate
 * the whole time. Intentionally simple — the point is the order of
 * magnitude, not a precise historical reconstruction.
 */
export function calcLifetimeLedger(
  annualCo2Kg: number,
  buildYear: number,
  currentYear: number = new Date().getFullYear()
): LifetimeLedger {
  const ageYears = Math.max(1, currentYear - buildYear)
  const lifetimeCo2Kg = annualCo2Kg * ageYears
  return {
    ageYears,
    lifetimeCo2Kg,
    lifetimeCo2Tonnes: lifetimeCo2Kg / 1000,
  }
}

// ─── "Inheritance" — personal carbon budget share ──────────────────────────

/**
 * What share of a single person's "1.5°C-aligned" annual carbon budget
 * this one building's emissions represent, expressed as a multiple.
 * e.g. 4.2 means "this building alone emits 4.2x a sustainable
 * per-person annual allowance."
 */
export function co2ToBudgetMultiple(annualCo2Kg: number): number {
  return annualCo2Kg / KG_CO2_PERSONAL_BUDGET_PER_YEAR
}

// ─── Carbon Body — visual severity tiering ─────────────────────────────────

export type CarbonBodyState = 'thriving' | 'strained' | 'distressed' | 'critical'

/**
 * Maps a 0-100 carbonScore (higher = worse) to a qualitative state used to
 * drive the "Carbon Body" visualization (color, cracks, smog density).
 */
export function carbonScoreToBodyState(carbonScore: number): CarbonBodyState {
  if (carbonScore < 30) return 'thriving'
  if (carbonScore < 55) return 'strained'
  if (carbonScore < 80) return 'distressed'
  return 'critical'
}

export const CARBON_BODY_COPY: Record<CarbonBodyState, { label: string; description: string }> = {
  thriving: {
    label: 'Thriving',
    description: 'This building is breathing easily — low emissions, minimal heat loss.',
  },
  strained: {
    label: 'Strained',
    description: 'Cracks are forming. Heat is escaping through several surfaces, and the building is working harder than it should.',
  },
  distressed: {
    label: 'Distressed',
    description: 'Significant heat loss across multiple surfaces. This building is bleeding energy — and money — every single day.',
  },
  critical: {
    label: 'Critical',
    description: 'This building is in a constant state of energy loss. Every year it operates like this compounds the damage — to your bills, and to the air everyone around it breathes.',
  },
}
