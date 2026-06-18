/**
 * Unit tests — lib/analysis/knowledge-base.ts
 *
 * Coverage:
 *   getEraKey                 — construction-era boundaries (1950/1970/1990/2005/2015)
 *   getHvacProfile            — direct key match, fallback keyword matching, default fallback
 *   detectClimateZone         — direct city match, alias/cityMap matching, default fallback
 *   detectClimateZoneFromGPS  — nearest-neighbour match, distance threshold, cityName formatting
 *   getBuildingTypeProfile    — keyword matching for each building type, default fallback
 *   getCarbonIntensity        — region-specific lookups, default fallback
 *   getEnergyCostPerKwh       — India residential/commercial vs. international lookups
 */

import {
  getEraKey,
  getHvacProfile,
  detectClimateZone,
  detectClimateZoneFromGPS,
  getBuildingTypeProfile,
  getCarbonIntensity,
  getEnergyCostPerKwh,
  HVAC_PROFILES,
  CLIMATE_ZONES,
  BUILDING_TYPES,
} from '../lib/analysis/knowledge-base'

describe('getEraKey', () => {
  it('classifies pre-1950 construction', () => {
    expect(getEraKey(1900)).toBe('pre_1950')
    expect(getEraKey(1949)).toBe('pre_1950')
  })

  it('classifies the 1950-1970 boundary', () => {
    expect(getEraKey(1950)).toBe('1950_1970')
    expect(getEraKey(1969)).toBe('1950_1970')
  })

  it('classifies the 1970-1990 boundary', () => {
    expect(getEraKey(1970)).toBe('1970_1990')
    expect(getEraKey(1989)).toBe('1970_1990')
  })

  it('classifies the 1990-2005 boundary', () => {
    expect(getEraKey(1990)).toBe('1990_2005')
    expect(getEraKey(2004)).toBe('1990_2005')
  })

  it('classifies the 2005-2015 boundary', () => {
    expect(getEraKey(2005)).toBe('2005_2015')
    expect(getEraKey(2014)).toBe('2005_2015')
  })

  it('classifies post-2015 construction', () => {
    expect(getEraKey(2015)).toBe('post_2015')
    expect(getEraKey(2030)).toBe('post_2015')
  })
})

describe('getHvacProfile', () => {
  it('matches "Split AC" to the split_ac profile', () => {
    expect(getHvacProfile('Split AC')).toBe(HVAC_PROFILES.split_ac)
  })

  it('matches "Central AC" to the central_ac profile', () => {
    expect(getHvacProfile('Central AC')).toBe(HVAC_PROFILES.central_ac)
  })

  it('matches "VRF/VRV" to the vrf_vrv profile', () => {
    expect(getHvacProfile('VRF/VRV')).toBe(HVAC_PROFILES.vrf_vrv)
  })

  it('matches "Heat Pump" to the heat_pump profile', () => {
    expect(getHvacProfile('Heat Pump')).toBe(HVAC_PROFILES.heat_pump)
  })

  it('matches "Gas Boiler" to the gas_boiler profile', () => {
    expect(getHvacProfile('Gas Boiler')).toBe(HVAC_PROFILES.gas_boiler)
  })

  it('matches "None" to the no-HVAC profile', () => {
    expect(getHvacProfile('None')).toBe(HVAC_PROFILES.none)
  })

  it('falls back to split_ac via the "inverter" keyword', () => {
    expect(getHvacProfile('Inverter AC')).toBe(HVAC_PROFILES.split_ac)
  })

  it('defaults to split_ac for an unrecognized type', () => {
    expect(getHvacProfile('Some Exotic Cooling Gadget')).toBe(HVAC_PROFILES.split_ac)
  })

  it('falls back to vrf_vrv via the "vrf" keyword', () => {
    expect(getHvacProfile('VRF System')).toBe(HVAC_PROFILES.vrf_vrv)
  })

  it('falls back to heat_pump via the "heatpump" keyword', () => {
    expect(getHvacProfile('HeatPump Unit')).toBe(HVAC_PROFILES.heat_pump)
  })

  it('falls back to gas_boiler via the "gas" keyword', () => {
    expect(getHvacProfile('Gas Furnace')).toBe(HVAC_PROFILES.gas_boiler)
  })

  it('falls back to window_ac via the "window" keyword', () => {
    expect(getHvacProfile('Window Unit AC')).toBe(HVAC_PROFILES.window_ac)
  })

  it('falls back to central_ac via the "central" keyword', () => {
    expect(getHvacProfile('Central HVAC System')).toBe(HVAC_PROFILES.central_ac)
  })

  it('falls back to none via the "fan" keyword', () => {
    expect(getHvacProfile('Ceiling Fan Only')).toBe(HVAC_PROFILES.none)
  })
})

describe('detectClimateZone', () => {
  it('matches a city name directly', () => {
    expect(detectClimateZone('Mumbai, Maharashtra')).toBe(CLIMATE_ZONES.mumbai)
  })

  it('matches "New Delhi" to the delhi zone', () => {
    expect(detectClimateZone('New Delhi')).toBe(CLIMATE_ZONES.delhi)
  })

  it('resolves "Bengaluru" via the city alias map to bangalore', () => {
    expect(detectClimateZone('Bengaluru')).toBe(CLIMATE_ZONES.bangalore)
  })

  it('resolves "Gurugram" via the city alias map to delhi', () => {
    expect(detectClimateZone('Gurugram')).toBe(CLIMATE_ZONES.delhi)
  })

  it('falls back to the default zone for an unrecognized location', () => {
    expect(detectClimateZone('Atlantis')).toBe(CLIMATE_ZONES.default)
  })
})

describe('detectClimateZoneFromGPS', () => {
  it('finds the nearest city for coordinates close to Bangalore', () => {
    const result = detectClimateZoneFromGPS(12.97, 77.59)
    expect(result.cityName).toBe('Bangalore')
    expect(result.name).toBe(CLIMATE_ZONES.bangalore.name)
  })

  it('formats multi-word city keys with a space, capitalizing only the first letter', () => {
    const result = detectClimateZoneFromGPS(40.71, -74.01)
    expect(result.cityName).toBe('New york')
  })

  it('falls back to the default zone when no city is within ~500km', () => {
    const result = detectClimateZoneFromGPS(0, 0)
    expect(result.cityName).toBe('Unknown')
    expect(result.name).toBe(CLIMATE_ZONES.default.name)
  })
})

describe('getBuildingTypeProfile', () => {
  it('defaults unrecognized types to residential', () => {
    expect(getBuildingTypeProfile('Single Family Home')).toBe(BUILDING_TYPES.residential)
  })

  it('matches apartment/flat/condo to apartment', () => {
    expect(getBuildingTypeProfile('Apartment Complex')).toBe(BUILDING_TYPES.apartment)
  })

  it('matches office/corporate/cowork to office', () => {
    expect(getBuildingTypeProfile('Corporate Office Tower')).toBe(BUILDING_TYPES.office)
  })

  it('matches commercial/retail/shop/mall to commercial', () => {
    expect(getBuildingTypeProfile('Shopping Mall')).toBe(BUILDING_TYPES.commercial)
  })

  it('matches industrial/warehouse/factory to industrial', () => {
    expect(getBuildingTypeProfile('Distribution Warehouse')).toBe(BUILDING_TYPES.industrial)
  })

  it('matches hospital/clinic/health to hospital', () => {
    expect(getBuildingTypeProfile('Community Hospital')).toBe(BUILDING_TYPES.hospital)
  })

  it('matches school/university/college/education to school', () => {
    expect(getBuildingTypeProfile('State University')).toBe(BUILDING_TYPES.school)
  })

  it('matches hotel/resort/hospitality to hotel', () => {
    expect(getBuildingTypeProfile('Boutique Hotel')).toBe(BUILDING_TYPES.hotel)
  })
})

describe('getCarbonIntensity', () => {
  it('returns the Maharashtra grid intensity for Mumbai', () => {
    expect(getCarbonIntensity('Mumbai, India')).toBe(0.68)
  })

  it('returns the Karnataka grid intensity for Bangalore', () => {
    expect(getCarbonIntensity('Bangalore')).toBe(0.52)
  })

  it('returns the Delhi grid intensity for New Delhi', () => {
    expect(getCarbonIntensity('New Delhi')).toBe(0.82)
  })

  it('returns the UK intensity for London', () => {
    expect(getCarbonIntensity('London, UK')).toBe(0.233)
  })

  it('falls back to the India default for unrecognized locations', () => {
    expect(getCarbonIntensity('Somewhere Else')).toBe(0.716)
  })

  it('returns the Gujarat grid intensity for Ahmedabad', () => {
    expect(getCarbonIntensity('Ahmedabad, Gujarat')).toBe(0.71)
  })

  it('returns the USA intensity for New York', () => {
    expect(getCarbonIntensity('New York, USA')).toBe(0.386)
  })

  it('returns the UAE intensity for Dubai', () => {
    expect(getCarbonIntensity('Dubai, UAE')).toBe(0.450)
  })

  it('returns the Singapore carbon intensity', () => {
    expect(getCarbonIntensity('Singapore')).toBe(0.408)
  })
})

describe('getEnergyCostPerKwh', () => {
  it('returns the India residential rate for residential buildings', () => {
    expect(getEnergyCostPerKwh('Mumbai', 'residential')).toBe(0.085)
  })

  it('returns the India commercial rate for non-residential buildings', () => {
    expect(getEnergyCostPerKwh('Mumbai', 'Office Complex')).toBe(0.12)
  })

  it('returns the UK rate for London regardless of building type', () => {
    expect(getEnergyCostPerKwh('London, UK', 'residential')).toBe(0.29)
  })

  it('returns the UAE rate for Dubai', () => {
    expect(getEnergyCostPerKwh('Dubai, UAE', 'office')).toBe(0.08)
  })

  it('falls back to the EU rate for other international locations', () => {
    expect(getEnergyCostPerKwh('Berlin, Germany', 'residential')).toBe(0.22)
  })

  it('returns the USA rate for New York', () => {
    expect(getEnergyCostPerKwh('New York, USA', 'residential')).toBe(0.16)
  })

  it('returns the Singapore rate for Singapore', () => {
    expect(getEnergyCostPerKwh('Singapore', 'office')).toBe(0.21)
  })
})
