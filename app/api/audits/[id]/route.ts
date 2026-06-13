import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { assertUUID, validateAuditPatch } from '@/lib/api/validators'
import { updateAuditForUser } from '@/lib/supabase/queries'
import type { Database } from '@/lib/supabase/database.types'

type AuditRow           = Database['public']['Tables']['audits']['Row']
type AnalysisResultRow  = Database['public']['Tables']['analysis_results']['Row']
type ProblemAreaRow     = Database['public']['Tables']['problem_areas']['Row']
type RoadmapItemRow     = Database['public']['Tables']['roadmap_items']['Row']
type EnergyBreakdownRow = Database['public']['Tables']['energy_breakdown']['Row']

type Params = { params: Promise<{ id: string }> }

/** GET /api/audits/[id] — fetch one audit (plus results if complete) */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try { assertUUID(id) } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  const { data: audit, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as unknown as { data: AuditRow | null; error: { message: string } | null }

  if (error || !audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  if (audit.status !== 'complete') {
    return NextResponse.json({ audit })
  }

  const [resultsRes, problemsRes, roadmapRes, breakdownRes] = await Promise.all([
    supabase.from('analysis_results').select('*').eq('audit_id', id).single(),
    supabase.from('problem_areas').select('*').eq('audit_id', id).order('sort_order'),
    supabase.from('roadmap_items').select('*').eq('audit_id', id).order('priority', { ascending: false }),
    supabase.from('energy_breakdown').select('*').eq('audit_id', id),
  ]) as unknown as [
    { data: AnalysisResultRow  | null },
    { data: ProblemAreaRow[]   | null },
    { data: RoadmapItemRow[]   | null },
    { data: EnergyBreakdownRow[] | null },
  ]

  return NextResponse.json({
    audit,
    results:         resultsRes.data,
    problemAreas:    problemsRes.data    ?? [],
    roadmapItems:    roadmapRes.data     ?? [],
    energyBreakdown: breakdownRes.data   ?? [],
  })
}

/** PATCH /api/audits/[id] — update allowed fields only (mass-assignment safe) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  try { assertUUID(id) } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  let rawBody: Record<string, unknown>
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let patch
  try {
    patch = validateAuditPatch(rawBody)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid input' },
      { status: 400 }
    )
  }

  const { data, error } = await updateAuditForUser(supabase, id, user.id, patch)

  if (error || !data) {
    console.error('[PATCH /api/audits/:id]', error?.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ audit: data })
}

/** DELETE /api/audits/[id] — soft-delete protected by row-level ownership check */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try { assertUUID(id) } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  const { error } = await supabase
    .from('audits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) as unknown as { error: { message: string } | null }

  if (error) {
    console.error('[DELETE /api/audits/:id]', error.message)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
