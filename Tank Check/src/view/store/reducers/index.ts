import { combineReducers, Action } from '@reduxjs/toolkit'
import { connectRouter } from 'connected-react-router'
import { createHashHistory } from 'history'
export const history = createHashHistory()
import { ThunkAction } from 'redux-thunk'

import optionsReducer from './options/reducers'
import sensorsReducer from './sensors/reducers'
import firmwareReducer from './sensors/firmware/reducers'
import nearbySensorsReducer from './nearbySensors/reducers'
import userReducer from './user/reducers'
import toasterReducer from './toaster/reducers'
import plotReducer from './plot/reducers'

const rootReducer = combineReducers({
  options: optionsReducer,
  user: userReducer,
  plot: plotReducer,
  toaster: toasterReducer,
  sensors: sensorsReducer,
  firmware: firmwareReducer,
  nearbySensors: nearbySensorsReducer,
  router: connectRouter(history),
})

export type RootState = ReturnType<typeof rootReducer>
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>

export default rootReducer
