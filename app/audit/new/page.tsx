'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Image as ImageIcon, ChevronRight, ChevronLeft, Building2, Loader2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import { AppShell, ContentColumn } from '@/components/layout/PageWrapper'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input, Field, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { extractGPSFromFiles } from '@/lib/analysis/exif-extractor'
import { detectClimateZoneFromGPS } from '@/lib/analysis/knowledge-base'
import { BUILDING_TYPE_LABELS, HVAC_TYPE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const ZONES = ['windows', 'doors', 'walls', 'vents', 'hvac', 'roof', 'exterior', 'other'] as const
type Zone = typeof ZONES[number]

/** Photo categories the analysis engine relies on most. The audit form
 *  guides users to cover each of these — missing categories produce a
 *  warning since the carbon estimate will be far less accurate. */
const REQUIRED_ZONES: { zone: Zone; label: string; hint: string }[] = [
  { zone: 'windows',  label: 'Windows',     hint: 'Glazing type, frame condition, drafts' },
  { zone: 'doors',    label: 'Doors',       hint: 'Seals, materials, gaps' },
  { zone: 'walls',    label: 'Walls',       hint: 'Insulation, cracks, exterior cladding' },
  { zone: 'vents',    label: 'Vents',       hint: 'Ventilation, ducting, airflow points' },
  { zone: 'hvac',     label: 'HVAC System', hint: 'AC unit, heater, or boiler — make, age, condition' },
  { zone: 'exterior', label: 'Exterior',    hint: 'Roofline, facade, overall building shot' },
]

/** Display labels for the zone <select> dropdown. */
const ZONE_LABELS: Record<Zone, string> = {
  windows:  'Windows',
  doors:    'Doors',
  walls:    'Walls',
  vents:    'Vents',
  hvac:     'HVAC System',
  roof:     'Roof',
  exterior: 'Exterior',
  other:    'Other',
}

interface UploadedFile {
  id: string
  file: File
  zone: Zone
  preview: string
  uploading: boolean
  storagePath?: string
  error?: string
}

const STEPS = ['Building Details', 'Upload Photos', 'Review & Submit']

export default function NewAuditPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState('')

  // Step 0 fields
  const [form, setForm] = useState({
    name: '',
    buildingType: '',
    buildYear: '',
    floorArea: '',
    location: '',
    hvacType: '',
    hvacInstallYear: '',  // optional — year current HVAC system was installed
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  // Step 1 files
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [gpsDetected, setGpsDetected] = useState<string | null>(null)
  const [ackMissing, setAckMissing] = useState(false)

  const coveredZones = new Set(files.map((f) => f.zone))
  const missingRequired = REQUIRED_ZONES.filter((r) => !coveredZones.has(r.zone))

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  function validateStep0() {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.buildingType) e.buildingType = 'Select a type'
    if (!form.buildYear || Number(form.buildYear) < 1800 || Number(form.buildYear) > new Date().getFullYear())
      e.buildYear = 'Enter a valid year'
    if (!form.floorArea || Number(form.floorArea) <= 0) e.floorArea = 'Enter floor area'
    if (!form.location.trim()) e.location = 'Required'
    if (!form.hvacType) e.hvacType = 'Select HVAC type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function addFiles(raw: File[]) {
    const valid = raw.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
    const newFiles: UploadedFile[] = valid.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      zone: 'other',
      preview: URL.createObjectURL(f),
      uploading: false,
    }))
    setFiles((prev) => [...prev, ...newFiles])

    // Try to extract GPS from photos and auto-fill location if empty
    try {
      const imageFiles = valid.filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        const exif = await extractGPSFromFiles(imageFiles)
        if (exif.hasGPS && exif.lat != null && exif.lon != null) {
          const zone = detectClimateZoneFromGPS(exif.lat, exif.lon)
          if (!form.location.trim()) {
            setField('location', zone.cityName)
          }
          setGpsDetected(zone.cityName)
        }
      }
    } catch {
      // EXIF extraction is best-effort — never block the upload
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id)
      if (f) URL.revokeObjectURL(f.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  function setFileZone(id: string, zone: Zone) {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, zone } : f))
  }

  async function handleSubmit() {
    if (files.length === 0) {
      setGlobalError('Please upload at least one photo of the building.')
      return
    }
    setSubmitting(true)
    setGlobalError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // 1. Create the audit record
      const auditRes = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          buildingType: form.buildingType,
          buildYear: Number(form.buildYear),
          floorArea: Number(form.floorArea),
          location: form.location,
          hvacType: form.hvacType,
          hvacInstallYear: form.hvacInstallYear ? Number(form.hvacInstallYear) : null,
        }),
      })

      if (!auditRes.ok) {
        const { error } = await auditRes.json()
        throw new Error(error ?? 'Failed to create audit')
      }

      const { audit } = await auditRes.json()
      const auditId = audit.id

      // 2. Update status to uploading
      await fetch(`/api/audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'uploading' }),
      })

      // 3. Upload each file to Supabase Storage
      for (const f of files) {
        setFiles((prev) =>
          prev.map((x) => x.id === f.id ? { ...x, uploading: true } : x)
        )

        const ext = f.file.name.split('.').pop() ?? 'jpg'
        const storagePath = `${user.id}/${auditId}/${f.id}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('building-photos')
          .upload(storagePath, f.file, { contentType: f.file.type, upsert: false })

        if (uploadError) {
          setFiles((prev) =>
            prev.map((x) => x.id === f.id ? { ...x, uploading: false, error: uploadError.message } : x)
          )
          continue
        }

        // Register upload record — cast required due to postgrest-js v2 type inference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('audit_uploads').insert({
          audit_id: auditId,
          storage_path: storagePath,
          file_name: f.file.name,
          file_size: f.file.size,
          mime_type: f.file.type,
          zone: f.zone,
        })

        setFiles((prev) =>
          prev.map((x) => x.id === f.id ? { ...x, uploading: false, storagePath } : x)
        )
      }

      // 4. Navigate to analysis page (which will trigger the AI analysis)
      router.push(`/analysis/${auditId}`)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <Sidebar />
      <ContentColumn>
        <Header
          title="New Building Audit"
          description="Run an AI-powered carbon footprint analysis on your building"
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 max-w-3xl">
          {/* Stepper */}
          <div className="flex items-center mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < step ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-emerald-600 text-white' :
                  'bg-slate-100 text-slate-400'
                )}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={cn(
                  'ml-2 text-sm font-medium',
                  i === step ? 'text-slate-900' : 'text-slate-400'
                )}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn('mx-4 h-px w-12 flex-shrink-0', i < step ? 'bg-emerald-500' : 'bg-slate-200')} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Building details */}
          {step === 0 && (
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Audit Name" required htmlFor="name" error={errors.name}>
                    <Input
                      id="name"
                      placeholder="e.g. HQ Office Block - London"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      error={!!errors.name}
                    />
                  </Field>
                </div>

                <Field label="Building Type" required htmlFor="buildingType" error={errors.buildingType}>
                  <Select
                    id="buildingType"
                    value={form.buildingType}
                    onChange={(e) => setField('buildingType', e.target.value)}
                    error={!!errors.buildingType}
                    placeholder="Select type..."
                    options={Object.entries(BUILDING_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </Field>

                <Field label="HVAC System" required htmlFor="hvacType" error={errors.hvacType}>
                  <Select
                    id="hvacType"
                    value={form.hvacType}
                    onChange={(e) => setField('hvacType', e.target.value)}
                    error={!!errors.hvacType}
                    placeholder="Select HVAC..."
                    options={Object.entries(HVAC_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </Field>

                <Field
                  label="HVAC Install Year"
                  htmlFor="hvacInstallYear"
                  hint="If your AC/heating was replaced after construction, enter that year for accurate analysis"
                >
                  <Input
                    id="hvacInstallYear"
                    type="number"
                    placeholder={`e.g. ${new Date().getFullYear() - 5}`}
                    value={form.hvacInstallYear}
                    onChange={(e) => setField('hvacInstallYear', e.target.value)}
                    min={1970}
                    max={new Date().getFullYear()}
                  />
                </Field>

                <Field label="Year Built" required htmlFor="buildYear" error={errors.buildYear}>
                  <Input
                    id="buildYear"
                    type="number"
                    placeholder="e.g. 1985"
                    value={form.buildYear}
                    onChange={(e) => setField('buildYear', e.target.value)}
                    error={!!errors.buildYear}
                    min={1800}
                    max={new Date().getFullYear()}
                  />
                </Field>

                <Field label="Floor Area (m2)" required htmlFor="floorArea" error={errors.floorArea}>
                  <Input
                    id="floorArea"
                    type="number"
                    placeholder="e.g. 450"
                    value={form.floorArea}
                    onChange={(e) => setField('floorArea', e.target.value)}
                    error={!!errors.floorArea}
                    min={1}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Location / City" required htmlFor="location" error={errors.location}>
                    <Input
                      id="location"
                      placeholder="e.g. Chennai, India"
                      value={form.location}
                      onChange={(e) => { setField('location', e.target.value); setGpsDetected(null) }}
                      error={!!errors.location}
                    />
                    {gpsDetected && (
                      <p className="text-xs text-emerald-600 mt-1">
                        📍 Location auto-detected from photo GPS: <strong>{gpsDetected}</strong>
                      </p>
                    )}
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => validateStep0() && setStep(1)} icon={<ChevronRight className="h-4 w-4" />} iconPosition="right">
                  Next: Upload Photos
                </Button>
              </div>
            </Card>
          )}

          {/* Step 1: Photo upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Required photo checklist */}
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">What to upload</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  For an accurate carbon estimate, upload at least one photo (or a short video frame) covering each
                  area below. Tag each file using the dropdown after you upload it.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REQUIRED_ZONES.map((r) => {
                    const done = coveredZones.has(r.zone)
                    return (
                      <li key={r.zone} className="flex items-start gap-2.5">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <p className={cn('text-sm font-medium', done ? 'text-slate-700' : 'text-slate-900')}>
                            {r.label}
                          </p>
                          <p className="text-xs text-slate-400">{r.hint}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>

              {/* Dropzone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload zone — click or press Enter to select photos or video"
                className={cn(
                  'rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
                  dragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  aria-label="Upload building photos or video"
                  className="hidden"
                  onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                />
                <Upload className="mx-auto h-10 w-10 text-slate-300 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-700">
                  Drop photos here or <span className="text-emerald-600">click to browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPEG, PNG, WEBP, MP4. Cover all areas in the checklist above: windows, doors, walls, vents,
                  HVAC system, and exterior.
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 bg-white">
                      <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-slate-100">
                        {f.file.type.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-slate-400 m-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{f.file.name}</p>
                        <p className="text-xs text-slate-400">{(f.file.size / 1024 / 1024).toFixed(1)} MB</p>
                        {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                      </div>
                      <select
                        value={f.zone}
                        onChange={(e) => setFileZone(f.id, e.target.value as Zone)}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {ZONES.map((z) => (
                          <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                        ))}
                      </select>
                      {f.uploading ? (
                        <Loader2 className="h-4 w-4 text-emerald-500 animate-spin flex-shrink-0" />
                      ) : f.storagePath ? (
                        <Badge variant="success">Uploaded</Badge>
                      ) : (
                        <button
                          onClick={() => removeFile(f.id)}
                          aria-label={`Remove ${f.file.name}`}
                          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Missing-photo warning */}
              {missingRequired.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Missing photos: </span>
                      {missingRequired.map((r) => r.label).join(', ')}.
                      Warning: if you don&rsquo;t upload everything, you won&rsquo;t get a proper output.
                    </p>
                    <label className="flex items-center gap-2 text-xs font-medium text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ackMissing}
                        onChange={(e) => setAckMissing(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Continue anyway — I understand the results may be inaccurate
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)} icon={<ChevronLeft className="h-4 w-4" />}>Back</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={missingRequired.length > 0 && !ackMissing}
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-500" /> Building Summary
                </h3>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['Audit Name', form.name],
                    ['Building Type', BUILDING_TYPE_LABELS[form.buildingType as keyof typeof BUILDING_TYPE_LABELS] ?? form.buildingType],
                    ['Year Built', form.buildYear],
                    ['Floor Area', `${form.floorArea} m2`],
                    ['Location', form.location],
                    ['HVAC System', HVAC_TYPE_LABELS[form.hvacType as keyof typeof HVAC_TYPE_LABELS] ?? form.hvacType],
                    ...(form.hvacInstallYear ? [['HVAC Install Year', form.hvacInstallYear]] : []),
                    ['Photos', `${files.length} file${files.length !== 1 ? 's' : ''}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              {globalError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {globalError}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} icon={<ChevronLeft className="h-4 w-4" />}>Back</Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  size="lg"
                  icon={submitting ? undefined : <ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  {submitting ? 'Uploading...' : 'Submit & Analyse'}
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </ContentColumn>
    </AppShell>
  )
}
