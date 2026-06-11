'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Lock, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) { setError(authError.message); return }
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-8 shadow-2xl text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Password updated</h2>
        <p className="text-slate-300 text-sm">Taking you to your dashboard&hellip;</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Choose a new password</h1>
      <p className="text-slate-400 text-sm mb-8">
        Set a new password for your ThermaMorph account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="New password" htmlFor="password" hint="Minimum 8 characters">
          <Input
            id="password"
            type="password"
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
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
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}
