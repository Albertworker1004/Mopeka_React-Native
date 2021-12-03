import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
const Slider = require('rc-slider').default
import classNames from 'classnames'

import Tank from '../components/widgets/Tank'
import Signal from '../components/widgets/Signal'
import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { toggleSearching, setRssiFilter } from '../store/reducers/nearbySensors/reducers'
import { selectSensorListKeys } from '../store/reducers/sensors/selectors'
import { TankCheck } from '../../lib/sensors/tankcheck'
import { ble } from '../../lib'
import { useHistory } from 'react-router-dom'

const NearbySensors = props => {
  const history = useHistory()
  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: 'Nearby Sensors',
      },
    })
  }, [history.location])

  const addOrRemoveSensor = sensor => {
    if (props.sensorKeyList.includes(sensor.shortAddress)) {
      // Remove
      ble.forget(sensor.shortAddress)
    } else {
      // Add
      ble.addSensorFromNearby(sensor.shortAddress)
    }
  }

  const sensors = Object.entries(props.NearbySensors)
    .filter(([key, value]) => {
      // Filter out sensors far away
      const sensor = value as TankCheck
      return sensor.last_rssi > -props.rssiFilter
    })
    // .sort((a, b) => {
    //   // Sort strongest signal to front
    //   const s1 = a[1] as Sensor
    //   const s2 = b[1] as Sensor
    //   const rssi1 = s1.last_rssi as number
    //   const rssi2 = s2.last_rssi as number
    //   return rssi2 - rssi1
    // })
    .map(([key, value]) => {
      // Map each sensor to a html fragment to be rendered
      const sensor = value as TankCheck
      let hwFamily
      if (sensor.hwFamily == 'xl') {
        hwFamily = 'XL'
      }
      if (sensor.hwFamily == 'gen2') {
        hwFamily = 'Std'
      }
      if (sensor.hwFamily == 'pro') {
        hwFamily = 'Pro'
      }

      const classes = classNames('flex flex-col p-2 shadow-md rounded text-center border-2 border-white', {
        'border-secondary': props.sensorKeyList.includes(key),
      })

      return (
        <div key={key} onClick={() => addOrRemoveSensor(sensor)} className={classes}>
          <div className="flex items-center justify-between">
            {sensor.isWater ? <Tank tankType="water_small" stage={9} /> : <Tank tankType="small" stage={9} />}
            <Signal stage={sensor.rssiQuality} />
          </div>
          <h4 className="mt-1 text-sm font-bold text-gray-900">Sensor Type</h4>
          <span>{hwFamily}</span>
        </div>
      )
    })

  return (
    <div>
      <div className="px-2 py-4 mb-48 nearby-sensor-grid">{sensors}</div>

      <div className="fixed bottom-0 z-50 flex flex-col w-full px-4 pt-2 pb-4 text-center bg-white nearby-sensor-top-shadow">
        <span className="text-xs text-gray-500">Tap a nearby sensor to add it your device.</span>
        <div className="mb-4">
          <label className="mt-1 mb-2 text-sm font-bold text-gray-900">Scan Range</label>
          <div className="px-4 mt-2">
            <Slider
              value={props.rssiFilter}
              min={35}
              max={75}
              onChange={v => props.setRssiFilter(v)}
              railStyle={{ height: 4 }}
              handleStyle={{
                height: 25,
                width: 25,
                marginTop: -10,
              }}
              trackStyle={{ height: 4 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold">
            <span>Close</span>
            <span>Far</span>
          </div>
        </div>
        {/* {props.searching ? 
            <button onClick={() => props.toggleSearching()} 
            className="px-4 py-2 m-auto text-lg font-semibold text-center text-white bg-red-600 rounded-full shadow fa spin">Stop <FontAwesomeIcon icon={['fas', 'spinner']} size="lg" className="text-red-500 fa-spin" /></button>
            :
            <button onClick={() => props.toggleSearching()} 
            className="px-4 py-2 m-auto text-lg font-semibold text-center text-white rounded-full shadow bg-secondary">Scan</button>
          } */}
      </div>
    </div>
  )
}

const mapStateToProps = (state: RootState) => {
  return {
    NearbySensors: state.nearbySensors.sensors,
    searching: state.nearbySensors.searching,
    sensorKeyList: selectSensorListKeys(state),
    rssiFilter: state.nearbySensors.rssiFilter,
  }
}

const mapDispatch = { setOption, toggleSearching, setRssiFilter }

export default connect(mapStateToProps, mapDispatch)(NearbySensors)
