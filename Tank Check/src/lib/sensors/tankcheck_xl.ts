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
import { SensorCategory } from './sensor'
import { HardwareFamily } from './tankcheck'
import { TankCheckGen2 } from './tankcheck_gen2'

export class TankCheckXL extends TankCheckGen2 {
  public constructor(obj: any, loaded: boolean, hwFamily: HardwareFamily, hwVersionNumber: number) {
    super(obj, loaded, hwFamily, hwVersionNumber)
    this.category = SensorCategory.LPG
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
}
