'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Copy, CheckCheck, Loader2, AlertCircle,
  Zap, Leaf, DollarSign, TrendingDown, BarChart3, Download,
} from 'lucide-react'
import { AppShell, ContentColumn } from '@/components/layout/PageWrapper'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ProgressBar'
import { StatCard } from '@/components/ui/StatCard'
import { EnergyBreakdownChart } from '@/components/charts/EnergyBreakdownChart'
import { CarbonSavingsChart } from '@/components/charts/CarbonSavingsChart'
import { cn, formatNumber, formatCurrency, scoreToGrade } from '@/lib/utils'
import { SEVERITY_COLORS } from '@/lib/types'
import type {
  AuditRow,
  AnalysisResultRow,
  ProblemAreaRow,
  RoadmapItemRow,
  EnergyBreakdownRow,
} from '@/lib/supabase/queries'

// ─── Types ─────────────────────────────────────────────────────────────────

interface AuditPageData {
  audit:           AuditRow
  results:         AnalysisResultRow
  problemAreas:    ProblemAreaRow[]
  roadmapItems:    RoadmapItemRow[]
  energyBreakdown: EnergyBreakdownRow[]
}

// ─── Chart adapter types (narrow DB rows into chart-friendly shapes) ─────────

interface BreakdownChartItem {
  id:         string
  category:   string
  kwhPerYear: number
  percentage: number
  color:      string
}

interface RoadmapChartItem {
  id:          string
  title:       string
  description: string
  effort:      string
  roiMonths:   number | null
  costRange:   { min: number | null; max: number | null }
  co2SavingKg: number
  priority:    number
}

const CHART_COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16']

const TABS = ['Overview', 'Problem Areas', 'Roadmap', 'Contractor Brief'] as const
type Tab = typeof TABS[number]

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tab,       setTab]       = useState<Tab>('Overview')
  const [copied,    setCopied]    = useState(false)
  const [exporting, setExporting] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [data,      setData]      = useState<AuditPageData | null>(null)

  const loadResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/audits/${id}`)
      if (!res.ok) { setError('Results not found.'); setLoading(false); return }
      const json = await res.json() as AuditPageData & { audit: AuditRow }
      if (json.audit.status !== 'complete') {
        router.push(`/analysis/${id}`)
        return
      }
      setData(json)
      setLoading(false)
    } catch {
      setError('Failed to load results.')
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadResults() }, [loadResults])

  async function handleCopy() {
    if (!data?.results?.contractor_brief) return
    await navigator.clipboard.writeText(data.results.contractor_brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExport() {
    if (!data) return
    setExporting(true)
    if (data.results?.contractor_brief) {
      try { await navigator.clipboard.writeText(data.results.contractor_brief) } catch { /* ignore */ }
    }
    setTimeout(() => {
      window.print()
      setExporting(false)
    }, 200)
  }

  if (loading) {
    return (
      <AppShell>
        <Sidebar />
        <ContentColumn>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </ContentColumn>
      </AppShell>
    )
  }

  if (error || !data) {
    return (
      <AppShell>
        <Sidebar />
        <ContentColumn>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-slate-600">{error || 'Results unavailable'}</p>
            <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
          </div>
        </ContentColumn>
      </AppShell>
    )
  }

  const { audit, results, problemAreas, roadmapItems, energyBreakdown } = data
  const score = results.carbon_score
  const grade = scoreToGrade(score)

  // Adapt DB rows into chart-friendly shapes
  const breakdownForChart: BreakdownChartItem[] = energyBreakdown.map((e, i) => ({
    id:         `e${i}`,
    category:   e.category,
    kwhPerYear: e.kwh_per_year,
    percentage: e.percentage,
    color:      CHART_COLORS[i % CHART_COLORS.length],
  }))

  const roadmapForChart: RoadmapChartItem[] = roadmapItems.map((r, i) => ({
    id:          `r${i}`,
    title:       r.title,
    description: r.description,
    effort:      r.effort,
    roiMonths:   r.roi_months,
    costRange:   { min: r.cost_min, max: r.cost_max },
    co2SavingKg: r.co2_saving_kg ?? 0,
    priority:    r.priority,
  }))

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-content, #print-content * { visibility: visible !important; }
          #print-content { position: absolute; inset: 0; padding: 32px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <AppShell>
        <Sidebar className="no-print" />
        <ContentColumn>
          <Header
            title={audit.name}
            description={`${audit.building_type} | ${audit.location} | Built ${audit.build_year}`}
            action={
              <div className="flex items-center gap-2 no-print">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                  icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                >
                  {exporting ? 'Preparing…' : 'Export PDF'}
                </Button>
              </div>
            }
          />

          <div id="print-content" className="p-6 space-y-6">

            {/* Print-only header */}
            <div className="hidden print:block mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600 font-black text-xl">ThermaMorph</span>
                <span className="text-slate-400 text-sm">Carbon Audit Report</span>
              </div>
              <p className="text-xs text-slate-500">
                Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Score hero */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <ScoreRing score={score} size={140} label="Carbon Score" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-slate-900">Grade {grade}</h2>
                    <Badge variant={score < 40 ? 'success' : score < 70 ? 'warning' : 'danger'}>
                      {score < 40 ? 'Efficient' : score < 70 ? 'Needs Work' : 'High Risk'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-5 max-w-lg leading-relaxed">
                    {score < 40
                      ? 'This building performs well. Minor optimisations can push it to net-zero.'
                      : score < 70
                      ? 'Moderate carbon risk. Several improvements can significantly cut emissions and costs.'
                      : 'High carbon footprint detected. Immediate action recommended to reduce costs and emissions.'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Annual CO₂"        value={formatNumber(results.annual_co2_kg)}        unit="kg"    accent="red"     />
                    <StatCard label="Energy Use"         value={formatNumber(results.annual_energy_kwh)}   unit="kWh"   accent="amber"   />
                    <StatCard label="Annual Cost"        value={formatCurrency(results.estimated_annual_cost)}           accent="blue"    />
                    <StatCard
                      label="Savings Potential"
                      value={`${results.potential_savings_pct}%`}
                      accent="emerald"
                      delta={{
                        value: `${formatCurrency(results.estimated_annual_cost * results.potential_savings_pct / 100)}/yr`,
                        positive: true,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 no-print">
              <nav aria-label="Results sections" className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    aria-pressed={tab === t}
                    aria-current={tab === t ? 'page' : undefined}
                    className={cn(
                      'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                      tab === t
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview */}
            {tab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-500" /> Energy Breakdown
                  </h3>
                  {breakdownForChart.length > 0
                    ? <EnergyBreakdownChart data={breakdownForChart} />
                    : <p className="text-slate-400 text-sm">No breakdown data available.</p>}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" /> Energy by Category
                  </h3>
                  {breakdownForChart.length > 0 ? (
                    <div className="space-y-3">
                      {breakdownForChart.map((e) => (
                        <div key={e.category} className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ background: e.color }} />
                          <span className="flex-1 text-sm text-slate-700">{e.category}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${e.percentage}%`, background: e.color }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-10 text-right">
                            {e.percentage.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No data available.</p>
                  )}
                </div>
              </div>
            )}

            {/* Problem Areas */}
            {tab === 'Problem Areas' && (
              <div className="space-y-3">
                {problemAreas.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <Leaf className="h-6 w-6 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">No significant issues found</p>
                      <p className="text-xs text-emerald-600 mt-0.5">This building appears to be in good condition.</p>
                    </div>
                  </div>
                ) : (
                  problemAreas.map((p) => {
                    const sev = SEVERITY_COLORS[p.severity]
                    const icon = ({ critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' } as Record<string, string>)[p.severity] ?? '⚪'
                    return (
                      <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{icon}</span>
                            <h4 className="text-sm font-semibold text-slate-900">{p.title}</h4>
                          </div>
                          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full shrink-0', sev?.bg, sev?.text)}>
                            {p.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-3 leading-relaxed">{p.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          {p.location && (
                            <span className="flex items-center gap-1">
                              📍 <strong className="text-slate-600">{p.location}</strong>
                            </span>
                          )}
                          {(p.estimated_loss_kwh ?? 0) > 0 && (
                            <span>Est. loss: <strong className="text-slate-600">{formatNumber(p.estimated_loss_kwh ?? 0)} kWh/yr</strong></span>
                          )}
                          {((p.fix_cost_min ?? 0) > 0 || (p.fix_cost_max ?? 0) > 0) && (
                            <span>Fix cost: <strong className="text-slate-600">{formatCurrency(p.fix_cost_min ?? 0)} – {formatCurrency(p.fix_cost_max ?? 0)}</strong></span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Roadmap */}
            {tab === 'Roadmap' && (
              <div className="space-y-6">
                {roadmapForChart.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-emerald-500" /> CO₂ Savings by Action
                    </h3>
                    <CarbonSavingsChart data={roadmapForChart} />
                  </div>
                )}
                <div className="space-y-3">
                  {roadmapItems.map((r, i) => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-xs font-black shrink-0 shadow-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-900">{r.title}</h4>
                            <Badge variant={r.effort === 'quick' ? 'success' : r.effort === 'medium' ? 'warning' : 'neutral'}>
                              {r.effort}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mb-3 leading-relaxed">{r.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                            {(r.cost_min ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(r.cost_min ?? 0)} – {formatCurrency(r.cost_max ?? 0)}
                              </span>
                            )}
                            {(r.roi_months ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-blue-500 font-medium">
                                <TrendingDown className="h-3 w-3" /> ROI in {r.roi_months} months
                              </span>
                            )}
                            {(r.co2_saving_kg ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <Leaf className="h-3 w-3" /> Saves {formatNumber(r.co2_saving_kg ?? 0)} kg CO₂/yr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contractor Brief */}
            {tab === 'Contractor Brief' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Scope of Work Document</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Ready to paste into an email or contractor portal</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      icon={copied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    >
                      {copied ? 'Copied!' : 'Copy text'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleExport}
                      disabled={exporting}
                      icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    >
                      Export PDF
                    </Button>
                  </div>
                </div>
                <pre className="p-6 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-loose overflow-auto max-h-[65vh] bg-white">
                  {results.contractor_brief ?? 'No contractor brief generated.'}
                </pre>
              </div>
            )}

          </div>
        </ContentColumn>
      </AppShell>
    </>
  )
}
