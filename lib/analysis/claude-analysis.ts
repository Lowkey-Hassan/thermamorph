/**
 * ThermaMorph Analysis Engine — entry point.
 *
 * Today this wraps the deterministic, rule-based ASHRAE/BREDEM energy engine
 * (`runEnergyEngine`) plus optional Hugging Face vision signals
 * (`VisionInsights`), so no external LLM API is required to run.
 *
 * This module is the seam where a future Claude/OpenAI vision call would
 * plug in: `visionInsights` is already a structured, typed input to the
 * engine, so a richer multimodal analysis step can populate the same shape
 * (or extend `AnalysisResult`) without changing callers of
 * `runAnalysisEngine` in app/api/audits/[id]/analyze/route.ts.
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

/** Run the full analysis pipeline for an audit and return its results. */
export async function runAnalysisEngine(ctx: AuditContext): Promise<AnalysisResult> {
  // Rule-based engine is synchronous but we keep async signature for API compat
  // (and for future async AI-vision-backed implementations).
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
