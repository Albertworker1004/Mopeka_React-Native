// import React, { useEffect, useState } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { RootState } from '../store/reducers'
// import { setOptionThunk } from '../store/reducers/options/reducers'
// import { ble } from '../../lib'

// const Diagnostic = () => {
//   const dispatch = useDispatch()
//   const [hasLocation, setHasLocation] = useState(false)
//   const [hasGPS, setHasGPS] = useState(false)
//   const [hasBluetooth, setHasBluetooth] = useState(false)
//   const [hasBluetoothLE, setHasBluetoothLE] = useState(true)

//   const nearbySensorCount = useSelector((state: RootState) => Object.keys(state.nearbySensors.sensors).length)

//   useEffect(() => {
//     dispatch(setOptionThunk({
//       name: 'title',
//       val: {
//         main: 'Diagnostics'
//       }
//     }))
//     refreshAllDiagnostics()
//   }, [])

//   const refreshAllDiagnostics = () => {
//     cordova.plugins['diagnostic'].isBluetoothAvailable(supported => {
//       setHasBluetooth(supported)
//     })
//     if (!ble.isIOS) {
//       cordova.plugins['diagnostic'].hasBluetoothLESupport(supported => {
//         setHasBluetoothLE(supported)
//       })
//     }
//     cordova.plugins['diagnostic'].isLocationAvailable(enabled => {
//       setHasLocation(enabled)
//     })
//   }

//   return (
//     <div className="flex flex-col h-screen px-5 text-2xl">
//       <div className="flex flex-col items-center mt-auto mb-4">
//         <span className="mb-1 text-gray-900">Bluetooth</span>
//         <span className={`text-center rounded-lg text-base text-white px-2 py-1 ${hasBluetooth ? 'bg-green-400' : 'bg-red-400'}`}>{hasBluetooth ? 'Enabled' : 'Disabled'}</span>
//       </div>
//       <div className="flex flex-col items-center my-4">
//         <span className="mb-1 text-gray-900">Bluetooth LE</span>
//         <span className={`text-center rounded-lg text-base text-white px-2 py-1 ${hasBluetoothLE ? 'bg-green-400' : 'bg-red-400'}`}>{hasBluetoothLE ? 'Enabled' : 'Disabled'}</span>
//       </div>
//       <div className="flex flex-col items-center my-4">
//         <span className="mb-1 text-gray-900">Location Services</span>
//         <span className={`text-center rounded-lg text-base text-white px-2 py-1 ${hasLocation ? 'bg-green-400' : 'bg-red-400'}`}>{hasLocation ? 'Enabled' : 'Disabled'}</span>
//       </div>
//       <div className="flex flex-col items-center my-4">
//         <span className="mb-1 text-gray-900">Nearby Sensors</span>
//         <span className={`text-center rounded-lg text-base text-white px-4 py-1 ${nearbySensorCount ? 'bg-green-400' : 'bg-red-400'}`}>{nearbySensorCount}</span>
//       </div>
//       <span className="my-auto text-xs text-center text-gray-500">Version {APP_VERSION}</span>
//     </div>
//   )
// }

// export default Diagnostic
