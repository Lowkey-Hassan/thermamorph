/**
 * Typed Supabase query helpers.
 *
 * Wraps the `as unknown as` casts required to work around a postgrest-js v2
 * regression where chained `.eq().single()` / `.eq().update()` resolve to `never`.
 * Centralising the casts here means route handlers stay readable.
 */

import { createClient, createServiceClient } from './server'
import type { Database } from './database.types'

// Use the actual return type of createClient — avoids SupabaseClient<Database>
// generic parameter mismatch introduced in postgrest-js v2.
type Supabase = Awaited<ReturnType<typeof createClient>>
// Structurally identical to `Supabase` (both wrap createServerClient<Database>),
// kept as a distinct alias so service-role-only helpers are self-documenting
// about which privilege level they expect.
type ServiceSupabase = Awaited<ReturnType<typeof createServiceClient>>
type Tables   = Database['public']['Tables']

// ─── Postgrest-js v2 argument-type escape hatch ───────────────────────────────
//
// In postgrest-js v2 the `.update()` and `.insert()` method argument types are
// erroneously inferred as `never` / `never[]` on certain query chains.  The
// functions below that call those methods route the client through `esc()` so
// the correct domain argument types can be passed without `as any` or eslint-
// disable suppressions.  All other functions use the Supabase client directly.

/**
 * Recursive chain type for the `esc()` escape hatch.  Every method call
 * returns another `AnyChain`, so a full query chain compiles cleanly.
 * Result types are still cast with `as unknown as T` at each call site.
 */
interface AnyChain {
  [method: string]: (...args: unknown[]) => AnyChain
}

/**
 * Routes a Supabase client through `AnyChain` via `as unknown as` (never
 * through `as any`) to bypass the postgrest-js v2 argument-type regression.
 * Use only in query helpers where `.update()` or `.insert()` is in the chain.
 */
function esc(client: Supabase | ServiceSupabase): AnyChain {
  return client as unknown as AnyChain
}

// ─── Row type exports (used by pages and routes) ──────────────────────────────

export type AuditRow           = Tables['audits']['Row']
export type AnalysisResultRow  = Tables['analysis_results']['Row']
export type ProblemAreaRow     = Tables['problem_areas']['Row']
export type RoadmapItemRow     = Tables['roadmap_items']['Row']
export type EnergyBreakdownRow = Tables['energy_breakdown']['Row']
export type UploadRow          = Tables['audit_uploads']['Row']

// ─── Query result shapes ──────────────────────────────────────────────────────

export type QuerySingle<T> = { data: T | null; error: { message: string } | null }
export type QueryList<T>   = { data: T[] | null; error: { message: string } | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a single audit owned by a specific user (null when not found). */
export async function getAuditByIdAndUser(
  supabase: Supabase,
  auditId: string,
  userId: string
): Promise<QuerySingle<AuditRow>> {
  return supabase
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .eq('user_id', userId)
    .single() as unknown as QuerySingle<AuditRow>
}

/** Fetch upload storage paths and mime types (used to separate photos from video) for an audit. */
export async function getAuditUploads(
  supabase: Supabase,
  auditId: string
): Promise<QueryList<Pick<UploadRow, 'storage_path' | 'mime_type'>>> {
  return supabase
    .from('audit_uploads')
    .select('storage_path,mime_type')
    .eq('audit_id', auditId) as unknown as QueryList<Pick<UploadRow, 'storage_path' | 'mime_type'>>
}

/** Update audit status (and any extra allowed fields). */
export async function updateAuditStatus(
  supabase: Supabase,
  auditId: string,
  patch: Tables['audits']['Update']
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('audits')
    .update(patch)
    .eq('id', auditId) as unknown as Promise<{ error: { message: string } | null }>
}

/** Fetch all audits owned by a user, most recent first. */
export async function getAuditsForUser(
  supabase: Supabase,
  userId: string
): Promise<QueryList<AuditRow>> {
  return supabase
    .from('audits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as unknown as Promise<QueryList<AuditRow>>
}

export type AuditScoreRow = Pick<
  AnalysisResultRow,
  'audit_id' | 'carbon_score' | 'annual_co2_kg' | 'annual_energy_kwh' | 'estimated_annual_cost'
>

/** Fetch summary score fields for a set of completed audits. */
export async function getAnalysisScores(
  supabase: Supabase,
  auditIds: string[]
): Promise<QueryList<AuditScoreRow>> {
  return supabase
    .from('analysis_results')
    .select('audit_id,carbon_score,annual_co2_kg,annual_energy_kwh,estimated_annual_cost')
    .in('audit_id', auditIds) as unknown as Promise<QueryList<AuditScoreRow>>
}

/** Create a new audit row (status defaults to 'draft') and return it. */
export async function insertAudit(
  supabase: Supabase,
  fields: Tables['audits']['Insert']
): Promise<QuerySingle<AuditRow>> {
  return esc(supabase)
    .from('audits')
    .insert(fields)
    .select()
    .single() as unknown as Promise<QuerySingle<AuditRow>>
}

/** Apply a partial update to an audit owned by a specific user and return the updated row. */
export async function updateAuditForUser(
  supabase: Supabase,
  auditId: string,
  userId: string,
  patch: Tables['audits']['Update']
): Promise<QuerySingle<AuditRow>> {
  return esc(supabase)
    .from('audits')
    .update(patch)
    .eq('id', auditId)
    .eq('user_id', userId)
    .select()
    .single() as unknown as Promise<QuerySingle<AuditRow>>
}

/** Register an uploaded building photo/video against an audit. */
export async function insertAuditUpload(
  supabase: Supabase,
  upload: Tables['audit_uploads']['Insert']
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('audit_uploads')
    .insert(upload) as unknown as Promise<{ error: { message: string } | null }>
}

/** Delete an audit owned by a specific user (row-level ownership check). */
export async function deleteAuditForUser(
  supabase: Supabase,
  auditId: string,
  userId: string
): Promise<{ error: { message: string } | null }> {
  return supabase
    .from('audits')
    .delete()
    .eq('id', auditId)
    .eq('user_id', userId) as unknown as { error: { message: string } | null }
}

// ─── Results bundle (GET /api/audits/[id]) ─────────────────────────────────────

export interface AuditResultsBundle {
  results:         AnalysisResultRow | null
  problemAreas:    ProblemAreaRow[]
  roadmapItems:    RoadmapItemRow[]
  energyBreakdown: EnergyBreakdownRow[]
}

/** Fetch the full results bundle (analysis, problem areas, roadmap, energy
 *  breakdown) for a completed audit, in a single round trip. */
export async function getAuditResultsBundle(
  supabase: Supabase,
  auditId: string
): Promise<AuditResultsBundle> {
  const [resultsRes, problemsRes, roadmapRes, breakdownRes] = await Promise.all([
    supabase.from('analysis_results').select('*').eq('audit_id', auditId).single(),
    supabase.from('problem_areas').select('*').eq('audit_id', auditId).order('sort_order'),
    supabase.from('roadmap_items').select('*').eq('audit_id', auditId).order('priority', { ascending: false }),
    supabase.from('energy_breakdown').select('*').eq('audit_id', auditId),
  ]) as unknown as [
    QuerySingle<AnalysisResultRow>,
    QueryList<ProblemAreaRow>,
    QueryList<RoadmapItemRow>,
    QueryList<EnergyBreakdownRow>,
  ]

  return {
    results:         resultsRes.data,
    problemAreas:    problemsRes.data  ?? [],
    roadmapItems:    roadmapRes.data   ?? [],
    energyBreakdown: breakdownRes.data ?? [],
  }
}

// ─── Analysis-result writes (service client — bypasses RLS) ───────────────────
//
// The /api/audits/[id]/analyze route persists engine output using the
// service-role client, which never goes through the user's RLS policies.
// These helpers centralise that client's `as unknown as {...}` casts so the
// route handler itself stays free of raw postgrest-js workarounds.

/** Insert the single analysis_results row produced by an audit run. */
export async function insertAnalysisResult(
  supabase: ServiceSupabase,
  fields: Tables['analysis_results']['Insert']
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('analysis_results')
    .insert(fields) as unknown as Promise<{ error: { message: string } | null }>
}

/** Bulk-insert the problem-area rows for an audit run. */
export async function insertProblemAreas(
  supabase: ServiceSupabase,
  rows: Tables['problem_areas']['Insert'][]
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('problem_areas')
    .insert(rows) as unknown as Promise<{ error: { message: string } | null }>
}

/** Bulk-insert the decarbonisation roadmap rows for an audit run. */
export async function insertRoadmapItems(
  supabase: ServiceSupabase,
  rows: Tables['roadmap_items']['Insert'][]
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('roadmap_items')
    .insert(rows) as unknown as Promise<{ error: { message: string } | null }>
}

/** Bulk-insert the energy-breakdown rows for an audit run. */
export async function insertEnergyBreakdown(
  supabase: ServiceSupabase,
  rows: Tables['energy_breakdown']['Insert'][]
): Promise<{ error: { message: string } | null }> {
  return esc(supabase)
    .from('energy_breakdown')
    .insert(rows) as unknown as Promise<{ error: { message: string } | null }>
}
