'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Building2, Zap, Leaf, AlertTriangle, LogOut,
  CheckCircle, Clock, Loader2, XCircle, BarChart3, X,
  TrendingDown, ChevronRight, ArrowUpRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { AppShell, ContentColumn } from '@/components/layout/PageWrapper'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ProgressBar'
import { createClient } from '@/lib/supabase/client'
import { cn, scoreToGrade } from '@/lib/utils'
import type { Database } from '@/lib/supabase/database.types'

type Audit = Database['public']['Tables']['audits']['Row']

interface AuditScore {
  auditId: string
  carbonScore: number
  annualCo2Kg: number
  annualEnergyKwh: number
  estimatedAnnualCost: number
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft:     { label: 'Draft',     icon: <Clock className="h-3 w-3" />,                          color: 'text-slate-400' },
  uploading: { label: 'Uploading', icon: <Loader2 className="h-3 w-3 animate-spin" />,           color: 'text-blue-500'  },
  analyzing: { label: 'Analysing', icon: <Loader2 className="h-3 w-3 animate-spin" />,           color: 'text-amber-500' },
  complete:  { label: 'Complete',  icon: <CheckCircle className="h-3 w-3" />,                    color: 'text-emerald-500'},
  error:     { label: 'Error',     icon: <XCircle className="h-3 w-3" />,                        color: 'text-red-500'   },
}

function scoreColor(s: number) {
  if (s <= 35) return '#10b981'
  if (s <= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(s: number) {
  if (s <= 35) return 'Good'
  if (s <= 60) return 'Average'
  return 'Poor'
}

// ── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({
  audits,
  scores,
  onClose,
}: {
  audits: Audit[]
  scores: Record<string, AuditScore>
  onClose: () => void
}) {
  const completed = audits.filter((a) => a.status === 'complete' && scores[a.id])
  const chartData = completed
    .map((a) => ({
      name: a.name.length > 16 ? a.name.slice(0, 14) + '…' : a.name,
      score: scores[a.id].carbonScore,
      co2: Math.round(scores[a.id].annualCo2Kg / 1000),
      fullName: a.name,
      location: a.location,
    }))
    .sort((a, b) => a.score - b.score)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div className="w-full max-w-3xl bg-[#0f172a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 id="compare-modal-title" className="text-lg font-bold text-white">Audit Comparison</h2>
            <p className="text-sm text-slate-400 mt-0.5">Carbon scores across all your completed audits</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Chart */}
        <div className="px-6 pt-6 pb-2">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No completed audits to compare yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    label={{ value: 'Carbon Score', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#94a3b8' } }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-[#1e293b] border border-white/10 rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold text-white mb-1">{d.fullName}</p>
                          <p className="text-slate-400">{d.location}</p>
                          <p className="mt-1.5 font-bold" style={{ color: scoreColor(d.score) }}>
                            Score: {d.score}/100 — {scoreLabel(d.score)}
                          </p>
                          <p className="text-slate-300">CO₂: {d.co2} t/year</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={scoreColor(entry.score)} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Score legend */}
              <div className="flex items-center justify-center gap-6 mt-2 pb-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" /> Good (≤35)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" /> Average (36–60)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" /> Poor (&gt;60)</span>
              </div>
            </>
          )}
        </div>

        {/* Summary row */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02]">
            {[
              { label: 'Audits compared', value: chartData.length },
              { label: 'Best score', value: `${Math.min(...chartData.map((d) => d.score))}/100` },
              { label: 'Total CO₂/year', value: `${chartData.reduce((s, d) => s + d.co2, 0)} t` },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-4 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [audits, setAudits] = useState<Audit[]>([])
  const [scores, setScores] = useState<Record<string, AuditScore>>({})
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [showCompare, setShowCompare] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserName(user.user_metadata?.full_name ?? user.email ?? 'User')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: auditRows } = await (supabase as any)
      .from('audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const list: Audit[] = auditRows ?? []
    setAudits(list)

    // Fetch carbon scores for completed audits
    const completedIds = list.filter((a) => a.status === 'complete').map((a) => a.id)
    if (completedIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: results } = await (supabase as any)
        .from('analysis_results')
        .select('audit_id,carbon_score,annual_co2_kg,annual_energy_kwh,estimated_annual_cost')
        .in('audit_id', completedIds)

      const map: Record<string, AuditScore> = {}
      for (const r of results ?? []) {
        map[r.audit_id] = {
          auditId: r.audit_id,
          carbonScore: r.carbon_score,
          annualCo2Kg: r.annual_co2_kg,
          annualEnergyKwh: r.annual_energy_kwh,
          estimatedAnnualCost: r.estimated_annual_cost,
        }
      }
      setScores(map)
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const completed = audits.filter((a) => a.status === 'complete')
  const inProgress = audits.filter((a) => ['uploading', 'analyzing'].includes(a.status))
  const errors = audits.filter((a) => a.status === 'error')
  const totalCo2 = Object.values(scores).reduce((s, r) => s + r.annualCo2Kg, 0)

  return (
    <>
      {showCompare && (
        <CompareModal
          audits={audits}
          scores={scores}
          onClose={() => setShowCompare(false)}
        />
      )}

      <AppShell>
        <Sidebar />
        <ContentColumn>
          <Header
            title="Dashboard"
            description={`Welcome back${userName ? ', ' + userName.split(' ')[0] : ''}`}
            action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handleSignOut} icon={<LogOut className="h-4 w-4" />}>
                  Sign out
                </Button>
                <Link href="/audit/new">
                  <Button size="sm" icon={<Plus className="h-4 w-4" />}>New Audit</Button>
                </Link>
              </div>
            }
          />

          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* CO2 banner — shown once user has data */}
            {!loading && completed.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 text-white flex items-center justify-between gap-6 overflow-hidden relative">
                <div className="pointer-events-none absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-emerald-400 blur-3xl" />
                  <div className="absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-blue-400 blur-2xl" />
                </div>
                <div className="relative">
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Portfolio at a glance</p>
                  <p className="text-3xl font-bold">{Math.round(totalCo2 / 1000).toLocaleString()} tonnes</p>
                  <p className="text-slate-300 text-sm mt-0.5">Total annual CO₂ across {completed.length} audited building{completed.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative flex gap-3 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setShowCompare(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 border"
                    icon={<BarChart3 className="h-4 w-4" />}
                  >
                    Compare
                  </Button>
                </div>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Audits',   value: loading ? '—' : audits.length,     icon: Building2,     accent: 'bg-blue-500/10 text-blue-400'    },
                { label: 'Completed',      value: loading ? '—' : completed.length,  icon: CheckCircle,   accent: 'bg-emerald-500/10 text-emerald-400'},
                { label: 'In Progress',    value: loading ? '—' : inProgress.length, icon: Zap,           accent: 'bg-amber-500/10 text-amber-400'   },
                { label: 'Needs Attention',value: loading ? '—' : errors.length,     icon: AlertTriangle, accent: 'bg-red-500/10 text-red-400'       },
              ].map(({ label, value, icon: Icon, accent }) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-5 flex items-start gap-4">
                  <span className={cn('shrink-0 rounded-lg p-2.5', accent)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Audits table */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-semibold text-white">All Building Audits</h2>
                <Link href="/audit/new">
                  <Button size="sm" variant="outline" icon={<Plus className="h-3.5 w-3.5" />}>New Audit</Button>
                </Link>
              </div>

              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  aria-label="Loading audits"
                  className="flex items-center justify-center py-20 text-slate-500"
                >
                  <Loader2 className="h-6 w-6 animate-spin mr-2" aria-hidden="true" /> Loading...
                </div>
              ) : audits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Leaf className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-200 font-semibold text-lg">No audits yet</p>
                  <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                    Run your first building audit to see carbon scores, problem areas, and a decarbonisation roadmap.
                  </p>
                  <Link href="/audit/new">
                    <Button className="mt-2" icon={<Plus className="h-4 w-4" />}>Start First Audit</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {audits.map((audit) => {
                    const meta = STATUS_META[audit.status] ?? STATUS_META.draft
                    const isComplete = audit.status === 'complete'
                    const isInProgress = ['uploading', 'analyzing'].includes(audit.status)
                    const score = scores[audit.id]

                    return (
                      <div
                        key={audit.id}
                        role={isComplete ? 'button' : undefined}
                        tabIndex={isComplete ? 0 : undefined}
                        aria-label={isComplete ? `View results for ${audit.name}` : undefined}
                        className={cn(
                          'group flex items-center gap-4 px-6 py-4 transition-colors',
                          isComplete ? 'hover:bg-white/[0.04] cursor-pointer' : 'opacity-90'
                        )}
                        onClick={() => isComplete && router.push(`/results/${audit.id}`)}
                        onKeyDown={(e) => {
                          if (isComplete && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            router.push(`/results/${audit.id}`)
                          }
                        }}
                      >
                        {/* Score ring */}
                        <div className="shrink-0">
                          {isComplete && score ? (
                            <ScoreRing score={score.carbonScore} size={52} strokeWidth={5} />
                          ) : (
                            <div className="h-[52px] w-[52px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-slate-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{audit.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {audit.building_type} &middot; {audit.location} &middot; Built {audit.build_year}
                          </p>
                          {isComplete && score && (
                            <p className="text-xs mt-1 font-medium" style={{ color: scoreColor(score.carbonScore) }}>
                              {scoreLabel(score.carbonScore)} — {Math.round(score.annualCo2Kg / 1000)} t CO₂/yr
                            </p>
                          )}
                        </div>

                        {/* Grade badge */}
                        {isComplete && score ? (
                          <div
                            className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                            style={{ backgroundColor: scoreColor(score.carbonScore) }}
                          >
                            {scoreToGrade(100 - score.carbonScore)}
                          </div>
                        ) : null}

                        {/* Status */}
                        <div className={cn('flex items-center gap-1.5 text-xs font-medium shrink-0', meta.color)}>
                          {meta.icon}
                          <span className="hidden sm:inline">{meta.label}</span>
                        </div>

                        {/* Action */}
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          {isComplete ? (
                            <Link href={`/results/${audit.id}`}>
                              <Button size="sm" variant="outline" icon={<ChevronRight className="h-3.5 w-3.5" />} iconPosition="right">
                                Results
                              </Button>
                            </Link>
                          ) : audit.status === 'draft' ? (
                            <Link href="/audit/new">
                              <Button size="sm" variant="outline">Continue</Button>
                            </Link>
                          ) : isInProgress ? (
                            <Link href={`/analysis/${audit.id}`}>
                              <Button size="sm" variant="outline">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" /> Watch
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Plus,
                  title: 'New Building Audit',
                  desc: 'Upload photos and get a carbon score with decarbonisation roadmap.',
                  color: 'emerald',
                  action: () => router.push('/audit/new'),
                },
                {
                  icon: BarChart3,
                  title: 'Compare Audits',
                  desc: 'Overlay all your buildings on a single carbon score chart.',
                  color: 'blue',
                  action: () => setShowCompare(true),
                  disabled: completed.length < 2,
                  hint: completed.length < 2 ? 'Complete 2+ audits to compare' : undefined,
                },
                {
                  icon: TrendingDown,
                  title: 'Export Reports',
                  desc: 'Go to any completed audit result and click Export PDF.',
                  color: 'violet',
                  action: () => completed.length > 0 && router.push(`/results/${completed[0].id}`),
                  disabled: completed.length === 0,
                  hint: completed.length === 0 ? 'Complete an audit first' : undefined,
                },
              ].map(({ icon: Icon, title, desc, color, action, disabled, hint }) => (
                <button
                  key={title}
                  onClick={action}
                  disabled={disabled}
                  aria-disabled={disabled}
                  aria-label={hint ?? title}
                  className={cn(
                    'group rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-left transition-all',
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/[0.05] hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
                  )}
                >
                  <span className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-colors',
                    color === 'emerald' && 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
                    color === 'blue'    && 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
                    color === 'violet'  && 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    {title}
                    {!disabled && <ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{hint ?? desc}</p>
                </button>
              ))}
            </div>

          </div>
          </div>
        </ContentColumn>
      </AppShell>
    </>
  )
}
