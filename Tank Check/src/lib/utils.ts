/// <reference types="cordova-plugin-dialogs" />

export class utils {
  static inNotifyFunction: boolean = false

  public static getShopLink() {
    const country = window.navigator.language.split('-')[1].toLowerCase()
    if (SHOP_URLS.hasOwnProperty(country)) {
      return SHOP_URLS[country]
    }
    return SHOP_URLS.default
  }

  public static loadSensorFromLongAddress(anyAddress: string) {
    //if (!utils.isIOS()) {
    let val = window.localStorage.getItem(anyAddress)
    if (val) {
      let short = utils.toShortAddress(anyAddress)
      //utils.log("Loaded as short: " + anyAddress);
      if (short !== anyAddress) {
        window.localStorage.setItem(short, val)
        window.localStorage.removeItem(anyAddress)
        utils.log('Deleted: ' + anyAddress)
      }
      return val
    }
    //}

    val = window.localStorage.getItem(utils.toShortAddress(anyAddress))
    utils.log('Loaded: ' + anyAddress)
    return val
  }

  public static toCloudAddress(address: string) {
    let str = address.replace(/:/g, '')
    str = '000000' + str.substr(-6, 6)
    return str
  }

  public static toShortAddress(address: string) {
    let str = address.replace(/:/g, '')
    str = str.substr(-6, 2) + ':' + str.substr(-4, 2) + ':' + str.substr(-2, 2)
    return str
  }

  public static show(e) {
    if (e) {
      e.removeClass('ui-screen-hidden')
    }
  }
  public static hide(e) {
    if (e) {
      e.addClass('ui-screen-hidden')
    }
  }

  public static isIOS() {
    return device.platform === 'iOS'
  }

  public static log = (function () {
    var timestamp = function () {}
    timestamp.toString = function () {
      return '[' + new Date().toISOString() + ']'
    }
    return console.log.bind(console, '%s', timestamp)
  })()

  public static promptPromise(
    msg: string,
    title?: string,
    buttonLabels?: string[],
    defaultText?: string
  ): Promise<{ buttonIndex: number; input1: string }> {
    return new Promise(resolve => {
      navigator.notification.prompt(
        msg,
        data => {
          utils.log('resolving prompt: ', data.buttonIndex)
          resolve(data)
        },
        title,
        buttonLabels,
        defaultText
      )
    })
  }

  public static notify(msg: string, title: string, func?): boolean {
    if (utils.inNotifyFunction === false) {
      utils.inNotifyFunction = true
      navigator.notification.alert(
        msg,
        () => {
          if (func) func()
          utils.inNotifyFunction = false
        },
        title
      )
      return true
    }
    return false
  }

  public static notifyPromise(msg: string, title: string) {
    return new Promise(resolve => {
      navigator.notification.alert(
        msg,
        () => {
          utils.inNotifyFunction = false
          resolve(true)
        },
        title
      )
    })
  }

  public static confirmPromise(msg: string, title: string, buttonLabels?: string[]): Promise<number> {
    return new Promise(resolve => {
      navigator.notification.confirm(
        msg,
        (data: number) => {
          utils.inNotifyFunction = false
          resolve(data)
        },
        title,
        buttonLabels
      )
    })
  }

  public static delay(t: number, value?: any): Promise<number> {
    return new Promise(resolve => setTimeout(resolve, t, value))
  }

  public static rand(min: number, max: number): number {
    return Math.round(min + Math.random() * (max - min))
  }

  public static round0(num: number): number {
    return Math.round(num)
  }

  public static round1(num: number): number {
    return Math.round(num * 10) / 10
  }

  public static round2(num: number): number {
    return Math.round(num * 100) / 100
  }

  public static round3(num: number): number {
    return Math.round(num * 1000) / 1000
  }

  public static round4(num: number): number {
    return Math.round(num * 10000) / 10000
  }

  public static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max)
  }

  public static clampCircle(x: number, y: number, centerX: number, centerY: number, radius: number) {
    let a = centerX - x
    let b = centerY - y
    let dist = Math.sqrt(a * a + b * b)
    if (dist <= radius) {
      return { x: x, y: y }
    } else {
      x = x - centerX
      y = y - centerY
      var radians = Math.atan2(y, x)
      return {
        x: Math.cos(radians) * radius + centerX,
        y: Math.sin(radians) * radius + centerY,
      }
    }
  }

  // convert byte to hex digit
  public static byte2str(i: number): string {
    var str = i.toString(16)
    if (i < 16) str = '0' + str
    return str
  }

  public static encode16Bit(value) {
    var u16 = new Uint16Array([value]) // Create a new Types Array, which is a special view for an Array Buffer
    var u8 = new Uint8Array(u16.buffer) // We transmit bytewise, so use an 8 Bit View on the Array Buffer
    return u8
  }
}

export module Timer {
  export const enum TimerType {
    SingleShot = 0,
    Recurring = 1,
  }
}

export class Timer {
  id: number = null
  func: TimerHandler
  type: Timer.TimerType

  constructor(callback: TimerHandler, type: Timer.TimerType) {
    this.func = callback
    this.type = type
  }

  public stop() {
    if (this.id !== null) {
      if (this.type === Timer.TimerType.Recurring) {
        clearInterval(this.id)
      } else {
        clearTimeout(this.id)
      }
      this.id = null
    }
  }

  public update(callback: Function, t: number) {
    this.func = callback
    this.start(t)
  }

  public start(t: number, runNow?: boolean) {
    this.stop()
    if (runNow) this.invoke()
    if (t > 0) {
      if (this.type === Timer.TimerType.Recurring) {
        this.id = setInterval(this.func, t)
      } else {
        this.id = setTimeout(this.func, t)
      }
    }
  }

  public invoke() {
    ;(<Function>this.func)()
  }

  public isArmed() {
    if (this.id !== null) {
      return true
    }
    return false
  }
}

declare global {
  interface String {
    hashCode(): number
    capitalize(): string
  }
}

String.prototype.hashCode = function (): number {
  var hash = 0,
    i,
    chr
  if (this.length === 0) return hash
  for (i = 0; i < this.length; i += 1) {
    chr = this.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

String.prototype.capitalize = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1)
}
