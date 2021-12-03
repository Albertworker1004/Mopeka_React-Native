/// <reference types="amazon-cognito-identity-js" />

import _ from 'lodash'
import $$ from 'jquery'
import { utils, Timer } from './utils'
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js'
import { TankCheck } from './sensors/tankcheck'
import { ble, get_i18n } from './index'
import { Sensor } from './sensors/sensor'
import store from '../view/store'
import {
  setSession,
  removeAllAccountSensors,
  addAccountSensor,
  clearSession,
} from '../view/store/reducers/user/reducers'
import { Sample } from './sensors/sample'
import { initPushService } from './notifications'
import { RootState } from '../view/store/reducers'

declare var app_brand: 'gascheck' | 'mttracker' | 'tankcheck' | 'vertrax' | 'yonke' | 'bmpro' | 'lippert' | 'eyegas'

type AttributeMap = {
  [name: string]: AmazonCognitoIdentity.CognitoUserAttribute
}

export type SensorMap = {
  [address: string]: ApiSensor
}

export type ApiSensor = {
  address: string
  name: string
  modelNumber: number
  alertsEnabled: boolean
  alertThreshold: number
  alertCooldown: number
  propaneButaneRatio: number
  tankHeight: number
  tankType: string
  vertical: boolean
  lastAlert?: number
}

export type ApiSample = {
  time: number
  lpgLevel: number
  voltage?: number
  quality?: number
  syncButtonState?: number
  rawLevel?: number
  temperature?: number
}

type ApiSensors = {
  devices: ApiSensor[]
}

// let $$ = $;

export class MopekaUser {
  private readonly poolData = {
    UserPoolId: 'us-east-1_sLQ1KlStp', // Your user pool id here
    ClientId: '7dafulgmkck7u9hiju6v6p1emt', // Your client id here
  }
  private readonly apiEndPoint = 'https://sdllzocmni.execute-api.us-east-1.amazonaws.com/alpha/'
  private readonly userPool: AmazonCognitoIdentity.CognitoUserPool = new AmazonCognitoIdentity.CognitoUserPool(
    this.poolData
  )

  private cognitoUser: AmazonCognitoIdentity.CognitoUser
  private session: AmazonCognitoIdentity.CognitoUserSession
  private attributeMap: AttributeMap = {}

  private sensorMap: SensorMap = {}
  private isLoading: boolean = false
  public cloudUpdateTimer: Timer = new Timer(this.doCloudUpdateAll.bind(this), Timer.TimerType.Recurring)

  /** How long to allow a sensor to be unseen before checking the cloud for an update */
  private readonly cloudSensorRefreshTime = 60 * 1000

  constructor() {}

  private registerUser(
    email: string,
    password: string,
    phoneNumber?: string
  ): Promise<{ ok: boolean; data?: AmazonCognitoIdentity.ISignUpResult; error?: Error }> {
    return new Promise(resolve => {
      try {
        this.setUserEmail(email)
        this.setUserBrand(app_brand)
        if (phoneNumber) this.setUserPhoneNumber(phoneNumber)

        let values: AmazonCognitoIdentity.CognitoUserAttribute[] = []
        for (let i in this.attributeMap) if (this.attributeMap.hasOwnProperty(i)) values.push(this.attributeMap[i])

        this.userPool.signUp(email, password, values, null, (error, data: AmazonCognitoIdentity.ISignUpResult) => {
          if (error) {
            utils.log('signUp error: ', error)
            resolve({ ok: false, error })
          } else {
            //this.cognitoUser = data.user;
            utils.log('user name is ' + data.user.getUsername(), data)
            resolve({ ok: true, data })
          }
        })
      } catch (e) {
        resolve({
          ok: false,
          error: new Error('Unexpected register error.  Check your internet connection and try again.'),
        })
      }
    })
  }

  public async register(
    email: string,
    password: string,
    password2: string
  ): Promise<{ ok: boolean; shouldConfirm?: boolean; invalid?: boolean }> {
    let valid = await this.validateEmailPassword(email, password, password2)
    if (!valid) return { ok: false }

    let resp = await this.registerUser(email, password)

    if (resp.ok) {
      return await this.Login(email, password)
    } else {
      const msg = get_i18n(resp.error.name) == 'i18n_string' ? resp.error.message : get_i18n(resp.error.name)
      await utils.notifyPromise(msg, get_i18n('registerFailed'))
    }
    return { ok: false }
  }

  private async isLoggedIn() {
    if (!this.session) return false

    if (this.session.isValid()) return true

    utils.log('Refreshing user token')
    this.session = null
    let res = await this.getUserSession()
    if (res.ok) {
      return this.session.isValid()
    }
    return false
  }

  /** Retrieve a session as long as we are authenticated.  If failed, then call authenticateUser */
  private getUserSession(): Promise<{
    ok: boolean
    session?: AmazonCognitoIdentity.CognitoUserSession
    error?: Error
  }> {
    if (this.session) return Promise.resolve({ ok: true, session: this.session })
    let user = this.userPool.getCurrentUser()
    this.cognitoUser = user
    if (user) {
      return new Promise(resolve => {
        user.getSession((error, session) => {
          if (error) {
            utils.log('getSession failed: ' + (error.message || JSON.stringify(error)))
            resolve({ ok: false, error })
          } else {
            this.session = session
            resolve({ ok: true, session })
          }
        })
      })
    } else {
      return Promise.resolve({ ok: false, error: new Error('no session') })
    }
  }

  /** Only call this if getUserSession fails first */
  private authenticateUser(
    email: string,
    password: string
  ): Promise<{ ok: boolean; session?: AmazonCognitoIdentity.CognitoUserSession; error?: Error }> {
    return new Promise(resolve => {
      let pending = true
      let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: email,
        Password: password,
      })
      let user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: this.userPool })
      this.cognitoUser = user
      //user.setAuthenticationFlowType("USER_PASSWORD_AUTH");
      user.authenticateUser(authenticationDetails, {
        onSuccess: (session: AmazonCognitoIdentity.CognitoUserSession) => {
          utils.log('Successfully logged in ' + email)
          pending = false
          resolve({ ok: true, session })
        },
        onFailure: (error: any) => {
          utils.log('Error authenticating user: ' + (error.message || JSON.stringify(error)))
          pending = false
          resolve({ ok: false, error })
        },
      })

      utils.delay(30000).then(() => {
        if (pending) {
          resolve({ ok: false, error: new Error('Login timed out.  Check your internet connection and try again.') })
        }
      })
    })
  }

  private confirmRegistration(email: string, code: string): Promise<{ ok: boolean; data?: any; error?: any }> {
    return new Promise(resolve => {
      let user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: this.userPool })
      this.cognitoUser = user
      user.confirmRegistration(code, true, (error: any, data: any) => {
        if (error) {
          utils.log('Error confirming verification code: ' + (error.message || JSON.stringify(error)))
          resolve({ ok: false, error })
        } else {
          utils.log('Successfully confirmed verification code: ' + data)
          resolve({ ok: true, data })
        }
      })
    })
  }

  public async confirmAccount(email: string, code: string): Promise<{ ok: boolean }> {
    let c = await this.confirmRegistration(email, code)
    if (c.ok) {
      await utils.notifyPromise('Successfully confirmed your new account and email address.', 'Success')
      return { ok: true }
    } else {
      await utils.notifyPromise('Verification failed. Please try again', 'Try again')
      return { ok: false }
    }
  }

  public resendConfirmation(email: string): Promise<{ ok: boolean; data?: any; error?: any }> {
    return new Promise(resolve => {
      let user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: this.userPool })
      user.resendConfirmationCode(async (error, data) => {
        if (error) {
          utils.log('Error resending verification code: ' + (error.message || JSON.stringify(error)))
          resolve({ ok: false, error })
        } else {
          utils.log('Successfully resent verification code: ' + data)
          await utils.notifyPromise(
            'Successfully sent new email verification code. Please wait a minute to make sure you get the most recent code and then try again.',
            'Verification code sent'
          )
          resolve({ ok: true, data })
        }
      })
    })
  }

  private logOut() {
    if (this.cognitoUser) {
      this.cognitoUser.signOut()
      this.session = null
      this.cognitoUser = null
      this.attributeMap = {}
      store.dispatch(clearSession())
    }
  }

  private sendPasswordReset(user: AmazonCognitoIdentity.CognitoUser): Promise<{ ok: boolean; error?: Error }> {
    return new Promise(async resolve => {
      user.forgotPassword({
        onSuccess: async _data => {
          utils.log('Successfully sent password reset:' + JSON.stringify(_data))
          resolve({ ok: true })
        },
        onFailure: async (error: Error) => {
          resolve({ ok: false, error })
        },
      })
    })
  }

  private confirmPasswordReset(
    user: AmazonCognitoIdentity.CognitoUser,
    code: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: Error }> {
    return new Promise(resolve => {
      user.confirmPassword(code, newPassword, {
        onSuccess: async () => {
          await utils.notifyPromise('Successfully changed password', 'Success')
          resolve({ ok: true })
        },
        onFailure: async (error: Error) => {
          utils.log('confirmPasswordReset error: ', error)
          await utils.notifyPromise(error.message || JSON.stringify(error), 'Failed to change password')
          resolve({ ok: false, error })
        },
      })
    })
  }

  private async getPasswordResetCodeFromUser(email: string, user: AmazonCognitoIdentity.CognitoUser): Promise<string> {
    while (1) {
      let code = await utils.promptPromise(
        'Please enter the password reset code that was sent to ' + email + '.',
        'Enter reset code',
        ['OK', 'Cancel', 'Resend']
      )
      if (code.buttonIndex != 1 && code.buttonIndex != 3) return null
      if (code.buttonIndex == 3) {
        let res = await this.sendPasswordReset(user)
        if (!res.ok) {
          await utils.notifyPromise(res.error.message || JSON.stringify(res.error), 'Forgot Password Error')
          return null
        }
        await utils.notifyPromise(
          'Successfully emailed new password reset code. Please wait a minute to make sure you get the most recent code that was emailed',
          'Reset code sent'
        )
        continue
      }
      return code.input1
    }
    return null
  }

  private async getPasswordFromUser(email: string): Promise<string> {
    while (1) {
      let pw = await utils.promptPromise('Please enter new password for ' + email + '.', 'Enter new password', [
        'OK',
        'Cancel',
      ])
      if (pw.buttonIndex != 1) {
        return null
      }

      pw.input1 = pw.input1.trim()
      let valid = await this.validateEmailPassword(email, pw.input1)
      if (!valid) continue // loop and prompt again

      return pw.input1
    }
    return null
  }

  public async doForgotPasswordSequence(email: string, nested?: boolean) {
    let valid = await this.validateEmailPassword(email)
    if (!valid) {
      return
    }

    let resetCode: string = null
    let newPassword: string = null

    try {
      let user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: this.userPool })
      let res = await this.sendPasswordReset(user)

      if (!res.ok) {
        if (
          res.error &&
          res.error.message &&
          !nested &&
          res.error.name === 'InvalidParameterException' &&
          /no register.+email/i.test(res.error.message)
        ) {
          let ret = await this.doConfirmUserAccount(email)
          if (ret.ok) {
            await this.doForgotPasswordSequence(email, true) // avoid endless recursive loop
            return
          } else {
            return
          }
        } else {
          await utils.notifyPromise(res.error.message || JSON.stringify(res.error), 'Forgot Password Error')
        }
      }

      if (!res.ok) return

      while (1) {
        if (!resetCode) {
          resetCode = await this.getPasswordResetCodeFromUser(email, user)
          if (resetCode === null) return
        }

        if (!newPassword) {
          newPassword = await this.getPasswordFromUser(email)
          if (!newPassword) return
        }

        let res = await this.confirmPasswordReset(user, resetCode, newPassword)
        if (res.ok) return

        if (res.error.name === 'CodeMismatchException') {
          resetCode = null
          continue
        }

        return
      }
    } catch (e) {
      await utils.notifyPromise(
        'Unexpected error. Please check your internet connection and try again',
        'Password reset'
      )
    }
  }

  private setUserEmail(email: string) {
    let attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })
    this.attributeMap['email'] = attributeEmail
    localStorage.setItem('userEmail', email)
  }

  private setUserBrand(brand: string) {
    let attributeBrand = new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'custom:brand', Value: brand })
    this.attributeMap['custom:brand'] = attributeBrand
  }

  private setUserPhoneNumber(phone: string) {
    let attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'phone_number', Value: phone })
    this.attributeMap['phone_number'] = attributePhoneNumber
  }

  /** Returns true if the user canceled, false if any other event happened */
  private async doConfirmUserAccount(email: string): Promise<{ ok: boolean; userCanceled: boolean }> {
    let results = await utils.promptPromise(
      'To activate your new account and email address, please enter the email verification code that was sent to ' +
        email +
        '.',
      'Enter verification code',
      ['OK', 'Cancel', 'Resend']
    )
    if (results.buttonIndex === 1) {
      let c = await this.confirmRegistration(email, results.input1)
      if (c.ok) {
        await utils.notifyPromise('Successfully confirmed your new account and email address.', 'Success')
        return Promise.resolve({ ok: true, userCanceled: false })
      } else {
        await utils.notifyPromise('Verification failed. Please try again', 'Try again')
        return Promise.resolve({ ok: false, userCanceled: false })
      }
    } else if (results.buttonIndex === 3) {
      let c = await this.resendConfirmation(email)
      if (c.ok) {
        await utils.notifyPromise(
          'Successfully sent new email verification code. Please wait a minute to make sure you get the most recent code and then try again.',
          'Verification code sent'
        )
        return Promise.resolve({ ok: false, userCanceled: false })
      } else {
        await utils.notifyPromise('Unexpected error sending email verification code', 'Unexpected error')
        return Promise.resolve({ ok: false, userCanceled: false })
      }
    } else {
      return Promise.resolve({ ok: false, userCanceled: true })
    }
  }

  /** Returns true if user has been authenticated successfully */
  private async doAuthenticateUserAccount(
    email: string,
    password: string
  ): Promise<{ ok: boolean; shouldConfirm?: boolean }> {
    try {
      while (1) {
        let auth = await this.authenticateUser(email, password)
        if (auth.ok) {
          let ret = await this.getUserSession()
          if (!ret.ok) {
            await utils.notifyPromise('Unexpected error retrieving user session.', get_i18n('loginFailed'))
          } else {
            await this.handleLoginEvent(true)
          }
          return { ok: true }
        }

        // Handle errors
        if (auth.error.name === 'UserNotConfirmedException') {
          return { ok: false, shouldConfirm: true }
        } else if (auth.error.name === 'UserNotFoundException') {
          await utils.notifyPromise(
            'An account does not exist for ' +
              email +
              '. Please check that you entered the correct email or click on the "Register" button to create a new account.',
            get_i18n('loginFailed')
          )
          break
        } else {
          // TODO: check for specific and fallback to this generic.
          await utils.notifyPromise(get_i18n('loginFailedGeneric'), get_i18n('loginFailed'))
          break
        }
      }
      utils.log('user sign in failed')
    } catch (e) {
      await utils.notifyPromise(
        'Unexpected login error.  Check your internet connection and try again.',
        get_i18n('loginFailed')
      )
    }
    return { ok: false }
  }

  private async validateEmailPassword(email: string, password?: string, confirm?: string): Promise<boolean> {
    let emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
    //let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let passwordRegex = /^[\S]+.*[\S]+$/

    if (email.length == 0) {
      await utils.notifyPromise(get_i18n('missingEmail'), get_i18n('invalidEmail'))
      return false
    }
    if (!emailRegex.test(email)) {
      await utils.notifyPromise(get_i18n('missingEmailMsg'), get_i18n('invalidEmail'))
      return false
    }
    if (email.length >= 254) {
      await utils.notifyPromise(get_i18n('emailLong'), get_i18n('invalidEmail'))
      return false
    }

    if (password == null) return true // not checking password

    if (password.length < 6) {
      await utils.notifyPromise(get_i18n('minPassword'), get_i18n('invalidPassword'))
      return false
    }
    if (!passwordRegex.test(password)) {
      await utils.notifyPromise(get_i18n('passwordFormat'), get_i18n('invalidPassword'))
      return false
    }

    if (confirm == null) return true // not confirming password

    if (confirm.length == 0) {
      await utils.notifyPromise(get_i18n('passwordConfirm'), get_i18n('invalidPassword'))
      return false
    }

    if (password !== confirm) {
      await utils.notifyPromise(get_i18n('passwordNotMatch'), get_i18n('passwordMismatch'))
      return false
    }

    return true
  }

  private async doCloudUpdate(tc: TankCheck) {
    let now = Date.now()
    let dt = now - tc.lastSeen
    if (!tc.lastSeen || dt > this.cloudSensorRefreshTime) {
      //utils.log("Checking for cloud update of " + tc.shortAddress);
      //utils.log(dt + " since last update. Updating " + tc.shortAddress + " now");
      let val = await this.getLastSample(tc.shortAddress)
      if (val.ok) {
        //utils.log("Got level update for " + tc.shortAddress + ": ", val);

        let d = val.sample
        if (!tc.lastSeen || d.time > tc.lastSeen + 15000) {
          // +1s to make sure the same sample from cloud isn't shown in case of upload latency - in most cases
          let s = new Sample()
          s.level = (d.rawLevel * 20) / 1000000
          s.temperature = d.temperature
          s.syncPressed = !!d.syncButtonState
          s.q = d.quality
          s.battery = d.voltage
          s.date = d.time
          s.slowUpdateRate = true

          tc.setSampleFromCloud(s)
        } else {
          //utils.log("Received cloud data older by " + (tc.lastSeen - d.time));
        }
      } else {
        //utils.log("Error retrieving level update for " + tc.shortAddress + ": ", val);
      }
    } else {
      //utils.log("Last saw " + tc.shortAddress + " - " + dt + ", skipping cloud update");
    }
  }

  private async doCloudUpdateAll() {
    utils.log('running doCloudUpdate')

    if (!(await this.isLoggedIn())) {
      return
    }

    for (let key in ble.sensorList) {
      if (!ble.sensorList.hasOwnProperty(key)) continue

      let sensor = ble.sensorList[key]
      if (!sensor || sensor.isGw) continue
      await this.doCloudUpdate(<TankCheck>sensor)
    }
  }

  public async Login(
    email: string,
    password: string
  ): Promise<{ ok: boolean; shouldConfirm?: boolean; invalid?: boolean }> {
    localStorage.setItem('userEmail', email)

    let valid = await this.validateEmailPassword(email, password)
    if (!valid) {
      return { ok: false, invalid: false }
    }

    return await this.doAuthenticateUserAccount(email, password)
  }

  public initUserAccountPanel(): void {
    this.getUserSession().then(resp => {
      if (resp.ok && resp.session.isValid()) {
        utils.log('User session found')
        this.handleLoginEvent(true).then(() => {
          utils.log('Going to startCloudUpdate')
        })
      } else {
        utils.log('No user session found')
      }
    })
  }

  public accountSensorToggle(shortAddr: string) {
    /** Toggle in or out of local list */
    if (!ble.forget(shortAddr)) {
      let apiSensor = this.sensorMap[shortAddr]
      if (apiSensor) {
        let obj = {
          address: shortAddr,
          name: apiSensor.name,
          alarmNotificationsEnabled: apiSensor.alertsEnabled,
          alarmThreshPercent: apiSensor.alertThreshold,
          notificationCooldown: apiSensor.alertCooldown,
          propaneButaneRatio: apiSensor.propaneButaneRatio,
          //TODO: We need to save and load tank region, vert/horiz, ...?
          tankInfo: TankCheck.findDefaultRegionTank(apiSensor.tankType, apiSensor.tankHeight),
        }
        obj.tankInfo.vertical = apiSensor.vertical

        let tc = ble.addTankCheckFromCloud(obj, apiSensor.modelNumber)
        this.doCloudUpdate(tc)
      }
    }
  }

  public async doLogout() {
    this.logOut()
    await this.handleLoginEvent(false)
  }

  private async handleLoginEvent(loggedIn: boolean) {
    utils.log('user signed ' + (loggedIn ? 'in' : 'out'))

    this.sensorMap = {}
    if (loggedIn) {
      store.dispatch(setSession(_.cloneDeep(this.session)))

      console.log(this.session)

      // Reinitialize the push service to assoicate this userId to the push endpoint
      initPushService()

      await this.refreshAccountSensors()
      this.cloudUpdateTimer.start(this.cloudSensorRefreshTime, true) // will run now and start off sequence
    } else {
      this.cloudUpdateTimer.stop()
    }
  }

  public async syncLocalSensorToCloud(s: Sensor, skipRedraw: boolean) {
    if (s.isGw || !(await this.isLoggedIn())) {
      return false
    }

    let tc = <TankCheck>s
    let apiSensor: ApiSensor = this.sensorMap[tc.shortAddress]
    if (!apiSensor) {
      utils.log('Adding new sensor to cloud: ' + s.shortAddress)
      await this.addOrUpdateSensorToCloud(tc, skipRedraw)
      return true
    }

    if (
      apiSensor.modelNumber != tc.hwVersionNumber ||
      apiSensor.name != tc.name ||
      apiSensor.alertsEnabled != tc.alarmNotificationsEnabled ||
      apiSensor.alertThreshold != tc.alarmThreshPercent ||
      apiSensor.alertCooldown != tc.notificationCooldown ||
      apiSensor.propaneButaneRatio != tc.propaneButaneRatio ||
      apiSensor.vertical != (tc.tankInfo && tc.tankInfo.vertical) ||
      apiSensor.tankHeight != (tc.tankInfo && tc.tankInfo.height) ||
      apiSensor.tankType != (tc.tankInfo && tc.tankInfo.type)
    ) {
      utils.log('Updating sensor to cloud: ' + s.shortAddress)
      await this.addOrUpdateSensorToCloud(tc, skipRedraw)
      return true
    }

    return false
  }

  private async addOrUpdateSensorToCloud(s: Sensor, skipRedraw: boolean) {
    if (!s.isGw) {
      let tc = <TankCheck>s

      let a: ApiSensor = {
        address: tc.shortAddress,
        name: tc.name,
        modelNumber: tc.hwVersionNumber,
        tankHeight: tc.tankInfo?.height,
        tankType: tc.tankInfo?.type,
        vertical: tc.tankInfo?.vertical,
        alertsEnabled: tc.alarmNotificationsEnabled,
        alertThreshold: tc.alarmThreshPercent,
        alertCooldown: tc.notificationCooldown,
        propaneButaneRatio: tc.propaneButaneRatio,
      }

      let res = await this.apiAddSensor(a)
      if (res.ok) {
        this.sensorMap[a.address] = a
        // if (!skipRedraw) this.redrawSensorMap();
      }
    }
  }

  /** Called anytime a cloud sensor has been added to the cloud "sensorMap" or added/removed from the
   * app sensor list (so this can update the "cloud/local" icon)  */
  public sensorAddRemoveLocalEvent(addr: string, add: boolean): void {
    let apiSensor = this.sensorMap[addr]
    if (!apiSensor) {
      if (add) {
        let sla = ble.sensorList[addr]
        if (sla) {
          this.addOrUpdateSensorToCloud(sla, false)
        }
      }
      return
    }
  }

  public async refreshAccountSensors() {
    let ret = await this.apiGetSensors()

    // Add all sensors from cloud
    if (ret.ok && ret.data && Array.isArray(ret.data.devices)) {
      let d = ret.data.devices

      store.dispatch(removeAllAccountSensors())

      this.sensorMap = {}

      for (let i = 0; i < d.length; ++i) {
        let apiSensor = d[i]

        if (!apiSensor.address) continue

        // Originally (before production), we were saving data in the full AA:BB:CC:DD:EE:FF format.  Now we just always use the short DD:EE:FF format
        if (apiSensor.address.startsWith('000000') === false) {
          utils.log('Old long address format sensor detected: ' + apiSensor.address + '. Skipping')
          continue
        } else {
          utils.log('Read ' + apiSensor.address + ' on user account')
        }

        let a = utils.toShortAddress(apiSensor.address)
        apiSensor.address = a
        this.sensorMap[a] = apiSensor
      }
      store.dispatch(addAccountSensor(_.cloneDeep(this.sensorMap)))
    } else {
      await utils.notifyPromise(
        'Check your internet connection or try logging out and in again',
        'Error retrieving sensors'
      )
      return
    }

    // Add all local sensors now, if they're not in cloud
    const {
      sensors: { sensors },
    } = (store.getState() as unknown) as RootState

    for (let key in sensors) {
      if (sensors.hasOwnProperty(key)) {
        await this.syncLocalSensorToCloud(sensors[key], true)
      }
    }
    // for (let key in ble.sensorList) {
    //     if (ble.sensorList.hasOwnProperty(key)) {
    //         await this.syncLocalSensorToCloud(ble.sensorList[key].sensor, true);
    //     }
    // }

    // this.redrawSensorMap();
  }

  public async getLastSample(shortAddress: string): Promise<{ ok: boolean; sample?: ApiSample }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false })
    }

    let apiSensor = this.sensorMap[shortAddress]
    if (!apiSensor) {
      return Promise.resolve({ ok: false })
    }

    let ret = await this.apiGetSensorData(shortAddress)

    if (!ret.ok || !ret.data || !Array.isArray(ret.data) || !ret.data.length) {
      return Promise.resolve({ ok: false })
    }

    return Promise.resolve({ ok: true, sample: ret.data[0] })
  }

  private async apiGetSensorData(shortAddress: string): Promise<{ ok: boolean; data?: ApiSample[]; error?: Error }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false, error: new Error('not logged in') })
    }

    return new Promise<{ ok: boolean; data?: ApiSample[]; error?: Error }>(resolve => {
      let token = this.session.getAccessToken().getJwtToken()

      $$.ajax({
        url: this.apiEndPoint + 'sensors/' + utils.toCloudAddress(shortAddress) + '/data',
        method: 'GET',
        data: {
          limit: 1,
        },
        headers: {
          auth: token,
          'content-Type': 'application/json',
        },
        dataType: 'json',
        contentType: 'application/json',
        timeout: 10000,
        cache: false,

        error: function (_error: JQuery.jqXHR, _textStatus: string, errorThrown: string) {
          //utils.log("Error reading " + shortAddress + ": ", error, textStatus, errorThrown);
          resolve({ ok: false, error: new Error(errorThrown) })
        },
        success: function (data: any, _textStatus: string, _jqXHR: JQuery.jqXHR) {
          //utils.log("Successfully read sensor " + shortAddress);
          resolve({ ok: true, data: data.data })
        },
      })
    })
  }

  public async apiPostSensorData(tc: TankCheck): Promise<{ ok: boolean; error?: Error }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false, error: new Error('not logged in') })
    }

    return new Promise<{ ok: boolean; data?: ApiSample[]; error?: Error }>(resolve => {
      let token = this.session.getAccessToken().getJwtToken()
      let s = tc.getSample()
      let addr = tc.shortAddress

      let data = {
        time: 0, // uses server for timestmap, but required in model/body
        lpgLevel: utils.round3(tc.getLevelAsMeters()),
        voltage: utils.round2(tc.getBatteryVoltage()),
        quality: utils.round2(tc.getScoreQuality()),
        syncButtonState: s.syncPressed ? 1 : 0,
        rawLevel: utils.round2((s.level * 1000000) / 20),
        temperature: utils.round2(s.temperature),
      }

      $$.ajax({
        url: this.apiEndPoint + 'sensors/' + utils.toCloudAddress(addr) + '/data',
        method: 'POST',
        data: JSON.stringify(data),
        headers: {
          auth: token,
          'content-Type': 'application/json',
        },
        processData: false,
        dataType: 'json',
        contentType: 'application/json',
        timeout: 10000,
        cache: false,

        error: function (_error: JQuery.jqXHR, _textStatus: string, errorThrown: string) {
          //utils.log("Error posting " + addr + ": ", error, textStatus, errorThrown);
          resolve({ ok: false, error: new Error(errorThrown) })
        },
        success: function (_data: any, _textStatus: string, _jqXHR: JQuery.jqXHR) {
          //utils.log("Successfully posted sensor data for " + addr);
          resolve({ ok: true })
        },
      })
    })
  }

  public async deleteSensor(shortAddr: string) {
    if (shortAddr) {
      let resp = await utils.confirmPromise(
        'You are about to remove this sensor from your online account.  You will not be able to add it again without physical access to your sensor.  Are you sure?',
        'Confirm delete?',
        ['Delete', 'Cancel']
      )
      if (resp == 1) {
        let r = await this.apiDeleteSensor(shortAddr)
        if (r.ok) {
          delete this.sensorMap[shortAddr] // delete from our user account map
          ble.forget(shortAddr) // and delete from app list (which then should call into here)
        } else {
          await utils.notifyPromise(
            'Error removing sensor:\n' + (r.error.message || JSON.stringify(r.error)),
            'Error removing sensor'
          )
        }
      }
    }
  }

  private async apiDeleteSensor(
    shortAddress: string
  ): Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false, loggedIn: false, error: new Error('not logged in') })
    }

    return new Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }>(resolve => {
      let token = this.session.getAccessToken().getJwtToken()

      $$.ajax({
        url: this.apiEndPoint + 'sensors/' + utils.toCloudAddress(shortAddress),
        method: 'DELETE',
        headers: {
          auth: token,
        },
        dataType: 'json',
        contentType: 'application/json',
        timeout: 10000,
        cache: false,
        error: (error: JQuery.jqXHR, textStatus: string, errorThrown: string) => {
          utils.log('Error: ', error, textStatus, errorThrown)
          resolve({ ok: false, loggedIn: true, error })
        },
        success: async (_data: any, _textStatus: string, _jqXHR: JQuery.jqXHR) => {
          utils.log('Successfully deleted ' + shortAddress + ' from cloud')
          await this.refreshAccountSensors()
          resolve({ ok: true, loggedIn: true })
        },
      })
    })
  }

  private async apiGetSensors(): Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false, loggedIn: false, error: new Error('not logged in') })
    }

    return new Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }>(resolve => {
      let token = this.session.getAccessToken().getJwtToken()

      $$.ajax({
        url: this.apiEndPoint + 'sensors',
        method: 'GET',
        data: {},
        headers: {
          auth: token,
          'content-Type': 'application/json',
        },
        dataType: 'json',
        contentType: 'application/json',
        timeout: 10000,
        cache: false,

        error: function (error: JQuery.jqXHR, textStatus: string, errorThrown: string) {
          utils.log('Error: ', error, textStatus, errorThrown)
          resolve({ ok: false, loggedIn: true, error })
        },
        success: function (data: any, _textStatus: string, _jqXHR: JQuery.jqXHR) {
          utils.log('Successfully got sensors')
          resolve({ ok: true, loggedIn: true, data })
        },
      })
    })
  }

  public async apiAddSensor(
    sensor: ApiSensor
  ): Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }> {
    if (!(await this.isLoggedIn())) {
      return Promise.resolve({ ok: false, loggedIn: false, error: new Error('not logged in') })
    }

    return new Promise<{ ok: boolean; loggedIn: boolean; data?: ApiSensors; error?: any }>(resolve => {
      let token = this.session.getAccessToken().getJwtToken()

      let w: ApiSensor = $$.extend({}, sensor)
      w.address = utils.toCloudAddress(w.address)

      $$.ajax({
        url: this.apiEndPoint + 'sensors',
        method: 'POST',
        data: JSON.stringify(w),
        headers: {
          auth: token,
        },
        dataType: 'json',
        contentType: 'application/json',
        processData: false,
        timeout: 10000,
        cache: false,
        error: function (error: JQuery.jqXHR, textStatus: string, errorThrown: string) {
          utils.log('Error: ', error, textStatus, errorThrown)
          resolve({ ok: false, loggedIn: true, error })
        },
        success: function (_data: any, _textStatus: string, _jqXHR: JQuery.jqXHR) {
          resolve({ ok: true, loggedIn: true })
        },
      })
    })
  }
}
