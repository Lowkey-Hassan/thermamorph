// ─── Domain Types ────────────────────────────────────────────────────────────

export type BuildingType =
  | 'residential_apartment'
  | 'residential_house'
  | 'office'
  | 'commercial_retail'
  | 'commercial_warehouse'

export type HVACType =
  | 'central_hvac'
  | 'split_ac'
  | 'heat_pump'
  | 'boiler_radiator'
  | 'window_units'
  | 'none'

export type AuditStatus = 'draft' | 'analyzing' | 'complete' | 'error'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

// ─── Analysis Result (returned by engine, saved to DB, read by results page) ─

export interface ProblemArea {
  id: string
  title: string
  description: string
  severity: SeverityLevel
  estimatedLossKwh: number
  fixCostRange: { min: number; max: number }
  location: string
}

export interface EnergyBreakdown {
  id: string
  category: string
  kwhPerYear: number
  percentage: number
  color?: string
}

export interface RoadmapItem {
  id: string
  title: string
  description: string
  effort: 'quick' | 'medium' | 'major'
  roiMonths: number
  costRange: { min: number; max: number }
  co2SavingKg: number
  priority: number
}

export interface AnalysisResult {
  auditId: string
  carbonScore: number         // 0-100, higher = worse
  annualCo2Kg: number
  annualEnergyKwh: number
  estimatedAnnualCost: number
  potentialSavingsPct: number
  problemAreas: ProblemArea[]
  energyBreakdown: EnergyBreakdown[]
  roadmapItems: RoadmapItem[]
  contractorBrief: string
  generatedAt: string
}

// ─── Audit Input ─────────────────────────────────────────────────────────────

export interface BuildingDetails {
  name: string
  location: string
  buildYear: number
  buildingType: BuildingType
  floorArea: number
  floors: number
  hvacType: HVACType
  occupants: number
}

export interface AuditMedia {
  id: string
  url: string
  type: 'photo' | 'video'
  zone: 'windows' | 'doors' | 'walls' | 'roof' | 'hvac' | 'exterior' | 'other'
  uploadedAt: string
}

export interface Audit {
  id: string
  status: AuditStatus
  createdAt: string
  updatedAt: string
  result?: AnalysisResult
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_apartment: 'Residential - Apartment',
  residential_house: 'Residential - House',
  office: 'Office',
  commercial_retail: 'Commercial - Retail',
  commercial_warehouse: 'Commercial - Warehouse',
}

export const HVAC_TYPE_LABELS: Record<HVACType, string> = {
  central_hvac: 'Central HVAC',
  split_ac: 'Split AC',
  heat_pump: 'Heat Pump',
  boiler_radiator: 'Boiler / Radiator',
  window_units: 'Window Units',
  none: 'None / Natural Ventilation',
}

export const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'    },
  high:     { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  medium:   { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  low:      { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200'  },
}
