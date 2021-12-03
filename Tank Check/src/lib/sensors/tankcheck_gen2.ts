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
import { HardwareFamily, TankCheck } from './tankcheck'
import { ble, get_i18n, i18n } from '../index'
import { utils } from '../utils'
import { PubSubConstDescriptor, SensorCategory } from './sensor'
import { dfp } from '../dfp'

import _ from 'lodash'

import store from '../../view/store'
import { setPlotData } from '../../view/store/reducers/plot/reducers'
import { Sample } from './sample'
import { RootState } from '../../view/store/reducers'

export class TankCheckGen2 extends TankCheck {
  private readonly vref = 159 / 128 // our 1.24V reference (actually 1.2421875 so it can be identical to embedded code)
  public hasRegistered: boolean
  private inProcessRoutine: boolean
  private plotShown: boolean = false

  protected readonly pubsub_types: PubSubConstDescriptor[] = []
  protected onConnected() {}
  protected onDisconnected() {}
  protected onUpdateStatus(_txt: string) {}

  public constructor(obj: any, loaded: boolean, hwFamily: HardwareFamily, hwVersionNumber: number) {
    super(obj, loaded, hwFamily, hwVersionNumber)
    this.category = SensorCategory.LPG
  }

  private process(debug: boolean, success: Function, error: Function): void {
    let ad = this.samples
    if (!ad) {
      error(0)
      return
    }
    let adv = ad.getRawAdvertData()

    // Try to filter out that initial problematic spike.  Specifically on XL tanks where we may only be able to get
    // a single valid echo, we will throw away anything below 2.5"
    if (ad.getHwFamily() === 'xl') {
      adv = adv.filter(obj => obj.i >= 18) // only allow spikes > 180us
    }

    let length = adv.length
    if (length === 0) {
      ad.level = 0
      ad.q = 0
      success()
      return
    }

    window['nativelib'].b(
      [adv, this.hwFamily !== 'gen2' ? 1 : 0, debug, length],
      obj => {
        ad.level = obj['level']
        ad.q = obj['q']
        success(obj)
      },
      e => {
        ad.level = 0
        ad.q = 0
        error(e)
      }
    )
  }

  public setSampleFromBle(s: Sample, rssi: number, dbg: boolean) {
    if (this.inProcessRoutine) return
    this.inProcessRoutine = true

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

      this.process(
        dbg,
        obj => {
          if (obj && obj['sf']) {
            if (this.samples) this.samples['sf'] = obj['sf']
          }

          this.onNewSample()
          this.checkForUpload(wasPressed)

          this.inProcessRoutine = false
        },
        () => {
          utils.log('Parsing error', s)
          this.inProcessRoutine = false
        }
      )
    } catch (e) {
      this.inProcessRoutine = false
    }
  }

  public onShowInfoPage() {
    if (!this.alarmActive) {
      ble.lastAlarm = false
      dfp.hideAd('tc_info_low_level', true)
    } else {
      ble.lastAlarm = true
      dfp.refreshAd('tc_info_low_level', this.tags)
    }

    this.updateTankCheckInfoPage()
  }

  public onShowPlotPage() {
    this.plotShown = true
  }

  public onHidePlotPage() {
    this.plotShown = false
  }

  protected updatePlotPage() {
    const {
      sensors: { selectedSensor },
    } = (store.getState() as unknown) as RootState
    const selected = ble.sensorList[selectedSensor]

    // if (!this.plotShown) return;

    if (selected !== this) {
      return
    }

    let s = this.getSample()
    if (!s) {
      return
    }

    // Finally place the guessed height bar
    var line = []
    let level = s.level * 1000 * 1000
    line.push([level, 0])
    line.push([level, 0.555])

    // Prepare the plot for the peak data
    let last
    let data = []
    let p = s.getRawAdvertData()
    if (p) {
      last = -20
      for (let i = 0; i < p.length; i += 1) {
        let time = Math.round(p[i].i * 10)
        let amp = utils.round4((p[i].a / 512.0) * this.vref)
        if (last + 20 !== time) {
          data.push([last + 20, -0.02])
          data.push([time - 20, -0.02])
        }
        last = time
        data.push([time, amp])
      }
      data.push([last + 20, -0.02])
      data.push([this.hwFamily === 'xl' ? 5000 : 2000, -0.02])
    }

    // Now prepare the score data plot
    var data2 = []
    if (s['sf']) {
      last = -20
      for (let i = 0; i < s['sf'].length; i += 1) {
        if (s['sf'][i] > 0.005) {
          let t = i * 20
          if (last + 20 !== t) {
            data2.push([last + 20, -0.02])
            data2.push([t - 20, -0.02])
          }
          last = t
          data2.push([t, s['sf'][i]])
        }
      }
      data2.push([last + 20, -0.02])
      data2.push([this.hwFamily === 'xl' ? 5000 : 2000, -0.02])
    }

    let stats =
      `level= ${utils.round2(this.getLevelAsInches())}"\n` +
      `quality= ${utils.round2(this.getScoreQuality())}\n` +
      `rssi= ${this.last_rssi}\n` +
      `battery= ${utils.round3(this.getBatteryVoltage())}V\n` +
      `temperature= ${utils.round2((this.getSample().temperature * 9) / 5 + 32)}F`
    const guess =
      utils.round2(this.getLevelAsInches()) +
      '" - Q' +
      utils.round2(this.getScoreQuality()) +
      ' - ' +
      utils.round3(this.getBatteryVoltage()) +
      'V'

    store.dispatch(setPlotData({ data, data1: data2, guessLine: line, guessText: guess, stats }))
    this.plotData = { blueLine: data, yellowLine: data2, guessLine: line, guessText: guess, stats }
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
        console.log(json)
      })
      .catch(err => {
        console.log(err)
      })
  }, 5000)

  public getSensorDescription(): { version: number; desc: string } {
    let fw = this.hwVersionNumber
    let ven = get_i18n('firmware_prefix') || 'Mopeka'

    let ver = fw & 0x3e
    if (fw & 0x40) {
      switch (fw) {
        case 0x40:
          ven = 'Simarine'
          ver = 2
          break
        case 0x41:
          ven = 'H20'
          ver = 3
          break
        case 0x42:
          ven = 'BOC'
          ver = 2
          break
        case 0x43:
          ven = 'BOC'
          ver = 3
          break
        case 0x44:
          ven = 'Ace'
          ver = 2
          break
        case 0x46:
          ven = 'BMPRO'
          ver = 2
          break
        case 0x48:
          ven = 'E-Trailer'
          ver = 2
          break
        default:
          break
      }
    }
    let str = 'v1.' + ver

    if (fw & 0x01) ven += ' XL'
    return { version: ver, desc: ven + ' ' + str }
  }

  public getUpdateRate(): number {
    let ad = this.samples
    if (!ad) {
      return 3.5
    }

    let v = ad.getHwVersion()
    if (v === 0x42 || v === 0x43) {
      //BOC gen2 or BOC XL sensor
      if (!ad.slowUpdateRate) {
        return 9
      } else {
        return 18
      }
    } else if (this.hwFamily === 'gen2') {
      if (!ad.slowUpdateRate) {
        return 3.5
      } else {
        return 10.5
      }
    } /*if (this.hwFamily === "xl")*/ else {
      // xl
      if (!ad.slowUpdateRate) {
        return 6.4
      } else {
        return 12.8
      }
    }
  }

  public getAcceloY(_corrected: boolean): number {
    return undefined
  }

  public getAcceloX(_corrected: boolean): number {
    return undefined
  }

  public onNewSample() {
    this.samples.qualityStars = this.getQualityStars()

    super.onNewSample()
    this.updatePlotPage()
  }
}
