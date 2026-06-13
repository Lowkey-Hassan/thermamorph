import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { validateAuditCreate } from '@/lib/api/validators'
import { insertAudit } from '@/lib/supabase/queries'
import type { Database } from '@/lib/supabase/database.types'

type AuditRow = Database['public']['Tables']['audits']['Row']

/** GET /api/audits — list all audits for the authenticated user */
export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as unknown as {
      data: AuditRow[] | null
      error: { message: string } | null
    }

  if (error) {
    console.error('[GET /api/audits]', error.message)
    return NextResponse.json({ error: 'Failed to load audits' }, { status: 500 })
  }

  return NextResponse.json({ audits: data ?? [] })
}

/** POST /api/audits — create a new audit draft */
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const { user, supabase } = auth

  let rawBody: Record<string, unknown>
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let fields
  try {
    fields = validateAuditCreate(rawBody)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid input' },
      { status: 400 }
    )
  }

  const { data, error } = await insertAudit(supabase, {
    user_id:           user.id,
    name:              fields.name,
    building_type:     fields.buildingType,
    build_year:        fields.buildYear,
    floor_area:        fields.floorArea,
    location:          fields.location,
    hvac_type:         fields.hvacType,
    hvac_install_year: fields.hvacInstallYear,
    status:            'draft',
  })

  if (error || !data) {
    console.error('[POST /api/audits]', error?.message)
    return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 })
  }

  return NextResponse.json({ audit: data }, { status: 201 })
}
