import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { rollbar } from '../../../../lib'
import { SensorMap, ApiSensor } from '../../../../lib/mopekaUser'
import { utils } from '../../../../lib/utils'
import { UserState } from './types'

const initialState: UserState = {
  session: null,
  sensors: {},
}

const accountSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{}>) {
      state.session = action.payload
      rollbar.configure({
        payload: {
          person: {
            id: state.session.idToken.payload.sub, // required
            email: state.session.idToken.payload.email,
          },
        },
      })
    },
    clearSession(state) {
      state.session = null
      rollbar.configure({
        payload: {
          person: {
            id: null,
          },
        },
      })
    },
    addAccountSensor(state, action: PayloadAction<SensorMap>) {
      state.sensors = action.payload
    },
    removeAllAccountSensors(state) {
      state.sensors = {}
    },
    removeAccountSensor(state, action: PayloadAction<ApiSensor>) {
      const shortaddr = utils.toShortAddress(action.payload.address)
      delete state.sensors[shortaddr]
    },
  },
})

export const {
  setSession,
  clearSession,
  addAccountSensor,
  removeAllAccountSensors,
  removeAccountSensor,
} = accountSlice.actions

export default accountSlice.reducer
