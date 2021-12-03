import { ble } from './index'

declare var tank_types: any
declare var propane_ratio: any

type TankRegionSetting = {
  /** Displayed country name */
  name: string

  /** Key/Id used by tank_types[] map for each set of country "regions".  This have a 1:many mapping to countries. */
  tankRegionKey: string
}

type TankRegionMap = {
  [key: string]: TankRegionSetting
}

export class TankRegionPicker {
  private static readonly id = 'tankRegionPicker'
  static readonly regions: TankRegionMap = {
    ar: {
      name: 'Argentina',
      tankRegionKey: 'ar',
    },
    au: {
      name: 'Australia',
      tankRegionKey: 'au',
    },
    br: {
      name: 'Brazil',
      tankRegionKey: 'br',
    },
    ca: {
      name: 'Canada',
      tankRegionKey: 'en',
    },
    mx: {
      name: 'Mexico',
      tankRegionKey: 'mx',
    },
    cl: {
      name: 'Chile',
      tankRegionKey: 'cl',
    },
    co: {
      name: 'Colombia',
      tankRegionKey: 'co',
    },
    ec: {
      name: 'Ecuador',
      tankRegionKey: 'ec',
    },
    il: {
      name: 'Israel',
      tankRegionKey: 'il',
    },
    nz: {
      name: 'New Zealand',
      tankRegionKey: 'au',
    },
    pe: {
      name: 'Peru',
      tankRegionKey: 'pe',
    },
    tt: {
      name: 'Trinidad and Tobago',
      tankRegionKey: 'tt',
    },
    jm: {
      name: 'Jamaica',
      tankRegionKey: 'jm',
    },
    py: {
      name: 'Paraguay',
      tankRegionKey: 'py',
    },
    ph: {
      name: 'Philippines',
      tankRegionKey: 'ph',
    },
    za: {
      name: 'South Africa',
      tankRegionKey: 'za',
    },
    kr: {
      name: 'South Korea',
      tankRegionKey: 'kr',
    },
    uy: {
      name: 'Uruguay',
      tankRegionKey: 'uy',
    },
    us: {
      name: 'United States',
      tankRegionKey: 'en',
    },

    // Follow are generics for when country doesn't match
    eu: {
      name: 'Other - Europe',
      tankRegionKey: 'eu',
    },
    es: {
      name: 'Other - Latin America',
      tankRegionKey: 'es',
    },
    en: {
      name: 'Other - North America',
      tankRegionKey: 'en',
    },
  }

  public static getDefaultPropaneRatio(region): number {
    if (propane_ratio.hasOwnProperty(region)) {
      return propane_ratio[region]
    } else if (propane_ratio.hasOwnProperty('default')) {
      propane_ratio.default
    }

    return 1
  }

  public static getAvailableCountries(): TankRegionMap {
    let countryList: TankRegionMap = {}

    //for each build list without flag
    for (let id in TankRegionPicker.regions) {
      let reg = TankRegionPicker.regions[id]
      if (tank_types[reg.tankRegionKey]) {
        countryList[id] = reg
      }
    }

    return countryList
  }

  private static getDefaultRegion(): {
    countryId: string
    region: TankRegionSetting
  } {
    // First check to see if country matches here (and use that region)
    let region = TankRegionPicker.regions[ble.defaultCountryId]
    if (region && tank_types[region.tankRegionKey]) {
      return { countryId: ble.defaultCountryId, region }
    }

    // Search for generic or "other" settings if country doesn't match
    region = TankRegionPicker.regions[ble.defaultTankRegionId]
    if (region && tank_types[region.tankRegionKey]) {
      return { countryId: ble.defaultTankRegionId, region }
    }

    // Else find the first country that matches default region
    for (let countryId in TankRegionPicker.regions) {
      let region = TankRegionPicker.regions[countryId]
      if (region.tankRegionKey === ble.defaultTankRegionId && tank_types[region.tankRegionKey]) {
        return { countryId, region: region }
      }
    }

    // Must return something
    if (tank_types[TankRegionPicker.regions.us.tankRegionKey]) {
      return { countryId: 'us', region: TankRegionPicker.regions.us }
    }

    // Now really should never get here! Bad config.  Just return the first thing we can find
    for (let countryId in TankRegionPicker.regions) {
      let region = TankRegionPicker.regions[countryId]
      if (tank_types[region.tankRegionKey]) {
        return { countryId, region: region }
      }
    }

    return { countryId: 'us', region: TankRegionPicker.regions.us }
  }

  public static getRegionByCountryId(
    countryId: string,
    strict?: boolean
  ): { countryId: string; region: TankRegionSetting } {
    let region = TankRegionPicker.regions[countryId]
    if (region && tank_types[region.tankRegionKey]) {
      return { countryId, region }
    }
    if (strict) return null
    return TankRegionPicker.getDefaultRegion()
  }

  public static getRegionByName(regionName: string): { countryId: string; region: TankRegionSetting } {
    for (let countryId in TankRegionPicker.regions) {
      let region = TankRegionPicker.regions[countryId]
      if (region.name === regionName && tank_types[region.tankRegionKey]) {
        return { countryId, region }
      }
    }
    return TankRegionPicker.getDefaultRegion()
  }
}
