/**
 * ThermaMorph Analysis Entry Point
 * Wraps the rule-based energy engine. No external AI API required.
 * Function name kept as `runClaudeAnalysis` for API route compatibility.
 */

import { runEnergyEngine } from './energy-engine'
import type { VisionInsights } from './hf-vision'
import type { AnalysisResult } from '@/lib/types'

export interface AuditContext {
  auditId: string
  buildingType: string
  buildYear: number
  floorArea: number
  location: string
  hvacType: string
  hvacInstallYear?: number | null
  imageUrls?: string[]
  visionInsights?: VisionInsights | null
}

export async function runClaudeAnalysis(ctx: AuditContext): Promise<AnalysisResult> {
  // Rule-based engine is synchronous but we keep async signature for API compat
  return runEnergyEngine({
    auditId: ctx.auditId,
    buildingType: ctx.buildingType,
    buildYear: ctx.buildYear,
    floorArea: ctx.floorArea,
    location: ctx.location,
    hvacType: ctx.hvacType,
    hvacInstallYear: ctx.hvacInstallYear,
    imageUrls: ctx.imageUrls,
    visionInsights: ctx.visionInsights,
  })
}
