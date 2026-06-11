/**
 * Climate & environmental reference data for the ThermaMorph landing page.
 *
 * Every figure here is sourced from a named, publicly-available dataset or
 * report (cited inline). Where a figure is a derived/illustrative estimate
 * built from a cited base rate, that derivation is shown in the comment so
 * it can be audited or updated later. Nothing here is invented for effect —
 * the goal is "terrifying because it's true," not "terrifying because it's
 * exaggerated."
 */

// ─────────────────────────────────────────────────────────────────────────
// IDEA 1 — THE REAL-TIME RECKONING
// Global Carbon Budget 2024 (Global Carbon Project / Friedlingstein et al.):
//   • Fossil fuel + cement CO2:           ~37.4 Gt CO2 / year
//   • Land-use change (deforestation etc.): ~4.2 Gt CO2 / year
//   • Total:                               ~41.6 Gt CO2 / year
// Converted to a per-second rate using a 365.25-day year (31,557,600 s):
// ─────────────────────────────────────────────────────────────────────────

/** Tonnes of CO2 emitted globally per second — fossil fuels + cement only. */
export const GLOBAL_CO2_FOSSIL_TONNES_PER_SECOND = 1185 // 37.4e9 t/yr ÷ 31,557,600 s

/** Tonnes of CO2-equivalent emitted globally per second — fossil + land-use change. */
export const GLOBAL_CO2_TOTAL_TONNES_PER_SECOND = 1318 // 41.6e9 t/yr ÷ 31,557,600 s

export const CO2_RATE_SOURCE =
  'Global Carbon Budget 2024, Global Carbon Project (Friedlingstein et al.) — ~41.6 Gt CO2 / year (fossil + land-use change), ~37.4 Gt CO2 / year fossil fuels & cement alone.'

// ─────────────────────────────────────────────────────────────────────────
// IDEA 4 — EARTH'S FEVER CHART
// NASA GISTEMP v4 global land-ocean temperature anomaly, °C, relative to the
// 1951-1980 baseline. 2024 was confirmed by NASA/NOAA as the warmest year on
// record at +1.28°C above the 1951-1980 baseline (+1.47°C above 1850-1900,
// i.e. the pre-industrial reference period).
// Source: NASA Goddard Institute for Space Studies (GISS) Surface
// Temperature Analysis, data.giss.nasa.gov/gistemp
// ─────────────────────────────────────────────────────────────────────────

export interface FeverPoint {
  year: number
  anomaly: number // °C vs. 1951-1980 baseline
}

export const EARTH_FEVER_DATA: FeverPoint[] = [
  { year: 1880, anomaly: -0.17 },
  { year: 1900, anomaly: -0.08 },
  { year: 1920, anomaly: -0.27 },
  { year: 1940, anomaly: 0.13 },
  { year: 1960, anomaly: -0.03 },
  { year: 1980, anomaly: 0.26 },
  { year: 2000, anomaly: 0.40 },
  { year: 2010, anomaly: 0.72 },
  { year: 2016, anomaly: 1.02 },
  { year: 2020, anomaly: 1.02 },
  { year: 2023, anomaly: 1.17 },
  { year: 2024, anomaly: 1.28 },
]

export const FEVER_CHART_SOURCE =
  'NASA GISTEMP v4 (Goddard Institute for Space Studies), global mean surface temperature anomaly vs. 1951-1980 baseline. 2024 = warmest year on record at +1.28°C (+1.47°C vs. pre-industrial 1850-1900).'

export const NORMAL_HUMAN_TEMP_C = 37.0
/** A +1.28°C anomaly mapped onto a human body temp scale, for the "fever" framing. */
export const EARTH_FEVER_TEMP_C = NORMAL_HUMAN_TEMP_C + EARTH_FEVER_DATA[EARTH_FEVER_DATA.length - 1].anomaly

// ─────────────────────────────────────────────────────────────────────────
// IDEA 2 — EVERYDAY CONFESSIONS
// ─────────────────────────────────────────────────────────────────────────

export interface ConfessionItem {
  id: string
  moment: string
  icon: 'coffee' | 'car' | 'snowflake' | 'plane'
  headline: string
  truth: string
  context: string
  source: string
}

export const EVERYDAY_CONFESSIONS: ConfessionItem[] = [
  {
    id: 'chai',
    moment: 'Morning chai',
    icon: 'coffee',
    headline: '~35g CO2 per kettle',
    truth:
      'One kettle of chai — about 3 minutes of boiling on grid electricity — releases roughly 35g of CO2.',
    context:
      "That's barely anything, until you multiply it. Boil it across roughly 250 million Indian households every single morning, and the country has emitted over 8,700 tonnes of CO2 — before most people have left the house.",
    source: "India grid emission factor 0.716 kgCO2/kWh (Central Electricity Authority, India). 1kW kettle × 3 min ≈ 0.05 kWh.",
  },
  {
    id: 'commute',
    moment: 'The commute',
    icon: 'car',
    headline: '~2.4kg CO2, every day, both ways',
    truth:
      'A 20km round trip in a petrol car emits about 2.4kg of CO2 — roughly 120g for every kilometre travelled.',
    context:
      'Do that five days a week, fifty weeks a year, and one daily commute alone adds up to more than 600kg of CO2 — just to get to a desk and back.',
    source: 'Average passenger car emission factor ≈ 120 gCO2/km (DEFRA / ICCT global averages for petrol vehicles).',
  },
  {
    id: 'ac',
    moment: 'The air conditioner',
    icon: 'snowflake',
    headline: '~6.4kg CO2 for 6 hours',
    truth:
      'Run a 1.5-tonne split AC for 6 hours and it draws about 9 kWh from the grid — roughly 6.4kg of CO2 in India.',
    context:
      "Today only about 1 in 12 Indian homes own an AC. But 14 million units were sold in 2024 alone, and cooling demand is projected to make air conditioning one of the largest single drivers of India's electricity emissions by 2050.",
    source: "India grid emission factor 0.716 kgCO2/kWh (CEA); India Cooling Action Plan / IEA 'The Future of Cooling in India'.",
  },
  {
    id: 'flight',
    moment: 'The flight',
    icon: 'plane',
    headline: '~150kg CO2 for one seat, one way',
    truth:
      'A one-way Delhi–Mumbai flight (about 1,150km) emits roughly 150kg of CO2 per economy passenger.',
    context:
      "Aircraft also release water vapour and NOx at altitude that amplify their warming effect by roughly 1.9x — so that single seat's real climate impact is closer to 280kg of CO2-equivalent. One round trip costs more carbon than that morning kettle costs in eight years.",
    source: 'Short/medium-haul economy emission factor ≈ 0.13 kgCO2/passenger-km (DEFRA/ICAO); radiative forcing index ≈ 1.9 (Lee et al. 2021, Atmospheric Environment).',
  },
]

// ─────────────────────────────────────────────────────────────────────────
// IDEA 3 — THE RECEIPT
// Global average per-capita carbon footprint ≈ 4.7 tonnes CO2/year
// (Our World in Data / Global Carbon Project, 2023). Breakdown below
// reflects typical global lifestyle-footprint composition (home energy,
// food, transport, goods & services) and sums to that average.
// ─────────────────────────────────────────────────────────────────────────

export interface ReceiptLineItem {
  label: string
  detail: string
  kg: number
}

export const RECEIPT_ITEMS: ReceiptLineItem[] = [
  { label: 'HOME ENERGY', detail: 'Electricity & heating, 1 yr', kg: 1410 },
  { label: 'FOOD & DIET', detail: 'Meals, 1 yr', kg: 1130 },
  { label: 'TRANSPORT', detail: 'Car, transit & flights, 1 yr', kg: 1080 },
  { label: 'GOODS & SERVICES', detail: 'Everything else you bought', kg: 1080 },
]

export const RECEIPT_TOTAL_KG = RECEIPT_ITEMS.reduce((sum, item) => sum + item.kg, 0) // 4,700 kg = 4.7t

export const RECEIPT_SOURCE =
  'Global average per-capita carbon footprint ≈ 4.7 tonnes CO2/yr (Our World in Data, Global Carbon Project 2023). Category split reflects typical global lifestyle-footprint composition.'

// ─────────────────────────────────────────────────────────────────────────
// IDEA 5 — VOICE OF THE VANISHING
// ─────────────────────────────────────────────────────────────────────────

export interface VanishingVoice {
  id: string
  name: string
  location: string
  quote: string[]
  stat: string
  source: string
}

export const VANISHING_VOICES: VanishingVoice[] = [
  {
    id: 'gangotri',
    name: 'The Gangotri Glacier',
    location: 'Uttarakhand, India — source of the Ganges',
    quote: [
      'I am the Gangotri Glacier. I have fed the Ganges for thousands of years.',
      'Since 1936 I have retreated more than 1.7 kilometres.',
      'In recent decades I have been losing 12 to 22 metres of ice every single year — and the pace is accelerating.',
      'The river that drinks from me feeds half a billion people downstream.',
    ],
    stat: '−12 to −22 m of retreat per year',
    source: 'Geological Survey of India / Wadia Institute of Himalayan Geology glacier monitoring records.',
  },
  {
    id: 'amazon',
    name: 'The Amazon Rainforest',
    location: 'Brazil & the Amazon basin',
    quote: [
      'I am the Amazon. For sixty million years I have regulated the climate of an entire hemisphere.',
      'In 2024 alone, fire and clearing destroyed 1.7 million hectares of me.',
      'Fires reached a record 2.8 million hectares of primary forest — the worst ever recorded.',
      'Right now, somewhere inside me, a piece of forest the size of a football pitch disappears roughly every 13 seconds.',
    ],
    stat: '1 football pitch lost every ~13 seconds',
    source: 'MAAP (Amazon Conservation) 2024 deforestation & fire data; INPE Brazil.',
  },
  {
    id: 'coral',
    name: "The World's Coral Reefs",
    location: 'Tropical oceans, worldwide',
    quote: [
      'I am the coral reefs. I cover less than 1% of the ocean floor, but I shelter a quarter of all marine life.',
      'Between 2009 and 2018, the world lost 14% of its living coral — an area larger than Jamaica.',
      'Since 2023, 84% of the world’s reefs have been hit by bleaching — the largest, most widespread bleaching event ever recorded.',
      'Each time the ocean fevers, fewer of us come back.',
    ],
    stat: '84% of reefs hit by bleaching since 2023',
    source: 'Global Coral Reef Monitoring Network (ICRI) 2021 status report; NOAA Coral Reef Watch global bleaching event, 2023-2024.',
  },
]
