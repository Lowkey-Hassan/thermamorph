/**
 * Unit tests — lib/api/validators.ts
 *
 * Coverage:
 *   assertUUID          — valid / invalid / wrong type
 *   sanitizeString      — trim, required, maxLen, blank
 *   sanitizeYear        — range, float rejection, NaN
 *   sanitizePositiveNumber — range, Infinity, NaN
 *   validateAuditCreate — happy path + each bad field
 *   validateAuditPatch  — allowlist, empty patch, set to null
 */

import {
  assertUUID,
  sanitizeString,
  sanitizeYear,
  sanitizePositiveNumber,
  validateAuditCreate,
  validateAuditPatch,
} from '../lib/api/validators'

// ─── assertUUID ───────────────────────────────────────────────────────────────

describe('assertUUID', () => {
  it('accepts a valid UUID v4', () => {
    expect(() =>
      assertUUID('123e4567-e89b-12d3-a456-426614174000')
    ).not.toThrow()
  })

  it('accepts uppercase UUID', () => {
    expect(() =>
      assertUUID('123E4567-E89B-12D3-A456-426614174000')
    ).not.toThrow()
  })

  it('throws on empty string', () => {
    expect(() => assertUUID('')).toThrow('Invalid id: must be a UUID')
  })

  it('throws on non-UUID string', () => {
    expect(() => assertUUID('not-a-uuid')).toThrow()
  })

  it('throws on number', () => {
    expect(() => assertUUID(42)).toThrow()
  })

  it('throws on null', () => {
    expect(() => assertUUID(null)).toThrow()
  })

  it('throws on object', () => {
    expect(() => assertUUID({})).toThrow()
  })

  it('uses the field name in the error message', () => {
    expect(() => assertUUID('bad', 'auditId')).toThrow('Invalid auditId')
  })
})

// ─── sanitizeString ───────────────────────────────────────────────────────────

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ', 'name')).toBe('hello')
  })

  it('returns empty string for optional missing value', () => {
    expect(sanitizeString(undefined, 'field', { required: false })).toBe('')
    expect(sanitizeString(null,      'field', { required: false })).toBe('')
    expect(sanitizeString('',        'field', { required: false })).toBe('')
  })

  it('throws when required value is missing', () => {
    expect(() => sanitizeString(undefined, 'name')).toThrow('name is required')
    expect(() => sanitizeString(null,      'name')).toThrow('name is required')
    expect(() => sanitizeString('',        'name')).toThrow('name is required')
  })

  it('throws when required value is only whitespace', () => {
    expect(() => sanitizeString('   ', 'name')).toThrow('name must not be blank')
  })

  it('throws when value exceeds maxLen', () => {
    const long = 'x'.repeat(200)
    expect(() =>
      sanitizeString(long, 'name', { maxLen: 120 })
    ).toThrow('name exceeds maximum length of 120')
  })

  it('accepts value at exactly maxLen', () => {
    const exact = 'x'.repeat(120)
    expect(sanitizeString(exact, 'name', { maxLen: 120 })).toBe(exact)
  })

  it('throws when value is not a string', () => {
    expect(() => sanitizeString(42, 'name')).toThrow('name must be a string')
  })
})

// ─── sanitizeYear ─────────────────────────────────────────────────────────────

describe('sanitizeYear', () => {
  it('accepts a valid year', () => {
    expect(sanitizeYear(2000, 'buildYear')).toBe(2000)
    expect(sanitizeYear('1975', 'buildYear')).toBe(1975)
  })

  it('throws on year below minimum', () => {
    expect(() => sanitizeYear(1799, 'buildYear', { min: 1800 })).toThrow('buildYear')
  })

  it('throws on year above maximum', () => {
    const nextYear = new Date().getFullYear() + 2
    expect(() => sanitizeYear(nextYear, 'buildYear')).toThrow('buildYear')
  })

  it('throws on float', () => {
    expect(() => sanitizeYear(2001.5, 'buildYear')).toThrow()
  })

  it('throws on NaN', () => {
    expect(() => sanitizeYear('not-a-number', 'buildYear')).toThrow()
  })
})

// ─── sanitizePositiveNumber ───────────────────────────────────────────────────

describe('sanitizePositiveNumber', () => {
  it('accepts a value within range', () => {
    expect(sanitizePositiveNumber(150, 'floorArea', { min: 5, max: 100_000 })).toBe(150)
  })

  it('accepts the minimum boundary', () => {
    expect(sanitizePositiveNumber(5, 'floorArea', { min: 5, max: 100_000 })).toBe(5)
  })

  it('throws below minimum', () => {
    expect(() =>
      sanitizePositiveNumber(4, 'floorArea', { min: 5, max: 100_000 })
    ).toThrow('floorArea')
  })

  it('throws above maximum', () => {
    expect(() =>
      sanitizePositiveNumber(200_000, 'floorArea', { min: 5, max: 100_000 })
    ).toThrow('floorArea')
  })

  it('throws on Infinity', () => {
    expect(() =>
      sanitizePositiveNumber(Infinity, 'floorArea', { min: 5, max: 100_000 })
    ).toThrow()
  })

  it('throws on NaN', () => {
    expect(() =>
      sanitizePositiveNumber(NaN, 'floorArea', { min: 5, max: 100_000 })
    ).toThrow()
  })

  it('accepts numeric strings', () => {
    expect(sanitizePositiveNumber('200', 'floorArea', { min: 5, max: 100_000 })).toBe(200)
  })
})

// ─── validateAuditCreate ──────────────────────────────────────────────────────

describe('validateAuditCreate', () => {
  const VALID_BODY = {
    name:           'Head Office',
    buildingType:   'office',
    buildYear:      1995,
    floorArea:      400,
    location:       'Chennai',
    hvacType:       'split_ac',
    hvacInstallYear: 2018,
  }

  it('returns sanitized data for a valid body', () => {
    const result = validateAuditCreate(VALID_BODY)
    expect(result.name).toBe('Head Office')
    expect(result.buildYear).toBe(1995)
    expect(result.floorArea).toBe(400)
    expect(result.hvacInstallYear).toBe(2018)
  })

  it('trims whitespace on string fields', () => {
    const result = validateAuditCreate({ ...VALID_BODY, name: '  Roof HQ  ' })
    expect(result.name).toBe('Roof HQ')
  })

  it('allows hvacInstallYear to be null', () => {
    const result = validateAuditCreate({ ...VALID_BODY, hvacInstallYear: null })
    expect(result.hvacInstallYear).toBeNull()
  })

  it('allows hvacInstallYear to be omitted', () => {
    const { hvacInstallYear: _, ...withoutYear } = VALID_BODY
    const result = validateAuditCreate(withoutYear)
    expect(result.hvacInstallYear).toBeNull()
  })

  it('throws when name is missing', () => {
    expect(() =>
      validateAuditCreate({ ...VALID_BODY, name: '' })
    ).toThrow('name is required')
  })

  it('throws when buildYear is invalid', () => {
    expect(() =>
      validateAuditCreate({ ...VALID_BODY, buildYear: 'banana' })
    ).toThrow('buildYear')
  })

  it('throws when floorArea is zero', () => {
    expect(() =>
      validateAuditCreate({ ...VALID_BODY, floorArea: 0 })
    ).toThrow('floorArea')
  })

  it('throws when hvacInstallYear is before buildYear', () => {
    expect(() =>
      validateAuditCreate({ ...VALID_BODY, buildYear: 2010, hvacInstallYear: 2005 })
    ).toThrow('hvacInstallYear cannot be before buildYear')
  })

  it('accepts hvacInstallYear equal to buildYear', () => {
    expect(() =>
      validateAuditCreate({ ...VALID_BODY, buildYear: 2010, hvacInstallYear: 2010 })
    ).not.toThrow()
  })
})

// ─── validateAuditPatch ───────────────────────────────────────────────────────

describe('validateAuditPatch', () => {
  it('returns only allowed fields', () => {
    const patch = validateAuditPatch({ name: 'New Name', user_id: 'inject' })
    expect(patch).toHaveProperty('name', 'New Name')
    expect(patch).not.toHaveProperty('user_id')
  })

  it('throws when body contains only disallowed fields', () => {
    expect(() =>
      validateAuditPatch({ id: 'abc', user_id: 'xyz' })
    ).toThrow('No valid fields provided for update')
  })

  it('rejects status values other than the allowed client transition', () => {
    expect(() =>
      validateAuditPatch({ id: 'abc', status: 'hacked', user_id: 'xyz' })
    ).toThrow('Invalid status: clients may only set status to uploading')
  })

  it('accepts status: "uploading" (the only client-initiated transition)', () => {
    const patch = validateAuditPatch({ status: 'uploading' })
    expect(patch.status).toBe('uploading')
  })

  it.each(['analyzing', 'complete', 'error', 'draft', 'completed'])(
    'rejects server-only status value %s from a client patch',
    (status) => {
      expect(() => validateAuditPatch({ status })).toThrow(
        'Invalid status: clients may only set status to uploading'
      )
    }
  )

  it('accepts partial patch with one field', () => {
    const patch = validateAuditPatch({ floor_area: 500