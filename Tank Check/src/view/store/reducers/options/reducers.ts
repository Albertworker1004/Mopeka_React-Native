import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk } from '..'
import { initPushService } from '../../../../lib/notifications'
import { OptionsState, OptionPayload } from './types'

const initialState: OptionsState = {
  notifications: true,
  uploadSensorData: true,
  searchFilter: false,
  groupSensors: false,
  sortPreferences: 'name',
  title: {
    main: 'Sensor List',
  },
  scanActive: false,
  errorUUID: '',
}

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setOption(state, action: PayloadAction<OptionPayload>) {
      state[action.payload.name] = action.payload.val
    },
  },
})

export const { setOption } = optionsSlice.actions

export const setOptionThunk = (payload: OptionPayload): AppThunk => async dispatch => {
  await dispatch(setOption(payload))
  if (payload.name == 'notifications') {
    initPushService()
  }
}

export default optionsSlice.reducer
