import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { assertUUID } from '@/lib/api/validators'
import {
  getAuditByIdAndUser,
  getAuditUploads,
  updateAuditStatus,
  insertAnalysisResult,
  insertProblemAreas,
  insertRoadmapItems,
  insertEnergyBreakdown,
} from '@/lib/supabase/queries'
import { runAnalysisEngine } from '@/lib/analysis/claude-analysis'
import { analyzeImages } from '@/lib/analysis/hf-vision'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

// Allow up to 60 s on Vercel Hobby, 300 s on Pro
export const maxDuration = 60

// Minimum time a caller must wait before retrying analysis after a failure,
// so a flaky client (or repeated page refreshes) can't hammer the vision API.
const RETRY_COOLDOWN_MS = 15_000

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try { assertUUID(id) } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  // Verify ownership
  const { data: audit, error: auditErr } = await getAuditByIdAndUser(supabase, id, user.id)
  if (auditErr || !audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  if (audit.status === 'complete') {
    return NextResponse.json({ message: 'Already analysed' })
  }

  // Reject overlapping runs — a second click/request while one is in flight.
  if (audit.status === 'analyzing') {
    return NextResponse.json(
      { error: 'Analysis is already in progress for this audit.' },
      { status: 429 }
    )
  }

  // Throttle retries shortly after a failed run.
  if (audit.status === 'error') {
    const elapsedMs = Date.now() - new Date(audit.updated_at).getTime()
    if (elapsedMs < RETRY_COOLDOWN_MS) {
      const waitSec = Math.ceil((RETRY_COOLDOWN_MS - elapsedMs) / 1000)
      return NextResponse.json(
        { error: `Please wait ${waitSec}s before retrying analysis.` },
        { status: 429 }
      )
    }
  }

  // Mark as analysing
  await updateAuditStatus(supabase, id, { status: 'analyzing' })

  try {
    // Resolve signed URLs for uploaded photos (valid for 5 minutes)
    const { data: uploads } = await getAuditUploads(supabase, id)
    const imageUrls: string[] = []

    for (const upload of uploads ?? []) {
      // The vision pipeline only supports still images today — video clips
      // are stored for the user's records but not yet sent for captioning.
      if (upload.mime_type?.startsWith('video/')) continue

      const { data: signed } = await supabase.storage
        .from('building-photos')
        .createSignedUrl(upload.storage_path, 300)
      if (signed?.signedUrl) imageUrls.push(signed.signedUrl)
    }

    // Vision analysis — gracefully skipped if HF_API_TOKEN is not configured
    const visionInsights = await analyzeImages(imageUrls)
    if (visionInsights.imagesAnalyzed > 0) {
      console.info(`[analyze:${id}] Vision: ${visionInsights.imagesAnalyzed} images, confidence=${visionInsights.confidence}`)
    } else if (visionInsights.skippedReason) {
      console.info(`[analyze:${id}] Vision skipped: ${visionInsights.skippedReason}`)
    }

    // Rule-based energy engine
    const result = await runAnalysisEngine({
      auditId:        id,
      buildingType:   audit.building_type,
      buildYear:      audit.build_year,
      floorArea:      audit.floor_area,
      location:       audit.location,
      hvacType:       audit.hvac_type,
      hvacInstallYear: audit.hvac_install_year,
      imageUrls,
      visionInsights,
    })

    // Persist using service client (bypasses RLS for server-side writes)
    const svc = await createServiceClient()

    await insertAnalysisResult(svc, {
      audit_id:              id,
      carbon_score:          result.carbonScore,
      annual_co2_kg:         result.annualCo2Kg,
      annual_energy_kwh:     result.annualEnergyKwh,
      estimated_annual_cost: result.estimatedAnnualCost,
      potential_savings_pct: result.potentialSavingsPct,
      contractor_brief:      result.contractorBrief,
      model_used:            'rule-based-engine-v1',
      raw_response:          result as unknown as Record<string, unknown>,
    })

    if (result.problemAreas.length > 0) {
      await insertProblemAreas(svc, result.problemAreas.map((p, i) => ({
        audit_id:          id,
        title:             p.title,
        description:       p.description,
        severity:          p.severity as Tables['problem_areas']['Row']['severity'],
        estimated_loss_kwh: p.estimatedLossKwh,
        fix_cost_min:      p.fixCostRange.min,
        fix_cost_max:      p.fixCostRange.max,
        location:          p.location,
        sort_order:        i,
      })))
    }

    if (result.roadmapItems.length > 0) {
      await insertRoadmapItems(svc, result.roadmapItems.map(r => ({
        audit_id:     id,
        title:        r.title,
        description:  r.description,
        effort:       r.effort as Tables['roadmap_items']['Row']['effort'],
        roi_months:   r.roiMonths,
        cost_min:     r.costRange.min,
        cost_max:     r.costRange.max,
        co2_saving_kg: r.co2SavingKg,
        priority:     r.priority,
      })))
    }

    if (result.energyBreakdown.length > 0) {
      await insertEnergyBreakdown(svc, result.energyBreakdown.map(e => ({
        audit_id:    id,
        category:    e.category,
        kwh_per_year: e.kwhPerYear,
        percentage:  e.percentage,
      })))
    }

    // Mark complete
    await updateAuditStatus(svc, id, { status: 'complete' })

    return NextResponse.json({ success: true, auditId: id })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    console.error(`[analyze:${id}] Error:`, message)
    await updateAuditStatus(supabase, id, { status: 'error', error_message: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
