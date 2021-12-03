import React, { useEffect, useCallback, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { RootState } from '../store/reducers'
import { setOptionThunk } from '../store/reducers/options/reducers'
import { showToast } from '../store/reducers/toaster/reducers'
import BrandLogo from '../../../www/img/mopekaproducts500x251.png'
import { ble, get_i18n, i18n } from '../../lib'

import ToggleSwitch from '../components/ToggleSwitch'
import { utils } from '../../lib/utils'

const Options = props => {
  const dispatch = useDispatch()
  const [tapCount, setTapCount] = useState(0)

  useEffect(() => {
    props.setOptionThunk({
      name: 'title',
      val: {
        main: get_i18n('options'),
      },
    })
  }, [])

  useEffect(() => {
    if (tapCount === 6) {
      ble.startDemo()
    }
  }, [tapCount])

  const onToggleStateChange = (name, val) => {
    props.setOptionThunk({
      name,
      val,
    })
  }

  const forgetAll = useCallback(async () => {
    const didForget = await ble.forgetAll()
    if (didForget) {
      dispatch(showToast({ type: 'success', message: 'All Sensors Removed' }))
    }
  }, [])

  const logoTapHandler = () => {
    setTapCount(n => n + 1)
  }

  return (
    <div className="flex flex-col p-5">
      <img onClick={logoTapHandler} className="object-contain" src={BrandLogo} />
      <div className="flex flex-col w-full mt-8">
        <a
          onClick={() => window.open(utils.getShopLink(), '_blank', 'location=true')}
          className="btn-primary button-primary-theme">
          {get_i18n('buy_sensors')}
        </a>
        <a onClick={() => window.open(HELP_URL, '_system')} className="mt-5 btn-primary button-secondary-theme">
          {get_i18n('help_page')}
        </a>
      </div>
      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{get_i18n('tank_settings')}</h3>
        <div className="flex items-center justify-between mb-5">
          {app_brand != 'lippert' && (
            <div className="w-8 mr-1 text-center">
              <FontAwesomeIcon icon={['fas', 'bell']} size="lg" className="text-gray-500" />
            </div>
          )}
          <span className="mr-auto text-gray-900">{get_i18n('notifications')}</span>
          <span className="mr-1 text-sm font-semibold">{props.notifications ? 'On' : 'Off'}</span>
          <ToggleSwitch
            theme={app_brand}
            enabled={props.notifications}
            name="notifications"
            onStateChange={onToggleStateChange}
          />
        </div>
        <div className="flex items-center justify-between mb-5">
          {app_brand != 'lippert' && (
            <div className="w-8 mr-1 text-center">
              <FontAwesomeIcon icon={['fas', 'cloud-upload-alt']} size="lg" className="text-gray-500" />
            </div>
          )}
          <span className="mr-auto text-gray-900">{get_i18n('upload_data')}</span>
          <span className="mr-1 text-sm font-semibold">{props.uploadSensorData ? 'On' : 'Off'}</span>
          <ToggleSwitch
            theme={app_brand}
            enabled={props.uploadSensorData}
            name="uploadSensorData"
            onStateChange={onToggleStateChange}
          />
        </div>
        <div className="flex items-center justify-between mb-5">
          {app_brand != 'lippert' && (
            <div className="w-8 mr-1 text-center">
              <FontAwesomeIcon icon={['fas', 'search']} size="lg" className="text-gray-500" />
            </div>
          )}
          <span className="mr-auto text-gray-900">{get_i18n('enable_filter')}</span>
          <span className="mr-1 text-sm font-semibold">{props.searchFilter ? 'On' : 'Off'}</span>
          <ToggleSwitch
            theme={app_brand}
            enabled={props.searchFilter}
            name="searchFilter"
            onStateChange={onToggleStateChange}
          />
        </div>
        <div className="flex items-center justify-between mb-5">
          {app_brand != 'lippert' && (
            <div className="w-8 mr-1 text-center">
              <FontAwesomeIcon icon={['fas', 'th-list']} size="lg" className="text-gray-500" />
            </div>
          )}
          {/* TODO: add i18n */}
          <span className="mr-auto text-gray-900">{get_i18n('groupSensors')}</span>
          <span className="mr-1 text-sm font-semibold">{props.groupSensors ? 'On' : 'Off'}</span>
          <ToggleSwitch
            theme={app_brand}
            enabled={props.groupSensors}
            name="groupSensors"
            onStateChange={onToggleStateChange}
          />
        </div>
        <div className="flex items-center justify-between mb-5">
          {app_brand != 'lippert' && (
            <div className="w-8 mr-1 text-center">
              <FontAwesomeIcon icon={['fas', 'sort']} size="lg" className="text-gray-500" />
            </div>
          )}
          <span className="mr-auto text-gray-900">{get_i18n('sort_preferences')}</span>
          <div className="relative">
            <select
              onChange={e => onToggleStateChange('sortPreferences', e.target.value)}
              value={props.sortPreferences}
              className="block w-full px-4 py-2 pr-8 leading-tight text-gray-700 bg-white border border-gray-200 rounded outline-none appearance-none dropdown-shadow-theme focus:border-secondary">
              <option value="name">{get_i18n('name').capitalize()}</option>
              <option value="level">{get_i18n('level').capitalize()}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
              <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full mt-6 mb-2">
        <a className="py-2 text-lg font-semibold text-center button-warning-theme" onClick={forgetAll}>
          {get_i18n('forget_all')}
        </a>
      </div>
      <span className="mt-auto text-xs text-center text-gray-500">
        Version {APP_VERSION} ({navigator.language})
      </span>
    </div>
  )
}

const mapStateToProps = (state: RootState) => {
  return {
    notifications: state.options.notifications,
    uploadSensorData: state.options.uploadSensorData,
    searchFilter: state.options.searchFilter,
    sortPreferences: state.options.sortPreferences,
    groupSensors: state.options.groupSensors,
  }
}

const mapDispatch = { setOptionThunk }

export default connect(mapStateToProps, mapDispatch)(Options)
