/**
 * ThermaMorph Knowledge Base
 * Building energy data sourced from ASHRAE 90.1, BRE BREDEM, and Indian BEE standards.
 * All values are engineering estimates — suitable for screening-level audits.
 */

// ─── U-Values by construction era (W/m²K) ──────────────────────────────────
// Lower = better insulation. ASHRAE 90.1 reference values.
export interface UValueProfile {
  walls: number      // External wall thermal transmittance
  roof: number       // Roof/ceiling thermal transmittance
  windows: number    // Glazing thermal transmittance
  floor: number      // Ground floor thermal transmittance
  doors: number      // External door thermal transmittance
  airtightness: number // Air changes per hour (ACH) at 50 Pa
}

export const U_VALUES_BY_ERA: Record<string, UValueProfile> = {
  pre_1950: { walls: 2.1, roof: 1.8, windows: 5.8, floor: 1.2, doors: 3.5, airtightness: 15 },
  '1950_1970': { walls: 1.7, roof: 1.4, windows: 5.6, floor: 1.0, doors: 3.2, airtightness: 12 },
  '1970_1990': { walls: 1.2, roof: 0.9, windows: 3.8, floor: 0.8, doors: 2.8, airtightness: 9 },
  '1990_2005': { walls: 0.8, roof: 0.5, windows: 2.8, floor: 0.6, doors: 2.2, airtightness: 7 },
  '2005_2015': { walls: 0.45, roof: 0.3, windows: 1.8, floor: 0.45, doors: 1.8, airtightness: 5 },
  post_2015: { walls: 0.28, roof: 0.18, windows: 1.2, floor: 0.3, doors: 1.4, airtightness: 3 },
}

export function getEraKey(buildYear: number): string {
  if (buildYear < 1950) return 'pre_1950'
  if (buildYear < 1970) return '1950_1970'
  if (buildYear < 1990) return '1970_1990'
  if (buildYear < 2005) return '1990_2005'
  if (buildYear < 2015) return '2005_2015'
  return 'post_2015'
}

// ─── Best-practice U-values (ASHRAE 90.1-2019 / BEE ECBC 2017) ─────────────
export const BEST_PRACTICE_U_VALUES: UValueProfile = {
  walls: 0.28,
  roof: 0.18,
  windows: 1.2,
  floor: 0.25,
  doors: 1.4,
  airtightness: 2,
}

// ─── HVAC Efficiency Factors ────────────────────────────────────────────────
export interface HvacProfile {
  heatingCOP: number   // Coefficient of Performance for heating
  coolingCOP: number   // COP for cooling (EER / 3.412)
  ventilationEfficiency: number  // Heat recovery effectiveness 0-1
  baseLoadMultiplier: number     // Multiplier on base energy load
  label: string
}

export const HVAC_PROFILES: Record<string, HvacProfile> = {
  central_ac: {
    heatingCOP: 1.0,
    coolingCOP: 3.0,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 1.0,
    label: 'Central Air Conditioning',
  },
  split_ac: {
    heatingCOP: 3.2,
    coolingCOP: 3.5,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 0.85,
    label: 'Split AC Units',
  },
  window_ac: {
    heatingCOP: 1.0,
    coolingCOP: 2.4,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 1.15,
    label: 'Window AC Units',
  },
  heat_pump: {
    heatingCOP: 3.5,
    coolingCOP: 3.8,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 0.7,
    label: 'Heat Pump',
  },
  vrf_vrv: {
    heatingCOP: 4.0,
    coolingCOP: 4.2,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 0.65,
    label: 'VRF/VRV System',
  },
  gas_boiler: {
    heatingCOP: 0.82,
    coolingCOP: 2.8,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 1.2,
    label: 'Gas Boiler',
  },
  electric_resistance: {
    heatingCOP: 1.0,
    coolingCOP: 2.0,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 1.4,
    label: 'Electric Resistance Heating',
  },
  evaporative_cooler: {
    heatingCOP: 1.0,
    coolingCOP: 1.8,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 1.3,
    label: 'Evaporative Cooler',
  },
  natural_ventilation: {
    heatingCOP: 1.0,
    coolingCOP: 1.0,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 0.6,
    label: 'Natural Ventilation Only',
  },
  none: {
    heatingCOP: 1.0,
    coolingCOP: 1.0,
    ventilationEfficiency: 0.0,
    baseLoadMultiplier: 0.5,
    label: 'No Mechanical HVAC',
  },
}

export function getHvacProfile(hvacType: string): HvacProfile {
  const key = hvacType.toLowerCase().replace(/[\s\-\/]/g, '_')
  for (const [k, v] of Object.entries(HVAC_PROFILES)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  // Fallback matching
  if (key.includes('split') || key.includes('inverter')) return HVAC_PROFILES.split_ac
  if (key.includes('vrf') || key.includes('vrv')) return HVAC_PROFILES.vrf_vrv
  if (key.includes('heat_pump') || key.includes('heatpump')) return HVAC_PROFILES.heat_pump
  if (key.includes('gas') || key.includes('boiler')) return HVAC_PROFILES.gas_boiler
  if (key.includes('window')) return HVAC_PROFILES.window_ac
  if (key.includes('central')) return HVAC_PROFILES.central_ac
  if (key.includes('none') || key.includes('no_hvac') || key.includes('fan')) return HVAC_PROFILES.none
  return HVAC_PROFILES.split_ac // Most common in India
}

// ─── Climate Zones ──────────────────────────────────────────────────────────
export interface ClimateZone {
  name: string
  heatingDegreeDays: number   // HDD base 18°C
  coolingDegreeDays: number   // CDD base 18°C
  solarIrradiance: number     // Annual kWh/m² horizontal
  humidityFactor: number      // 1.0 = baseline, >1 = extra cooling load for dehumidification
  lat?: number                // Approximate latitude for GPS-based detection
  lon?: number                // Approximate longitude for GPS-based detection
}

// India climate zones per ECBC 2017 + selected international cities
export const CLIMATE_ZONES: Record<string, ClimateZone> = {
  // India — hot and dry
  jaipur:      { name: 'Hot & Dry',     heatingDegreeDays: 120, coolingDegreeDays: 2800, solarIrradiance: 1950, humidityFactor: 1.0,  lat: 26.92, lon: 75.79 },
  ahmedabad:   { name: 'Hot & Dry',     heatingDegreeDays: 80,  coolingDegreeDays: 3100, solarIrradiance: 2000, humidityFactor: 1.1,  lat: 23.03, lon: 72.59 },
  jodhpur:     { name: 'Hot & Dry',     heatingDegreeDays: 100, coolingDegreeDays: 3000, solarIrradiance: 2050, humidityFactor: 0.95, lat: 26.30, lon: 73.02 },
  // India — warm and humid
  mumbai:      { name: 'Warm & Humid',  heatingDegreeDays: 10,  coolingDegreeDays: 2600, solarIrradiance: 1750, humidityFactor: 1.35, lat: 19.08, lon: 72.88 },
  chennai:     { name: 'Warm & Humid',  heatingDegreeDays: 5,   coolingDegreeDays: 3000, solarIrradiance: 1900, humidityFactor: 1.4,  lat: 13.08, lon: 80.27 },
  kolkata:     { name: 'Warm & Humid',  heatingDegreeDays: 50,  coolingDegreeDays: 2800, solarIrradiance: 1700, humidityFactor: 1.45, lat: 22.57, lon: 88.36 },
  // India — composite
  delhi:       { name: 'Composite',     heatingDegreeDays: 350, coolingDegreeDays: 2500, solarIrradiance: 1850, humidityFactor: 1.2,  lat: 28.61, lon: 77.23 },
  bangalore:   { name: 'Composite',     heatingDegreeDays: 200, coolingDegreeDays: 1500, solarIrradiance: 1800, humidityFactor: 1.15, lat: 12.97, lon: 77.59 },
  hyderabad:   { name: 'Composite',     heatingDegreeDays: 150, coolingDegreeDays: 2200, solarIrradiance: 1900, humidityFactor: 1.2,  lat: 17.38, lon: 78.49 },
  pune:        { name: 'Composite',     heatingDegreeDays: 180, coolingDegreeDays: 1800, solarIrradiance: 1850, humidityFactor: 1.15, lat: 18.52, lon: 73.86 },
  nagpur:      { name: 'Composite',     heatingDegreeDays: 200, coolingDegreeDays: 2400, solarIrradiance: 1950, humidityFactor: 1.1,  lat: 21.15, lon: 79.09 },
  // India — moderate
  shimla:      { name: 'Moderate',      heatingDegreeDays: 1800, coolingDegreeDays: 200, solarIrradiance: 1400, humidityFactor: 0.9,  lat: 31.10, lon: 77.17 },
  // India — cold
  srinagar:    { name: 'Cold',          heatingDegreeDays: 2800, coolingDegreeDays: 100, solarIrradiance: 1200, humidityFactor: 0.85, lat: 34.08, lon: 74.80 },
  // International
  london:      { name: 'Temperate',     heatingDegreeDays: 2200, coolingDegreeDays: 150, solarIrradiance: 1050, humidityFactor: 1.0,  lat: 51.51, lon: -0.13 },
  new_york:    { name: 'Mixed-Humid',   heatingDegreeDays: 1800, coolingDegreeDays: 900, solarIrradiance: 1300, humidityFactor: 1.2,  lat: 40.71, lon: -74.01 },
  dubai:       { name: 'Hot & Dry',     heatingDegreeDays: 20,  coolingDegreeDays: 4200, solarIrradiance: 2200, humidityFactor: 1.3,  lat: 25.20, lon: 55.27 },
  singapore:   { name: 'Tropical',      heatingDegreeDays: 0,   coolingDegreeDays: 3600, solarIrradiance: 1600, humidityFactor: 1.5,  lat: 1.35,  lon: 103.82 },
  // Default fallback
  default:     { name: 'Composite',     heatingDegreeDays: 250, coolingDegreeDays: 2200, solarIrradiance: 1800, humidityFactor: 1.2 },
}

export function detectClimateZone(location: string): ClimateZone {
  const loc = location.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  for (const [key, zone] of Object.entries(CLIMATE_ZONES)) {
    if (key === 'default') continue
    if (loc.includes(key.replace(/_/g, ' ')) || loc.includes(key)) {
      return zone
    }
  }
  // Try partial matching
  const cityMap: Record<string, string> = {
    'new delhi': 'delhi', 'ncr': 'delhi', 'gurugram': 'delhi', 'gurgaon': 'delhi', 'noida': 'delhi', 'faridabad': 'delhi',
    'bengaluru': 'bangalore', 'blr': 'bangalore',
    'hyd': 'hyderabad', 'secunderabad': 'hyderabad',
    'bombay': 'mumbai', 'thane': 'mumbai', 'navi mumbai': 'mumbai',
    'madras': 'chennai', 'coimbatore': 'chennai',
    'calcutta': 'kolkata',
    'jamshedpur': 'kolkata',
    'chandigarh': 'delhi',
    'lucknow': 'delhi', 'kanpur': 'delhi',
    'surat': 'ahmedabad', 'vadodara': 'ahmedabad',
    'kochi': 'chennai', 'thiruvananthapuram': 'chennai',
  }
  for (const [alias, key] of Object.entries(cityMap)) {
    if (loc.includes(alias)) return CLIMATE_ZONES[key]
  }
  return CLIMATE_ZONES.default
}

/**
 * Detect climate zone from GPS coordinates (from EXIF data).
 * Finds nearest city using Euclidean distance on lat/lon.
 */
export function detectClimateZoneFromGPS(lat: number, lon: number): ClimateZone & { cityName: string } {
  let nearest = 'default'
  let minDist = Infinity
  for (const [key, zone] of Object.entries(CLIMATE_ZONES)) {
    if (key === 'default' || zone.lat == null || zone.lon == null) continue
    const d = Math.sqrt(Math.pow(lat - zone.lat, 2) + Math.pow(lon - zone.lon, 2))
    if (d < minDist) { minDist = d; nearest = key }
  }
  // Only use GPS match if within ~500km (approx 4.5 degrees)
  if (minDist > 4.5) return { ...CLIMATE_ZONES.default, cityName: 'Unknown' }
  return { ...CLIMATE_ZONES[nearest], cityName: nearest.charAt(0).toUpperCase() + nearest.slice(1).replace(/_/g, ' ') }
}


// ─── Building Base Energy Intensities (kWh/m²/year) ────────────────────────
// Based on ECBC 2017, ASHRAE 90.1, and CBECS 2018 survey data
export interface BuildingTypeProfile {
  baseEnergyIntensity: number    // kWh/m²/year (reference climate, modern construction)
  hvacFraction: number           // HVAC share of total energy 0-1
  lightingFraction: number
  hotWaterFraction: number
  appliancesFraction: number
  ventilationFraction: number
  occupancyHoursPerDay: number
  label: string
}

export const BUILDING_TYPES: Record<string, BuildingTypeProfile> = {
  residential: {
    baseEnergyIntensity: 85,
    hvacFraction: 0.42,
    lightingFraction: 0.12,
    hotWaterFraction: 0.22,
    appliancesFraction: 0.18,
    ventilationFraction: 0.06,
    occupancyHoursPerDay: 16,
    label: 'Residential',
  },
  apartment: {
    baseEnergyIntensity: 75,
    hvacFraction: 0.38,
    lightingFraction: 0.10,
    hotWaterFraction: 0.25,
    appliancesFraction: 0.20,
    ventilationFraction: 0.07,
    occupancyHoursPerDay: 16,
    label: 'Apartment/Flat',
  },
  office: {
    baseEnergyIntensity: 185,
    hvacFraction: 0.52,
    lightingFraction: 0.22,
    hotWaterFraction: 0.04,
    appliancesFraction: 0.16,
    ventilationFraction: 0.06,
    occupancyHoursPerDay: 10,
    label: 'Office',
  },
  commercial: {
    baseEnergyIntensity: 220,
    hvacFraction: 0.48,
    lightingFraction: 0.28,
    hotWaterFraction: 0.05,
    appliancesFraction: 0.14,
    ventilationFraction: 0.05,
    occupancyHoursPerDay: 12,
    label: 'Commercial / Retail',
  },
  industrial: {
    baseEnergyIntensity: 320,
    hvacFraction: 0.22,
    lightingFraction: 0.12,
    hotWaterFraction: 0.08,
    appliancesFraction: 0.52,
    ventilationFraction: 0.06,
    occupancyHoursPerDay: 16,
    label: 'Industrial / Warehouse',
  },
  hospital: {
    baseEnergyIntensity: 480,
    hvacFraction: 0.55,
    lightingFraction: 0.15,
    hotWaterFraction: 0.18,
    appliancesFraction: 0.08,
    ventilationFraction: 0.04,
    occupancyHoursPerDay: 24,
    label: 'Hospital / Healthcare',
  },
  school: {
    baseEnergyIntensity: 110,
    hvacFraction: 0.45,
    lightingFraction: 0.25,
    hotWaterFraction: 0.06,
    appliancesFraction: 0.18,
    ventilationFraction: 0.06,
    occupancyHoursPerDay: 8,
    label: 'School / Education',
  },
  hotel: {
    baseEnergyIntensity: 280,
    hvacFraction: 0.50,
    lightingFraction: 0.18,
    hotWaterFraction: 0.20,
    appliancesFraction: 0.08,
    ventilationFraction: 0.04,
    occupancyHoursPerDay: 24,
    label: 'Hotel / Hospitality',
  },
}

export function getBuildingTypeProfile(buildingType: string): BuildingTypeProfile {
  const t = buildingType.toLowerCase()
  if (t.includes('apartment') || t.includes('flat') || t.includes('condo')) return BUILDING_TYPES.apartment
  if (t.includes('office') || t.includes('corporate') || t.includes('cowork')) return BUILDING_TYPES.office
  if (t.includes('commercial') || t.includes('retail') || t.includes('shop') || t.includes('mall')) return BUILDING_TYPES.commercial
  if (t.includes('industrial') || t.includes('warehouse') || t.includes('factory')) return BUILDING_TYPES.industrial
  if (t.includes('hospital') || t.includes('clinic') || t.includes('health')) return BUILDING_TYPES.hospital
  if (t.includes('school') || t.includes('university') || t.includes('college') || t.includes('education')) return BUILDING_TYPES.school
  if (t.includes('hotel') || t.includes('resort') || t.includes('hospitality')) return BUILDING_TYPES.hotel
  return BUILDING_TYPES.residential
}

// ─── Carbon Intensity (kg CO2 per kWh) ─────────────────────────────────────
// Source: IEA Electricity Maps, Central Electricity Authority (India) 2023
export const CARBON_INTENSITY: Record<string, number> = {
  india: 0.716,       // CEA India grid average 2023
  delhi: 0.82,        // Northern Grid (coal-heavy)
  maharashtra: 0.68,  // Western Grid
  karnataka: 0.52,    // Southern Grid (more renewables)
  tamil_nadu: 0.55,
  gujarat: 0.71,
  uk: 0.233,
  usa: 0.386,
  eu: 0.275,
  singapore: 0.408,
  uae: 0.450,
  default: 0.716,     // India default
}

export function getCarbonIntensity(location: string): number {
  const loc = location.toLowerCase()
  if (loc.includes('delhi') || loc.includes('ncr') || loc.includes('gurugram') || loc.includes('noida')) return CARBON_INTENSITY.delhi
  if (loc.includes('mumbai') || loc.includes('pune') || loc.includes('maharashtra') || loc.includes('nagpur')) return CARBON_INTENSITY.maharashtra
  if (loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('karnataka')) return CARBON_INTENSITY.karnataka
  if (loc.includes('chennai') || loc.includes('tamil') || loc.includes('coimbatore')) return CARBON_INTENSITY.tamil_nadu
  if (loc.includes('ahmedabad') || loc.includes('gujarat') || loc.includes('surat')) return CARBON_INTENSITY.gujarat
  if (loc.includes('uk') || loc.includes('london') || loc.includes('england')) return CARBON_INTENSITY.uk
  if (loc.includes('usa') || loc.includes('new york') || loc.includes('united states')) return CARBON_INTENSITY.usa
  if (loc.includes('singapore')) return CARBON_INTENSITY.singapore
  if (loc.includes('dubai') || loc.includes('uae') || loc.includes('emirates')) return CARBON_INTENSITY.uae
  return CARBON_INTENSITY.default
}

// ─── Energy Cost (USD per kWh) ───────────────────────────────────────────────
export const ENERGY_COST_PER_KWH: Record<string, number> = {
  india_residential: 0.085,   // ~₹7/kWh average
  india_commercial: 0.12,     // ~₹10/kWh commercial tariff
  uk: 0.29,
  usa: 0.16,
  eu: 0.22,
  singapore: 0.21,
  uae: 0.08,
  default: 0.10,
}

// Countries/regions outside India that should fall back to the EU energy
// rate when no more specific match (UK/USA/Singapore/UAE) applies.
const EU_LOCATION_KEYWORDS = [
  'europe', 'germany', 'france', 'spain', 'italy', 'netherlands', 'belgium',
  'austria', 'portugal', 'ireland', 'poland', 'sweden', 'norway', 'denmark',
  'finland', 'switzerland', 'greece',
]

export function getEnergyCostPerKwh(location: string, buildingType: string): number {
  const loc = location.toLowerCase()
  const isIndia = !loc.includes('uk') && !loc.includes('usa') &&
                  !loc.includes('singapore') && !loc.includes('dubai') && !loc.includes('uae') &&
                  !EU_LOCATION_KEYWORDS.some((kw) => loc.includes(kw))
  if (!isIndia) {
    if (loc.includes('uk') || loc.includes('london')) return ENERGY_COST_PER_KWH.uk
    if (loc.includes('usa') || loc.includes('new york')) return ENERGY_COST_PER_KWH.usa
    if (loc.includes('singapore')) return ENERGY_COST_PER_KWH.singapore
    if (loc.includes('dubai') || loc.includes('uae')) return ENERGY_COST_PER_KWH.uae
    return ENERGY_COST_PER_KWH.eu
  }
  const t = buildingType.toLowerCase()
  if (t.includes('residential') || t.includes('apartment') || t.includes('flat')) {
    return ENERGY_COST_PER_KWH.india_residential
  }
  return ENERGY_COST_PER_KWH.india_commercial
}

// ─── Retrofit Cost Database (USD) ───────────────────────────────────────────
// Per m² unless noted. Source: ESCO India market surveys, RSMeans 2023
export const RETROFIT_COSTS = {
  // Envelope
  wallInsulation: { minPerM2: 8, maxPerM2: 25, label: 'Wall insulation' },
  roofInsulation: { minPerM2: 5, maxPerM2: 18, label: 'Roof/ceiling insulation' },
  doubleGlazing: { minPerM2: 80, maxPerM2: 200, label: 'Double-glazed windows' },
  tripleGlazing: { minPerM2: 150, maxPerM2: 350, label: 'Triple-glazed windows' },
  doorReplacement: { minEach: 150, maxEach: 500, label: 'External door replacement' },
  weatherstripping: { minEach: 15, maxEach: 60, label: 'Weatherstripping per opening' },
  // HVAC
  splitAcUpgrade: { minEach: 600, maxEach: 1200, label: '5-star inverter AC unit' },
  vrfSystem: { minPerM2: 35, maxPerM2: 70, label: 'VRF/VRV system' },
  heatPump: { minEach: 2500, maxEach: 6000, label: 'Air source heat pump' },
  hvacControls: { minEach: 200, maxEach: 800, label: 'Smart HVAC controls/BMS' },
  // Lighting
  ledRetrofit: { minPerM2: 3, maxPerM2: 12, label: 'LED lighting retrofit' },
  lightingControls: { minPerM2: 5, maxPerM2: 20, label: 'Occupancy sensors & daylight controls' },
  // Renewables
  solarPV: { minPerKwp: 700, maxPerKwp: 1100, label: 'Solar PV panels' },
  solarHotWater: { minEach: 400, maxEach: 900, label: 'Solar hot water system' },
  // Building management
  buildingEnergyMgmt: { minEach: 1500, maxEach: 5000, label: 'Building energy management system' },
  airSealingAudit: { minEach: 300, maxEach: 800, label: 'Air sealing & pressure test' },
}
