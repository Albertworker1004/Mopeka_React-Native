import React, { CSSProperties } from 'react'
import Collapsible from './Collapsible'
import { i18n, ble, get_i18n } from '../../../lib'
import { confirmAlert } from 'react-confirm-alert'

const SensorPositionCollapsible = ({ sensor }) => {
  if (!sensor.accelPosition) return null

  const zeroSensor = async () => {
    confirmAlert({
      closeOnClickOutside: true,
      customUI: ({ onClose }) => {
        return (
          <div className="fixed z-10 w-full" style={{ bottom: '40%' }}>
            <div className="p-4 mx-10 bg-gray-100 border rounded shadow-lg">
              <h3 className="text-xl">{get_i18n('accConfirmRezero')}</h3>
              <p className="pt-2">{get_i18n('accConfirmMsg')}</p>
              <div className="flex justify-around mt-4">
                <a
                  className="btn-secondary"
                  onClick={() => {
                    onClose()
                  }}>
                  {get_i18n('cancel')}
                </a>
                <a
                  className="btn-primary"
                  onClick={() => {
                    ble.calibrateAdc()
                    onClose()
                  }}>
                  Ok
                </a>
              </div>
            </div>
          </div>
        )
      },
    })
  }

  // TODO: try using jquery here for the smoother .animate() function
  const dot = sensor.accelPosition
  const dotStyle: CSSProperties = {
    position: 'relative',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
    borderRadius: '9999px',
    transition: 'all 0.5s cubic-bezier(0.02, 0.01, 0.47, 1)',
  }

  const dotXY = {
    ...dotStyle,
    height: '9vw',
    width: '9vw',
    top: dot.movexy.top,
    left: dot.movexy.left,
  }
  const dotX = {
    ...dotStyle,
    height: '6vw',
    width: '6vw',
    top: '86.7vw',
    left: dot.movex.left,
  }
  const dotY = {
    ...dotStyle,
    height: '6vw',
    width: '6vw',
    top: dot.movey.top,
    left: '75.2vw',
  }

  return (
    <Collapsible title={get_i18n('accTitle')} icon="exclamation-triangle" iconEnabled={dot.shouldWarn}>
      <div className="flex flex-col p-4">
        <p>{get_i18n('acc')}</p>
        <p className="mt-6">{get_i18n('accStep1')}</p>
        <p className="my-4">{get_i18n('accStep2')}</p>
        <a onClick={() => zeroSensor()} className="px-8 py-2 m-auto font-semibold text-white rounded-full bg-secondary">
          {get_i18n('accZeroSensor')}
        </a>
        <p className="mt-4">{get_i18n('accStep3')}</p>
        <div
          style={{
            width: '85vw',
            marginTop: '-24vw',
            margin: 'auto',
            textAlign: 'center',
            verticalAlign: 'middle',
          }}>
          <div className="bg-secondary" style={dotXY}></div>
          <div className="bg-secondary" style={dotX}></div>
          <div className="bg-secondary" style={dotY}></div>
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
            <g filter="url(#filter0_i)">
              <circle cx="435" cy="439" r="405" fill="#FAFAFA" />
            </g>
            <g filter="url(#filter1_i)">
              <rect x="30" y="867" width="810" height="100" rx="50" fill="#FAFAFA" />
            </g>
            <g filter="url(#filter2_i)">
              <rect x="870" y="34" width="100" height="810" rx="50" fill="#FAFAFA" />
            </g>
            <circle r="72" transform="matrix(1 0 0 -1 435 439)" stroke="#000" strokeOpacity=".5" strokeWidth="8" />
            <path
              stroke="#000"
              strokeOpacity=".5"
              strokeWidth="4"
              d="M870 486h100M870 388h100M388 867v100M486 867v100"
            />
            <defs>
              <filter
                id="filter0_i"
                x="30"
                y="34"
                width="810"
                height="810"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="12.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                <feBlend in2="shape" result="effect1_innerShadow" />
              </filter>
              <filter
                id="filter1_i"
                x="30"
                y="867"
                width="810"
                height="100"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="12.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                <feBlend in2="shape" result="effect1_innerShadow" />
              </filter>
              <filter
                id="filter2_i"
                x="870"
                y="34"
                width="100"
                height="810"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="12.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                <feBlend in2="shape" result="effect1_innerShadow" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
    </Collapsible>
  )
}

export default SensorPositionCollapsible
