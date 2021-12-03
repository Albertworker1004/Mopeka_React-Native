/// <reference path='./index.d.ts'/>
/// <reference types="cordova-plugin-statusbar" />

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { PersistGate } from 'redux-persist/integration/react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
library.add(far, fas)
import 'typeface-open-sans'
import 'rc-slider/assets/index.css'
import './app.css'

import store, { persistor } from './store'
import { history } from './store/reducers'
import App from './App'

import { ble } from '../lib/index'

export function createMarkupFromString(s: string) {
  return { __html: s }
}

var app = {
  // Application Constructor
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false)
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: async function () {
    await ble.initialize()
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <PersistGate loading={null} persistor={persistor}>
            <App />
          </PersistGate>
        </ConnectedRouter>
      </Provider>,
      document.getElementById('app')
    )

    if (app_brand != 'lippert') {
      const navbar = document.querySelector('nav')
      const style = getComputedStyle(navbar)
      const rgb2hex = c =>
        '#' +
        c
          .match(/\d+/g)
          .map(x => (+x).toString(16).padStart(2, '0'))
          .join('')
      StatusBar.backgroundColorByHexString(rgb2hex(style.backgroundColor))
    }

    // reveal app last
    navigator['splashscreen'].hide()
  },
}

app.initialize()
