import { TankCheck } from './tankcheck'
import { utils } from '../utils'
import { ble } from '../index'

import _ from 'lodash'

import store from '../../view/store'
import { removeSensor, addOrUpdateSensor, setPendingWriteStatus } from '../../view/store/reducers/sensors/reducers'
import { RootState } from '../../view/store/reducers'

export type SensorList = {
  [key: string]: Sensor
}

export enum SensorCategory {
  LPG = 'Bottom Mount - LPG',
  BottomWater = 'Bottom Mount - Water',
  Other = 'Bottom Mount - Other',
  TopMount = 'Top Mount - All Liquids',
  Bridges = 'Bridges',
}

export enum PubSubVarTypeEnum {
  UNKNOWN,
  STRING,
  PASSWORD,
  UINT8,
  UINT16,
  UINT32,
  CUSTOM,
}

export type PubSubConstDescriptor = {
  name: string
  cuuid: string
  type: PubSubVarTypeEnum
  label: string
  refreshRate: number
  subscribe?: boolean
  canRead: boolean
  canWrite: boolean
  customRead?: (_ps: PubSubVar, val: Uint8Array | Uint16Array | Uint32List) => any
}

export type PubSubVar = {
  descriptor: PubSubConstDescriptor

  /** Service uuid containing characteristic */
  suuid: string

  /** Characteristic uuid */
  cuuid: string

  /** Base64 encoded string of bytes */
  rawValue: Uint8Array
  value: string | number
  readTimer?: number
  pendingRead?: boolean
}

type PubSubVarMap = {
  [name: string]: PubSubVar
}

type DeviceInfoResponse = {
  ok: boolean
  data?: BluetoothlePlugin.DeviceInfo
  error?: BluetoothlePlugin.Error
}

class ResolveOnce {
  public isResolved = false
  private resolve: Function
  constructor(_resolve) {
    this.resolve = _resolve
  }
  public once(obj: any) {
    if (!this.isResolved) {
      this.isResolved = true
      this.resolve(obj)
      //utils.log("Resolved once: " + obj.ok);
      return true
    }
    return false
  }
}

export abstract class Sensor {
  public category: SensorCategory
  /** Full 6 byte MAC on android and 3 byte on iOS*/
  longAddress: string

  /** 3 byte MAC on android and iOS */
  shortAddress: string

  /** Full 6 byte MAC on android, custom UUID on iOS */
  public connectAddress: string

  isGw: boolean
  email: string
  firstName: string
  lastName: string
  forgotten: boolean
  name: string
  lastSeen: number
  highlighted: boolean

  /**
   * Returns raw RSSI value
   *
   * @type {(number | "none")}
   * @memberof Sensor
   */
  last_rssi: number | 'none'

  /**
   * Returns a quality in the range of 0-5
   *
   * Only returns 5 when last source was cloud
   *
   * @type {number}
   * @memberof Sensor
   */
  rssiQuality: number
  isNew: boolean ///< Is first time seen?

  protected defaultMtu: number = 23
  private deviceConnectCalls: number = 0

  public connectState: 'disconnected' | 'trying' | 'connected' = 'disconnected'

  private pubsub_service_uuids: string[] = null
  public pubsub: PubSubVarMap = {}

  protected abstract readonly pubsub_types: PubSubConstDescriptor[]

  protected abstract onConnected()
  protected abstract onDisconnected()
  protected abstract onUpdateStatus(txt: string)

  /** is the sync button pressed */
  public abstract isSyncPressed()
  public abstract onShowInfoPage()

  public isConnectable(): boolean {
    return this.pubsub_service_uuids !== null
  }

  public getConnectState() {
    return this.connectState
  }

  protected setUuid(pubsub_uuid: string[]) {
    this.pubsub_service_uuids = pubsub_uuid
    for (let i = 0; i < this.pubsub_types.length; ++i) {
      this.pubsub_types[i].cuuid = this.pubsub_types[i].cuuid.toUpperCase()
    }
  }

  protected loader(obj: any, loaded: boolean) {
    let s = obj
    if (loaded) {
      this.last_rssi = 'none'
      this.isNew = false
    } else {
      // This is for a first added to list sensor. Check to see if it exists in local storage
      // from a previous time saved and if so use this.  Otherwise will be NULL and we create a new
      let js = utils.loadSensorFromLongAddress(obj['address'])
      if (js) s = JSON.parse(js)
      this.isNew = !js
      this.last_rssi = obj['rssi']
      this.rssiQuality = this.getSignalImageOffset()
    }

    this.longAddress = obj['address']
    this.shortAddress = utils.toShortAddress(this.longAddress)
    this.connectAddress = obj['connectAddress']
    this.name = s['name']
    this.email = s['email']
    this.firstName = s['firstName']
    this.lastName = s['lastName']
    this.lastSeen = s['lastSeen']
    this.forgotten = s['forgotten']
    return s
  }

  getLastSeenDate() {
    if (!this.lastSeen) return null
    return new Date(this.lastSeen)
  }

  protected getSaveObject(obj?) {
    obj = obj || {}
    _.extend(obj, {
      address: this.longAddress,
      isGw: this.isGw,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      forgotten: this.forgotten,
      name: this.name,
      lastSeen: this.lastSeen,
      connectAddress: this.connectAddress,
    })
    return obj
  }

  public save(updateState?: boolean) {
    this.forgotten = false
    // // send a cloned copy of this sensor/gateway to keep redux state immutable
    // this.save();
    let obj = this.getSaveObject()
    if (updateState) {
      store.dispatch(addOrUpdateSensor(this))
    }
    window.localStorage.setItem(this.shortAddress, JSON.stringify(obj))
  }

  public forget() {
    this.forgotten = true
    let obj = this.getSaveObject()
    store.dispatch(removeSensor(this))
    window.localStorage.setItem(this.shortAddress, JSON.stringify(obj))
  }

  public getName(): string {
    return this.name
  }

  public getSignalImageOffset(): number {
    var r = 4
    let rssi = this.last_rssi

    if (!this.isGw) {
      let s: Sensor = this
      let tc = <TankCheck>s
      if (tc.lastSampleSource === 'cloud') {
        return (5 / 5) * 100
      }
    }

    if (rssi === 'none') return 0

    if (rssi <= -88) {
      r = 0
    }
    if (rssi <= -82) {
      r = 1
    }
    if (rssi <= -77) {
      r = 2
    }
    if (rssi <= -72) {
      r = 3
    }
    //if (rssi <= -67) {
    //return 4;
    //}

    return r
  }

  /*private getSignalStrengthAsPercentage() {
        var t = (this.last_rssi + 100) * 2;
        if (t <= 0) {
            t = 1;
        } else if (t > 100) {
            t = 100;
        }
        return t;
    }*/

  private findPubSubInfoByCharUuid(char_uuid: string): PubSubConstDescriptor {
    let cuuid: string = char_uuid.substr(4, 4).toUpperCase()

    for (let i = 0; i < this.pubsub_types.length; ++i) {
      if (cuuid === this.pubsub_types[i].cuuid) return this.pubsub_types[i]
    }
    return null
  }

  protected refreshCharacteristic(
    ps: PubSubVar
  ): Promise<{
    ok: boolean
    data?: PubSubVar
    error?: BluetoothlePlugin.Error
  }> {
    if (!ps || !ps.descriptor) {
      return Promise.resolve({
        ok: false,
        error: { code: -1, message: 'Sensor discovery not performed yet' },
      })
    }
    if (!ps.descriptor.canRead) {
      return Promise.resolve({
        ok: false,
        error: {
          code: -1,
          message: 'Characteristic ' + ps.descriptor.name + ' does not have read access',
        },
      })
    }

    if (ps.pendingRead) {
      return Promise.resolve({
        ok: false,
        error: {
          code: -2,
          message: 'Characteristic ' + ps.descriptor.name + ' has a read already pending',
        },
      })
    }

    ps.pendingRead = true
    return new Promise(resolve => {
      this.readCharacteristicPromise(ps).then(resp => {
        try {
          if (resp.ok) {
            let val = resp.data
            ps.rawValue = val
            switch (ps.descriptor.type) {
              case PubSubVarTypeEnum.STRING:
                //utils.log("ConvertA:" + JSON.stringify(val));
                ps.value = bluetoothle.bytesToString(val)
                break
              case PubSubVarTypeEnum.UINT8:
                ps.value = val[0]
                break
              case PubSubVarTypeEnum.UINT16:
                /* jslint bitwise: true */
                ps.value = (val[0] << 0) + (val[1] << 8)
                /* jslint bitwise: false */
                break
              case PubSubVarTypeEnum.UINT32:
                /* jslint bitwise: true */
                ps.value = (val[0] << 0) + (val[1] << 8) + (val[2] << 16) + (val[3] << 24)
                /* jslint bitwise: false */
                break
              case PubSubVarTypeEnum.CUSTOM:
                if (ps.descriptor.customRead) {
                  ps.value = ps.descriptor.customRead.call(this, ps, val)
                }
            }
            ps.pendingRead = false
            this.updatePubSubDiv(ps)
            resolve({ ok: true, data: ps })
          } else {
            ps.pendingRead = false
            utils.log('Failed to read characteristic ' + ps.descriptor.name, resp)
            resolve({ ok: false, error: resp.error })
          }
        } catch (e) {
          ps.pendingRead = false
          resolve({ ok: false, error: (e && e.message) || 'Unexpected error' })
        }
      })
    })
  }

  private cancelCharacteristicRefreshTimers(): boolean {
    let gotOne: boolean = false
    if (!this.pubsub) return false

    var i = 0,
      keys = Object.keys(this.pubsub)
    for (i = 0; i < keys.length; i++) {
      let name = keys[i]
      let ps = this.pubsub[name]
      if (ps.readTimer) {
        clearInterval(ps.readTimer)
        ps.readTimer = null
        gotOne = true
      }

      if (ps.descriptor.subscribe) {
        this.unSubscribePromise(5000, ps)
      }
    }
    return gotOne
  }

  // TODO: later use
  // public hasPendingWrites(): boolean {
  //     let gotOne: boolean = false;
  //     if (!this.pubsub) return false;

  //     var i = 0, keys = Object.keys(this.pubsub);
  //     for (i = 0; i < keys.length; i++) {
  //         let name = keys[i];
  //         let ps = this.pubsub[name];
  //         if (ps.pendingWrite) {
  //             gotOne = true;
  //         }
  //     }
  //     return gotOne;
  // }

  private initCharacteristicRefreshTimer(ps: PubSubVar) {
    if (ps.descriptor.refreshRate && ps.descriptor.canRead) {
      ps.readTimer = window.setInterval(
        ps => {
          this.refreshCharacteristic(ps)
        },
        ps.descriptor.refreshRate,
        ps
      )
    }
    if (ps.descriptor.subscribe) {
      this.subscribePromise(5000, ps)
    }
  }

  private initCharacteristics(
    status: BluetoothlePlugin.Device
  ): Promise<{ ok: boolean; data?: PubSubVar; error?: BluetoothlePlugin.Error }[]> {
    this.onUpdateStatus('Reading variables...')
    this.cancelCharacteristicRefreshTimers()
    this.pubsub = {}

    let s = status.services
    for (let i = 0; i < s.length; ++i) {
      if (this.pubsub_service_uuids.indexOf(s[i].uuid) < 0) continue
      let cs = s[i].characteristics

      for (let x = 0; x < cs.length; ++x) {
        let c = cs[x]
        let psi: PubSubConstDescriptor = this.findPubSubInfoByCharUuid(c.uuid)
        if (psi) {
          this.pubsub[psi.name] = {
            descriptor: psi,
            suuid: s[i].uuid,
            cuuid: c.uuid,
            rawValue: null,
            value: null,
          }
        }
      }
    }

    let defs = []
    let keys = Object.keys(this.pubsub)
    for (let i = 0; i < keys.length; i++) {
      let ps = this.pubsub[keys[i]]
      if (ps.descriptor.type !== PubSubVarTypeEnum.UNKNOWN) {
        defs.push(this.refreshCharacteristic(ps))
        this.initCharacteristicRefreshTimer(ps)
      }
    }

    return Promise.all(defs)
  }

  protected unSubscribePromise(
    timeout: number,
    ps: PubSubVar
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.Device
    error?: BluetoothlePlugin.Error
  }> {
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)

      bluetoothle.unsubscribe(
        data => {
          if (data.status == 'unsubscribed') {
            once.once({ ok: true })
          }
        },
        () => {
          once.once({ ok: false })
        },
        {
          address: this.connectAddress,
          service: ps.suuid,
          characteristic: ps.cuuid,
        }
      )

      utils.delay(timeout).then(() =>
        once.once({
          ok: false,
          error: { code: -1, message: 'subscribePromise timeout.' },
        })
      )
    })
  }

  protected subscribePromise(
    timeout: number,
    ps: PubSubVar
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.Device
    error?: BluetoothlePlugin.Error
  }> {
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)

      bluetoothle.subscribe(
        data => {
          if (data.status == 'subscribedResult') {
            let raw = bluetoothle.encodedStringToBytes(data.value || '')
            ps.value = ps.descriptor.customRead.call(this, ps, raw)
          } else if (data.status == 'subscribed') {
            once.once({ ok: true })
          }
        },
        () => {
          once.once({ ok: false })
        },
        {
          address: this.connectAddress,
          service: ps.suuid,
          characteristic: ps.cuuid,
        }
      )

      utils.delay(timeout).then(() =>
        once.once({
          ok: false,
          error: { code: -1, message: 'subscribePromise timeout.' },
        })
      )
    })
  }

  protected requestConnectionPriorityPromise(
    timeout: number,
    prio: 'low' | 'balanced' | 'high'
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.Device
    error?: BluetoothlePlugin.Error
  }> {
    if (ble.isIOS || ble.androidVersion < 0x00050000) {
      return Promise.resolve({ ok: true })
    }
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)

      bluetoothle.requestConnectionPriority(
        () => once.once({ ok: true }),
        () => once.once({ ok: false }),
        {
          address: this.connectAddress,
          connectionPriority: prio,
        }
      )

      utils.delay(timeout).then(() =>
        once.once({
          ok: false,
          error: { code: -1, message: 'requestConnectionPriority timeout.' },
        })
      )
    })
  }

  private setMtuPromise(
    timeout: number
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.Device
    error?: BluetoothlePlugin.Error
  }> {
    if (ble.isIOS || ble.androidVersion < 0x00050000) {
      return Promise.resolve({ ok: true })
    }
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)

      bluetoothle.mtu(
        () => once.once({ ok: true }),
        () => once.once({ ok: false }),
        {
          address: this.connectAddress,
          mtu: this.defaultMtu,
        }
      )

      utils.delay(timeout).then(() =>
        once.once({
          ok: false,
          error: { code: -1, message: 'setMtu timeout.' },
        })
      )
    })
  }

  private deviceDiscoveryPromise(
    timeout: number,
    info: BluetoothlePlugin.DeviceInfo
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.Device
    error?: BluetoothlePlugin.Error
  }> {
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)
      bluetoothle.discover(
        data => once.once({ ok: true, data }),
        error => once.once({ ok: false, error }),
        { address: info.address }
      )

      // Implement timeout
      utils.delay(timeout).then(() =>
        once.once({
          ok: false,
          error: { code: -1, message: 'Discovery timeout.' },
        })
      )
    })
  }

  // Disconnect and after a brief delay reconnect
  private async reconnect(): Promise<void> {
    utils.log('reconnect called')
    return this.deviceDisconnect(true)
      .then(() => utils.delay(500))
      .then(() => {
        if (this.connectState === 'connected') {
          this.deviceConnect()
        } else {
          utils.log('Skipping reconnect')
        }
      })
  }

  protected writeCharacteristicPromise(
    ps: PubSubVar,
    val: Uint8Array
  ): Promise<{
    ok: boolean
    data?: BluetoothlePlugin.OperationResult
    error?: BluetoothlePlugin.Error
  }> {
    return new Promise(resolve => {
      if (this.connectState != 'connected') {
        resolve({ ok: false })
      } else {
        ps.rawValue = val
        if (!val || !val.length) {
          val = new Uint8Array([0])
        }
        bluetoothle.write(
          data => {
            store.dispatch(setPendingWriteStatus(false))
            resolve({ ok: true, data })
          },
          error => {
            store.dispatch(setPendingWriteStatus(false))
            resolve({ ok: false, error })
          },
          {
            address: this.connectAddress,
            service: ps.suuid,
            characteristic: ps.cuuid,
            value: bluetoothle.bytesToEncodedString(val),
          }
        )
      }
    })
  }

  private readCharacteristicPromise(
    ps: PubSubVar
  ): Promise<{
    ok: boolean
    data?: Uint8Array
    error?: BluetoothlePlugin.Error
  }> {
    return new Promise(resolve => {
      bluetoothle.read(
        data =>
          resolve({
            ok: true,
            data: bluetoothle.encodedStringToBytes(data.value || ''),
          }),
        error => resolve({ ok: false, error }),
        {
          address: this.connectAddress,
          service: ps.suuid,
          characteristic: ps.cuuid,
        }
      )
    })
  }

  private closePromise(): Promise<DeviceInfoResponse> {
    return new Promise(resolve => {
      bluetoothle.close(
        data => {
          this.onDisconnected()
          resolve({ ok: true, data })
        },
        error => {
          resolve({ ok: false, error })
        },
        { address: this.connectAddress }
      )
    })
  }

  private disconnectPromise(): Promise<DeviceInfoResponse> {
    return new Promise(resolve => {
      bluetoothle.disconnect(
        data => {
          resolve({ ok: true, data })
        },
        error => {
          resolve({ ok: false, error })
        },
        { address: this.connectAddress }
      )
    })
  }

  private deviceConnectPromise(timeout: number, callNumber: number): Promise<DeviceInfoResponse> {
    return new Promise(resolve => {
      let once = new ResolveOnce(resolve)

      utils.log(callNumber + ' - calling connect on ' + this.connectAddress + ', mac=' + this.longAddress)
      bluetoothle.connect(
        data => {
          utils.log(callNumber + ' - Got connect callback: ', data)
          if (data.status === 'connected') {
            once.once({ ok: true, data })
          } else {
            this.reconnect().then(() => {
              once.once({ ok: false, data })
            })
          }
        },
        error => {
          utils.log(callNumber + ' - Got connect error callback: ' + JSON.stringify(error))
          this.reconnect().then(() => {
            once.once({ ok: false, error })
          })
        },
        { address: this.connectAddress }
      )

      // Implement timeout
      utils.delay(timeout).then(() => {
        if (!once.isResolved) {
          once.isResolved = true
          utils.log(callNumber + ' - Connect timeout')
          this.reconnect().then(() => {
            resolve({
              ok: false,
              error: { code: -1, message: 'Connect timeout.' },
            })
          })
        }
      })
    })
  }

  public async deviceDisconnect(internalCall?: boolean): Promise<any> {
    utils.log('deviceDisconnect called')
    const gotOne = this.cancelCharacteristicRefreshTimers() // If any pending read timers, then cancel now
    let t = gotOne ? 100 : 0

    if (!internalCall) {
      this.connectState = 'disconnected'
    }

    const {
      sensors: { pendingWrite },
    } = (store.getState() as unknown) as RootState
    console.log(`pendingWrite: ${pendingWrite}`)

    if (pendingWrite) {
      t = 2000
    }

    // delay disconnecting to allow for any writes to finish. This is a bandaid fix
    return utils
      .delay(t)
      .then(() => {
        this.disconnectPromise()
      })
      .then(() => {
        this.closePromise()
      })
  }

  public async deviceConnect() {
    if (this.shortAddress == 'A1:B2:C3') {
      // don't bother connecting to demo sensor
      return
    }
    // If any pending read timers, then cancel now
    this.cancelCharacteristicRefreshTimers()

    if (this.connectState === 'trying') return
    this.connectState = 'trying'

    // Connect loop and retry
    while (this.connectState === 'trying') {
      this.onUpdateStatus('Connecting to device...')
      let info = await this.deviceConnectPromise(9000, this.deviceConnectCalls++)
      if (!info.ok) {
        this.onUpdateStatus(((info.error && info.error.message) || 'Connect error') + '. Retrying...')
        await utils.delay(1000)
        continue
      }

      utils.log('Now connected to: ' + info.data.address)
      this.onUpdateStatus('Discovering variables...')
      utils.log('Discovering variables...')
      let disc = await this.deviceDiscoveryPromise(15000, info.data)
      if (!disc.ok) {
        utils.log('Discovery failed: ', disc)
        this.onUpdateStatus('Discovery failed. ' + ((disc.error && disc.error.message) || '') + '. Retrying...')
        utils.log('Disconnecting after failed discovery')
        await this.deviceDisconnect(true)
        await utils.delay(2000)
        continue
      }

      // Set MTU to allow setting more than 20 characters for WIFI SSID/Password, and others
      await this.setMtuPromise(5000)

      utils.log('Discovered characteristics for ' + info.data.address)
      await this.initCharacteristics(disc.data)

      this.connectState = 'connected'

      this.onConnected()
      this.onUpdateStatus('Connected to device')
      break
    }
  }

  // Update existing div for a pubsub variable
  protected updatePubSubDiv(ps: PubSubVar) {
    if (!ps || ps.pendingRead) return

    store.dispatch(addOrUpdateSensor(this))
  }
}
