/**
 * Mopeka Products, LLC ("COMPANY") CONFIDENTIAL
 * Unpublished Copyright (c) 2015-2019 Mopeka Products, LLC, All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains the property of COMPANY. The intellectual and technical concepts contained
 * herein are proprietary to COMPANY and may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained
 * from COMPANY. Access to the source code contained herein is hereby forbidden to anyone except current COMPANY employees, managers or contractors who have executed
 * Confidentiality and Non-disclosure agreements explicitly covering such access.
 *
 * The copyright notice above does not evidence any actual or intended publication or disclosure of this source code, which includes
 * information that is confidential and/or proprietary, and is a trade secret, of COMPANY.  ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC PERFORMANCE,
 * OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED, AND IN VIOLATION OF APPLICABLE
 * LAWS AND INTERNATIONAL TREATIES. THE RECEIPT OR POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES NOT CONVEY OR IMPLY ANY RIGHTS
 * TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE, IN WHOLE OR IN PART.
 */
import _ from 'lodash'
import store from '../../view/store'
import { RootState } from '../../view/store/reducers'
import { ble, get_i18n } from '../index'
import * as notifications from '../notifications'
import { TankRegionPicker } from '../tankRegionPicker'
import { utils } from '../utils'
import { HardwareId, Sample } from './sample'
import { Sensor } from './sensor'

export interface TankType {
  type: string
  label: string
  vertical: boolean
  height: number
  fullHeight?: number
}

export type TankUpdateSettings = {
  shortAddress: string
  arbHeightMeters: number
  arbFullHeightMeters: number
  arbTypeVertical: boolean
  name: string
  region: string
  alarmNotificationsEnabled: boolean
  notificationCooldown: number
  alarmThreshold: number
  updateRate: number
  tankType: string
  tankUnits: 'percent' | 'centimeters' | 'inches'
}

export type HardwareFamily = 'gen2' | 'gen4' | 'xl' | 'pro'
export type LevelUnits = 'inches' | 'centimeters' | 'percent'

declare var sensor_max_height: number[]
declare var arb_tank_vertical: TankType
declare var arb_tank_horizontal: TankType
declare var tank_types: any
declare var c_adjustment: number
declare var scale_factor: number
declare var tank_min_offset: number

export abstract class TankCheck extends Sensor {
  public lastSampleSource: 'ble' | 'cloud'

  // Saved parameters

  /** Latest hardware version received for sensor (not updated by cloud updates) */
  public hwVersionNumber: HardwareId | number // < 255 is the original CC2540 "version" byte.  Anything > 255 is an nrf52 version

  public levelUnits: LevelUnits
  public savedTankRegionId: string
  public savedTankCountryId: string
  /**
   * Ratio of propane gas to butane gas. A value of 1.0 is 100% propane.
   * Defaults to 1.0 for 100% propane
   *
   * @type {number}
   * @memberof TankCheck
   */
  public propaneButaneRatio: number = 1.0
  public tankInfo: TankType
  public hwFamily: HardwareFamily
  public updateRate: number
  public isWater: boolean

  // Alarm variables
  public alarmNotificationsEnabled: boolean
  /**
   * Cooldown to use between notifications in hours
   *
   * @type {number}
   * @memberof TankCheck
   */
  public notificationCooldown: number
  public alarmThreshPercent: number
  alarmReady: boolean
  alarmTriggered: boolean
  alarmActCount: number
  alarmInactCount: number
  alarmActive: boolean
  alarmShownTime: number

  aceRewards: string
  acePromos: string
  acceloXOffset: number
  acceloYOffset: number
  samples: Sample
  public plotData = {}

  // Display properties
  public batteryImageOffset: number
  public batteryPercentage: number
  public levelImageOffset: number
  public levelStringFull: string
  public levelPercent: number
  public accelPosition
  public updateRateText: string = '? seconds'
  public firmware_version: { version: number; desc: string }

  hash: number
  tags: string

  private lastInfluxUpload: number

  public abstract onShowPlotPage()
  public abstract onHidePlotPage()
  protected abstract updatePlotPage()
  public abstract setSampleFromBle(s: Sample, rssi: number, dbg: boolean)
  public abstract getSensorDescription(): { version: number; desc: string }
  public abstract getUpdateRate(): number
  public abstract getAcceloY(corrected: boolean): number
  public abstract getAcceloX(corrected: boolean): number

  /* TODO: 'obj' is either from localstorage, or from BLE advert - could use two initFrom() functions */
  public constructor(obj: any, loaded: boolean, hwFamily: HardwareFamily, hwVersionNumber: number) {
    super()

    let s = super.loader(obj, loaded)
    this.isGw = false
    this.hash = this.longAddress.hashCode()
    this.hwFamily = hwFamily
    this.name = this.name || get_i18n('new_device')
    this.samples = new Sample().initFromObject(s['samples'] || { level: 0 })
    this.hwVersionNumber = hwVersionNumber || this.samples.getHwVersion()
    this.levelUnits = s['levelUnits'] || 'percent'
    this.lastSeen = this.lastSeen || this.samples.date // load legacy date
    this.alarmThreshPercent = s['alarmThreshPercent'] || 20
    this.notificationCooldown = s['notificationCooldown'] || 12
    this.alarmNotificationsEnabled = s['alarmNotificationsEnabled'] || true
    this.alarmReady = s['alarmReady'] || false
    this.alarmTriggered = s['alarmTriggered'] || false
    this.aceRewards = s['aceRewards'] || ''
    this.acceloXOffset = s['acceloXOffset'] || 0
    this.acceloYOffset = s['acceloYOffset'] || 0
    this.lastSampleSource = s['lastSampleSource'] || 'ble'
    this.savedTankCountryId = s['savedTankCountryId'] || ble.defaultCountryId
    this.propaneButaneRatio =
      s['propaneButaneRatio'] ||
      TankRegionPicker.getDefaultPropaneRatio(TankRegionPicker.getRegionByCountryId(this.savedTankCountryId).countryId)
    this.savedTankRegionId =
      s['savedTankRegionId'] || TankRegionPicker.getRegionByCountryId(this.savedTankCountryId).region.tankRegionKey

    // Load tankInfo
    this.tankInfo = s['tankInfo'] && this.findCurrentRegionTank(s['tankInfo']['type'])
    if (!this.tankInfo) {
      let defTankTypes = this.getCurrentRegionTankTypes()
      if (hwVersionNumber === 0x41) {
        // h20 sensor
        this.tankInfo = _.extend({}, arb_tank_vertical)
      } else if (hwFamily !== 'xl') {
        // if not XL
        if (!s['tankInfo']) {
          // no info, so find closest
          this.tankInfo = defTankTypes[0] // retrieve first tank type (20lb or 5kg)
        } else {
          this.tankInfo = s['tankInfo'] // should be arbitrary?
        }
      } else {
        //xl
        if (!s['tankInfo']) {
          // no info, so find closest
          this.tankInfo = defTankTypes[0]
          for (let i = 0; i < defTankTypes.length; i += 1) {
            // find first tank that is supported by XL but not standard sensor
            if (defTankTypes[i].height > sensor_max_height[0]) {
              this.tankInfo = defTankTypes[i] // retrieve 100lb or 45kg
              break
            }
          }
        } else {
          this.tankInfo = s['tankInfo'] // should be arbitrary?
        }
      }
    }

    // And in case above fails, go to fail safe
    if (!this.tankInfo || !this.tankInfo.height) {
      this.tankInfo = _.extend({}, arb_tank_vertical)
    }

    // TOOD: Ask about these tags. Endpoint seems to be dead for awhile
    // Always refresh tags
    // if (!this.tags) {
    //   // TODO: remove jquery
    //   $$.ajax({
    //     url: 'http://pstick.com/mopeka/tag/tags.php',
    //     method: 'GET',
    //     timeout: 5000,
    //     cache: false,
    //     data: { mac: this.longAddress },
    //     dataType: 'html',
    //     error: () => {},
    //     success: resp => {
    //       this.tags = resp
    //       utils.log('Got tags for ' + this.longAddress + ': ' + resp)
    //     },
    //   })
    // }

    // Init scratch vars
    this.alarmActCount = 0
    this.alarmInactCount = 0
    this.alarmActive = false

    this.batteryImageOffset = this.getBatteryImageOffset()
    this.samples.qualityStars = this.getQualityStars()
    this.levelImageOffset = this.getLevelImageOffset()
    this.levelStringFull = this.getLevelStringFull()
    this.rssiQuality = this.getSignalImageOffset()
    this.accelPosition = this.updateAcceloView()
  }

  public getSaveObject(obj?) {
    obj = obj || {}
    super.getSaveObject(obj)
    _.extend(obj, {
      version: this.hwVersionNumber,
      levelUnits: this.levelUnits,
      tankInfo: this.tankInfo,
      hwFamily: this.hwFamily,
      alarmNotificationsEnabled: this.alarmNotificationsEnabled,
      alarmThreshPercent: this.alarmThreshPercent,
      alarmReady: this.alarmReady,
      alarmTriggered: this.alarmTriggered,
      aceRewards: this.aceRewards,
      acceloXOffset: this.acceloXOffset,
      acceloYOffset: this.acceloYOffset,
      samples: { ...this.samples, syncPressed: false },
      lastSampleSource: this.lastSampleSource,
      savedTankRegionId: this.savedTankRegionId,
      savedTankCountryId: this.savedTankCountryId,
      propaneButaneRatio: this.propaneButaneRatio,
    })
    return obj
  }

  public getSample() {
    return this.samples
  }

  public forget() {
    this.alarmTriggered = false
    this.alarmReady = false
    super.forget()
    notifications.cancelNotification(this.hash)
  }

  /** Indicates where the last update was from local ble or cloud */
  public getLastSampleSource(): 'ble' | 'cloud' {
    return this.lastSampleSource
  }

  public updateAlarm() {
    var h = this.getLevelAsMeters()
    var a = this.getHeightFromPercent(this.alarmThreshPercent)

    this.alarmActive = h <= a
    if (this.alarmActive) {
      this.alarmInactCount = 0
      this.alarmActCount += 1
      if (this.alarmActCount >= 5 && this.alarmReady) {
        this.alarmReady = false
        this.alarmTriggered = true
        this.save()
      }
    } else {
      this.alarmActCount = 0
      this.alarmInactCount += 1
      if (this.alarmInactCount >= 10 && !this.alarmReady) {
        this.alarmReady = true
        this.alarmTriggered = false
        this.save()
      }
    }
  }

  public getScoreQuality(): number {
    let ad = this.samples
    if (!ad || !ad.q) return 0
    return ad.q
  }

  public getQualityStars(): number {
    let q = this.getScoreQuality()

    if (this.samples.qualityStars >= 0 && this.samples.qualityStars <= 3) {
      return this.samples.qualityStars
    }

    //var ad = this.samples;
    //log("q = " + ad['onSensorQuality'] + ", calc=" + q);
    let r = 0
    if (q < 5) {
      r = 0
    } else if (q < 15) {
      r = 1
    } else if (q < 30) {
      r = 2
    } else {
      r = 3
    }

    return r
  }

  /** Called on each new received BLE packet to see if we should upload data to influxDB */
  protected checkForUpload(wasPressed: boolean): void {
    const { options } = (store.getState() as unknown) as RootState

    if (options.uploadSensorData) {
      let rate = 600000 // 10 minutes
      let s = this.getSample()
      if (s.syncPressed) {
        if (!wasPressed) {
          rate = 1000
        } else {
          rate = 10000
        }
      }
      var n = Date.now()
      if (!this.lastInfluxUpload) this.lastInfluxUpload = n - rate
      if (n - this.lastInfluxUpload >= rate) {
        this.lastInfluxUpload = n
        ble.uploadToAws(this)
        ble.writeInfluxDb(this)

        let obj
        this.getSaveObject(obj)
        let tcJson = JSON.stringify(obj)
        utils.log('upload sensor (upload): ' + this.longAddress)
      } else {
        //log("saw sensor: " + obj['address']);
      }
    }
  }

  public updateNotifications() {
    const { options } = (store.getState() as unknown) as RootState

    if (!options.notifications || !this.alarmNotificationsEnabled || ble.snoozeNotifications) {
      // nothing to do currently if not enabled
      return
    }

    cordova.plugins['notification'].local.isPresent(this.hash, present => {
      if (this.alarmTriggered) {
        if (this.alarmActive) {
          // make sure its not triggered but then goes high again and we update to something like "Low sensor: 100% level"!
          var now = Date.now()

          var levelStr = this.getLevelStringFull()
          //if (isIOS()) {  // in IOS % needs to be escaped
          //    levelStr = levelStr.replace("%", "%%");
          //}

          var o = {
            id: this.hash,
            title: get_i18n('notify_title'),
            text: "'" + this.name + "' " + get_i18n('notify_at') + ' ' + levelStr + ' - ' + get_i18n('notify_tap'),
            data: { addr: this.shortAddress },
            color: '56aa1c',
            led: {
              color: '#56aa1c',
              on: 500,
              off: 500,
            },
            foreground: true,
            sticky: false,
            autoClear: true,
            icon: 'notify_icon',
            smallIcon: 'res://notify_icon', // smallIcon is what shows in the notification bar on Android 7.
          }

          if (present) {
            // Only update every 2 minute
            if (this.alarmShownTime && now - this.alarmShownTime < 1000 * 60 * 2) {
              //log('too soon update');
              return
            }

            o['sound'] = null // if already present then skip sound
            //log('updating');
          } else {
            // If user swiped close then only reshow every cooldown period
            if (this.alarmShownTime && now - this.alarmShownTime < 1000 * 60 * 60 * this.notificationCooldown) {
              //log('too soon');
              return
            }
            //log('scheduling new');
          }

          cordova.plugins['notification'].local.schedule(o)
          this.alarmShownTime = now
        }
      } else {
        if (present) {
          //log('cancelling');
          cordova.plugins['notification'].local.cancel(this.hash)
        }
      }
    })
  }

  public getUnits(): string {
    if (this.levelUnits === 'percent') {
      return get_i18n(ble.defaultUnits)
    }
    return get_i18n(this.levelUnits)
  }

  public isSyncPressed(): boolean {
    let ad = this.samples
    return ad && ad.syncPressed
  }

  public getUnitScaler(): number {
    let s = this.levelUnits
    if (s === 'percent') {
      s = ble.defaultUnits
    }
    if (s === 'inches') {
      return 39.3701
    }
    if (s === 'centimeters') {
      return 100.0
    }
    return 1.0
  }

  public getLevelStringFull(): string {
    // Update Tank Level
    let txt = ''
    let g = this.getLevelAsMeters()
    const inches = Math.round(g * 39.3701 * 10) / 10
    if (this.hwVersionNumber == HardwareId.PRO_H2O && inches < 1.5) {
      // TODO: move this phrase to translation file
      txt += 'Low'
    } else if (g <= 0) {
      txt += get_i18n('empty')
    } else if (this.levelUnits !== 'percent') {
      txt += this.getLevelString(g)
    } else {
      txt += this.getPercentFromHeight(g) + '%'
    }
    return txt
  }

  public getLevelString(height_meters: number): string {
    let s = this.levelUnits
    if (s === 'percent') {
      s = ble.defaultUnits
    }
    if (s === 'inches') {
      return Math.round(height_meters * 39.3701 * 10) / 10 + '"'
    }
    if (s === 'centimeters') {
      return Math.round(height_meters * 100 * 10) / 10 + ' cm'
    }
    return ''
  }

  public getLevelAsMeters(): number {
    let t = this.getLevelAsInches()
    return t / 39.3701
  }

  public convertLevelToInches(tof: number, temperature: number): number {
    let tmp = temperature
    let tmp2 = tmp * tmp
    let c: number

    if (this.hwVersionNumber === 0x41) {
      // h20 sensor
      // Excel fit from data here: https://www.engineeringtoolbox.com/sound-speed-water-d_598.html
      // C is speed of sound in m/s
      c = 0.000093009 * tmp * tmp2 - 0.04122379 * tmp2 + 4.579691847 * tmp + 1404.337855187
    } else {
      if (tmp <= -39) {
        // old non-supported sensors send temperature of -40C, so use classic conversion
        let x = tof
        var SCALING = 0.03 / 2 // comes out to 762m/s speed of sound
        var OFFSET = 0.5
        if (x <= 0) {
          return 0
        }
        let ret = x * 1000 * 1000 * SCALING + OFFSET
        if (c_adjustment) ret *= c_adjustment
        return ret
      } else {
        // From https://pdfs.semanticscholar.org/f351/707441473beaa90caea0b47f34d1525194d9.pdf
        // 71.74% propane is
        // c = 0.0004 * T^3 - 0.0224 * T^2 - 6.1989 * T + 940.04
        // or 27.80% propane is
        // c = 0.0003 * T^3 - 0.0131 * T^2 - 5.9648 * T + 962.74
        //
        // It seems the remainder is mostly butane
        // C is speed of sound in m/s

        // old calc
        // c = 0.0004 * tmp * tmp2 - 0.0224 * tmp2 - 6.1989 * tmp + 940.04;

        // c = -0.0107 * tmp2 - 6.5 * tmp + 903.21\

        c = this.get_lpg_speed_of_sound(tmp, this.propaneButaneRatio)
      }
    }
    let t = tof
    if (t <= 0) {
      return 0
    }
    let ret = ((t * c) / 2) * 39.3701
    if (c_adjustment) ret *= c_adjustment
    return ret
  }

  // temp is -40 to 80C. lpg_butane_ratio is 1.0 to 0.0, for 100% propane to 0% propane (with the difference assumed to be butane)
  public get_lpg_speed_of_sound(temp: number, lpg_butane_ratio: number) {
    return 1040.71 - 4.87 * temp - 137.5 * lpg_butane_ratio - 0.0107 * temp * temp - 1.63 * temp * lpg_butane_ratio
  }

  public setPropaneRatio(ratio: number) {
    this.propaneButaneRatio = utils.clamp(ratio, 0, 1)
    this.save(true)
  }

  public getLevelAsInches(): number {
    let s = this.samples
    if (!s) return 0
    return this.convertLevelToInches(s.level, s.temperature)
  }

  private getHeightFromPercent(percent: number): number {
    let tt = this.tankInfo
    const tankHeight = tt.height * scale_factor

    if (tt.vertical) {
      return (percent / 100.0) * (tankHeight - tank_min_offset) + tank_min_offset
    } else {
      let dia = tankHeight
      if (percent >= 100.0) {
        return dia
      } else if (percent <= 0.0) {
        return 0.0
      }

      // From https://en.wikipedia.org/wiki/Circular_segment
      // Plotted 100 points, did 3rd order polynomial fit in excel
      // y = 0.8478x3 - 1.2717x2 + 1.3764x + 0.0238
      // Where x is percentage and y is h/D
      let p = percent / 100.0
      let y = 0.8478 * p * p * p - 1.2717 * p * p + 1.3764 * p + 0.0238
      let h = y * dia
      return h
    }
  }

  public getPercentFromHeight(height: number): number {
    let ti = this.tankInfo
    let tankHeight = ti.height * scale_factor
    if (!ti) {
      return 0.0
    }
    if (tank_min_offset >= tankHeight) {
      return 100.0
    }

    if (ti.vertical) {
      let d = (100.0 * (height - tank_min_offset)) / (tankHeight - tank_min_offset)
      if (d < 0.0) {
        return 0.0
      }
      if (d > 100.0) {
        return 100.0
      }
      return Math.round(d)
    } else {
      // From https://en.wikipedia.org/wiki/Circular_segment
      // Plotted 100 points, did 3rd order polynomial fit in excel
      // Got -1.16533x3 + 1.76150x2 + 0.40923x
      // Where y is percentage and x is h/D
      let dia = tankHeight
      if (height >= dia) {
        return 100.0
      } else if (height <= 0.0) {
        return 0.0
      }

      let x = height / dia
      let percent = -1.16533 * x * x * x + 1.7615 * x * x + 0.40923 * x
      return Math.round(percent * 100.0)
    }
  }

  public getBatteryVoltage(): number {
    let ad = this.samples
    if (!ad) {
      return 0
    }
    return ad.battery
  }

  public getBatteryPercentage(): number {
    let f = this.getBatteryVoltage()
    f = ((f - 2.2) / 0.65) * 100.0
    if (f < 0.0) {
      return 0.0
    }
    if (f > 100.0) {
      return 100.0
    }
    return Math.round(f)
  }

  public getBatteryImageOffset(): number {
    let b = Math.floor(this.getBatteryPercentage() / 10.0)
    if (b > 9) {
      b = 9
    }
    return b
  }

  public getLevelImageOffset(): number {
    let b = this.getPercentFromHeight(this.getLevelAsMeters())
    b = Math.floor(b / 10.0)
    if (b > 9) {
      b = 9.0
    }
    return b
  }

  public setUpdateRateText(text?: string) {
    if (text) {
      this.updateRateText = text
    } else if (this.lastSampleSource === 'cloud') {
      this.updateRateText = 'Cloud Sync'
    } else {
      this.updateRateText = (this.getUpdateRate() || '?') + ' seconds'
    }
  }

  private getCurrentRegionTankTypes(): TankType[] {
    let t = tank_types[this.savedTankRegionId]
    if (!t) {
      return tank_types[ble.defaultTankRegionId]
    }
    return t
  }

  public updateAcceloView() {
    let x = this.getAcceloX(true)
    let y = this.getAcceloY(true)
    if (x === undefined || y === undefined) {
      return (this.accelPosition = null)
    } else {
      let shouldWarn: boolean = false
      if (x > 8) x = 8
      if (x < -8) x = -8
      if (y > 8) y = 8
      if (y < -8) y = -8

      // xy-circle/plane
      let xy = utils.clampCircle(x * 5 + 32.4, y * 5 + 53.7, 32.4, 53.7, 30)
      let movexy = { top: xy.y + 'vw', left: xy.x + 'vw' }
      // x-axis
      let movex = { left: utils.clamp(x * 5 + 34.2, 3.8, 64.4) + 'vw' }
      // y-axis
      let movey = { top: utils.clamp(y * 5 + 40, 10, 70) + 'vw' }

      if (x <= 2 && x >= -2 && y <= 2 && y >= -2) {
        shouldWarn = false
      } else {
        shouldWarn = true
      }

      return (this.accelPosition = {
        movexy,
        movex,
        movey,
        shouldWarn,
      })
    }
    //console.log("x:" + x + ",y:" + y + ", move:{" + px + "," + py + "}");
  }

  public showTankSettingsPage() {}

  public updateTankCheckInfoPage() {}

  public setSampleFromCloud(s: Sample) {
    this.lastSeen = s.date
    this.lastSampleSource = 'cloud'
    this.samples = s

    this.onNewSample()
  }

  public onNewSample() {
    this.batteryImageOffset = this.getBatteryImageOffset()
    this.batteryPercentage = this.getBatteryPercentage()
    this.samples.qualityStars = this.getQualityStars()
    this.levelImageOffset = this.getLevelImageOffset()
    this.levelStringFull = this.getLevelStringFull()
    this.rssiQuality = this.getSignalImageOffset()
    this.accelPosition = this.updateAcceloView()
    this.levelPercent = this.getPercentFromHeight(this.getLevelAsMeters())
    this.firmware_version = this.getSensorDescription()
    this.setUpdateRateText()

    if (this.samples.corrupted) {
      utils.log(`Received sample from corrupted sensor. ${this.getName()} (${this.longAddress})`)
    }

    this.updateAlarm()
    this.updateNotifications()
    ble.updateSensorListItem(this, true)
    this.save() //TODO: only save periodically
  }

  /** Current region is the user selection tank region for this sensor */
  public findCurrentRegionTank(tankType: string, heightSearch?: number): TankType {
    let defTankTypes = this.getCurrentRegionTankTypes()
    for (let i = 0; i < defTankTypes.length; i += 1) {
      if (defTankTypes[i].type === tankType) {
        return defTankTypes[i]
      }
    }

    return TankCheck.findDefaultRegionTank(tankType, heightSearch)
  }

  /** Default region is the best region based on the phone's country/language setting */
  public static findDefaultRegionTank(tankType: string, heightSearch?: number): TankType {
    let defTankTypes = tank_types[ble.defaultTankRegionId]
    for (let i = 0; i < defTankTypes.length; i += 1) {
      if (defTankTypes[i].type === tankType) {
        return defTankTypes[i]
      }
    }

    if (!heightSearch || !tank_types) return null

    // Exhaustive search will try to find match for type across all languages
    // Else it will return the closest height match
    let difftt = null
    try {
      let minDiff = 9999999999
      for (let key in tank_types) {
        if (tank_types.hasOwnProperty(key)) {
          let cat: TankType[] = tank_types[key]
          if (!cat) continue
          if (!Array.isArray(cat)) continue

          for (let i = 0; i < cat.length; ++i) {
            let tt = cat[i]
            if (tt.type == tankType) return tt
            let deltaHeight = Math.abs(tt.height - heightSearch)
            if (deltaHeight < minDiff) {
              difftt = tt
              minDiff = deltaHeight
            }
          }
        }
      }
    } catch {
      utils.log('Failed to parse tank_types')
    }
    return difftt
  }
}
