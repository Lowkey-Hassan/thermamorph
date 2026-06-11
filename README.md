# ThermaMorph — AI-Powered Carbon Footprint Awareness Platform

> **Challenge Vertical:** Carbon Footprint & Climate Action
> **Built with:** Next.js 16, TypeScript, Tailwind CSS, Supabase, ASHRAE 90.1 Rule Engine

---

## 1. Chosen Vertical

**Carbon Footprint Awareness — Buildings & Energy**

Buildings account for 40–60% of a household's total carbon emissions, yet most people have no idea how efficient (or inefficient) their home or office actually is. ThermaMorph targets this gap: it turns a set of phone photos and five form fields into a professional-grade carbon audit — the same analysis that typically costs thousands of dollars from a licensed energy auditor.

---

## 2. Problem Statement Addressed

> *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

| Problem requirement | How ThermaMorph addresses it |
|---|---|
| **Understand** | Carbon score (0–100), grade (A–F), plain-English problem descriptions, energy breakdown chart |
| **Track** | Dashboard with all past audits, Compare modal overlaying multiple buildings on one chart |
| **Reduce** | Prioritised decarbonisation roadmap with cost, CO₂ saving, and ROI per action |
| **Simple actions** | Upload photos → fill 5 fields → get results in under 5 minutes |
| **Personalised insights** | Analysis is specific to building age, location (climate zone), floor area, HVAC type, and install year |

---

## 3. How the Solution Works

### User Flow

```
1. Register / Sign in
2. Create a new audit — enter name, location, build year, floor area, HVAC type
3. Upload photos — windows, walls, roof, AC unit (phone or desktop)
4. Analysis runs automatically (rule-based engine + optional AI vision)
5. Results dashboard — carbon score, energy breakdown, problem areas, roadmap
6. Export PDF report + copy-paste contractor brief
7. Compare across multiple audits on the dashboard
```

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (client + server components)        │
│                                                         │
│  Pages: Landing · Dashboard · Audit Form                │
│         Analysis · Results · Auth                       │
└────────────────┬────────────────────────────────────────┘
                 │ API Routes (/api/audits/*)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Analysis Pipeline                                      │
│                                                         │
│  1. EXIF extractor  → auto-detects GPS from photos      │
│  2. HF BLIP vision  → captions photos, finds signals    │
│  3. ASHRAE engine   → rule-based energy calculation     │
│     • Envelope heat loss (U-values by era)              │
│     • HVAC efficiency (COP by type and age)             │
│     • Climate zone adjustment (HDD/CDD)                 │
│     • Vision override pass (upgrades severity)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Storage + Auth)                 │
│  Tables: audits · analysis_results · problem_areas      │
│          roadmap_items · energy_breakdown · profiles    │
└─────────────────────────────────────────────────────────┘
```

### Energy Calculation Model — How the Carbon Score Is Actually Calculated

ThermaMorph's scoring engine (`lib/analysis/energy-engine.ts`, backed by reference
data in `lib/analysis/knowledge-base.ts`) is a **deterministic, rule-based
screening audit** — not a black box. It follows the methodology professional
energy auditors use under **ASHRAE 90.1** (Energy Standard for Buildings, used
for the steady-state heat-balance formula and U-value benchmarks) and the UK
BRE's **BREDEM** (Building Research Establishment Domestic Energy Model, used
for the degree-day climate adjustment and occupancy-based load split), localised
with **ECBC 2017 / BEE star-labelling** data for Indian construction. Every
number on the results page can be traced back to a formula and a cited constant
— no opaque ML sits between the audit inputs and the score.

The pipeline runs in nine steps:

**1. Era classification → U-values.** The building's construction year maps to a
U-value profile (W/m²K — lower is better insulation) for walls, roof, windows,
floor, doors, and airtightness (air changes/hour at 50 Pa):

| Era | Walls | Roof | Windows | Floor | Doors | Airtightness (ACH₅₀) |
|---|---|---|---|---|---|---|
| Pre-1950 | 2.10 | 1.80 | 5.8 | 1.20 | 3.5 | 15 |
| 1950–1970 | 1.70 | 1.40 | 5.6 | 1.00 | 3.2 | 12 |
| 1970–1990 | 1.20 | 0.90 | 3.8 | 0.80 | 2.8 | 9 |
| 1990–2005 | 0.80 | 0.50 | 2.8 | 0.60 | 2.2 | 7 |
| 2005–2015 | 0.45 | 0.30 | 1.8 | 0.45 | 1.8 | 5 |
| Post-2015 | 0.28 | 0.18 | 1.2 | 0.30 | 1.4 | 3 |
| **ASHRAE 90.1 / ECBC 2017 best practice** | **0.28** | **0.18** | **1.2** | **0.25** | **1.4** | **2** |

**2. Geometry estimation.** From the building's floor area alone (no architectural
plans needed), the engine derives a simplified envelope: `perimeter = √floorArea × 4`,
`wallArea = perimeter × 2.8 m` (average ceiling height), `windowArea = wallArea × 25%`
(typical window-to-wall ratio), `roofArea = floorArea × 1.1` (roof overhang factor),
`doorArea = 4 m²`.

**3. Envelope heat loss (the ASHRAE steady-state formula).** For each surface —
walls, roof, windows, floor, doors, plus air infiltration — the engine applies:

```
Q (kWh) = U × A × ΔT × hours / 1000
```

where `U` is the surface's thermal transmittance (W/m²K), `A` is its area (m²),
`ΔT` is the temperature differential driven by local heating/cooling degree-days,
and `hours` is the building's annual occupancy-weighted operating hours. Cooling
loss through windows additionally applies a **1.8× solar heat-gain factor** to
account for direct radiant heat. Infiltration loss uses
`ACH = airtightness ÷ 20` with a **0.33 Wh/m³K** specific heat capacity of air —
the standard BREDEM infiltration coefficient. The engine runs this twice — once
for the building's *actual* U-values, once for ASHRAE *best-practice* U-values —
and the difference becomes the **envelope penalty** added to the energy intensity.

**4. Climate & humidity adjustment.** Each location is mapped to a climate zone
(ECBC 2017 hot-dry / warm-humid / composite / temperate / cold zones, with
heating and cooling degree-days, e.g. Delhi ≈ 350 HDD / 2,500 CDD vs. Chennai ≈
5 HDD / 3,000 CDD) using either the entered location text or GPS coordinates from
photo EXIF data. This produces:

```
climateMultiplier  = 0.7 + 0.3 × (localDegreeDays / 2750)   // 2750 = Delhi reference
humidityMultiplier = 0.9 + 0.1 × humidityFactor              // e.g. Mumbai = 1.35
```

**5. HVAC efficiency & age degradation.** The selected HVAC system (split AC, VRF,
heat pump, gas boiler, evaporative cooler, natural ventilation, etc.) carries a
`baseLoadMultiplier` and Coefficient of Performance (COP) from the knowledge base
— a high-efficiency VRF system (COP ≈ 4.2, multiplier 0.65) draws far less energy
per degree of comfort than a window AC unit (COP ≈ 2.4, multiplier 1.15). On top
of this, every year of equipment age adds wear-based degradation:

```
ageDegradation = min(30%, hvacAgeYears × 0.8% per year)
```

**6. Composite energy intensity.** All of the above combine into a single
"adjusted energy intensity" (kWh/m²/year), starting from the building type's
baseline (residential ≈ 85, office ≈ 185, hospital ≈ 480, etc.):

```
adjustedIntensity = baseEnergyIntensity
                     × climateMultiplier
                     × humidityMultiplier
                     × hvac.baseLoadMultiplier
                     × (1 + ageDegradation)
                     + envelopePenalty
```

This drives two headline numbers: `annualEnergyKwh = adjustedIntensity × floorArea`,
and `annualCo2Kg = annualEnergyKwh × gridCarbonIntensity` (using regional grid
carbon factors — e.g. India national average 0.716 kgCO₂/kWh, UK 0.233, sourced
from CEA India / IEA Electricity Maps).

**7. Carbon Score — normalised 0–100.** Rather than show a raw, hard-to-interpret
kWh/m² figure, the engine benchmarks the building against the *realistic best and
worst case for its building type*:

```
bestCaseIntensity  = baseEnergyIntensity × 0.60   // a highly efficient building of this type
worstCaseIntensity = baseEnergyInte