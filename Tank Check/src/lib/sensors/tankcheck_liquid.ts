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

import { TankCheckPro } from './tankcheck_pro'
import { HardwareFamily } from './tankcheck'
import { get_i18n, i18n } from '..'
import { SensorCategory } from './sensor'

export class TankCheckLiquid extends TankCheckPro {
  public constructor(obj: any, loaded: boolean, hwFamily: HardwareFamily, hwVersionNumber: number) {
    super(obj, loaded, hwFamily, hwVersionNumber)
    this.category = SensorCategory.TopMount
    this.isWater = true
    if (this.name == get_i18n('new_pro_h20_device') || this.name == get_i18n('new_device')) {
      this.name = get_i18n('new_h20_device')
    }
  }

  public getLevelAsInches(): number {
    let s = this.samples
    if (!s) return 0
    let t = this.convertLevelToInches(s.level)
    return t
  }

  public getLevelAsMeters(): number {
    let t = this.getLevelAsInches()
    t = t / 39.3701
    return t
  }

  public convertLevelToInches(tof: number): number {
    // Spend of sound in air
    let c: number = 335

    let t = tof
    if (t <= 0) {
      return 0
    }

    const heightReadingInMeters = (t * c) / 2
    const fullHeight = this.tankInfo.fullHeight ? this.tankInfo.fullHeight : this.tankInfo.height // if no fullHeight assume it is just container height
    const containerHeight = this.tankInfo.height
    const calculatedHeight = fullHeight - Math.max(heightReadingInMeters - (containerHeight - fullHeight), 0)
    const calculatedHeightInInches = calculatedHeight * 39.3701

    return calculatedHeightInInches
  }

  public getPercentFromHeight(height: number): number {
    let ti = this.tankInfo
    const tankHeight = this.tankInfo.fullHeight ? this.tankInfo.fullHeight : this.tankInfo.height // if no fullHeight assume it is just container height
    if (!ti) {
      return 0.0
    }
    if (tank_min_offset >= tankHeight) {
      return 100.0
    }

    if (ti.vertical) {
      let d = 100.0 * (height / tankHeight)
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
}
