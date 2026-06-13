/**
 * API input validation utilities.
 *
 * Rules:
 *   - All validators throw a plain Error with a user-readable message on failure.
 *   - Callers catch and return 400 with the message.
 *   - No external dependencies — keeps bundle small and tests trivial.
 */

// ─── UUID guard ───────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Throws if `value` is not a valid UUID string. */
export function assertUUID(value: unknown, field = 'id'): asserts value is string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${field}: must be a UUID`)
  }
}

// ─── Primitive sanitisers ────────────────────────────────────────────────────

/** Trim and clamp a string. Throws if missing or too long. */
export function sanitizeString(
  value: unknown,
  field: string,
  { maxLen = 500, required = true }: { maxLen?: number; required?: boolean } = {}
): string {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${field} is required`)
    return ''
  }
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length === 0 && required) throw new Error(`${field} must not be blank`)
  if (trimmed.length > maxLen) throw new Error(`${field} exceeds maximum length of ${maxLen}`)
  return trimmed
}

/** Parse and range-check a year integer. */
export function sanitizeYear(
  value: unknown,
  field: string,
  { min = 1900, max = new Date().getFullYear() + 1 }: { min?: number; max?: number } = {}
): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${field} must be a whole number between ${min} and ${max}`)
  }
  return n
}

/** Parse and range-check a positive number (floor area, capacity, etc.). */
export function sanitizePositiveNumber(
  value: unknown,
  field: string,
  { min, max }: { min: number; max: number }
): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${field} must be a number between ${min} and ${max}`)
  }
  return n
}

// ─── Audit-specific validation ───────────────────────────────────────────────

export interface ValidatedAuditCreate {
  name: string
  buildingType: string
  buildYear: number
  floorArea: number
  location: string
  hvacType: string
  hvacInstallYear: number | null
}

/**
 * Validate and sanitize the POST /api/audits request body.
 * Throws a descriptive Error on the first invalid field.
 */
export function validateAuditCreate(body: Record<string, unknown>): ValidatedAuditCreate {
  const name         = sanitizeString(body.name,         'name',         { maxLen: 120 })
  const buildingType = sanitizeString(body.buildingType, 'buildingType', { maxLen: 80  })
  const location     = sanitizeString(body.location,     'location',     { maxLen: 200 })
  const hvacType     = sanitizeString(body.hvacType,     'hvacType',     { maxLen: 80  })
  const buildYear    = sanitizeYear(body.buildYear,      'buildYear',    { min: 1800   })
  const floorArea    = sanitizePositiveNumber(body.floorArea, 'floorArea', { min: 5, max: 100_000 })

  let hvacInstallYear: number | null = null
  if (body.hvacInstallYear !== undefined && body.hvacInstallYear !== null && body.hvacInstallYear !== '') {
    hvacInstallYear = sanitizeYear(body.hvacInstallYear, 'hvacInstallYear', { min: 1960 })
    if (hvacInstallYear < buildYear) {
      throw new Error('hvacInstallYear cannot be before buildYear')
    }
  }

  return { name, buildingType, buildYear, floorArea, location, hvacType, hvacInstallYear }
}

/**
 * Allowlist of fields a client may update on an audit.
 * Prevents mass-assignment of sensitive columns (user_id, id, etc.).
 *
 * `status` is included but tightly restricted (see CLIENT_STATUS_TRANSITIONS
 * below) — the client may only move an audit from `draft` to `uploading`
 * as it starts the upload step. All other transitions (`analyzing`,
 * `complete`, `error`) are server-only, set by the analyze route using the
 * service-role client.
 */
const AUDIT_PATCH_ALLOWLIST = new Set([
  'name', 'building_type', 'build_year', 'floor_area',
  'location', 'hvac_type', 'hvac_install_year', 'status',
])

/** The only audit status values a client is allowed to set via PATCH. */
const CLIENT_STATUS_TRANSITIONS = new Set(['uploading'])

export interface ValidatedAuditPatch {
  name?: string
  building_type?: string
  build_year?: number
  floor_area?: number
  location?: string
  hvac_type?: string
  hvac_install_year?: number | null
  status?: 'uploading'
}

/**
 * Validate PATCH /api/audits/[id] body.
 * Strips fields not in AUDIT_PATCH_ALLOWLIST, then re-validates each present field.
 */
export function validateAuditPatch(body: Record<string, unknown>): ValidatedAuditPatch {
  const patch: Record<string, unknown> = {}

  for (const key of AUDIT_PATCH_ALLOWLIST) {
    if (!(key in body)) continue
    const val = body[key]
    switch (key) {
      case 'name':
        patch[key] = sanitizeString(val, 'name', { maxLen: 120 })
        break
      case 'building_type':
        patch[key] = sanitizeString(val, 'buildingType', { maxLen: 80 })
        break
      case 'location':
        patch[key] = sanitizeString(val, 'location', { maxLen: 200 })
        break
      case 'hvac_type':
        patch[key] = sanitizeString(val, 'hvacType', { maxLen: 80 })
        break
      case 'build_year':
        patch[key] = sanitizeYear(val,