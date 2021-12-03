import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Slider, { createSliderWithTooltip } from 'rc-slider'
const SliderWithTooltip = createSliderWithTooltip(Slider)

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { ble, get_i18n, i18n, show_help } from '../../lib'
import { TankRegionPicker } from '../../lib/tankRegionPicker'
import { TankUpdateSettings, TankCheck, LevelUnits } from '../../lib/sensors/tankcheck'
import { showToast } from '../store/reducers/toaster/reducers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HardwareId } from '../../lib/sensors/sample'
import ToggleSwitch from '../components/ToggleSwitch'
import { SensorCategory } from '../../lib/sensors/sensor'
import TankDiagram from '../../../www/img/offset_image_help.png'
import GasMixtureSetting from '../components/GasMixtureSettings'

function getLevel(height_meters: number, units: string): number {
  if (units === 'percent') {
    units = window['ble'].defaultUnits
  }
  if (units === 'inches') {
    return Math.round(height_meters * 39.3701)
  }
  if (units === 'centimeters') {
    return Math.round(height_meters * 100)
  }
  return 0
}

const SensorOptions = () => {
  const { id } = useParams<{ id: string }>()
  const sensor = useSelector((state: RootState) => state.sensors.sensors[id]) as TankCheck
  const dispatch = useDispatch()
  const [alarmThreshold, setAlarmThreshold] = useState(sensor.alarmThreshPercent)
  const [updateRate, setUpdateRate] = useState(sensor.updateRate)
  const [name, setName] = useState(sensor.name)
  const [region, setRegion] = useState(TankRegionPicker.getRegionByCountryId(sensor.savedTankCountryId).countryId)
  const [tankType, setTankType] = useState('')
  const [arbTypeVertical, setArbTypeVertical] = useState(sensor.tankInfo.vertical)
  const [arbHeightMeters, setArbHeightMeters] = useState(sensor.tankInfo.height)
  const [tankUnits, setTankUnits] = useState(sensor.levelUnits)
  const [arbHeight, setArbHeight] = useState(0)
  const [fullHeightMeters, setFullHeightMeters] = useState(
    sensor.tankInfo.fullHeight ? sensor.tankInfo.fullHeight : sensor.tankInfo.height
  )
  const [fullHeight, setFullHeight] = useState(
    getLevel(sensor.tankInfo.fullHeight ? sensor.tankInfo.fullHeight : sensor.tankInfo.height, sensor.levelUnits)
  )
  const [arbOptionEnabled, setArbOptionEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(sensor.alarmNotificationsEnabled)
  const [notificationCooldown, setNotificationCooldown] = useState(sensor.notificationCooldown)
  const [pendingWrite, setPendingWrite] = useState(false)
  const saveCallback = useRef<Function>()

  const availableCountries = TankRegionPicker.getAvailableCountries()

  saveCallback.current = useCallback(() => {
    if (tankType) {
      const success = ble.updateSensorOptions({
        shortAddress: sensor.shortAddress,
        name: name,
        region: region,
        arbTypeVertical: arbTypeVertical,
        arbHeightMeters: arbHeightMeters,
        arbFullHeightMeters: fullHeightMeters > arbHeightMeters ? arbHeightMeters : fullHeightMeters,
        alarmThreshold: alarmThreshold,
        alarmNotificationsEnabled: notificationsEnabled,
        notificationCooldown: notificationCooldown,
        updateRate: updateRate,
        tankType: tankType,
        tankUnits: tankUnits,
      } as TankUpdateSettings)
      if (success) {
        dispatch(
          showToast({
            type: 'success',
            message: get_i18n('updateToastText'),
          })
        )
      } else {
        dispatch(
          showToast({
            type: 'error',
            message: get_i18n('updateErrorToastText'),
          })
        )
      }
    }
  }, [
    tankType,
    name,
    region,
    arbTypeVertical,
    arbHeightMeters,
    fullHeightMeters,
    alarmThreshold,
    updateRate,
    tankUnits,
    notificationsEnabled,
    notificationCooldown,
  ])

  useEffect(() => {
    setArbHeight(getLevel(sensor.tankInfo.height, sensor.levelUnits))
    const availableTanks = tank_types[TankRegionPicker.getRegionByCountryId(region).region.tankRegionKey]

    for (let i = 0; i < availableTanks.length; i++) {
      const element = availableTanks[i]
      if (sensor.tankInfo.type == 'arbitrary' || sensor.isWater) {
        setTankType('arbitrary')
        setArbOptionEnabled(true)
        break
      }
      if (sensor.tankInfo.height === element.height && sensor.tankInfo.type === element.type) {
        setTankType(sensor.tankInfo.type)
      } else {
        setTankType(TankCheck.findDefaultRegionTank(sensor.tankInfo.type, sensor.tankInfo.height).type)
      }
    }

    dispatch(
      setOption({
        name: 'title',
        val: {
          main: get_i18n('tank_settings'),
        },
      })
    )

    return () => {
      saveCallback.current()
    }
  }, [])

  useEffect(() => {
    setUpdateRate(sensor.updateRate)
  }, [sensor.updateRate])

  useEffect(() => {
    setArbHeight(getLevel(arbHeightMeters, tankUnits))
    setFullHeight(getLevel(fullHeightMeters, tankUnits))
  }, [tankUnits])

  const onThresholdChange = value => {
    setPendingWrite(true)
    setAlarmThreshold(value)
  }

  const onUpdateRateChange = value => {
    setPendingWrite(true)
    setUpdateRate(value)
  }

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingWrite(true)
    setName(e.target.value)
  }

  const onRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingWrite(true)
    setRegion(e.target.value)
    setTankType(TankCheck.findDefaultRegionTank(sensor.tankInfo.type, sensor.tankInfo.height).type)
  }

  const onTankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingWrite(true)
    setTankType(e.target.value)
    setArbOptionEnabled(e.target.value == 'arbitrary')
  }

  const onNotificationCooldownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingWrite(true)
    setNotificationCooldown(parseInt(e.target.value))
  }

  const onArbHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingWrite(true)
    // Store height as meters
    let height = parseFloat(e.target.value)
    // store input value
    setArbHeight(height)
    if (tankUnits == 'percent') {
      if (window['ble'].defaultUnits == 'inches') {
        height = height / 39.3701
      } else {
        height = height / 100
      }
    } else if (tankUnits == 'inches') {
      height = height / 39.3701
    } else {
      height = height / 100
    }
    // store value in meters
    setArbHeightMeters(height)
  }

  const onTopDownFullHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingWrite(true)
    // Store height as meters
    let height = parseFloat(e.target.value)
    // store input value
    setFullHeight(height)
    if (tankUnits == 'percent') {
      if (window['ble'].defaultUnits == 'inches') {
        height = height / 39.3701
      } else {
        height = height / 100
      }
    } else if (tankUnits == 'inches') {
      height = height / 39.3701
    } else {
      height = height / 100
    }
    // store value in meters
    setFullHeightMeters(height)
  }

  const onArbTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingWrite(true)
    // TODO: set defaultSelected
    setArbTypeVertical(e.target.value == 'true')
  }

  const onUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingWrite(true)
    setTankUnits(e.target.value as LevelUnits)
  }

  const onToggleNotifications = (name, val) => {
    setNotificationsEnabled(val)
  }

  const getUnits = () => {
    if (tankUnits == 'percent') {
      if (window['ble'].defaultUnits == 'inches') {
        return 'in'
      } else {
        return 'cm'
      }
    } else if (tankUnits == 'inches') {
      return 'in'
    } else {
      return 'cm'
    }
  }

  // Populate dropdown select boxes
  const getAvailableCountriesOptions = () => {
    return Object.entries(availableCountries).map(([key, value]) => {
      return (
        <option key={key} value={key}>
          {value['name']}
        </option>
      )
    })
  }

  const getAvailableTankOptions = () => {
    const availableTanks = tank_types[TankRegionPicker.getRegionByCountryId(region).region.tankRegionKey]

    let availableTanksOptions = []
    if (!sensor.isWater) {
      availableTanksOptions = availableTanks.map((tank, index) => {
        if (tank.height <= sensor_max_height[sensor.hwFamily !== 'gen2' ? 1 : 0]) {
          return (
            <option key={index} value={tank.type}>
              {tank.label}
            </option>
          )
        }
        return null
      })
    }

    availableTanksOptions.push(
      <option key={'arbitrary'} value={'arbitrary'}>
        {get_i18n('arbitrary')}
      </option>
    )

    return availableTanksOptions
  }

  return (
    <div className="flex flex-col p-5">
      <div className="mb-5">
        <div className="flex mb-2">
          <label className="block text-gray-900" htmlFor="deviceName">
            {get_i18n('device_name')}
          </label>
          <FontAwesomeIcon
            onClick={() => show_help('device_name')}
            icon={['fas', 'question-circle']}
            size="lg"
            className="m-auto ml-1 text-sm text-gray-500"
          />
        </div>
        <input
          placeholder="Sensor name"
          defaultValue={name}
          onChange={e => onNameChange(e)}
          maxLength={50}
          className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 border rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="text"
          id="deviceName"
        />
      </div>
      <h2 className="px-5 pt-2 my-4 -mx-5 text-xl border-t border-gray-400">{get_i18n('tank_settings')}</h2>
      {sensor.category != SensorCategory.TopMount ? (
        <>
          <div className="mb-5">
            <label className="block mb-2 text-gray-900" htmlFor="tankRegion">
              <span>{get_i18n('tankRegionLabel')}</span>
            </label>
            <div className="relative">
              <select
                onChange={e => onRegionChange(e)}
                value={region}
                className="block w-full px-4 py-3 pr-8 leading-tight text-gray-700 bg-white border border-gray-200 rounded outline-none appearance-none dropdown-shadow-theme focus:border-secondary">
                {getAvailableCountriesOptions()}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mb-5">
            <div className="flex mb-2">
              <label className="block text-gray-900" htmlFor="tankRegion">
                <span>{get_i18n('tank_type')}</span>
              </label>
              <FontAwesomeIcon
                onClick={() => show_help('tank_type')}
                icon={['fas', 'question-circle']}
                size="lg"
                className="m-auto ml-1 text-sm text-gray-500"
              />
            </div>
            <div className="relative">
              <select
                onChange={e => onTankChange(e)}
                value={tankType}
                className="block w-full px-4 py-3 pr-8 leading-tight bg-white border border-gray-200 rounded outline-none appearance-none text -gray-700 dropdown-shadow-theme focus:border-secondary">
                {getAvailableTankOptions()}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          {arbOptionEnabled && (
            <div className="mb-5">
              <div>
                <label className="block mb-2 text-gray-900" htmlFor="tankRegion">
                  {get_i18n('arbitrary')}
                </label>
                <div className="switch-field">
                  <input
                    onChange={e => onArbTypeChange(e)}
                    id="vertical"
                    type="radio"
                    name="arbitrary"
                    value="true"
                    defaultChecked={arbTypeVertical}
                  />
                  <label htmlFor="vertical">Vertical</label>
                  {sensor.hwVersionNumber != HardwareId.PRO_H2O ? (
                    <>
                      <input
                        onChange={e => onArbTypeChange(e)}
                        id="horizontal"
                        type="radio"
                        name="arbitrary"
                        value="false"
                        defaultChecked={!arbTypeVertical}
                      />
                      <label htmlFor="horizontal">Horizontal</label>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="mt-2">
                <label className="block mb-2 text-gray-900" htmlFor="arbHeightMeters">
                  <span>{get_i18n('set_tank_height')}</span>
                </label>
                <div className="relative inline-block w-32">
                  <input
                    value={arbHeight}
                    onChange={e => onArbHeightChange(e)}
                    min={1}
                    max={9999}
                    pattern="[0-9]*"
                    inputMode="decimal"
                    type="number"
                    className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
                    id="arbHeightMeters"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                    <span className="text-sm font-semibold text-gray-500">{getUnits()}.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center mb-3 space-x-2">
            <img className="w-6/12 h-full" src={TankDiagram} />
            <p className="text-xs">
              Overall Height value represents height from bottom to the sensor itself. Max liquid height Value
              represents the height the container is considered full. If full height, and tank height are the same,
              leave both values the same.
            </p>
          </div>
          <div className="flex flex-wrap justify-center space-x-8">
            <div className="mb-5">
              <div className="flex mb-2">
                <label className="block" htmlFor="fullHeight">
                  <span className="text-sm font-bold text-gray-900">Max Liquid Height</span>
                </label>
              </div>
              <div className="relative inline-block w-32">
                <input
                  value={fullHeight}
                  onChange={e => onTopDownFullHeightChange(e)}
                  min={1}
                  max={9999}
                  pattern="[0-9]*"
                  inputMode="decimal"
                  type="number"
                  className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
                  id="fullHeight"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                  <span className="text-sm font-semibold text-gray-500">{getUnits()}.</span>
                </div>
              </div>
            </div>
            <div className="mb-5">
              <div className="flex mb-2">
                <label className="block" htmlFor="totalHeight">
                  <span className="text-sm font-bold text-gray-900">Overall Height</span>
                </label>
              </div>
              <div className="relative inline-block w-32">
                <input
                  value={arbHeight}
                  onChange={e => onArbHeightChange(e)}
                  min={1}
                  max={9999}
                  pattern="[0-9]*"
                  inputMode="decimal"
                  type="number"
                  className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
                  id="totalHeight"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                  <span className="text-sm font-semibold text-gray-500">{getUnits()}.</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="mb-5">
        <div className="flex mb-2">
          <label className="block text-gray-900" htmlFor="displayedUnits">
            {get_i18n('tank_level_units')}
          </label>
          <FontAwesomeIcon
            onClick={() => show_help('tank_level_units')}
            icon={['fas', 'question-circle']}
            size="lg"
            className="z-50 m-auto ml-1 text-sm text-gray-500"
          />
        </div>
        <div className="switch-field">
          <input
            onChange={e => onUnitChange(e)}
            id="percent"
            type="radio"
            value="percent"
            name="units"
            defaultChecked={sensor.levelUnits == 'percent'}
          />
          <label htmlFor="percent">{get_i18n('percent')}</label>
          <input
            onChange={e => onUnitChange(e)}
            id="centimeters"
            type="radio"
            value="centimeters"
            name="units"
            defaultChecked={sensor.levelUnits == 'centimeters'}
          />
          <label htmlFor="centimeters">{get_i18n('centimeters')}</label>
          <input
            onChange={e => onUnitChange(e)}
            id="inches"
            type="radio"
            value="inches"
            name="units"
            defaultChecked={sensor.levelUnits == 'inches'}
          />
          <label htmlFor="inches">{get_i18n('inches')}</label>
        </div>
      </div>
      {!sensor.isWater && app_brand != 'bmpro' && <GasMixtureSetting sensor={sensor} region={region} />}
      {sensor.hwFamily == 'pro' && sensor.connectState == 'connected'
        ? sensor.updateRate && (
            <div className="mb-5">
              <div className="flex mb-2">
                <label className="block text-gray-900" htmlFor="updateRate">
                  {get_i18n('updateRate')}
                </label>
                {/* <FontAwesomeIcon onClick={() => show_help('alarm_thresh')} icon={['fas', 'question-circle']} size="lg" className="m-auto ml-1 text-sm text-gray-500" /> */}
              </div>
              <div className="flex items-center px-2">
                <div className="slider-label-badge">
                  <span>{updateRate}s</span>
                </div>
                <SliderWithTooltip
                  tipFormatter={v => {
                    return `${v} Seconds`
                  }}
                  tipProps={{ overlayClassName: 'foo' }}
                  value={updateRate}
                  min={3.5}
                  max={30}
                  step={0.1}
                  onChange={e => onUpdateRateChange(e)}
                  railStyle={{ height: 4 }}
                  handleStyle={{
                    height: 25,
                    width: 25,
                    marginLeft: 10,
                    marginTop: -10,
                  }}
                  trackStyle={{ height: 4 }}
                />
              </div>
            </div>
          )
        : sensor.hwFamily == 'pro' && (
            <div className="flex flex-col mb-5 text-center">
              <span className="text-gray-500">{get_i18n('proSettings')}</span>
              <span className="text-gray-500">Attempting to connect...</span>
            </div>
          )}
      <h2 className="px-5 pt-2 my-4 -mx-5 text-xl border-t border-gray-400">{get_i18n('notifications')}</h2>
      {/* Notifications Settings */}
      <div className="flex items-center justify-between mb-5">
        <span className="block mr-auto text-gray-900">{get_i18n('notifications')}</span>
        {app_brand == 'lippert' && (
          <span className="mr-1 text-sm font-semibold">{notificationsEnabled ? 'On' : 'Off'}</span>
        )}
        <ToggleSwitch
          theme={app_brand}
          enabled={notificationsEnabled}
          name="notificationsEnabled"
          onStateChange={onToggleNotifications}
        />
      </div>
      {notificationsEnabled && (
        <div>
          <div className="mb-5">
            <div className="flex mb-2">
              <label className="block text-gray-900" htmlFor="alarmThreshold">
                {get_i18n('alarm_thresh')}
              </label>
              <FontAwesomeIcon
                onClick={() => show_help('alarm_thresh')}
                icon={['fas', 'question-circle']}
                size="lg"
                className="m-auto ml-1 text-sm text-gray-500"
              />
            </div>
            <div className="flex items-center px-2">
              <div className="slider-label-badge">
                <span>{alarmThreshold}%</span>
              </div>
              <SliderWithTooltip
                tipFormatter={v => {
                  return `${v} %`
                }}
                tipProps={{ overlayClassName: 'foo' }}
                value={alarmThreshold}
                min={5}
                max={95}
                onChange={e => onThresholdChange(e)}
                railStyle={{ height: 4 }}
                handleStyle={{
                  height: 25,
                  width: 25,
                  marginLeft: 10,
                  marginTop: -10,
                  // borderColor: '#48bb78',
                  // backgroundColor: '#48bb78',
                }}
                trackStyle={{
                  // backgroundColor: '#48bb78',
                  height: 4,
                }}
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-gray-900" htmlFor="tankRegion">
              <span>{get_i18n('notificationsFreq')}</span>
            </label>
            <div className="relative">
              <select
                onChange={e => onNotificationCooldownChange(e)}
                value={notificationCooldown}
                className="block w-full px-4 py-3 pr-8 leading-tight text-gray-700 bg-white border border-gray-200 rounded outline-none appearance-none dropdown-shadow-theme focus:border-secondary">
                <option value={6}>{get_i18n('hour6')}</option>
                <option value={12}>{get_i18n('hour12')}</option>
                <option value={24}>{get_i18n('day1')}</option>
                <option value={24 * 3}>{get_i18n('day3')}</option>
                <option value={24 * 7}>{get_i18n('week')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SensorOptions
