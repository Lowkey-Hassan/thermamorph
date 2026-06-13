'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Leaf, Zap, BarChart3, FileText, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { icon: Leaf,       label: 'Preparing building context' },
  { icon: Zap,        label: 'Fetching uploaded photos' },
  { icon: Zap,        label: 'Sending images to AI vision model' },
  { icon: BarChart3,  label: 'Analysing thermal envelope' },
  { icon: BarChart3,  label: 'Calculating carbon impact' },
  { icon: FileText,   label: 'Generating decarbonisation roadmap' },
  { icon: CheckCircle,label: 'Finalising report' },
]

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'running' | 'error'>('running')
  const [errorMsg, setErrorMsg] = useState('')
  const analysisCalled = useRef(false)

  // Animate progress bar independently
  useEffect(() => {
    const target = Math.min(92, (currentStep / STEPS.length) * 100 + 5)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= target) { clearInterval(interval); return p }
        return Math.min(target, p + 0.4)
      })
    }, 40)
    return () => clearInterval(interval)
  }, [currentStep])

  // Advance step labels during analysis
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => (s < STEPS.length - 2 ? s + 1 : s))
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Trigger real analysis once
  useEffect(() => {
    if (analysisCalled.current) return
    analysisCalled.current = true

    async function runAnalysis() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const res = await fetch(`/api/audits/${id}/analyze`, { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setErrorMsg(data.error ?? 'Analysis failed')
          return
        }

        // Success — go to results
        setCurrentStep(STEPS.length - 1)
        setProgress(100)
        await new Promise((r) => setTimeout(r, 800))
        router.push(`/results/${id}`)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Unexpected error')
      }
    }

    runAnalysis()
  }, [id, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold text-white">ThermaMorph</span>
        </div>

        {status === 'error' ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-slate-300 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Return to Dashboard"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">AI Analysis in Progress</h1>
            <p className="text-slate-400 text-sm mb-10">
              AI is examining your building photos and generating a carbon assessment.
              This typically takes 30-60 seconds.
            </p>

            {/* Progress bar */}
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Analysis progress"
              className="w-full bg-white/10 rounded-full h-2 mb-10 overflow-hidden"
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step list */}
            <div aria-live="polite" aria-atomic="false" className="space-y-3 text-left">
              {STEPS.map(({ icon: Icon, label }, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <div
                    key={label}
                    className={[
                      'flex items-center gap-3 rounded-lg px-4 py-3 transition-all',
                      done   ? 'bg-emerald-500/10 text-emerald-400' :
                      active ? 'bg-white/5 text-white' :
                               'text-slate-600'
                    ].join(' ')}
                  >
                    <Icon className={['h-4 w-4 flex-shrink-0', active ? 'animate-pulse' : ''].join(' ')} />
                    <span className="text-sm font-medium">{label}</span>
                    {done && (
                      <CheckCircle className="h-4 w-4 ml-auto text-emerald-400" />
                    )}
                    {active && (
                      <div className="ml-auto flex gap-1">
                        {[0, 1, 2].map((j) => (
                          <div
                            key={j}
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
