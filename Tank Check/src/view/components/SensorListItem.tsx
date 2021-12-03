import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React from 'react'
import { Link } from 'react-router-dom'
import { BluetoothObject, get_i18n } from '../../lib'
import { HardwareId } from '../../lib/sensors/sample'
import { Sensor, SensorCategory } from '../../lib/sensors/sensor'
import { TankCheck } from '../../lib/sensors/tankcheck'
import LastUpdated from './LastUpdated'
import Battery from './widgets/Battery'
import Gateway from './widgets/Gateway'
import Signal from './widgets/Signal'
import Tank from './widgets/Tank'

const SensorListItem = ({ sensor }: { sensor: Sensor }) => {
  let widgets, levelText, badges

  if (sensor.isGw) {
    widgets = (
      <>
        <Gateway width={50} className="first:ml-0" />
        {/* <Signal stage={sensor.rssiQuality} className="ml-2"/> */}
      </>
    )
  } else {
    let tank = sensor as TankCheck

    if (hwidToString(tank.hwVersionNumber) != 'UNKNOWN') {
      badges = <span className="px-2 font-bold rounded badge-theme">{hwidToString(tank.hwVersionNumber)}</span>
    }

    const classes = classNames('h-6', {
      'text-red-600': tank.levelStringFull === 'Empty' || tank.levelStringFull === 'Low',
      'text-yellow-800': !tank.levelStringFull,
    })
    if (tank.levelStringFull) {
      levelText = (
        <span>
          {get_i18n('tank_level')}: <span className={classes}>{tank.levelStringFull}</span>
        </span>
      )
    } else {
      levelText = <span className={classes}>Looking for sensor...</span>
    }
    let tankType: any = tank.tankInfo.vertical
      ? tank.tankInfo.height >= BluetoothObject.largeTankIconMinHeight
        ? 'large'
        : 'small'
      : 'small_horizontal'
    if (tank.isWater) {
      tankType = 'water_small'
    }
    if (tank.category == SensorCategory.TopMount) {
      tankType = 'generic'
    }
    // used to show demo truck icon
    if (tank.connectAddress == 'AA:BB:CC:A1:B2:C3') {
      tankType = 'truck'
    }

    widgets = (
      <>
        <Tank tankType={tankType} stage={tank.levelImageOffset} className="first:ml-0" />
        <Battery stage={tank.batteryImageOffset} className="ml-2" />
        <Signal stage={tank.lastSampleSource == 'ble' ? tank.rssiQuality : 5} className="ml-2" />
      </>
    )
  }

  const listitemClasses = classNames('flex px-4 pt-4 pb-2 h-26 h-full w-full transition-shadow', {
    'listitem-highlight': sensor.highlighted,
  })

  return (
    <Link
      to={sensor.isGw ? `/gateway/${sensor.shortAddress}` : `/sensor/${sensor.shortAddress}`}
      className={listitemClasses}>
      <div className="flex items-center justify-between pr-4 border-r border-gray-300">{widgets}</div>
      <div className="flex flex-col justify-between pl-4 truncate">
        <h4 className="text-lg font-semibold truncate">{sensor.name}</h4>
        <span className="text-sm text-gray-800">{sensor.isGw ? get_i18n('bridge') : levelText}</span>
        <span className="text-xs text-gray-600">{!sensor.isGw && <LastUpdated lastSeen={sensor.lastSeen} />}</span>
        <div className="flex text-xs text-white">{badges}</div>
      </div>
      <FontAwesomeIcon icon={['fas', 'chevron-right']} size="lg" className="self-center ml-auto text-gray-500" />
    </Link>
  )
}

function hwidToString(hwid: number): string {
  switch (hwid) {
    case HardwareId.XL:
      return 'XL'

    case HardwareId.STD:
    case HardwareId.BMPRO_STD:
      return 'STANDARD'

    case HardwareId.PRO_MOPEKA:
    case HardwareId.PRO_LIPPERT_LPG:
    case HardwareId.PRO_DOMETIC_LPG:
      return 'PRO'

    case HardwareId.PRO_PLUS_CELL_LPG:
    case HardwareId.PRO_PLUS_BLE_LPG:
      return 'PRO+'

    case HardwareId.TOPDOWN:
      return 'TOPDOWN'

    case HardwareId.PRO_PLUS_BLE_TD40:
    case HardwareId.PRO_PLUS_CELL_TD40:
      return 'TOPDOWN+'

    case HardwareId.PRO_H2O:
      return 'PRO H2O'

    case HardwareId.VERTRAX_STANDARD:
      return 'STANDARD'

    case HardwareId.VERTRAX_BULK:
      return get_i18n('bulk')
    // return 'BULK'

    case HardwareId.UNKNOWN:
      return 'BAD SENSOR'

    default:
      return 'UNKNOWN'
  }
}

export default SensorListItem
