import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import { push } from 'connected-react-router'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import PulseLoader from 'react-spinners/PulseLoader'
import { createMarkupFromString } from '..'
import { ble, BluetoothObject, get_i18n, show_help } from '../../lib'
import { SensorCategory } from '../../lib/sensors/sensor'
import { TankCheck } from '../../lib/sensors/tankcheck'
import { TankCheckGen2 } from '../../lib/sensors/tankcheck_gen2'
import { utils } from '../../lib/utils'
import Collapsible from '../components/Collapsibles/Collapsible'
import { CollapsibleList } from '../components/Collapsibles/CollapsibleList'
import { FirmwareCollapsible } from '../components/Collapsibles/FirmwareCollapsible'
import SensorPositionCollapsible from '../components/Collapsibles/SensorPositionCollapsible'
import LastUpdated from '../components/LastUpdated'
import Battery from '../components/widgets/Battery'
import QualityStars from '../components/widgets/QualityStars'
import Signal from '../components/widgets/Signal'
import Tank from '../components/widgets/Tank'
import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { clearPlotData } from '../store/reducers/plot/reducers'
import { setSelectedSensor } from '../store/reducers/sensors/reducers'
import { selectSensorById } from '../store/reducers/sensors/selectors'

const SensorDetails = props => {
  const sensor = props.sensor as TankCheck
  const [tapCountBattery, setTapCountBattery] = useState(0)
  const [tapCountRssi, setTapCountRssi] = useState(0)
  const [hwFamily, setHwFamily] = useState<string>()

  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: get_i18n('tank_info'),
        subtitle: sensor.name,
      },
    })
  }, [sensor.name])

  useEffect(() => {
    props.setSelectedSensor(sensor.shortAddress)
    ble.gotoSensorInfoPage()

    if (
      sensor.isNew === true &&
      sensor.hwVersionNumber == 0x44 && // ACE sensor
      app_brand === 'tankcheck' &&
      !(sensor as TankCheckGen2).hasRegistered
    ) {
      props.push(`/sensor/${sensor.shortAddress}/register`)
    }

    return function () {
      // @ts-ignore
      window.plugins.insomnia.allowSleepAgain()
    }
  }, [])

  useEffect(() => {
    if (sensor.hwFamily == 'xl') {
      setHwFamily('XL')
    }
    if (sensor.hwFamily == 'gen2') {
      setHwFamily('Std')
    }
    if (sensor.hwFamily == 'pro') {
      setHwFamily('Pro')
    }
  }, [sensor.hwFamily])

  useEffect(() => {
    if (tapCountBattery > 3 && tapCountRssi > 3) {
      props.push(`/sensor/${sensor.shortAddress}/plot`)
    }
  }, [tapCountRssi, tapCountBattery])

  const handleTaps = (tapped: string) => {
    if (tapped === 'battery') {
      setTapCountBattery(tapCountBattery + 1)
    }
    if (tapped === 'rssi') {
      setTapCountRssi(tapCountRssi + 1)
    }
  }

  if (!sensor.samples) {
    return (
      <div className="absolute w-1/2 text-center" style={{ transform: 'translateX(50%)', top: 'calc(50% - 30px)' }}>
        <PulseLoader loading={true} />
        <div>Have not received any data from this sensor yet...</div>
      </div>
    )
  }

  let tankType: any = sensor.tankInfo.vertical
    ? sensor.tankInfo.height >= BluetoothObject.largeTankIconMinHeight
      ? 'large'
      : 'small'
    : 'horizontal'

  const percentCircleClasses = classNames(
    'absolute top-0 right-0 mt-20 mr-4 rounded-full bg-gray-200 text-gray-900 font-semibold border-2 shadow-md text-2xl flex items-center',
    {
      'border-green-700': sensor.levelImageOffset >= 2,
      'border-red-700': sensor.levelImageOffset < 2,
      'h-32 w-32': window.screen.width > 500,
      'h-26 w-26': window.screen.width < 500,
    }
  )

  if (sensor.isWater) {
    tankType = 'water_small'
  }

  if (sensor.category == SensorCategory.TopMount) {
    tankType = 'generic'
  }

  const tankWidth =
    tankType == 'horizontal'
      ? Math.min(window.screen.width * 0.8, 600)
      : Math.min(Math.max(window.screen.width * 0.5, 120), 350)

  return (
    <div>
      <div className="flex items-end justify-between py-4 border-b mt- bg-lightgray border-darkgray px-7 md:px-32">
        <div onClick={() => handleTaps('battery')} className="flex flex-col items-center">
          <Battery stage={sensor.batteryImageOffset} width={17} />
          <span className="text-xs text-gray-900">{get_i18n('battery')}</span>
        </div>
        <div onClick={() => handleTaps('rssi')} className="flex flex-col items-center h-">
          <Signal stage={sensor.lastSampleSource == 'ble' ? sensor.rssiQuality : 5} width={40} />
          <span className="text-xs text-gray-900">{get_i18n('signal')}</span>
        </div>
        <div className="flex flex-col items-center">
          <QualityStars stage={sensor.samples.qualityStars} width={14} />
          <span className="text-xs text-gray-900">{get_i18n('quality')}</span>
        </div>
      </div>
      <div className="relative flex flex-col p-6 md:px-24" style={{ minHeight: '250px' }}>
        <div className="flex items-center justify-center my-auto">
          <Tank tankType={tankType} stage={sensor.levelImageOffset} width={tankWidth} />
        </div>
        <div className={percentCircleClasses}>
          <span onClick={() => show_help('tank_info')} className="m-auto text-xl">
            {sensor.levelStringFull}
          </span>
        </div>
        <div className="flex flex-col mt-auto">
          <div className="my-2 text-sm text-center">
            <LastUpdated lastSeen={sensor.lastSeen} />
          </div>
          {quality(sensor.samples.qualityStars) <= 1 && (
            <div onClick={() => show_help('lowQuality')} className="p-2 mt-2 bg-red-400 rounded shadow">
              <p
                className="text-sm text-red-900"
                dangerouslySetInnerHTML={createMarkupFromString(get_i18n('lowQualityAlert'))}></p>
            </div>
          )}
          {sensor.batteryPercentage < 10 && (
            <div
              onClick={() => window.open(HELP_URL, '_blank', 'location=true')}
              className="p-2 mt-2 bg-yellow-400 rounded shadow">
              <p
                className="text-sm text-yellow-900"
                dangerouslySetInnerHTML={createMarkupFromString(get_i18n('lowBattery'))}></p>
            </div>
          )}
        </div>
      </div>
      <CollapsibleList>
        <Collapsible title={get_i18n('additionalInfo')}>
          <div className="flex flex-wrap justify-between px-4">
            {hwFamily == 'Pro' ? (
              <div className="flex flex-col items-center p-4">
                <div className="flex">
                  <h4 className="font-semibold">{get_i18n('temperature')}</h4>
                  {/* <FontAwesomeIcon icon={['fas', 'question-circle']} size="lg" className="m-auto ml-1 text-sm text-gray-500" /> */}
                </div>
                {sensor.samples.temperature ? (
                  <span className="text-gray-800">
                    {sensor.samples.temperature.toFixed(0)}°C ({((sensor.samples.temperature * 9) / 5 + 32).toFixed(0)}
                    °F)
                  </span>
                ) : (
                  <FontAwesomeIcon icon={['fas', 'question']} size="lg" className="text-gray-800" />
                )}
              </div>
            ) : null}
            <div className="flex flex-col items-center p-4">
              <div className="flex">
                <h4 className="font-semibold">{get_i18n('update_rate')}</h4>
                {hwFamily != 'Pro' && (
                  <FontAwesomeIcon
                    onClick={() => utils.notify(get_i18n('change_update_rate'), get_i18n('updateRate'))}
                    icon={['fas', 'question-circle']}
                    size="lg"
                    className="m-auto ml-1 text-sm text-gray-500"
                  />
                )}
              </div>
              <span className="text-gray-800">{sensor.updateRateText || '? Seconds'}</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="flex">
                <h4 className="font-semibold">{get_i18n('sensorType')}:</h4>
                {/* <FontAwesomeIcon icon={['fas', 'question-circle']} size="lg" className="m-auto ml-1 text-sm text-gray-500" /> */}
              </div>
              <span className="text-gray-800">{hwFamily}</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="flex">
                <h4 className="font-semibold">{get_i18n('dev_addr')}</h4>
                {/* <FontAwesomeIcon icon={['fas', 'question-circle']} size="lg" className="m-auto ml-1 text-sm text-gray-500" /> */}
              </div>
              <span className="text-gray-800">{sensor.shortAddress}</span>
            </div>
          </div>
        </Collapsible>
        {<SensorPositionCollapsible sensor={sensor} />}
        {hwFamily == 'Pro' && <FirmwareCollapsible />}
      </CollapsibleList>
    </div>
  )
}

// Used to stabilize the quality value fed to the renderer.
// Waits for it to settles on a value for 1 second before updating it.
const quality = _.debounce(q => {
  return q
}, 500)

const mapStateToProps = (state: RootState, props) => {
  return {
    sensor: selectSensorById(state, props.match.params.id),
    pendingWrite: state.sensors.pendingWrite,
  }
}

const mapDispatch = { setSelectedSensor, setOption, push, clearPlotData }

export default withRouter(connect(mapStateToProps, mapDispatch)(SensorDetails))
