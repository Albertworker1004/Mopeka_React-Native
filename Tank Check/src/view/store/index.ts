import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import rootReducer, { history, RootState } from './reducers'
import { routerMiddleware } from 'connected-react-router'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import { createBlacklistFilter } from 'redux-persist-transform-filter'

const nearbySensorsBlacklist = createBlacklistFilter('nearbySensors', ['sensors'])

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: autoMergeLevel2,
  transforms: [nearbySensorsBlacklist],
  blacklist: ['router', 'toaster', 'plot', 'firmware'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState() as RootState)
  return result
}

const store = configureStore({
  reducer: persistedReducer,
  middleware: [
    ...getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
    routerMiddleware(history),
  ],
  // middleware: [...getDefaultMiddleware({serializableCheck: false}), routerMiddleware(history), logger]
})

export type AppDispatch = typeof store.dispatch

window['store'] = store

export const persistor = persistStore(store)

export default store
