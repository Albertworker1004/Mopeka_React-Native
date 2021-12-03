import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import semver from 'semver'
import * as dfu from '../../../lib/dfu'
import { RootState } from '../../store/reducers'
import Collapsible from './Collapsible'
import { showToast } from '../../store/reducers/toaster/reducers'
import { get_i18n } from '../../../lib'

// enables usage of cordova file chooser
declare const chooser

export const FirmwareCollapsible = () => {
  const dispatch = useDispatch()
  const currentFirmwareVersion = useSelector((state: RootState) => state.firmware.currentFirmwareInfo)
  const latestFirmwareVersion = useSelector((state: RootState) => state.firmware.latestFirmwareInfo)
  const selectedSensor = useSelector((state: RootState) => state.sensors.sensors[state.sensors.selectedSensor])
  const [updateInProgress, setUpdateInProgress] = useState<boolean>(false)
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const [didFail, setDidFail] = useState<boolean>(false)
  const [updateProgress, setUpdateProgress] = useState<any>()
  const [updateAvailable, setUpdateAvailable] = useState<boolean>()
  const [file, setFile] = useState<any>()

  useEffect(() => {
    if (currentFirmwareVersion && latestFirmwareVersion && latestFirmwareVersion.downloadUrl) {
      setUpdateAvailable(true)
    } else {
      setUpdateAvailable(false)
    }
  }, [latestFirmwareVersion])

  const pickFile = async () => {
    const f = await chooser.getFile()
    if (f) {
      const re = /([0-9+]+\.[0-9+]+\.[0-9+]+)/
      const ver = f.name.match(re)
      if (ver) {
        // if file version is older current. Don't set as the active file to use
        if (semver.lt(ver[0], currentFirmwareVersion.version)) {
          dispatch(
            showToast(
              {
                type: 'error',
                message: 'Selected file version older than current version',
              },
              5000
            )
          )
        } else {
          setFile(f)
        }
      }
    } else {
      setFile(null)
    }
  }

  const resetState = () => {
    setUpdateInProgress(false)
    setDidFail(false)
    setUpdateProgress(null)
    setFile(null)
  }

  const startUpdate = async () => {
    // @ts-ignore
    window.plugins.insomnia.keepAwake()
    setUpdateInProgress(true)
    setUpdateSuccess(false)
    const upgradePayload = file ? file : latestFirmwareVersion.downloadUrl
    dfu.upgradeFirmware(
      selectedSensor.connectAddress,
      upgradePayload,
      progress => {
        setUpdateProgress(progress)
        if (progress.status == 'dfuCompleted') {
          resetState()
          setUpdateSuccess(true)
        }
        console.log(progress)
      },
      error => {
        console.error(error)
        if (!didFail && error != 'FW version failure') {
          setDidFail(true)
          console.log('retrying firmware upgrade')
          startUpdate()
        } else if (error == 'FW version failure') {
          setUpdateProgress({ statusMessage: 'Invalid firmware version' })
        } else {
          resetState()
        }
      }
    )
  }

  if (currentFirmwareVersion) {
    const buttons =
      updateAvailable && latestFirmwareVersion ? (
        <>
          <button className="self-start w-full mx-auto btn-primary button-primary-theme" onClick={() => startUpdate()}>
            {`${get_i18n('fw1')} ${latestFirmwareVersion.version}`}
          </button>
          <button onClick={() => pickFile()} className="self-start mx-auto mt-2 text-sm font-semibold text-gray-600">
            {get_i18n('fw2')}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => pickFile()}
            className="self-start w-full mx-auto mt-2 text-sm font-semibold text-gray-600 btn-secondary button-secondary-theme">
            {get_i18n('fw3')}
          </button>
        </>
      )

    const progress = !updateSuccess ? (
      <div className="w-full">
        <div className="w-full shadow bg-grey-light">
          <div
            className="py-1 text-xs leading-none text-center text-white bg-blue-500"
            style={{ width: `${updateProgress?.progress?.percent || 0}%` }}>{`${
            updateProgress?.progress?.percent || 0
          }%`}</div>
        </div>
        <div className="flex flex-col">
          <span className="mt-1">{updateProgress?.statusMessage || 'Starting'}</span>
          <span className="mt-1 text-xs text-gray-500">{get_i18n('fwStarted')}</span>
        </div>
      </div>
    ) : (
      <div className="w-full">
        <div className="w-full shadow bg-grey-light">
          <div
            className="py-1 text-xs leading-none text-center text-white bg-blue-500"
            style={{ width: `${100}%` }}>{`${100}%`}</div>
        </div>
        <div className="flex flex-col">
          <span className="mt-1">{get_i18n('fwSuccess')}</span>
        </div>
      </div>
    )

    return (
      <Collapsible title="Firmware" text="Update Available!" textEnabled={updateAvailable}>
        <div className="flex flex-col p-6 text-center">
          {/* <img className="object-contain w-1/2 mx-auto" src={SensorImage}/> */}
          <div className="flex flex-col">
            <h4 className="font-semibold">{get_i18n('fwCurrentVersionTitle')}</h4>
            <span>{currentFirmwareVersion.version}</span>
            {currentFirmwareVersion?.version == latestFirmwareVersion?.version && !updateInProgress && (
              <span className="font-semibold text-green-500">{get_i18n('nofwUpdate')}</span>
            )}
          </div>
          <div className="mt-4">
            {updateInProgress || updateSuccess ? (
              progress
            ) : file ? (
              <div className="flex flex-col">
                <span>{file ? file.name.toString() : null}</span>
                <button
                  onClick={() => startUpdate()}
                  className="self-start w-full mx-auto mt-2 text-sm font-semibold btn-primary button-primary-theme">
                  {get_i18n('fwUpgradeNow')}
                </button>
              </div>
            ) : (
              buttons
            )}
          </div>
        </div>
      </Collapsible>
    )
  } else {
    return (
      <Collapsible title="Firmware">
        <div className="flex flex-col p-8 text-center">
          {/* <img className="object-contain w-1/2 mx-auto" src={SensorImage}/> */}
          <span className="mt-2 font-semibold text-gray-600">{get_i18n('checkFirmware')}</span>
        </div>
      </Collapsible>
    )
  }
}
