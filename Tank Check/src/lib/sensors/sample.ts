import _, { isNumber } from 'lodash'
import { utils } from '../utils'
import { ble } from '..'
import { HardwareFamily } from './tankcheck'

declare var app_brand: 'gascheck' | 'mttracker' | 'tankcheck' | 'vertrax' | 'yonke' | 'bmpro' | 'lippert' | 'eyegas'

export enum HardwareId {
  // Gen2/Standard
  STD = 2,
  XL = 3,
  BMPRO_STD = 70,

  // Pro Family IDs offset by 256 to separate from standard sensors
  UNKNOWN = 0 | 0x100, // If PRO is reporting this, it likely indicates an obscure hardware issue
  VERTRAX_STANDARD = 1 | 0x100,
  VERTRAX_BULK = 2 | 0x100,
  PRO_MOPEKA = 3 | 0x100, // Mopeka PRO LPG sensor
  TOPDOWN = 4 | 0x100, // This will is currently both the top-down water and air sensor, but will likely break it out in the future
  PRO_H2O = 5 | 0x100, // This is the PRO sensor, but with hwid for doing bottom-up assumed in a water tank
  PRO_LIPPERT_LPG = 6 | 0x100, // Lippert private labeled LPG sensor
  PRO_DOMETIC_LPG = 7 | 0x100, // Dometic private labeled LPG sensor
  PRO_PLUS_BLE_LPG = 8 | 0x100, // Mopeka PRO+ LPG sensor, BLE boosted
  PRO_PLUS_CELL_LPG = 9 | 0x100, // Mopeka PRO+ LPG sensor, Cellular
  PRO_PLUS_BLE_TD40 = 10 | 0x100, // Mopeka PRO+ TD40 LPG sensor, BLE booster
  PRO_PLUS_CELL_TD40 = 11 | 0x100, // Mopeka PRO+ TD40 LPG sensor, Cellular
}

type AdvertType = 'cc2540' | 'nrf52' | 'gw'

interface advertType {
  /** index or time in 10us ticks */
  i: number

  /** amplitude */
  a: number
}

export class Sample {
  public date: number

  /** Level is time in seconds of detected pulse */
  public level: number
  public q: number
  protected hwFamily: HardwareFamily

  public qualityStars: number // 0, 1, 2, or 3 stars quality - read directly from sensor
  protected hwVersionNumber: number // full sensor version < 255 is the original CC2540 "version" byte.  Anything > 255 is an nrf52 version and its version byte
  public acceloX: number // range is -128 to 127 which maps to -2G to 2G.
  public acceloY: number // range is -128 to 127 which maps to -2G to 2G.
  public battery: number
  public temperature: number
  public syncPressed: boolean
  public slowUpdateRate: boolean
  public corrupted = false

  public static createFromAdvert(type: AdvertType, mfrData: Uint8Array) {
    if (type === 'cc2540') {
      return new SampleCC2540(mfrData)
    } else if (type === 'nrf52') {
      return new SampleNRF52(mfrData)
    }
    return null
  }

  constructor(mfrData?: Uint8Array) {
    this.level = -1
    this.q = -1
    this.qualityStars = -1

    if (!mfrData) return

    this.date = Date.now()
  }

  // Returns the MAC (3 or 6 bytes on iOS)
  public static getAdvertInfo(obj): { id: string; type: AdvertType } {
    var adv = obj['advertisement']

    // Assume we always have manufacturer data and service uuid for tankcheck is ADA0
    if (!adv['serviceUuids']) return null

    let uuid = adv['serviceUuids'][0]

    switch (uuid) {
      case 'ADA0':
        return this.getTankCheckSensorMac_cc2540(obj)
      case 'FEE5':
        return this.getTankCheckSensorMac_nrf52(obj)
      default:
        return null
    }
  }
  //M0pekaD0ma!n
  public static validateHardwareId(hwid: HardwareId): boolean {
    // TODO: Use this function for std/xl sensors

    // Global Rule - Allow HWID_BAD_SENSOR always.  (NOTE: This will only be sent in a very obscure case where hardware is faulty, hence why I renamed this to avoid confusion).  I do not believe any sensors will ever send this.
    // Mopeka - For gen2/XL, keep same as today .  For PRO, reject HWID_PRO_LIPPERT_LPG, allow all others
    // GasNow - For gen2/XL, keep same as today.  For PRO, reject HWID_PRO_LIPPERT_LPG, reject HWID_PRO_DOMETIC_LPG, allow all others
    // Lippert - For gen2/XL, reject all.  For PRO, allow HWID_PRO_LIPPERT_LPG, reject all others
    // BMPRO - For gen2/XL, allow the BMPRO gen2 sensor, reject all others.  For PRO, allow HWID_PRO_MOPEKA, reject all others.  (Note: whenever they white label pro, we will switch to give them a custom hwid)
    // Vertrax - Same as Mopeka

    let allowed = [...(Object.values(HardwareId).filter(k => isNumber(k)) as HardwareId[])]

    if (hwid == HardwareId.UNKNOWN) return true

    if (app_brand == 'tankcheck' || app_brand == 'vertrax') {
      const reject = [HardwareId.PRO_LIPPERT_LPG]
      allowed = allowed.filter(id => !reject.includes(id))
    } else if (app_brand == 'gascheck') {
      const reject = [HardwareId.PRO_LIPPERT_LPG, HardwareId.PRO_DOMETIC_LPG]
      allowed = allowed.filter(id => !reject.includes(id))
    } else if (app_brand == 'lippert') {
      const allow = [HardwareId.PRO_LIPPERT_LPG]
      allowed = allowed.filter(id => allow.includes(id))
    } else if (app_brand == 'bmpro') {
      const allow = []
      allowed = allowed.filter(id => allow.includes(id))
    }

    if (allowed.includes(hwid)) {
      return true
    }

    return false
  }

  private static getTankCheckSensorMac_cc2540(obj): { id: string; type: AdvertType } {
    var adv = obj['advertisement']
    var mfr = adv['manufacturerData']
    var id = null
    let len = mfr.length // len of manufacturing data excluding "length" and "type" bytes - common on both android and ios at this point

    // check length - first few devices did not include 3 bytes of MAC address
    if (len !== 22 && len !== 25) {
      return null
    }

    // Get ID
    if (ble.isIOS) {
      if (len === 22) {
        id = utils.toShortAddress(obj['address'])
      } else {
        id = utils.byte2str(mfr[22]) + ':' + utils.byte2str(mfr[23]) + ':' + utils.byte2str(mfr[24])
        id = id.toUpperCase()
      }
    } else {
      // If we have the new packet type with MAC then check it first
      id = obj['address']
      if (len == 25) {
        if (mfr[22] !== parseInt(id.substring(9, 11), 16)) {
          return null
        }
        if (mfr[23] !== parseInt(id.substring(12, 14), 16)) {
          return null
        }
        if (mfr[24] !== parseInt(id.substring(15, 17), 16)) {
          return null
        }
      }
    }

    let hwid = mfr[3] & 0xcf

    // reject all non pro sensors for lippert
    if (app_brand == 'lippert') return null

    // Don't allow SiMarine sensors
    if (hwid === 0x40) {
      return null
    }

    // prevent BOC/MTTracker sensors for being used in Tankcheck
    let is_BOC = hwid === 0x42 || hwid === 0x43
    if (app_brand === 'tankcheck') {
      if (is_BOC) {
        return null
      }
    }

    // bmpro and e-trailer sensors - only allow in their app
    let is_bmpro = hwid === 0x46 || hwid === 0x48
    if (app_brand === 'bmpro') {
      if (!is_bmpro) return null
    } else {
      if (is_bmpro) return null
    }

    if (mfr[0] !== 0x0d || mfr[1] !== 0x00) {
      return null
    }

    if (mfr[2] === 0xbb || mfr[2] === 0xaa) {
      //if (mfr[i + 2] !== 170) {   // special manufacturing tester
      //log("Reserved byte received as = " + mfr[i + 2] + ", expected 0!");
      //}
      return null
    }

    return { id, type: 'cc2540' }
  }

  private static getTankCheckSensorMac_nrf52(obj): { id: string; type: AdvertType } {
    var adv = obj['advertisement']
    var mfr = adv['manufacturerData']
    var id = null
    let len = mfr.length // len of manufacturing data excluding "length" and "type" bytes - common on both android and ios at this point

    // check length - first few devices did not include 3 bytes of MAC address
    if (len !== 12) {
      return null
    }

    // Get ID
    if (ble.isIOS) {
      id = utils.byte2str(mfr[7]) + ':' + utils.byte2str(mfr[8]) + ':' + utils.byte2str(mfr[9])
      id = id.toUpperCase()
    } else {
      // If we have the new packet type with MAC then check it first
      id = obj['address']

      if (mfr[7] !== parseInt(id.substring(9, 11), 16)) {
        return null
      }
      if (mfr[8] !== parseInt(id.substring(12, 14), 16)) {
        return null
      }
      if (mfr[9] !== parseInt(id.substring(15, 17), 16)) {
        return null
      }
    }

    if (mfr[0] !== 0x59 || mfr[1] !== 0x00) {
      return null
    }

    const hwid = 0x100 | mfr[2]
    const validHW = Sample.validateHardwareId(hwid)

    if (!validHW) return null

    return { id, type: 'nrf52' }
  }

  public getHwVersion() {
    return this.hwVersionNumber
  }

  public getHwFamily(): HardwareFamily {
    return this.hwFamily
  }

  public getRawAdvertData() {
    return null
  }

  public initFromObject(samples: any) {
    return _.extend(this, samples)
  }
}

export class SampleCC2540 extends Sample {
  private adv: advertType[]

  constructor(mfrData: Uint8Array) {
    super(mfrData)

    function setPD(s: SampleCC2540, ndx: number) {
      let x: number
      if (s.hwFamily !== 'xl') {
        x = mfrData[ndx * 2 + 7] // original sensor sends time as 10us ticks
      } else {
        x = mfrData[ndx * 2 + 7] * 2 // large tank sensor sends as 20us ticks, so convert to 10us ticks
      }
      s.adv[ndx] = {
        a: mfrData[ndx * 2 + 6],
        i: x,
      }
    }

    let hwid = mfrData[3]
    //if (version > 3 && version !== 0x41) {
    //log("Version byte received as = " + mfrData[i + 2] + ", expected 0 or 1!");
    //return;
    //}

    /* jslint bitwise: true */
    if ((hwid & 1) === 1) {
      this.hwFamily = 'xl'
    } else {
      this.hwFamily = 'gen2'
    }

    this.hwVersionNumber = hwid & 0xcf

    if (this.hwVersionNumber == 0x46 || this.hwVersionNumber == 0x48) {
      this.qualityStars = (hwid >>> 4) & 0x03
    }

    this.acceloX = this.__getAcceloX(mfrData[2])
    this.acceloY = this.__getAcceloY(mfrData[2])
    this.battery = (mfrData[4] / 256.0) * 2.0 + 1.5

    let tmp = mfrData[5] & 0x3f
    if (mfrData[5] == 0x3f && mfrData[4] == 0xff) {
      this.corrupted = true
    }
    if (tmp === 0) {
      this.temperature = -40
    } else {
      this.temperature = (tmp - 25.0) * 1.776964
    }
    this.slowUpdateRate = !!(mfrData[5] & 0x40)
    this.syncPressed = !!(mfrData[5] & 0x80)
    /* jslint bitwise: false */

    this.adv = []

    if (hwid === 0 || hwid === 1) {
      setPD(this, 0)
      setPD(this, 1)
      setPD(this, 2)
      setPD(this, 3)
      setPD(this, 4)
      setPD(this, 5)
      setPD(this, 6)
      setPD(this, 7)

      // Sort the peak data based on time
      this.adv.sort((a, b) => a.i - b.i)
    } else {
      let ndx = 0
      let last_time = 0
      let w = 6

      for (let q = 0; q < 12; q += 1) {
        let bitpos = q * 10
        let bytepos = Math.floor(bitpos / 8)
        let off = bitpos % 8
        let v = mfrData[w + bytepos] + mfrData[w + bytepos + 1] * 256
        /* jslint bitwise: true */
        v = v >>> off
        let dt = (v & 0x1f) + 1
        v = v >>> 5
        let amp = v & 0x1f
        /* jslint bitwise: false */
        let this_time = last_time + dt
        last_time = this_time

        if (this_time > 255) {
          break
        }

        if (!amp) {
          continue
        }
        amp -= 1
        amp *= 4
        amp += 6

        this.adv[ndx] = {
          a: amp,
          i: this_time * 2,
        }
        ndx += 1
      }
    }
  }

  private __getAcceloY(acceloByte: number): number {
    //          0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
    const map = [-7, 1, 2, 3, 4, 5, 6, 0, -6, -5, -8, 7, -4, -3, -2, -1]
    return map[(acceloByte >>> 4) & 0x0f]
  }

  private __getAcceloX(acceloByte: number): number {
    //          0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
    const map = [-7, 1, 2, 3, 4, 5, 6, 0, -6, -5, -8, 7, -4, -3, -2, -1]
    return map[acceloByte & 0x0f]
  }

  public getRawAdvertData() {
    return this.adv
  }
}

export class SampleNRF52 extends Sample {
  constructor(mfrData: Uint8Array) {
    super(mfrData)

    this.hwFamily = 'pro'
    this.hwVersionNumber = 0x100 | mfrData[2] // offset pro family sensors by 256 + RES=1, BLK=2, PRO=3, TOP=4

    this.battery = (mfrData[3] & 0x7f) / 32
    this.temperature = (mfrData[4] & 0x7f) - 40
    this.syncPressed = !!(mfrData[4] & 0x80)
    this.slowUpdateRate = true
    let u16 = mfrData[5] | (mfrData[6] << 8)
    this.level = (u16 & 0x3fff) * 0.000001

    this.qualityStars = u16 >>> 14
    this.q = [0, 10, 50, 100][this.qualityStars] // convert 2-bit value to thresholds
    this.acceloX = ((mfrData[10] << 24) >> 24) / 16
    this.acceloY = ((mfrData[11] << 24) >> 24) / 16
  }
}
