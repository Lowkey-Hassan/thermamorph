'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Mail, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
      })
      if (authError) { setError(authError.message); return }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-8 shadow-2xl text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-slate-300 text-sm">
          If an account exists for <strong className="text-white">{email}</strong>, we&rsquo;ve
          sent a link to reset your password. Click it to choose a new password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
      <p className="text-slate-400 text-sm mb-8">
        Enter the email address associated with your account and we&rsquo;ll send you a link to
        reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={loading} size="lg">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered your password?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
