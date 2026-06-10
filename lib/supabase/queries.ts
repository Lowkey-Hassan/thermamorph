/**
 * Typed Supabase query helpers.
 *
 * Wraps the `as unknown as` casts required to work around a postgrest-js v2
 * regression where chained `.eq().single()` / `.eq().update()` resolve to `never`.
 * Centralising the casts here means route handlers stay readable.
 */

import { createClient } from './server'
import type { Database } from './database.types'

// Use the actual return type of createClient — avoids SupabaseClient<Database>
// generic parameter mismatch introduced in postgrest-js v2.
type Supabase = Awaited<ReturnType<typeof createClient>>
type Tables   = Database['public']['Tables']

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

/** Fetch upload storage paths for an audit. */
export async function getAuditUploads(
  supabase: Supabase,
  auditId: string
): Promise<QueryList<Pick<UploadRow, 'storage_path'>>> {
  return supabase
    .from('audit_uploads')
    .select('storage_path')
    .eq('audit_id', auditId) as unknown as QueryList<Pick<UploadRow, 'storage_path'>>
}

/** Update audit status (and any extra allowed fields). */
export async function updateAuditStatus(
  supabase: Supabase,
  auditId: string,
  patch: Tables['audits']['Update']
): Promise<{ error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)
    .from('audits')
    .update(patch)
    .eq('id', auditId) as Promise<{ error: { message: string } | null }>
}
