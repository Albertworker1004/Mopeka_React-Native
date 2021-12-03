/*!
 * @license
 * Mopeka Products, LLC ("COMPANY") CONFIDENTIAL
 * Unpublished Copyright (c) 2015-2018 Mopeka Products, LLC, All Rights Reserved.
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
/// <reference types="cordova-plugin-device" />
/// <reference types="cordova-plugin-bluetoothle" />
/// <reference types="cordova-plugin-dialogs" />
/// <reference types="phonegap-plugin-push/types" />
/// <reference types="amazon-cognito-identity-js" />
import 'core-js/stable'
import 'jquery'
import 'regenerator-runtime/runtime'
import Rollbar from 'rollbar'
import store from '../view/store'
import { RootState } from '../view/store/reducers'
import * as nearbySensors from '../view/store/reducers/nearbySensors/reducers'
import { setOption } from '../view/store/reducers/options/reducers'
import { addOrUpdateSensor, removeAllSensors } from '../view/store/reducers/sensors/reducers'
import { dfp } from './dfp'
import './fetch'
import i18nFallback from './i18n_fallback'
import { MopekaUser } from './mopekaUser'
import * as notification from './notifications'
import { Gateway } from './sensors/gateway'
import { HardwareId, Sample } from './sensors/sample'
import { Sensor, SensorList } from './sensors/sensor'
import { HardwareFamily, TankCheck, TankType, TankUpdateSettings } from './sensors/tankcheck'
import { TankCheckGen2 } from './sensors/tankcheck_gen2'
import { TankCheckLiquid } from './sensors/tankcheck_liquid'
import { TankCheckLiquid_BottomUp } from './sensors/tankcheck_liquid_bottom'
import { TankCheckPro } from './sensors/tankcheck_pro'
import { TankCheckXL } from './sensors/tankcheck_xl'
import { TankRegionPicker } from './tankRegionPicker'
import { Timer, utils } from './utils'

export const rollbar = new Rollbar({
  accessToken: 'e612efd7d4de463081c44d035004a7c4',
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: 'production',
    app_meta: {
      brand: app_brand,
      version: APP_VERSION,
    },
  },
  onSendCallback: (isUncaught, args, payload: any) => {
    store.dispatch(
      setOption({
        name: 'errorUUID',
        val: payload.uuid,
      })
    )
  },
})
window['Rollbar'] = rollbar

declare let WifiWizard2: any

type Units = 'inches' | 'centimeters'

declare let Origami: any
declare let bluetoothle: BluetoothlePlugin.Bluetoothle
declare let Influxdb_Point: any

let $$ = $
export let i18n: any

declare var app_brand: 'gascheck' | 'mttracker' | 'tankcheck' | 'vertrax' | 'yonke' | 'bmpro' | 'lippert' | 'eyegas'

// tank_types.js
declare let tank_types: {
  en: TankType[]
  es: TankType[]
  ec: TankType[]
  ar: TankType[]
  cl: TankType[]
  co: TankType[]
  br: TankType[]
  pe: TankType[]
  eu: TankType[]
  il: TankType[]
  py: TankType[]
  au: TankType[]
  uy: TankType[]
  za: TankType[]
}

// Polyfill - Android 4.4 is missing this
if (!Uint8Array.prototype.slice) {
  Object.defineProperty(Uint8Array.prototype, 'slice', {
    value: function (begin: number, end: number) {
      return new Uint8Array(Array.prototype.slice.call(this, begin, end))
    },
    //writable: true
  })
}

// Prevent another DFP/advertisement script from loading Jquery and overwriting JQM or other plugins
// let $$ = $;

export function get_i18n(key: string): string {
  if (!i18n) return ''
  if (i18n.hasOwnProperty(key)) {
    return i18n[key]
  } else if (i18nFallback.hasOwnProperty(key)) {
    return i18nFallback[key]
  }
  rollbar.error('Missing i18n key/string', { key })
  return 'i18n_string'
}
window['get_i18n'] = get_i18n

export function show_help(help_id: string): void {
  if (!i18n) return
  let s = get_i18n(help_id)
  if (!s) return

  s = s.replace(':', '')
  utils.notify(get_i18n(help_id + '_help'), s, null)
}
window['show_help'] = show_help

export class BluetoothObject {
  //let cPropane = 720.0;    // speed of sound in propane (m/s) - was 756
  public androidVersion: number
  public isIOS: boolean
  public static readonly largeTankIconMinHeight = 0.3 // Size in meters before the "large" 40# tank graphic is shown instead of small

  public defaultCountryId: string = 'us'
  public defaultTankRegionId: string = 'en'
  public defaultUnits: Units = 'inches'
  private isInBackground: boolean = false
  private backgroundFetch_complete = null
  private doingForeground: boolean = false
  public plot = null
  private scanRetryTimer: Timer = null
  private bgFetchTimer: Timer = null
  private demoStateTimer: Timer = null

  private lastSeenMap = {}
  public sensorList: SensorList = {}
  public nearbySensorList: SensorList = {}
  // public selectedSensor : Sensor = null;
  public snoozeNotifications: boolean = false

  public lastAlarm: boolean = false
  public dbg: boolean = false
  private influxDb: any = null

  private geolocation: GeolocationPosition = null
  public user: MopekaUser = null

  constructor() {}

  public writeInfluxDb(sensor: TankCheck): void {
    if (this.influxDb) {
      let s = sensor.getSample()
      if (!s) return
      let tt = sensor.tankInfo

      let writePoint = (location: GeolocationPosition) => {
        if (location) this.geolocation = location
        let fields = {
          rawLevel: s.level,
          lpgLevel: sensor.getLevelAsMeters(),
          quality: s.q,
          voltage: s.battery,
          syncButtonState: s.syncPressed,
          updateMode: s.slowUpdateRate,
          temperature: s.temperature,
          tankHeight: tt.height,
        }
        if (this.geolocation && this.geolocation.coords) {
          let c = this.geolocation.coords
          if (c.latitude) fields['latitude'] = c.latitude
          if (c.longitude) fields['longitude'] = c.longitude
          if (c.altitude) fields['altitude'] = c.altitude
          if (c.accuracy) fields['location_accuracy'] = c.accuracy
        }
        if (sensor.firstName) fields['first'] = '"' + sensor.firstName + '"'
        if (sensor.lastName) fields['last'] = '"' + sensor.lastName + '"'
        if (sensor.acePromos) fields['acePromos'] = sensor.acePromos

        let tags = {
          addr: sensor.shortAddress,
          isXL: sensor.hwFamily !== 'gen2',
          version: s.getHwVersion(),
          tankType: tt.type,
        }
        if (sensor.email) tags['email'] = sensor.email
        if (sensor.aceRewards) tags['aceRewards'] = sensor.aceRewards

        let pt = new Influxdb_Point('sensorData', fields, tags, +s.date)

        $$.ajax({
          url: INFLUX_ENDPOINT,
          method: 'POST',
          timeout: 15000,
          cache: false,
          processData: false,
          data: pt.getLine(),
          success: () => {
            //utils.log("Successfully wrote ", pt);
          },
          error: (e, e2, str) => {
            utils.log('Influxdb err:', e, e2, str)
          },
        })
      }

      // Accept 1 hour cached position and 9 second timeout
      let timeout = 5000
      if (this.geolocation === null) {
        timeout = 15000
      }
      navigator.geolocation.getCurrentPosition(
        writePoint,
        () => {
          writePoint(null)
        },
        { maximumAge: 3600000, timeout: timeout, enableHighAccuracy: true }
      )

      //influxDb.point('sensorData', fields, tags, +s['date']);
      //influxDb.send();
      //log("Wrote tags=" + JSON.stringify(tags) + ", fields=" + JSON.stringify(fields));
    }
  }

  public uploadToAws(tc: TankCheck) {
    // Upload to AWS
    this.user.apiPostSensorData(tc)
  }

  /**
   * Highlights a sensor within the sensor list view by temporarily adding a class '.highlight-list-item'
   *
   * @param {Sensor} sensor
   * @param {number} [duration=3000] in milliseconds.
   * @memberof BluetoothObject
   */
  public highlightSensorListItem(sensor: Sensor, duration: number = 3000) {
    const sla = this.sensorList[sensor.shortAddress]
    sla.highlighted = true
    utils.delay(duration).then(() => {
      sla.highlighted = false
    })
  }

  public updateSensorListItem(sensor: Sensor, do_refresh: boolean) {
    // A brief 1 second hold of the sync button will highlight the sensor
    if (sensor.isSyncPressed()) {
      this.highlightSensorListItem(sensor)
    }

    // Send off a clone of the sensor to the view state
    store.dispatch(addOrUpdateSensor(sensor))
  }

  private getAdvFields(scanData: Uint8Array, scanLength: number) {
    let obj = { serviceUuids: [] }
    let i = 0
    let start, type, len
    while (i < scanLength) {
      len = scanData[i]
      if (!len) return obj
      type = scanData[i + 1]

      start = i + 2
      i = Math.min(i + len + 1, scanLength)

      switch (type) {
        case 0xff: // Manufacturer Specific Data
          obj['manufacturerData'] = scanData.slice(start, i)
          break
        case 0x01: // Ble advertisement flags
          //#define BLE_GAP_ADV_FLAG_LE_LIMITED_DISC_MODE         (0x01)   /**< LE Limited Discoverable Mode. */
          //#define BLE_GAP_ADV_FLAG_LE_GENERAL_DISC_MODE         (0x02)   /**< LE General Discoverable Mode. */
          if (len == 2) {
            obj['isConnectable'] = !!(scanData[start] & 0x02)
          }
          break
        case 0x02: // Incomplete list of 16-bit service UUIDs
        case 0x03: //   Complete list of 16-bit service UUIDs
        case 0x04: // Incomplete list of 32-bit service UUIDs
        case 0x05: //   Complete list of 32-bit service UUIDs
        case 0x06: // Incomplete list of 128-bit service UUIDs
        case 0x07: //   Complete list of 128-bit service UUIDs
          let size = [2, 2, 4, 4, 16, 16][type - 2]
          while (len > size) {
            let uuid = ''
            for (let x = size - 1; x >= 0; --x) {
              uuid += utils.byte2str(scanData[start + x])
              if (x === 6 || x === 8 || x === 10 || x === 12) uuid += '-'
            }
            obj['serviceUuids'].push(uuid.toUpperCase())
            len -= size
            start += size
          }
          break
        case 0x08: // Shortened Local Name
        case 0x09: // Complete Local Name
          obj['localName'] = ''
          len--
          for (let x = 0; x < len; ++x) {
            obj['localName'] += String.fromCharCode(scanData[start + x])
          }
          break
        case 0x0a: // Tx Power Level
          //obj["txPowerLevel"] = Int8Array(scanData, start, 1)[0];
          break
      }
    }
    return obj
  }

  private createFromFamily(
    obj: any,
    loaded: boolean,
    hwFamily: HardwareFamily,
    hwVersionNumber: HardwareId
  ): TankCheck {
    if (hwFamily === 'pro' || hwFamily === 'gen4') {
      if (
        hwVersionNumber == HardwareId.TOPDOWN ||
        hwVersionNumber == HardwareId.PRO_PLUS_BLE_TD40 ||
        hwVersionNumber == HardwareId.PRO_PLUS_CELL_TD40
      ) {
        return new TankCheckLiquid(obj, loaded, hwFamily, hwVersionNumber)
      } else if (hwVersionNumber == HardwareId.PRO_H2O) {
        return new TankCheckLiquid_BottomUp(obj, loaded, hwFamily, hwVersionNumber)
      }

      return new TankCheckPro(obj, loaded, hwFamily, hwVersionNumber)
    } else if (hwFamily === 'gen2') {
      return new TankCheckGen2(obj, loaded, hwFamily, hwVersionNumber)
    } else if (hwFamily === 'xl') {
      return new TankCheckXL(obj, loaded, hwFamily, hwVersionNumber)
    }
    return null
  }

  private updateWithNewAdvert(obj): void {
    // Rate limit new devices, unless its the selectedSensor
    const {
      sensors: { selectedSensor },
      nearbySensors: { searching },
    } = (store.getState() as unknown) as RootState
    const selected = this.sensorList[selectedSensor]

    let now = Date.now()
    let last = this.lastSeenMap[obj['address']] || 0
    let dt = now - last

    // if we have a selected sensor, then only update other sensors every 15 seconds. Else every second
    const updateDelay = selectedSensor ? 15000 : 950
    if (dt >= 0 && dt < updateDelay) {
      if (!selected || selected.connectAddress !== obj['address']) {
        return // Not selected sensor. Therefore too soon to update
      }
    }

    this.lastSeenMap[obj['address']] = now

    obj['connectAddress'] = obj['address']

    let isGw: boolean
    let adv = obj['advertisement']
    if (!adv) return

    // Make so that returned data is common on iOS and android, and make sure the mfr data
    // is decoded from base-64
    if (this.isIOS) {
      if (!adv['manufacturerData']) {
        return
      }
      adv['manufacturerData'] = bluetoothle.encodedStringToBytes(adv['manufacturerData'])
    } else {
      adv = this.getAdvFields(bluetoothle.encodedStringToBytes(adv), 62)
      obj['advertisement'] = adv
      if (!adv['manufacturerData']) {
        return
      }
    }

    let s: Sample
    let sinfo = Sample.getAdvertInfo(obj)
    if (sinfo) {
      s = Sample.createFromAdvert(sinfo.type, adv['manufacturerData'])

      if (this.isIOS) {
        obj['address'] = sinfo.id
      } else {
        sinfo.id = obj['address'].substr(-8, 8)
      }
      isGw = false
    } else {
      sinfo = { id: null, type: 'gw' }
      // not tankcheck sensor, check if its a gateway...
      if (!adv['serviceUuids'] || adv['serviceUuids'][0] !== Gateway.PUBSUB_UUID) {
        return
      }

      let mfr = adv['manufacturerData']
      if (mfr.length !== 6 || mfr[1] !== 0x2f || mfr[0] !== 0x44) {
        return
      }

      // Get ID
      if (this.isIOS) {
        sinfo.id = utils.byte2str(mfr[3]) + ':' + utils.byte2str(mfr[4]) + ':' + utils.byte2str(mfr[5])
        sinfo.id = sinfo.id.toUpperCase()

        // On iOS this will override the random UUID for the last 3 of the MAC address sent in the
        // advert data, for devices that support it.  For old devices the UUID will still be used
        obj['address'] = sinfo.id
      } else {
        // If we have the new packet type with MAC then check it first
        sinfo.id = obj['address'].substr(-8, 8)
      }
      isGw = true
    }

    let sl = this.sensorList
    let sensor: Sensor = sl[sinfo.id] && sl[sinfo.id]

    // maintain a list of nearby sensors
    if (!isGw) {
      let sen = this.nearbySensorList[sinfo.id]

      if (!sen) {
        sen = this.createFromFamily(obj, false, s.getHwFamily(), s.getHwVersion())
      } else {
        sen.last_rssi = obj['rssi']
        sen.rssiQuality = sen.getSignalImageOffset()
      }
      this.nearbySensorList[sen.shortAddress] = sen
      store.dispatch(nearbySensors.addSensor(sen))
    }

    // if sensor not in sensorList add it if sync pressed
    if (!sensor) {
      if (isGw) {
        sensor = this.addToSensorList(new Gateway(obj, false))
      } else {
        if (!s.syncPressed) {
          // Only add initially if the button is pressed
          return
        }

        sensor = this.addToSensorList(this.nearbySensorList[sinfo.id])
      }
    } else {
      sensor.connectAddress = obj['connectAddress']
    }

    sensor.rssiQuality = sensor.getSignalImageOffset()

    // update existing sensors
    if (sensor.isGw) {
      let gw: Gateway = <Gateway>sensor

      gw.last_rssi = obj['rssi']
      gw.name = obj['name']
      gw.lastSeen = now
      gw.save()

      this.updateSensorListItem(gw, true)
    } else {
      let tc: TankCheck = <TankCheck>sensor
      tc.setSampleFromBle(s, obj['rssi'], this.dbg)
    }
  }

  private startScanSuccessCallback(obj: BluetoothlePlugin.ScanStatus) {
    const { options } = (store.getState() as unknown) as RootState

    if (obj.status === 'scanResult') {
      this.updateWithNewAdvert(obj)
    } else if (obj.status === 'scanStarted') {
      //utils.log("startScanSuccessCallback: " + obj['status']);

      if (!options.scanActive) {
        store.dispatch(
          setOption({
            name: 'scanActive',
            val: true,
          })
        )
      }

      if (this.isInBackground) {
        this.scanRetryTimer.start(utils.rand(600000, 900000))
      } else {
        this.scanRetryTimer.start(utils.rand(7500, 9000))
      }
      this.finish_bg_fetch()
    } else {
      this.finish_bg_fetch()
      store.dispatch(
        setOption({
          name: 'scanActive',
          val: false,
        })
      )
      //log("Unexpected start scan status: " + obj['status']);
      utils.notify('Unexpected start scan status: ' + obj['status'], 'Start scan error', null)
    }
  }

  private startScanErrorCallback(obj: BluetoothlePlugin.Error) {
    const { options } = (store.getState() as unknown) as RootState
    utils.log('startScanErrorCallback: ' + obj['error'] + ' - ' + obj.message)
    if (obj.message && obj.message === 'Scanning already in progress') {
      this.adapterRestartScan()
    } else if (
      !obj.message ||
      (obj.message !== 'Scanning already in progress' && obj.message !== 'Scan already started')
    ) {
      store.dispatch(
        setOption({
          name: 'scanActive',
          val: false,
        })
      )

      utils.notify(get_i18n('check_bluetooth_msg'), get_i18n('start_scan') + ' Error', null)
    }
  }

  private static getAndroidVersion(): number {
    let s = device.version
    let v = s.split(/[.\-]/, 3)

    let v1: string | number = v[0]
    let v2: string | number = v[1]
    let v3: string | number = v[2]

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n)
    }

    if (!isNumeric(v1)) {
      v1 = 0
    }
    if (!isNumeric(v2)) {
      v2 = 0
    }
    if (!isNumeric(v3)) {
      v3 = 0
    }

    v1 = parseInt(<string>v1, 10)
    v2 = parseInt(<string>v2, 10)
    v3 = parseInt(<string>v3, 10)

    return (v1 << 16) + (v2 << 8) + v3
  }

  private adapterStartScan() {
    let params: BluetoothlePlugin.ScanParams

    // Handle bug on kit-kat - seen on Motorola Droid Ultra - this matches
    // some logic in v4.0.0 of the BLE plugin
    if (!this.isIOS && this.androidVersion <= 0x00050000) {
      params = { allowDuplicates: true }
    } else {
      params = {
        services: ['ADA0', 'FEE5', Gateway.PUBSUB_UUID],
        allowDuplicates: true,
        scanMode: bluetoothle['SCAN_MODE_LOW_LATENCY'],
        matchMode: bluetoothle['MATCH_MODE_AGGRESSIVE'],
        matchNum: bluetoothle['MATCH_NUM_MAX_ADVERTISEMENT'],
        callbackType: bluetoothle['CALLBACK_TYPE_ALL_MATCHES'],
      }

      if (this.isInBackground) {
        params.scanMode = bluetoothle['SCAN_MODE_LOW_POWER']
      }
    }

    bluetoothle.startScan(
      data => this.startScanSuccessCallback(data),
      error => this.startScanErrorCallback(error),
      params
    )
  }

  private stopScanSuccess(obj: { status: string }) {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    const sensor = this.sensorList[selectedSensor]

    // utils.log("stopScanSuccess: " + obj['status']);
    if (obj.status === 'scanStopped') {
      if (!sensor || !sensor.isGw) {
        // no scanning while connected to gateway
        setTimeout(() => {
          this.adapterStartScan()
        }, utils.rand(350, 550))
      }
    } else {
      this.finish_bg_fetch()
      utils.log('Unexpected stop scan status: ' + obj.status)
    }
  }

  private stopScanError(obj: BluetoothlePlugin.Error) {
    utils.log('Stop scan error: ' + obj['error'] + ' - ' + obj['message'])
    this.stopScanSuccess({ status: 'scanStopped' })
  }

  public adapterStopScan(): Promise<{ ok: boolean; data?: { status: string }; error?: BluetoothlePlugin.Error }> {
    if (this.scanRetryTimer) this.scanRetryTimer.stop()

    return new Promise(resolve => {
      bluetoothle.stopScan(
        data => {
          this.stopScanSuccess(data)
          resolve({ ok: true, data })
        },
        error => {
          this.stopScanError(error)
          resolve({ ok: false, error })
        }
      )
    })
  }

  private adapterRestartScan() {
    // the scanactive flag should still be set so will restart automatically
    //log("adapterRestartScan");
    return this.adapterStopScan()
  }

  private finish_bg_fetch() {
    //log("finish_bg_fetch");
    if (this.backgroundFetch_complete !== null) {
      this.bgFetchTimer.stop()
      let finish = this.backgroundFetch_complete
      this.backgroundFetch_complete = null
      utils.log('[js] BackgroundFetch ended')
      finish()
    }
  }

  // iOS Background Fetch is basically an API which wakes up your app about every 15 minutes
  // (during the user's prime-time hours) and provides your app exactly 30s of background running-time.
  private init_background_fetch() {
    // Background fetch handler
    let fetchCallback = () => {
      utils.log('[js] BackgroundFetch initiated')

      this.backgroundFetch_complete = window['BackgroundFetch'].finish
      this.bgFetchTimer.start(28000) // Trigger background fetch to stop after 28s to avoid iOS killing us
      this.adapterRestartScan()
    }
    let failureCallback = error => {
      utils.log('Background updating not enabled: ' + error)
    }

    if (this.isIOS) {
      window['BackgroundFetch'].configure(fetchCallback.bind(this), failureCallback.bind(this), {
        stopOnTerminate: false,
      })
    }
  }

  private goingToBackground() {
    const { options } = (store.getState() as unknown) as RootState
    utils.log('going to background: scan=' + options.scanActive)
    this.isInBackground = true
  }

  private goingToForeground() {
    this.isInBackground = false
    if (!this.doingForeground) {
      // these can nest if prompts enabling BLE cause us to go to background and back
      const { options } = (store.getState() as unknown) as RootState
      this.doingForeground = true

      utils.log('going to foreground: scan=' + options.scanActive)

      this.adapterRestartScan()
      this.user.cloudUpdateTimer.invoke()
      this.doingForeground = false
    }
  }

  private addToSensorList(sensor: Sensor): Sensor {
    this.sensorList[sensor.shortAddress] = sensor
    store.dispatch(addOrUpdateSensor(sensor))
    this.user.sensorAddRemoveLocalEvent(sensor.shortAddress, true) // refresh cloud list icons

    return sensor
  }

  public addSensorFromNearby(shortAddress: string) {
    const sensor = (this.sensorList[shortAddress] = this.nearbySensorList[shortAddress])

    store.dispatch(addOrUpdateSensor(sensor))
    this.user.sensorAddRemoveLocalEvent(sensor.shortAddress, true) // refresh cloud list icons
  }

  public addTankCheckFromCloud(
    cloudobj: { address: string; name: string; tankInfo: TankType },
    modelNumber: number
  ): TankCheck {
    let obj = null
    let json = window.localStorage.getItem(cloudobj.address)
    if (json) obj = JSON.parse(json)

    if (!obj) {
      obj = cloudobj
    } else {
      obj.tankInfo = cloudobj.tankInfo || obj.tankInfo
      obj.name = cloudobj.name || obj.name
    }

    // TODO: Check on this when I get water sensor prototype.
    let hwFamily: HardwareFamily
    if (modelNumber < 255) {
      hwFamily = modelNumber & 1 ? 'xl' : 'gen2'
    } else {
      hwFamily = 'pro'
    }

    let tc = this.createFromFamily(obj, true, hwFamily, modelNumber)
    let sensor = this.addToSensorList(tc)
    this.updateSensorListItem(sensor, true)
    sensor.save()
    return tc
  }

  public loadSensorFromLocalStorage(addr: string) {
    let js = utils.loadSensorFromLongAddress(addr)
    let obj = null
    if (js) obj = JSON.parse(js)

    // WARNING: obj is not really the Sensor or TankCheck class, so we use ['this'] notation to sort of indicate this.
    if (obj && obj['forgotten'] !== null && obj['forgotten'] !== undefined && obj['forgotten'] === false) {
      // make sure its actually a sensor (sensors will always have s.forgotten == TRUE or FALSE)
      if (obj['isGw']) {
        this.addToSensorList(new Gateway(obj, true))
      } else {
        let hwFamily: HardwareFamily
        // TODO: This is legacy added 1/20/19 when changed save name from sensorType => isXL (same values). Can probably remove at some time will just result in reporting standard sensor until first sample comes
        if (obj['sensorType'] !== undefined) {
          hwFamily = !!(obj['sensorType'] & 0x01) ? 'xl' : 'gen2'
        } else if (obj['isXL'] !== undefined) {
          hwFamily = !!obj['isXL'] ? 'xl' : 'gen2'
        } else {
          hwFamily = obj['hwFamily']
        }

        utils.log('Added obj: ' + obj + ' - ' + hwFamily)
        this.addToSensorList(this.createFromFamily(obj, true, hwFamily, obj['version']))

        if (obj.connectAddress == '') {
        }
      }
      return true
    }
    return false
  }

  // Initialize all sensors that were previously saved in localStorage
  private loadSensors() {
    let len = window.localStorage.length
    for (let i = 0; i < len; i += 1) {
      try {
        let key = window.localStorage.key(i)
        // Match AA:BB:CC or AA:BB:CC:DD:EE:FF or 8E8E3195-0295-4CA9-A7F3-41942A562C80
        if (
          key &&
          (/^([0-9a-f]{2}[:\-]){2,5}([0-9a-f]{2})$/i.test(key) ||
            /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))
        ) {
          this.loadSensorFromLocalStorage(key)
        }
      } catch (e) {}
    }
  }

  private bleInitSuccess(result: { status: 'enabled' | 'disabled' }) {
    if (result.status === 'enabled') {
      this.startScan()
    } else {
      utils.log('Unexpected initialize status: ' + result)
      this.startScan()
    }
  }

  private bleInit() {
    bluetoothle.initialize(this.bleInitSuccess.bind(this), {
      request: true,
      statusReceiver: true,
      restoreKey: 'tankcheck',
    })
  }

  public saveSensorSettings(s: Sensor) {
    s.save(true)
    if (!s.isGw) {
      this.user.syncLocalSensorToCloud(<TankCheck>s, false)
    }
  }

  public async registerSensor(
    addr: string,
    firstName: string,
    lastName: string,
    email: string,
    aceRewards: string,
    acePromos: string
  ): Promise<boolean> {
    let sensor = this.sensorList[addr] as TankCheckGen2
    sensor.firstName = firstName.trim()
    sensor.lastName = lastName.trim()
    sensor.email = email.trim()
    if (sensor.hwVersionNumber == 0x44) {
      // Ace sensor
      sensor.aceRewards = aceRewards.trim()
      sensor.acePromos = acePromos.trim()
    }

    sensor.hasRegistered = true
    ble.writeInfluxDb(sensor)
    sensor.save()
    return true
  }

  public async getSensorFromAddress(mac: string): Promise<Sensor> {
    if (mac in this.sensorList) {
      return this.sensorList[mac]
    } else {
      throw new Error(`No sensor found with that mac ${mac}`)
    }
  }

  public updateSensorOptions(a: TankUpdateSettings): boolean {
    try {
      let sensor = this.sensorList[a.shortAddress]
      sensor.name = a.name
      let tc = sensor as TankCheck

      const r = TankRegionPicker.regions[a.region]
      tc.savedTankCountryId = a.region
      tc.savedTankRegionId = r.tankRegionKey
      tc.alarmNotificationsEnabled = a.alarmNotificationsEnabled
      tc.notificationCooldown = a.notificationCooldown

      tc.alarmThreshPercent = a.alarmThreshold
      tc.levelUnits = a.tankUnits
      if (a.tankType == 'arbitrary') {
        let ti: TankType
        if (a.arbTypeVertical) {
          ti = { ...arb_tank_vertical }
        } else {
          ti = { ...arb_tank_horizontal }
        }
        ti.height = a.arbHeightMeters
        ti.fullHeight = a.arbFullHeightMeters
        tc.tankInfo = ti
      } else {
        let ti = tc.findCurrentRegionTank(a.tankType)
        if (ti !== null) {
          tc.tankInfo = ti
        }
      }

      if (a.updateRate != tc.updateRate) {
        ;(tc as TankCheckPro).setUpdateRate(a.updateRate * 1000)
      }

      tc.onNewSample()
      this.saveSensorSettings(sensor)
    } catch (error) {
      return false
    }
    return true
  }

  public async forgetAll(): Promise<boolean> {
    let res = await utils.confirmPromise(
      'Continue and remove all sensors?\n\nNote: To remove a single sensor, you can swipe an item to the left and then click the delete button. ',
      'Remove all sensors?',
      ['Remove All', 'Cancel']
    )
    if (res != 1) {
      return false
    }

    let s: string
    let i = 0,
      keys = Object.keys(this.sensorList)
    for (let len = keys.length; i < len; i += 1) {
      s = keys[i]
      if (this.sensorList[s]) {
        this.sensorList[s].forget()
      }
      delete this.sensorList[s]
      this.user.sensorAddRemoveLocalEvent(s, false)
    }

    store.dispatch(removeAllSensors())
    return true
  }

  public forget(shortAddress: string): boolean {
    let sensor = this.sensorList[shortAddress]
    if (!sensor) return false

    sensor.forget()
    delete this.sensorList[shortAddress]
    this.user.sensorAddRemoveLocalEvent(shortAddress, false)
    return true
  }

  private startScan__final() {
    this.adapterStartScan()
    utils.log('User start scan')
  }

  private startScan__checkLocationServices() {
    let d = $$.Deferred()

    if (!this.isIOS) {
      bluetoothle.isLocationEnabled(status => {
        // success
        if (status['isLocationEnabled'] === false && window.localStorage.getItem('slp') !== 'true') {
          // skip location prompt?
          navigator.notification.confirm(
            get_i18n('loc_prompt1'),
            val => {
              if (val === 3) {
                // This will automatically popup the location enable dialog box in Android settings
                bluetoothle.requestLocation(d.resolve, d.reject)
              } else if (val === 2) {
                // never prompt
                window.localStorage.setItem('slp', 'true') //set skip location prompt
                utils.notify(get_i18n('loc_prompt2'), get_i18n('loc_title2'), null)
                d.resolve({ requestLocation: true })
              } else {
                d.resolve({ requestLocation: true })
              }
            },
            get_i18n('loc_title1'),
            [get_i18n('no'), get_i18n('never_again'), get_i18n('yes')]
          )
        } else {
          d.resolve({ requestLocation: true })
        }
      }, d.resolve)
    } else {
      d.resolve({ requestLocation: true })
    }

    d.always(ret => {
      if (ret['requestLocation'] === false) {
        utils.notify(get_i18n('loc_prompt3'), get_i18n('loc_serv_title'), null)
      } else {
        this.startScan__final()
      }
    })
  }

  public connectToSensor(sensor: Sensor) {
    let selected = this.sensorList[sensor.shortAddress]
    selected.deviceConnect()
  }

  public disconnectFromSensor(sensor?: Sensor): PromiseLike<any> {
    let selected: Sensor
    if (sensor) {
      selected = this.sensorList[sensor.shortAddress]
    } else {
      const {
        sensors: { selectedSensor },
      } = (store.getState() as unknown) as RootState
      selected = this.sensorList[selectedSensor]
    }
    if (selected) {
      console.log('attempting to disconnect')

      return selected.deviceDisconnect()
    } else {
      return Promise.resolve()
    }
  }

  public saveGatewaySettings(gatewaySettings) {
    let selected = this.sensorList[gatewaySettings.shortAddress]
    const bridge = selected as Gateway
    if (gatewaySettings.passwordEnabled) {
      bridge.saveWifiSettings(gatewaySettings.wifiName, gatewaySettings.password)
    } else {
      bridge.saveWifiSettings(gatewaySettings.wifiName)
    }
    if (gatewaySettings.updateRate) {
      bridge.saveCloudSettings(gatewaySettings.updateRate)
    }
  }

  public calibrateAdc() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    let selected = this.sensorList[selectedSensor]

    let s = selected
    if (!s || s.isGw) {
      return false
    }
    let tc = <TankCheck>selected
    let x = tc.getAcceloX(false)
    let y = tc.getAcceloY(false)
    if (x === undefined || y === undefined) {
      x = 0
      y = 0
    }
    tc.acceloXOffset = x
    tc.acceloYOffset = y
    this.saveSensorSettings(tc)
    tc.updateAcceloView()
    // update view state sensor so it reflects the new zero'd position right away
    store.dispatch(addOrUpdateSensor(tc))
    utils.log('Accelo calibration to: (' + x + ',' + y + ')')
    return false
  }

  public startScan() {
    const reqResponse = status => {
      if (status['requestPermission'] === false) {
        ///@TODO - prompt here after failure
        utils.log('requestPermission error')
      } else {
        this.startScan__checkLocationServices()
      }
    }

    if (!this.isIOS) {
      bluetoothle.hasPermission((status: { hasPermission: boolean }) => {
        if (status.hasPermission === false) {
          ///@TODO check version before prompt??
          if (
            !utils.notify(get_i18n('loc_serv_msg'), get_i18n('loc_serv_title'), () => {
              ;(<Function>bluetoothle.requestPermission)(reqResponse, this.startScan__checkLocationServices)
            })
          ) {
            //TODO: should we reject
          }
        } else {
          reqResponse({ requestPermission: true })
        }
      })
    } else {
      reqResponse({ requestPermission: true })
    }
  }

  private scanRetryTimeout() {
    if (this.scanRetryTimer) {
      //log("scanRetryTimeout");
      this.scanRetryTimer.stop()
      this.adapterRestartScan()
    } else {
      utils.log('scanRetryTimeout unexpected!!!')
    }
  }

  public async gotoSensorInfoPage() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    let selected = this.sensorList[selectedSensor]

    dfp.clearAd('tc_info_low_level')

    //window.ga.trackView('info');

    if (selected) {
      selected.onShowInfoPage()
    }
    return false
  }

  public gotoPlotPage() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    let selected = this.sensorList[selectedSensor]
    this.dbg = true

    //window.ga.trackView('plot');
    let tc = <TankCheck>selected
    tc.onShowPlotPage()
  }

  public hidePlotPage() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    let selected = this.sensorList[selectedSensor]
    this.dbg = false

    //window.ga.trackView('plot');
    let tc = <TankCheck>selected
    tc.onHidePlotPage()
  }

  private backbutton(e) {
    e.preventDefault()
    const {
      router: {
        location: { pathname },
      },
    } = (store.getState() as unknown) as RootState
    if (pathname == '/') {
      navigator['Backbutton'].goBack(
        () => {
          utils.log('went to bg')
        },
        () => {
          utils.log('failed to go to bg')
        }
      )
    } else {
      window.history.back()
    }
  }

  public copyPlotDataAndUpload(sensor?: Sensor | TankCheck) {
    let selected: TankCheck
    if (sensor) {
      selected = this.sensorList[sensor.shortAddress] as TankCheck
    } else {
      const {
        sensors: { selectedSensor },
      } = (store.getState() as unknown) as RootState
      selected = this.sensorList[selectedSensor] as TankCheck
    }
    fetch(
      `https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/sensors/${utils.toCloudAddress(
        selected?.shortAddress
      )}/plot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selected?.plotData),
      }
    )
      .then(data => data.json())
      .then(json => {
        console.log(json)
      })
      .catch(err => {
        console.log(err)
      })
    window.cordova.plugins['clipboard'].copy(JSON.stringify(selected?.plotData))
  }

  private async getConfig() {
    try {
      const res = await fetch(`https://gateway.mopeka.cloud/v1/config/${app_brand}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (res.status === 200) {
        const json = await res.json()
        for (const [key, value] of Object.entries(json)) {
          window.localStorage.setItem(key, value as any)
        }
      }
    } catch (error) {
      utils.log('Failed to fetch. Probably no internet connection.')
    }
  }

  private async ready() {
    utils.log('deviceready')

    // requirejs(['js-lib/influxdb.min.js'], () => {
    //   utils.log('InfluxDB loaded')
    //   this.influxDb = true //new Influxdb("https://misc.wirelessbites.com/write?db=mopeka&u=writer&p=writer&precision=ms", false);
    // })

    notification.initPushService()
    await this.getConfig()

    // delay notifications for the first minute
    this.snoozeNotifications = true
    utils.delay(60 * 1000).then(() => {
      this.snoozeNotifications = false
    })

    if (!cordova.plugins || !cordova.plugins['notification']) {
      // bad build environment if this happens???
      utils.notify('Bad configuration - no notifications', 'Error')
    } else {
      cordova.plugins['notification'].local.on('click', notification => {
        if (notification.data && notification.data.addr) {
          // TODO: dispatch a route
          console.log(notification.data.addr)
        }
      })
    }

    if (app_brand === 'bmpro') {
      utils.hide($$('#menu_img_main'))
      utils.show($$('#menu_img_alt'))
    }

    // Setup fastclick to speed up iOS
    if (ble.isIOS) {
      // requirejs(['js-lib/fastclick.min.js'], () => {
      //   utils.log('Fast click initiated')
      //   let attachFastClick = Origami.fastclick
      //   attachFastClick(document.body)
      // })
      require('intersection-observer')
      IntersectionObserver.prototype['POLL_INTERVAL'] = 100 // Time in milliseconds.
    }

    let split = $$['defaultLanguage'].split('-')
    let lang_short = split[0]
    let region = split[1]
    lang_short = lang_short ? lang_short.toLowerCase() : 'en'
    // TODO: iOS 13.4 beta breaks navigator.language
    region = region ? region.toLowerCase() : 'us'

    utils.log($$['defaultLanguage'])
    let loc = $$('[data-localize]')['localize']('i18n/i18n', { fallback: 'en', language: lang_short })

    await loc.localizePromise.always(() => {
      // Store localization strings in shorter string for convenience
      i18n = $$['localize'].data['i18n/i18n']

      this.defaultCountryId = region

      //TODO: this can likely be removed at some point and we use TankRegionPicker exclusively
      // Retrieve whether we should use metric units and tank types
      //http://www.i18nguy.com/unicode/language-identifiers.html
      if (
        tank_types.au !== undefined &&
        (['au', 'nz'].indexOf(lang_short) > -1 || // Australia / New Zealand
          ['au', 'nz'].indexOf(region) > -1)
      ) {
        this.defaultTankRegionId = 'au'
        this.defaultUnits = 'centimeters'
      } else if (
        // South Africa
        tank_types.za !== undefined &&
        (['za'].indexOf(lang_short) > -1 || ['za'].indexOf(region) > -1)
      ) {
        this.defaultTankRegionId = 'za'
        this.defaultUnits = 'centimeters'
      } else if (
        // Israel
        tank_types.il !== undefined &&
        (['il', 'he', 'ar'].indexOf(lang_short) > -1 || ['il'].indexOf(region) > -1)
      ) {
        this.defaultTankRegionId = 'il'
        this.defaultUnits = 'centimeters'
      } else if (
        // Europe
        tank_types.eu !== undefined &&
        ([
          'da',
          'de',
          'it',
          'pl',
          'hu',
          'cs',
          'no',
          'is',
          'fi',
          'sv',
          'ro',
          'tr',
          'uk',
          'bg',
          'lb',
          'sk',
          'sq',
          'bs',
          'ga',
          'ca',
          'be',
          'mk',
          'lt',
          'mo',
          'et',
          'fo',
          'lv',
          'cu',
        ].indexOf(lang_short) > -1 ||
          [
            'fr',
            'de',
            'gb',
            'ch',
            'nl',
            'gr',
            'hr',
            'pl',
            'ua',
            'mt',
            'at',
            'cz',
            'se',
            'no',
            'be',
            'cy',
            'dk',
            'is',
            'fi',
            'mc',
            'hu',
            'bg',
            'lu',
            'si',
            'ba',
            'ie',
            'gi',
            'ad',
            'fo',
            'li',
            'sm',
            'ax',
            'pt',
          ].indexOf(region) > -1)
      ) {
        this.defaultTankRegionId = 'eu'
        this.defaultUnits = 'centimeters'
      } else if (tank_types.br !== undefined && ['br'].indexOf(region) > -1) {
        // Brazil
        this.defaultTankRegionId = 'br'
        this.defaultUnits = 'centimeters'
      } else if (tank_types.pe !== undefined && ['pe'].indexOf(region) > -1) {
        // Peru
        this.defaultTankRegionId = 'pe'
        this.defaultUnits = 'centimeters'
      } else if (
        // Rest of LATAM
        tank_types.es !== undefined &&
        (['es', 'gn', 'ay'].indexOf(lang_short) > -1 ||
          ['ar', 'co', 'bo', 'py', 'uy', 've', 'mx', 'cr', 'tt', 'jm'].indexOf(region) > -1)
      ) {
        this.defaultTankRegionId = 'es'
        this.defaultUnits = 'centimeters'
      } else {
        // Else English tanks
        if (app_brand === 'gascheck') {
          this.defaultTankRegionId = 'cl'
          this.defaultCountryId = 'cl'
          this.defaultUnits = 'centimeters'
        } else if (app_brand === 'yonke') {
          this.defaultTankRegionId = 'za'
          this.defaultUnits = 'centimeters'
        } else if (app_brand === 'bmpro') {
          this.defaultTankRegionId = 'au'
          this.defaultUnits = 'centimeters'
        } else {
          this.defaultTankRegionId = 'en'
          this.defaultUnits = 'inches'
        }
      }

      // Load all previously associated devices
      try {
        // be conservative here due to prior failures
        this.loadSensors()
        // remove demo sensor on startup only show it when people tab the option screen logo 6 times
        console.log(this.forget('A1:B2:C3'))
      } catch (e) {}

      // Initialize the scan retry timer but keep it off
      this.scanRetryTimer = new Timer(this.scanRetryTimeout.bind(this), Timer.TimerType.SingleShot)
      this.bgFetchTimer = new Timer(this.finish_bg_fetch.bind(this), Timer.TimerType.SingleShot)

      this.bleInit()

      this.init_background_fetch()

      if (app_brand === 'bmpro') {
        utils.hide($$('#loginMenuIcon'))
      }

      // Do this after we loaded all sensors
      this.user = new MopekaUser()
      this.user.initUserAccountPanel()

      // TODO: rebind these in the view layer
      document.addEventListener('backbutton', this.backbutton.bind(this), false)
      document.addEventListener('pause', this.goingToBackground.bind(this), false)
      document.addEventListener('resume', this.goingToForeground.bind(this), false)

      window.open = cordova['InAppBrowser'].open

      // for demo sensor
      this.demoStateTimer = new Timer(this.updateDemo.bind(this), Timer.TimerType.Recurring)
    })
  }

  public startDemo() {
    window.localStorage.setItem(
      'A1:B2:C3',
      JSON.stringify({
        address: 'AA:BB:CC:A1:B2:C3',
        isGw: false,
        forgotten: false,
        name: 'DEMO Sensor',
        lastSeen: Date.now(),
        shortAddress: 'A1:B2:C3',
        connectAddress: 'AA:BB:CC:A1:B2:C3',
        version: 259,
        levelUnits: 'percent',
        tankInfo: { type: '20lb', label: '20 lb, Vertical', vertical: true, height: 0.254 },
        hwFamily: 'pro',
        alarmNotificationsEnabled: true,
        alarmThreshPercent: 20,
        alarmReady: false,
        alarmTriggered: true,
        aceRewards: '',
        acceloXOffset: 0,
        acceloYOffset: 0,
        samples: {
          corrupted: false,
          level: 0.18,
          q: 35.1443644762039185,
          qualityStars: 3,
          date: 1619675487332,
          hwFamily: 'pro',
          hwVersionNumber: 259,
          acceloX: -7,
          acceloY: -7,
          battery: 2.8828125,
          temperature: 31.985352,
          slowUpdateRate: true,
          syncPressed: false,
          adv: [
            { a: 6, i: 68 },
            { a: 6, i: 130 },
          ],
        },
        lastSampleSource: 'ble',
        savedTankRegionId: 'en',
        savedTankCountryId: 'us',
        propaneButaneRatio: 1,
      })
    )
    this.loadSensorFromLocalStorage('A1:B2:C3')
    if (this.demoStateTimer.isArmed) {
      this.demoStateTimer.start(2000)
    }
  }

  public stopDemo() {
    this.demoStateTimer.stop()
  }

  private updateDemo() {
    const sensor = this.sensorList['A1:B2:C3'] as TankCheck
    const s = {
      corrupted: false,
      level: Math.random() * (0.0009 - 0.0002) + 0.0002,
      q: Math.random() * (40 - 25) + 25,
      qualityStars: 3,
      date: Date.now(),
      hwFamily: 'pro',
      hwVersionNumber: 259,
      acceloX: -7,
      acceloY: -7,
      battery: Math.random() * (2.9 - 2.4) + 2.4,
      temperature: Math.random() * (34 - 30) + 30,
      slowUpdateRate: true,
      syncPressed: false,
      adv: [
        { a: 6, i: 68 },
        { a: 6, i: 130 },
      ],
    }

    sensor.samples.level = s.level
    sensor.samples.q = s.q
    sensor.samples.qualityStars = s.qualityStars
    sensor.samples.date = s.date
    sensor.samples.battery = s.battery
    sensor.samples.temperature = s.temperature
    sensor.samples.slowUpdateRate = s.slowUpdateRate

    sensor.lastSeen = Date.now()
    sensor.last_rssi = utils.rand(-92, -68)

    sensor.onNewSample()
  }

  public async initialize() {
    this.androidVersion = BluetoothObject.getAndroidVersion()
    this.isIOS = utils.isIOS()
    await this.ready()
  }
}

export const ble = new BluetoothObject()
window['ble'] = ble
