import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import { AppThunk } from '../..'
import { TankCheck } from '../../../../../lib/sensors/tankcheck'
import { SensorFirmwareState } from './types'

const initialState: SensorFirmwareState = {
  currentFirmwareInfo: null,
  latestFirmwareInfo: null,
}

const firmwareSlice = createSlice({
  name: 'firmware',
  initialState,
  reducers: {
    clearFirmwareInfo(state) {
      state.currentFirmwareInfo = null
      state.latestFirmwareInfo = null
    },
    setCurrentFirmwareInfo(state, action: PayloadAction<{ version: string; downloadUrl?: string }>) {
      state.currentFirmwareInfo = action.payload ? action.payload : null
    },
    setLatestFirmwareInfo(state, action: PayloadAction<{ version: string; downloadUrl?: string }>) {
      state.latestFirmwareInfo = action.payload ? action.payload : null
    },
  },
})

export const setCurrentAndCheckForUpdates = (current: string): AppThunk => async (dispatch, getState) => {
  dispatch(setCurrentFirmwareInfo({ version: current }))
  dispatch(setLatestFirmwareInfo(null)) // clear latest and recheck
  const state = getState()
  const selectedSensor = state.sensors.sensors[state.sensors.selectedSensor] as TankCheck
  dispatch(checkForNewFirmware(selectedSensor.hwFamily, current))
}

export const checkForNewFirmware = (type, current): AppThunk => async dispatch => {
  // https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/firmware?type=pro&current=0.0.48
  const endpoint = new URL('https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/firmware?')
  const params = new URLSearchParams({ type, current })
  fetch(endpoint + params.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(data => data.json())
    .then(json => {
      dispatch(setLatestFirmwareInfo(json))
    })
    .catch(err => {
      dispatch(setLatestFirmwareInfo(null))
    })
}

export const { clearFirmwareInfo, setCurrentFirmwareInfo, setLatestFirmwareInfo } = firmwareSlice.actions

export default firmwareSlice.reducer
