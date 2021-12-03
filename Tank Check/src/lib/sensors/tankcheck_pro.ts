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
import { Duration } from 'luxon'
import store from '../../view/store'
import { RootState } from '../../view/store/reducers'
import { setPlotData } from '../../view/store/reducers/plot/reducers'
import { setCurrentAndCheckForUpdates } from '../../view/store/reducers/sensors/firmware/reducers'
import { ble } from '../index'
import { utils } from '../utils'
import { Sample } from './sample'
import { PubSubConstDescriptor, PubSubVar, PubSubVarTypeEnum, SensorCategory } from './sensor'
import { HardwareFamily, TankCheck } from './tankcheck'

type tankcheck_data_t = {
  fw_version?: string // MAJOR(16) . MINOR(8) . PATCH(8)
  raw_level?: number // last measured raw level in 20us ticks
  quality?: number // last measured quality
  hyper_count?: number
  low_pass_alpha?: number // [0.16] low pass alpha - updated at sample rate
  accelo_x?: number
  accelo_y?: number
  battery?: number // [2.6] V
  temperature?: number // [7.1] degC with -40 offset
  pulse_settings?: number
  algo_select?: number
  dont_zero_sample?: number
  sample_rate?: number
  fir_coef_table?: number
  pulse_param?: number
  gain_setting?: number
  att_type?: number

  samp_filt?: Int16Array // low passed and median filtered buffer
  score_filt?: Uint32Array // calculated score buffer

  adc_buf?: Int16Array // raw buffer for samples
}

export class TankCheckPro extends TankCheck {
  public uptime: number = 0

  private tc: tankcheck_data_t

  private plotShown: boolean = false

  private stream: Uint8Array = new Uint8Array(6000)

  protected readonly pubsub_types: PubSubConstDescriptor[] = [
    {
      name: 'stream',
      cuuid: '0201',
      type: PubSubVarTypeEnum.CUSTOM,
      label: 'stream',
      refreshRate: 0,
      customRead: this.onStreamRead,
      canRead: false,
      canWrite: false,
      subscribe: false,
    },
    {
      name: 'firmware_version',
      cuuid: '0001',
      type: PubSubVarTypeEnum.UINT16,
      label: 'Firmware Version',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'top_level_pn',
      cuuid: '0003',
      type: PubSubVarTypeEnum.STRING,
      label: 'Part Number',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'pcba_pn',
      cuuid: '0004',
      type: PubSubVarTypeEnum.STRING,
      label: 'PCB Number',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'serial_number',
      cuuid: '0005',
      type: PubSubVarTypeEnum.UINT32,
      label: 'Serial Number',
      refreshRate: 0,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'uptime',
      cuuid: '0008',
      type: PubSubVarTypeEnum.UINT32,
      label: 'Uptime',
      refreshRate: 3000,
      canRead: true,
      canWrite: false,
    },
    {
      name: 'update_rate',
      cuuid: '0009',
      type: PubSubVarTypeEnum.UINT16,
      label: 'Update Rate',
      refreshRate: 3000,
      canRead: true,
      canWrite: true,
    },
    {
      name: 'hyper_count',
      cuuid: '0106',
      type: PubSubVarTypeEnum.UINT16,
      label: 'Hyper Count',
      refreshRate: 3000,
      canRead: true,
      canWrite: true,
    },
    // { name: "pulse_strength", cuuid: "0102", type: PubSubVarTypeEnum.UINT8, label: "Pulse Stength", refreshRate: 0, canRead: true, canWrite: true },
    // { name: "pulse_skip", cuuid: "0107", type: PubSubVarTypeEnum.UINT8, label: "Pulse Skip", refreshRate: 0, canRead: true, canWrite: true },
    // { name: "shelf_life_mode", cuuid: "0108", type: PubSubVarTypeEnum.UINT32, label: "Shelf Life Mode", refreshRate: 0, canRead: false, canWrite: true},
  ]

  public constructor(obj: any, loaded: boolean, hwFamily: HardwareFamily, hwVersionNumber: number) {
    super(obj, loaded, hwFamily, hwVersionNumber)
    this.category = SensorCategory.LPG
    this.setUuid(['FEE5', '6FF6FEE6-1392-4A00-93D7-551C884C2EC7', '6FF6FEE7-1392-4A00-93D7-551C884C2EC7'])
  }

  protected async onConnected() {
    utils.log('Pro connected')

    if (this.plotShown) {
      this.subscribeToGraphData()
    }

    const fwVersion = this.getFirmwareVersion()
    store.dispatch<any>(setCurrentAndCheckForUpdates(fwVersion))

    this.setHyperCount(1000)
  }

  protected onDisconnected() {
    utils.log('Pro disconnected')
  }

  protected onUpdateStatus(txt: string) {
    utils.log('Pro Status: ' + txt)
  }

  public getFirmwareVersion(): string {
    let fwVersionPubSub: PubSubVar = this.pubsub['firmware_version'] || null
    if (!fwVersionPubSub) return '0.0.0'
    let fwversionStr = fwVersionPubSub.value.toString()
    // pad for consistent length
    fwversionStr = fwversionStr.padStart(5, '0')
    const major = fwversionStr.substr(0, 1)
    const minor = fwversionStr.substr(1, 2)
    const patch = fwversionStr.substr(3, 2)
    // convert back to int to remove leading zeros
    return `${parseInt(major)}.${parseInt(minor)}.${parseInt(patch)}`
  }

  /**
   * Sets the number of updates to remain in a hyper state.
   *
   * @private
   * @param {number} x
   * @memberof TankCheckPro
   */
  private async setHyperCount(x: number) {
    const val = utils.clamp(x, 9, 65535)
    const ps = this.pubsub['hyper_count']

    let w = await this.writeCharacteristicPromise(ps, utils.encode16Bit(val))
    if (!w.ok || w.data.status !== 'written') {
      utils.log('Failed to write', w)
      // utils.notify(w.error && w.error.message, "Failed to write '" + name + '"');
    }
  }

  /**
   * Accepts an number input representing the number of miliseconds between updates.
   *
   * @param {number} x
   * @memberof TankCheckPro
   */
  public async setUpdateRate(milliseconds: number) {
    const val = utils.clamp(milliseconds, 3500, 30000)
    const ps = this.pubsub['update_rate']
    const oldRate = this.pubsub['update_rate'].value

    // optimistically assume the update rate will success
    this.pubsub['update_rate'].value = milliseconds

    let w = await this.writeCharacteristicPromise(ps, utils.encode16Bit(val))
    if (!w.ok || w.data.status !== 'written') {
      utils.log('Failed to write', w)
      utils.notify(w.error && w.error.message, "Failed to write '" + ps.descriptor.label + '"')
      this.pubsub['update_rate'].value = oldRate
    }
  }

  private getUptime(): number {
    let uptime: PubSubVar = this.pubsub['uptime'] || null
    return uptime ? (uptime.value as number) : 0
  }

  private getPartNumber(): string {
    let top_level_pn: PubSubVar = this.pubsub['top_level_pn'] || null
    return top_level_pn ? (top_level_pn.value as string) : ''
  }

  private getSerialNumber(): number {
    let serial_number: PubSubVar = this.pubsub['serial_number'] || null
    return serial_number ? (serial_number.value as number) : 0
  }

  private getPCBNumber(): string {
    let pcba_pn: PubSubVar = this.pubsub['pcba_pn'] || null
    return pcba_pn ? (pcba_pn.value as string) : ''
  }

  public getSensorDescription(): { version: number; desc: string } {
    let fw = this.hwVersionNumber
    let ven = 'Mopeka Pro '
    let ver = fw & 0x3e
    return { version: ver, desc: ven + ' v' + ver }
  }

  /**
   * Returns the update rate for the sensor. Pro sensors prior to FW version 0.0.69 have a fixed update rate.
   *
   * @returns {number}
   * @memberof TankCheckPro
   */
  public getUpdateRate(): number {
    try {
      let updateRate = this.pubsub['update_rate'] || null
      if (updateRate) {
        return (this.updateRate = (updateRate.value as number) / 1000)
      }
    } catch (error) {
      console.log('must have been old firmware without update rate')
    }

    return this.updateRate
  }

  public getQualityStars(): number {
    let ad = this.samples
    if (!ad || !ad.q) return 0
    return ad.qualityStars
  }

  public onShowInfoPage() {
    if (this.getConnectState() === 'disconnected') {
      ble.adapterStopScan().then(() => {
        this.deviceConnect()
      })
    }
  }

  private onStreamRead(_ps: PubSubVar, raw: Uint8Array) {
    let pos = (raw[0] + raw[1] * 256) * 18
    let rem = this.stream.length - pos
    if (rem + raw.length - 2 < 0 || raw.length > 20) {
      utils.log('ERROR: Notify length too long')
      return
    }

    this.stream.set(raw.subarray(2, raw.length), pos)
    if (raw.length != 20) {
      this.tc = {}
      pos += raw.length - 2

      let arr: Uint16Array = new Uint16Array(this.stream.buffer, 0, 8)
      this.tc.fw_version = 'v' + arr[0] + '.' + (arr[1] >> 8) + '.' + (arr[1] & 0xff)
      this.tc.raw_level = arr[2]
      this.tc.quality = arr[3]
      this.tc.hyper_count = arr[4]
      this.tc.low_pass_alpha = arr[5]
      this.tc.accelo_x = (arr[6] << 16) >> 16 // to int32
      this.tc.accelo_y = (arr[7] << 16) >> 16 // to int32
      let a8: Uint8Array = new Uint8Array(this.stream.buffer, 16, 6)
      this.tc.battery = a8[0] / 64
      this.tc.temperature = a8[1] / 2 - 40

      this.tc.pulse_settings = a8[2] // a8[2] is the entire pulse_settings byte, broken down into the following bit fields
      this.tc.algo_select = (a8[2] >>> 0) & 0x01 // 0="old", 1="new" algorithm
      this.tc.dont_zero_sample = (a8[2] >>> 3) & 0x01 // whether or not we are "zeroing" or blanking the gain circuit capacitors during pulse firing time, or not.
      this.tc.sample_rate = (a8[2] >>> 4) & 0x03 // 0=5us, 1=10us, 2=20us, 3=40us sample rate
      this.tc.fir_coef_table = (a8[2] >>> 6) & 0x01 // 0=5-point FIR smoothing, 1=7-point FIR smoothing

      this.tc.pulse_param = a8[3]
      this.tc.gain_setting = a8[4]
      this.tc.att_type = a8[5]

      let off = 24
      this.tc.samp_filt = new Int16Array(this.stream.buffer, off, 768)
      off += 768 * 2
      this.tc.score_filt = new Uint32Array(this.stream.buffer, off, 501)
      // off += 501 * 4;
      // this.tc.adc_buf = new Int16Array(this.stream.buffer, off, 768);

      this.updatePlotPage()
    }
  }

  private async subscribeToGraphData() {
    if (this.connectState == 'connected') {
      utils.log('subscription to graph data started')
      let ps = this.pubsub['stream']
      await this.requestConnectionPriorityPromise(5000, 'balanced')
      await this.subscribePromise(5000, ps)
    } else {
      // await utils.notify("Not connected to sensor yet.  Go back and try again", "Not connected");
    }
  }

  public async onShowPlotPage() {
    this.subscribeToGraphData()

    utils.log('plot page')
    this.plotShown = true
  }

  public async onHidePlotPage() {
    utils.log('hide page')
    this.plotShown = false
    let ps = this.pubsub['stream']
    if (ps) {
      await this.unSubscribePromise(5000, ps)
    }
    await this.requestConnectionPriorityPromise(5000, 'balanced')
  }

  protected async updatePlotPage() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    const selected = ble.sensorList[selectedSensor]

    if (selected !== this) {
      return
    }

    let microSeconds = 20
    switch (this.tc.sample_rate) {
      case 0:
        microSeconds = 5
        break
      case 1:
        microSeconds = 10
        break
      case 2:
        microSeconds = 20
        break
      case 3:
        microSeconds = 40
        break
      default:
        microSeconds = 20
        break
    }

    // Prepare the plot for the peak data
    let data = []
    let p = this.tc.samp_filt
    for (let i = 0; p && i < p.length; i++) {
      let v = p[i]
      data.push([i * microSeconds, (v / 16384) * 1.2])
    }

    let data2 = []
    let u = this.tc.score_filt
    for (let i = 0; u && i < u.length; i++) {
      let v = u[i]
      data2.push([i * microSeconds, v / 32768])
    }

    // Finally place the guessed height bar
    let line = []
    let t = this.getSample().level * 1000 * 1000
    line.push([t, 0])
    line.push([t, 1.5])

    let stats =
      utils.round2(this.convertLevelToInches(this.tc.raw_level / 1000000, this.tc.temperature)) +
      '" - ' +
      this.tc.raw_level +
      'μs ' +
      'Q=' +
      this.tc.quality +
      ' ' +
      'V=' +
      utils.round3(this.getBatteryVoltage()) +
      'V\n'
    if (this.tc.hyper_count !== undefined) {
      stats +=
        'hyper_count=' +
        this.tc.hyper_count +
        '\n' +
        'low_pass_alpha=' +
        this.tc.low_pass_alpha +
        '\n' +
        'RSSI:' +
        this.last_rssi +
        '\n' +
        `accel: x=${this.tc.accelo_x} y=${this.tc.accelo_y}\n` +
        `vbat= ${this.tc.battery}v ` +
        'temp=' +
        ((this.tc.temperature * 9) / 5 + 32) +
        'F\n' +
        `pulse: 0x${this.tc.pulse_settings.toString(16)} (${microSeconds}μs) algo=${this.tc.algo_select} zero=${
          this.tc.dont_zero_sample
        } FIR=${this.tc.fir_coef_table}\n` +
        'pulse_param=' +
        this.tc.pulse_param +
        '\n' +
        'gain_setting=' +
        this.tc.gain_setting +
        '\n' +
        'att_type=' +
        this.tc.att_type +
        '\n' +
        `uptime= ${Duration.fromMillis(this.getUptime() * 1000).toFormat('hh:mm:ss')} \n` +
        `PN:${this.getPartNumber()} SN:${this.getSerialNumber()} PCB:${this.getPCBNumber()} \n`
    }

    const guess = `${utils.round2(this.getLevelAsInches())}"`

    store.dispatch(
      setPlotData({
        data,
        data1: data2,
        guessLine: line,
        guessText: guess,
        stats,
      })
    )
    this.plotData = {
      blueLine: data,
      yellowLine: data2,
      guessLine: line,
      guessText: guess,
      stats,
    }
    // this.updatePlot(this.plotData);
  }

  updatePlot = _.throttle(plot => {
    fetch(
      `https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/sensors/${utils.toCloudAddress(
        this.shortAddress
      )}/plot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plot),
      }
    )
      .then(data => data.json())
      .then(json => {
        utils.log(json)
      })
      .catch(err => {
        utils.log(err)
      })
  }, 5000)

  public setSampleFromBle(s: Sample, rssi: number, _dbg: boolean) {
    try {
      let os = this.samples
      let wasPressed = os && os.syncPressed

      this.lastSeen = s.date
      this.lastSampleSource = 'ble'
      this.last_rssi = rssi
      this.samples = s

      // update version from latest sample just in case it changed (update?)
      this.hwVersionNumber = s.getHwVersion()
      this.hwFamily = s.getHwFamily()

      this.onNewSample()
      this.checkForUpload(wasPressed)
    } catch (e) {}
  }

  public getAcceloY(corrected: boolean): number {
    let ad = this.samples
    if (!ad) {
      return undefined
    }
    let val = ad.acceloY

    if (corrected) {
      let off = this.acceloYOffset
      val -= ~~off // cast falsy (null, undefined, 0, false) to 0 and subtract
    }

    return val
  }

  public getAcceloX(corrected: boolean): number {
    let ad = this.samples
    if (!ad) {
      return undefined
    }
    let val = ad.acceloX

    if (corrected) {
      let off = this.acceloXOffset
      val -= ~~off // cast falsy (null, undefined, 0, false) to 0 and subtract
    }

    return val
  }

  public showTankSettingsPage() {
    super.showTankSettingsPage()
  }

  public onNewSample() {
    this.updateTankCheckInfoPage()
    super.onNewSample()

    // Specific data for Pro after the super call
    this.uptime = this.getUptime()
  }
}
