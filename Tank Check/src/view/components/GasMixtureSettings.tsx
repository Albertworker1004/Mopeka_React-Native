import React, { useState, useEffect } from 'react'
import Slider, { createSliderWithTooltip } from 'rc-slider'
const SliderWithTooltip = createSliderWithTooltip(Slider)
import { ble, get_i18n, i18n, show_help } from '../../lib'
import { TankCheck } from '../../lib/sensors/tankcheck'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TankRegionPicker } from '../../lib/tankRegionPicker'

const GasMixtureSetting = ({ sensor, region }: { sensor: TankCheck; region?: string }) => {
  const [propanePercentage, setPropanePercentage] = useState(sensor.propaneButaneRatio)
  const [prevRegion, setPrevRegion] = useState(region)

  useEffect(() => {
    if (region && region !== prevRegion) {
      const regionRatio = TankRegionPicker.getDefaultPropaneRatio(region)
      if (sensor.propaneButaneRatio !== regionRatio) {
        setPropanePercentage(regionRatio)
        setPrevRegion(region)
      }
    }
  }, [region, prevRegion])

  useEffect(() => {
    const setPropaneRatio = async () => {
      const s = (await ble.getSensorFromAddress(sensor.shortAddress)) as TankCheck
      s.setPropaneRatio(propanePercentage)
    }

    setPropaneRatio()
  }, [propanePercentage])

  return (
    <div className="mb-5">
      <div className="flex mb-2">
        <label className="block text-gray-900">
          <span>{get_i18n('gas_mixture')}</span>
        </label>
        <FontAwesomeIcon
          onClick={() => show_help('gas_mixture')}
          icon={['fas', 'question-circle']}
          size="lg"
          className="z-50 m-auto ml-1 text-sm text-gray-500"
        />
      </div>
      <div className="flex flex-col items-center self-center w-11/12 my-2">
        <div className="flex justify-between w-full mb-1 text-sm">
          <span>{`+ ${get_i18n('butane')}`}</span>
          <span>{`${get_i18n('propane')} +`}</span>
        </div>
        <SliderWithTooltip
          tipFormatter={v => {
            if (v == 0) {
              return `100% ${get_i18n('butane')}`
            } else if (v == 1) {
              return `100% ${get_i18n('propane')}`
            }
            return `${(v * 100).toFixed(0)}% propane`
          }}
          tipProps={{ overlayClassName: 'foo' }}
          value={propanePercentage}
          min={0}
          max={1}
          step={0.01}
          onChange={e => setPropanePercentage(e)}
          railStyle={{ height: 6 }}
          handleStyle={{
            height: 25,
            width: 25,
            marginLeft: 0,
            marginTop: -10,
          }}
          trackStyle={{ height: 6 }}
        />
        <span className="text-xs">{`${get_i18n('propane')} ${(propanePercentage * 100).toFixed(0)}% / ${get_i18n(
          'butane'
        )} ${((1 - propanePercentage) * 100).toFixed(0)}%`}</span>
      </div>
    </div>
  )
}

export default GasMixtureSetting
