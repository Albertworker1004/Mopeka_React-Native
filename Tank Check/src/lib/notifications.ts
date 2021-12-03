/// <reference types="phonegap-plugin-push/types" />

import store from '../view/store'
import { RootState } from '../view/store/reducers'
import { utils } from './utils'

function* idGenerator(): Generator<number> {
  let index: number = 0
  while (true) yield <number>index++
}

let getNextId = idGenerator()

// #region Remote Notifications
const SNS_ENDPOINT = 'https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/sns-endpoints'

export function initPushService() {
  // get app options to see if notifications enabled
  // call this function when that option changes
  // register or unregister
  // call on login again

  let push = PushNotification.init({
    android: {
      vibrate: true,
      icon: 'notify_icon',
      iconColor: '#56aa1c',
    },
    ios: {
      alert: 'true',
      badge: 'true',
      sound: 'true',
    },
    windows: {},
  })

  // Since this function may be reran multiple times during a session unregister and register event handlers
  push.off('registration', onRegistration)
  push.off('notification', onNotification)
  push.off('error', onError)

  // Register Event handlers
  push.on('registration', onRegistration)
  push.on('notification', onNotification)
  push.on('error', onError)
}

function createARN(payload: {
  deviceId: string
  endpointArn?: string
  userId?: string
  customData?: {}
}): Promise<{ ok: boolean; data?: any; err?: any }> {
  return new Promise(resolve => {
    fetch(SNS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(data => data.json())
      .then(data => {
        resolve({
          ok: true,
          data,
        })
      })
      .catch(err => {
        resolve({
          ok: false,
          err,
        })
      })
  })
}

async function onRegistration(data: PhonegapPluginPush.RegistrationEventResponse) {
  console.dir(data)

  const {
    user: { session },
    options: { notifications },
  } = (store.getState() as unknown) as RootState
  const username = session?.idToken.payload.sub || null

  if (!notifications) {
    utils.log('Notifications not enabled. Disabling endpoint.')
  }

  let ARN = window.localStorage.getItem('ARN')
  const payload = {
    deviceId: data.registrationId,
    endpointArn: ARN,
    userId: username,
    customData: {
      brand: app_brand,
    },
    notificationsEnabled: notifications,
  }
  const arn = await createARN(payload)

  if (arn.ok) {
    if (arn.data.arn) {
      window.localStorage.setItem('ARN', arn.data.arn)
      console.log(`got arn: ${JSON.stringify(arn.data.arn)}`)
    } else {
      console.log(arn.data)
    }
  } else {
    console.log(arn.err)
  }
}

function onNotification(data: PhonegapPluginPush.NotificationEventResponse) {
  console.log(data)
  if (data.message || data.title) {
    showOrUpdateNotification({
      id: getNextId.next().value,
      title: data.title,
      text: data.message,
    })
  }
}

function onError(error: Error) {
  console.log(error)
}

// #endregion

// #region Local Notifications

export function cancelNotification(hash) {
  cordova.plugins['notification'].local.cancel(hash)
}

export async function showOrUpdateNotification(options: {
  id: number
  title: string
  text: string
  data?: any
}): Promise<number> {
  var notificationOptions = {
    id: options.id,
    title: options.title,
    text: options.text,
    data: options.data || null,
    color: '56aa1c',
    led: {
      color: '#56aa1c',
      on: 500,
      off: 500,
    },
    foreground: true,
    sticky: false,
    autoClear: true,
    icon: 'notify_icon',
    smallIcon: 'res://notify_icon', // smallIcon is what shows in the notification bar on Android 7.
  }

  const present = await isPresent(options.id)
  if (present) {
    notificationOptions['sound'] = null // if already present then skip sound
  }

  cordova.plugins['notification'].local.schedule(notificationOptions)
  return options.id
}

async function isPresent(id: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    cordova.plugins['notification'].local.isPresent(id, present => {
      if (present) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

// #endregion
