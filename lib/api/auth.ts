/**
 * Route authentication helper.
 *
 * Extracts and verifies the session user in a single call, keeping
 * the auth boilerplate out of every individual route handler.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if (!auth.ok) return auth.error   // ready-to-return NextResponse 401
 *   const { user, supabase } = auth   // fully typed from here
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// Discriminated union: caller checks `.ok` once, then gets narrowed types
type AuthOk   = { ok: true;  user: User; supabase: Awaited<ReturnType<typeof createClient>>; error: null }
type AuthFail = { ok: false; user: null; supabase: null; error: NextResponse }
export type AuthResult = AuthOk | AuthFail
// AppSupabase matches the return of createClient; not exported to keep coupling low

/**
 * Returns the authenticated user and a typed Supabase client.
 * On failure returns a ready-to-return 401 NextResponse.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      user: null,
      supabase: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true, user, supabase: supabase as unknown as Awaited<ReturnType<typeof createClient>>, error: null }
}
