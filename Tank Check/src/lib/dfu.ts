/// <reference types="cordova-plugin-file" />

import { ble } from './index'
import { utils } from './utils'

function downloadFirmware(url: string, progressCB): Promise<string> {
  return new Promise(resolve => {
    window.requestFileSystem(
      LocalFileSystem.TEMPORARY,
      0,
      function (fs) {
        console.log('file system open: ' + fs.name)

        fs.root.getFile(
          `firmware${Date.now()}.zip`,
          { create: true, exclusive: false },
          function (fileEntry) {
            console.log('fileEntry is file? ' + fileEntry.isFile.toString())
            var oReq = new XMLHttpRequest()
            // Make sure you add the domain name to the Content-Security-Policy <meta> element.
            oReq.open('GET', url, true)
            // Define how you want the XHR data to come back
            oReq.responseType = 'blob'
            oReq.onload = function () {
              var blob = oReq.response // Note: not oReq.responseText
              if (blob) {
                fileEntry.createWriter(writer => {
                  writer.onwriteend = function () {
                    console.log('Write of file completed.')
                    resolve(fileEntry.toURL())
                  }

                  writer.onprogress = a => {
                    console.log(a)
                  }

                  writer.onerror = function () {
                    console.log('Write failed')
                  }
                  writer.write(blob)
                })
              } else resolve('we didnt get an XHR response!')
            }
            oReq.send(null)
          },
          function (err) {
            resolve('error getting file! ' + err)
          }
        )
      },
      function (err) {
        resolve('error getting persistent fs! ' + err)
      }
    )
  })
}

async function scanForDevice(deviceId) {
  await ble.adapterStopScan()
  return Promise.race([
    utils.delay(15000, false).then(() => {
      window['BLECentral'].stopScan()
    }),
    new Promise((resolve, error) => {
      window['BLECentral'].startScanWithOptions(
        ['FEE5'],
        { reportDuplicates: true },
        function (scanData) {
          if (deviceId == scanData.id) {
            window['BLECentral'].stopScan()
            return resolve(scanData.id)
          }
        },
        function (scanErr) {
          error(scanErr)
        }
      )
    }),
  ])
}

async function connect(deviceId) {
  return new Promise(resolve => {
    window['BLECentral'].connect(
      deviceId,
      success => {
        resolve(success)
      },
      () => {
        resolve(false)
      }
    )
  })
}

// function isConnected(deviceId) {
//   return new Promise((resolve) => {
//     window['BLECentral'].isConnected(deviceId, () => {
//       resolve(true)
//     }, () => {
//       resolve(false)
//     })
//   });
// }

/**
 *
 *
 * @export
 * @param {string} deviceId used for connecting to the device. Either a MAC or UUID if iOS
 * @param {(string | object)} firmware A URL to the file, or a file object if using local file
 * @param {*} progress a callback function that receives progress updates
 * @param {*} error
 * @returns {void}
 */
export async function upgradeFirmware(
  deviceId: string,
  firmware:
    | string
    | {
        data: Uint8Array
        dataURI: string
        mediaType: string
        name: string
        uri: string
      },
  progress: (_: any) => void,
  error: (_: any) => void
) {
  try {
    console.log(`Attempting to upgrade device ${deviceId}`)

    let scanRes = await scanForDevice(deviceId)
    if (!scanRes) {
      progress({ statusMessage: 'Could not find device. Trying anyways...' })
    } else {
      console.log(`Found ${deviceId}`)
    }

    let attempts = 1
    let connectResults
    do {
      console.log(`Connection attempt ${attempts}...`)
      connectResults = await connect(deviceId)
      attempts++
    } while (!connectResults && attempts <= 10)

    if (!connectResults) {
      return error('Could not connect to device for DFU update.')
    }

    let filePath: string
    if (typeof firmware === 'string') {
      filePath = await downloadFirmware(firmware, (p: ProgressEvent<EventTarget>) => {
        console.log(p)
      })
    } else {
      filePath = firmware.uri
    }
    console.log(filePath)

    window['BLECentral'].upgradeFirmware(
      deviceId,
      filePath,
      p => {
        p.statusMessage = FIRMWARE_MESSAGES[p.status]
        progress(p)
      },
      e => {
        return error(e.errorMessage)
      }
    )
  } catch (error) {
    return error(JSON.stringify(error))
  }
}

type UpdateResponse = {
  updateAvailable: boolean
  latest?: string
  firmwareUrl?: string
}

const FIRMWARE_MESSAGES = {
  deviceConnected: 'Device Connected',
  dfuProcessStarting: 'DFU process Starting',
  enablingDfuMode: 'Enabling DFU mode',
  deviceConnecting: 'Connecting to device',
  dfuProcessStarted: 'DFU process started',
  progressChanged: 'Uploading firmware',
  deviceDisconnecting: 'Device disconnecting',
  deviceDisconnected: 'Device disconnected',
  dfuCompleted: 'Firmware upgrade complete',
}
