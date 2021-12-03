import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'

import { Sensor } from '../../../../lib/sensors/sensor'
import { NearbySensorsState } from './types'

const initialState: NearbySensorsState = {
  sensors: {},
  searching: false,
  rssiFilter: 60,
}

const nearbySensorsSlice = createSlice({
  name: 'nearbySensors',
  initialState,
  reducers: {
    toggleSearching(state) {
      state.searching = !state.searching
    },
    setRssiFilter(state, action: PayloadAction<number>) {
      state.rssiFilter = action.payload
    },
    addSensor(state, action: PayloadAction<Sensor>) {
      state.sensors[action.payload.shortAddress] = _.cloneDeep(action.payload)
    },
    removeSensor(state, action: PayloadAction<Sensor>) {
      delete state.sensors[action.payload.shortAddress]
    },
  },
})

export const { addSensor, removeSensor, toggleSearching, setRssiFilter } = nearbySensorsSlice.actions

export default nearbySensorsSlice.reducer
