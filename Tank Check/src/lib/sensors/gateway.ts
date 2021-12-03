/// <reference types="cordova-plugin-bluetoothle" />

declare var bluetoothle: BluetoothlePlugin.Bluetoothle
import store from '../../view/store'
import { showToast } from '../../view/store/reducers/toaster/reducers'
import { ble } from '../index'
import { utils } from '../utils'
import { PubSubConstDescriptor, PubSubVar, PubSubVarTypeEnum, Sensor, SensorCategory } from './sensor'

/** @constructor */
export class Gateway extends Sensor {
  protected defaultMtu: number = 70
  public static readonly PUBSUB_UUID = '7F330000-5C9A-4440-9254-52FC43A694F1'
  protected readonly pubsub_types: PubSubConstDescriptor[] = [
    //{ name: "dev_name",         cuuid: "75f4",      type: PubSubVarTypeEnum.STRING,   label: "Device Name",       refreshRate: 0,     canRead: true,  canWrite: false,  subscribe: false, onWrite: this.onGatewayNameWrite },
    {
      name: 'wap_ssid',
      cuuid: '34d1',
      type: PubSubVarTypeEnum.STRING,
      label: 'Wifi AP Name',
      refreshRate: 0,
      canRead: true,
      canWrite: true,
      subscribe: false,
    },
    {
      name: 'wap_password',
      cuuid: 'd403',
      type: PubSubVarTypeEnum.PASSWORD,
      label: 'Wifi Password',
      refreshRate: 0,
      canRead: false,
      canWrite: true,
      subscribe: false,
    },
    {
      name: 'wap_state',
      cuuid: 'f8ad',
      type: PubSubVarTypeEnum.CUSTOM,
      label: 'Wifi State',
      refreshRate: 3000,
      canRead: true,
      canWrite: false,
      customRead: this.onWapStateRead,
    },
    {
      name: 'updateRate',
      cuuid: '1b7a',
      type: PubSubVarTypeEnum.CUSTOM,
      label: 'Update Rate',
      refreshRate: 0,
      canRead: true,
      canWrite: true,
      customRead: this.onUpdateIntRead,
    },
    {
      name: 'ip_address',
      cuuid: 'dc38',
      type: PubSubVarTypeEnum.STRING,
      label: 'Wifi Address',
      refreshRate: 3000,
      canRead: true,
      canWrite: false,
      subscribe: false,
    },
    {
      name: 'bda_str',
      cuuid: '5122',
      type: PubSubVarTypeEnum.CUSTOM,
      label: 'Device Address',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
      customRead: this.onMacRead,
    },
    {
      name: 'firmware_version',
      cuuid: '5412',
      type: PubSubVarTypeEnum.CUSTOM,
      label: 'Firmware Version',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
      customRead: this.onFirmwareRead.bind(this),
    },
    {
      name: 'pcb_revision',
      cuuid: '4bb1',
      type: PubSubVarTypeEnum.STRING,
      label: 'PCB Revision',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'factory_reset',
      cuuid: 'da41',
      type: PubSubVarTypeEnum.UINT8,
      label: 'Factory Reset',
      refreshRate: 0,
      canRead: false,
      canWrite: false,
    },

    //{ name: "free_heap",        type: "uint32",     label: "Free Memory",       refreshRate: 5000  },
  ]

  // Displayed properties
  public statusMessage: string
  public ssid: string
  public updateRate: string

  constructor(obj: any, loaded: boolean) {
    super()
    this.category = SensorCategory.Bridges
    this.setUuid([Gateway.PUBSUB_UUID])
    super.loader(obj, loaded)
    this.isGw = true
    this.name = this.name || 'New Bridge'
  }

  public getSaveObject(obj?) {
    obj = obj || {}
    super.getSaveObject(obj)
    return obj
  }

  public isSyncPressed(): boolean {
    //TODO: make this work
    return false
  }

  private onMacRead(_ps: PubSubVar, val: Uint8Array): string {
    if (!val || !val.length) return 'Unknown'
    var s = bluetoothle.bytesToString(val)
    return (
      s.substring(0, 2) +
      ':' +
      s.substring(2, 4) +
      ':' +
      s.substring(4, 6) +
      ':' +
      s.substring(6, 8) +
      ':' +
      s.substring(8, 10) +
      ':' +
      s.substring(10, 12)
    )
  }

  private onFirmwareRead(_ps: PubSubVar, val: Uint8Array): string {
    let f = this.getFirmwareVersion(val)
    if (!f) return bluetoothle.bytesToString(val)
    return '' + f.major + '.' + f.minor + '.' + f.commit
  }

  private onUpdateIntRead(_ps: PubSubVar, val: Uint8Array): string {
    if (!val || !val.length) return '5'

    let n = val[0] + (val[1] << 8) + (val[2] << 16) + (val[3] << 24)
    n = (n + 59) / 60
    n = Math.floor(n)

    return '' + n
  }

  private onWapStateRead(_ps: PubSubVar, val: Uint8Array): string {
    if (!val || !val.length) return 'Unknown Wifi state'
    let connected = val[0] & 1
    let trying = val[0] & 4
    if (!trying && !connected) {
      return 'No Wifi credentials'
    } else if (!connected) {
      return 'Trying to connect...'
    } else {
      return 'Connected'
    }
  }

  private getFirmwareVersion(val?: Uint8Array): { major: number; minor: number; commit: number } {
    if (!val) {
      let ps = this.pubsub['firmware_version']
      val = ps.rawValue
    }
    let s = bluetoothle.bytesToString(val)
    let m = s.match(/^v([0-9]+).([0-9]+)-([0-9]+)/)
    if (!m || m.length != 4) return null

    return { major: +m[1], minor: +m[2], commit: +m[3] }
  }

  public async saveCloudSettings(n: number) {
    return new Promise(async (resolve, reject) => {
      let ps = this.pubsub['updateRate']
      if (!ps) {
        let f = this.getFirmwareVersion()
        if (f && f.major <= 0 && f.minor <= 0 && f.commit < 66) {
          utils.notify(
            'This feature is not available in your current bridge firmware.  The bridge will automatically be updated once connected to Wifi with internet access',
            'Failed to write'
          )
        } else {
          utils.notify('Unexpected error trying to write value', 'Failed to write')
        }
        return reject({ success: false })
      }

      // let s = String(ps.$div.val());
      // s = s.trim();

      // let n : number = parseInt(s, 10);
      if (!n || n === NaN || n < 1 || n > 1e25) {
        utils.notify('Invalid number entered', 'Invalid')
        return reject({ success: false })
      }

      // ps.$div.val(n);

      n *= 60
      let a: Uint8Array = new Uint8Array(4)
      a[0] = n & 0xff
      a[1] = (n >>> 8) & 0xff
      a[2] = (n >>> 16) & 0xff
      a[3] = (n >>> 24) & 0xff

      let w = await this.writeCharacteristicPromise(ps, a)
      //utils.log("" + JSON.stringify(w));
      if (!w.ok || w.data.status !== 'written') {
        utils.log('Failed to write', w)
        utils.notify(w.error && w.error.message, "Failed to write '" + name + '"')
        return reject({ success: false })
      } else {
        utils.log('Successfully wrote updateRate=' + n)
        store.dispatch<any>(
          showToast({
            type: 'success',
            message: 'Successfully changed update rate',
          })
        ) // any type to appease redux
        // utils.notify("Successfully changed update rate", "Success");
        this.refreshCharacteristic(ps)
        return resolve({ success: true })
      }
    })
  }

  public async saveWifiSettings(ssid: string, password?: string) {
    return new Promise(async (resolve, reject) => {
      if (ssid) {
        let ps = this.pubsub['wap_ssid']
        if (!ps) return

        let w = await this.writeCharacteristicPromise(ps, bluetoothle.stringToBytes(ssid))
        if (!w.ok || w.data.status !== 'written') {
          utils.log('Failed to write', w)
          utils.notify(w.error && w.error.message, "Failed to write '" + name + '"')
          reject({ success: false })
        }
      }

      if (password !== '!~m@#@!~@#4!~!a@#@1#!~') {
        let ps = this.pubsub['wap_password']
        if (!ps) return

        let w = await this.writeCharacteristicPromise(ps, bluetoothle.stringToBytes(password ?? ''))
        if (!w.ok || w.data.status !== 'written') {
          utils.log('Failed to write', w)
          utils.notify(w.error && w.error.message, "Failed to write '" + name + '"')
          return reject({ success: false })
        }
      }

      if (ssid || password) {
        this.refreshCharacteristic(this.pubsub['wap_state'])
        this.refreshCharacteristic(this.pubsub['wap_ssid'])

        store.dispatch<any>(
          showToast(
            {
              type: 'success',
              title: 'Wifi settings saved',
              message: 'If Wifi does not connect, check your Wifi name and password and try again',
            },
            5000
          )
        ) // any type to appease redux
        // await utils.notifyPromise("If Wifi does not connect, check your Wifi name and password and try again.", "Wifi settings saved");
        return resolve({ success: true })
      }
    })
  }

  protected onUpdateStatus(txt: string) {
    this.statusMessage = txt
    this.save()
  }

  protected onDisconnected() {
    utils.log('Gateway disconnected')
  }

  protected onConnected() {
    for (var i = 0; i < this.pubsub_types.length; ++i) {
      let ps = this.pubsub[this.pubsub_types[i].name]
      if (ps) {
        this.updatePubSubDiv(ps)
      }
    }
  }

  public onShowInfoPage() {
    ble.adapterStopScan().then(() => {
      this.deviceConnect()
    })
  }
}
