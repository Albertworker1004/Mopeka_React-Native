import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Sensor } from '../../../../lib/sensors/sensor'
import _ from 'lodash'
import { SensorState } from './types'

const initialState: SensorState = {
  sensors: {},
  selectedSensor: null,
  pendingWrite: false,
}

const sensorListSlice = createSlice({
  name: 'sensorList',
  initialState,
  reducers: {
    addOrUpdateSensor(state, action: PayloadAction<Sensor>) {
      // existing code mutates the sensor objects. create a clone so it is not mutated in the view state
      state.sensors[action.payload.shortAddress] = _.cloneDeep(action.payload)
    },
    syncSensors(state, action: PayloadAction<{}>) {
      state.sensors = action.payload
    },
    removeAllSensors(state) {
      state.sensors = {}
    },
    removeSensor(state, action: PayloadAction<Sensor>) {
      delete state.sensors[action.payload.shortAddress]
    },
    setSelectedSensor(state, action: PayloadAction<string>) {
      state.selectedSensor = action.payload ? action.payload : null
    },
    setPendingWriteStatus(state, action: PayloadAction<boolean>) {
      state.pendingWrite = action.payload
    },
  },
})

export const {
  addOrUpdateSensor,
  syncSensors,
  removeAllSensors,
  removeSensor,
  setSelectedSensor,
  setPendingWriteStatus,
} = sensorListSlice.actions

export default sensorListSlice.reducer
