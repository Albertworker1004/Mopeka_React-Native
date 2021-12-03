import { createSelector } from '@reduxjs/toolkit'

export const selectSensors = state => state.sensors.sensors

const selectSensorId = (state, sensorId) => sensorId

export const selectSensorById = createSelector([selectSensors, selectSensorId], (sensors, sensorId) => {
  return sensors[sensorId] || null
})

export const selectSensorListKeys = createSelector([selectSensors], sensors => {
  return Object.keys(sensors)
})
