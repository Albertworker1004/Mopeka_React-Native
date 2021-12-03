import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectSensorById } from '../store/reducers/sensors/selectors'
import BrandLogo from '../../../www/img/mopekaproducts500x251.png'
import Tank from '../components/widgets/Tank'
import { TankCheck } from '../../lib/sensors/tankcheck'

const SensorDemo = () => {
  const sensor = useSelector(state => selectSensorById(state, 'A1:B2:C3')) as TankCheck

  const tankWidth = Math.min(window.screen.width * 0.9, 600)

  return (
    <div className="flex flex-col h-screen">
      <Link className="absolute top-0 right-0 w-10 p-2" to="/">
        <FontAwesomeIcon icon={['fas', 'times']} size="lg" />
      </Link>
      <div className="flex items-center justify-center mt-8">
        <img className="object-contain" src={BrandLogo} />
      </div>
      <div className="flex items-center justify-center my-auto">
        <Tank tankType={'truck'} stage={sensor.levelImageOffset} width={tankWidth} />
      </div>
      <div className="flex flex-col items-center w-64 max-w-xs px-8 m-auto">
        <h2 className="text-xl text-center">Density: 4.2 lb/gal</h2>
        <label className="block mb-2 font-semibold text-center text-gray-900" htmlFor="commodity">
          <span>Commodity</span>
        </label>
        <div id="commodity" className="relative">
          <select className="block w-full px-4 py-3 pr-8 leading-tight text-gray-700 bg-white border border-gray-200 rounded outline-none appearance-none dropdown-shadow-theme focus:border-secondary">
            <option>Propane</option>
            <option>Butane</option>
            <option>Isobutane</option>
            <option>Natural Gasoline</option>
            <option>Ethane</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex mt-auto nav-theme">
        <div className="relative w-full p-8 text-center border-r">
          <FontAwesomeIcon
            icon={['fas', 'percent']}
            size="5x"
            color="white"
            opacity={0.28}
            className="absolute top-0 right-0 p-2"
          />
          <span className="text-5xl">{sensor.levelStringFull}</span>
        </div>
        <div className="relative w-full p-8 text-center">
          <FontAwesomeIcon
            icon={['fas', 'thermometer-three-quarters']}
            size="6x"
            color="white"
            opacity={0.28}
            className="absolute top-0 right-0 p-2"
          />
          <span className="text-5xl">{`${((sensor.samples.temperature * 9) / 5 + 32).toFixed(0)}°F`}</span>
        </div>
      </div>
    </div>
  )
}

export default SensorDemo
