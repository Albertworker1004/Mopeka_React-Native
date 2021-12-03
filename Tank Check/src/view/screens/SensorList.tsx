import React, { useEffect, useState, Component } from 'react'
import { bindActionCreators } from '@reduxjs/toolkit'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { push } from 'connected-react-router'
import BarLoader from 'react-spinners/BarLoader'
import ScaleLoader from 'react-spinners/ScaleLoader'
import classNames from 'classnames'
import { css } from '@emotion/core'
import _ from 'lodash'

import { RootState } from '../store/reducers'
import { setSelectedSensor } from '../store/reducers/sensors/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { ble, get_i18n, i18n } from '../../lib'
import { Sensor } from '../../lib/sensors/sensor'
import { TankCheck } from '../../lib/sensors/tankcheck'

import LoadingImage from '../../../www/img/bottlecheck_device.png'

import SwipeableList from '../components/SwipeableList/SwipeableList'
import SensorListItem from '../components/SensorListItem'
import SwipeableListItem from '../components/SwipeableList/SwipeableListItem'
import BrandLogo from '../../../www/img/mopekaproducts500x251.png'
import SensorImage from '../../../www/img/sensor.png'
import AddNearbyButton from '../components/widgets/AddNearbyButton'
import { createMarkupFromString } from '..'
import { Link } from 'react-router-dom'
import { clearPlotData } from '../store/reducers/plot/reducers'
import { clearFirmwareInfo } from '../store/reducers/sensors/firmware/reducers'
import { CollapsibleList } from '../components/Collapsibles/CollapsibleList'
import CollapsibleSensorGroup from '../components/Collapsibles/CollapsibleSensorGroup'

const override = css`
  display: block
  margin: 10px auto
  border-color: red
`

type SensorListState = {
  searchFilterText: string
  logoTapCount: number
}

type SensorListProps = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>

class SensorList extends Component<SensorListProps, SensorListState> {
  constructor(props: SensorListProps) {
    super(props)

    this.state = {
      searchFilterText: '',
      logoTapCount: 0,
    }
  }

  componentDidMount() {
    this.props.setOption({
      name: 'title',
      val: {
        main: get_i18n('title'),
      },
    })
    ble.disconnectFromSensor().then(() => {
      this.props.clearFirmwareInfo()
      this.props.setSelectedSensor(null)
    }) // disconnect from anything if we haven't
    this.props.clearPlotData()
  }

  clearSearchFilter() {
    this.setState({ searchFilterText: '' })
  }

  onFilterTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ searchFilterText: e.target.value })
  }

  logoTapHandler() {
    this.setState({ logoTapCount: this.state.logoTapCount + 1 })
    if (this.state.logoTapCount == 4) {
      this.props.push('/nearby')
    }
  }

  render() {
    const props = this.props
    const state = this.state
    const comparer = props.sortPreferences == 'name' ? nameComparer : levelComparer

    const filteredSensors = Object.values(props.sensors).filter(
      s => s.name.toLowerCase().includes(state.searchFilterText.toLowerCase()) || state.searchFilterText.length < 2
    )

    let renderedSensors = null

    if (props.groupSensors) {
      const groupedSensors = _.groupBy(filteredSensors, (x: TankCheck) => x.category)
      const mappedGroupedSensors = {}

      const groupHighlight = {}

      for (const [key, value] of Object.entries(groupedSensors)) {
        mappedGroupedSensors[key] = value.sort(comparer).map(s => {
          if (s.highlighted) {
            groupHighlight[key] = true
          }
          return (
            <SwipeableListItem
              className="border-b border-gray-300 first:border-t"
              key={s.shortAddress}
              onClick={() => ble.forget(s.shortAddress)}>
              <SensorListItem sensor={s} />
            </SwipeableListItem>
          )
        })
      }

      renderedSensors = (
        <CollapsibleList>
          {Object.entries(mappedGroupedSensors).map(([key, value]) => (
            <CollapsibleSensorGroup title={key} highlight={groupHighlight[key]}>
              <SwipeableList>{value}</SwipeableList>
            </CollapsibleSensorGroup>
          ))}
        </CollapsibleList>
      )
    } else {
      const sensors = Object.entries(props.sensors)
        .map(([key, value]) => value)
        .sort(comparer)
        .map(value => {
          const s = value as Sensor
          if (
            s.name.toLowerCase().includes(state.searchFilterText.toLowerCase()) ||
            state.searchFilterText.length < 2
          ) {
            return (
              <SwipeableListItem
                className="border-b border-gray-300 first:border-t"
                key={s.shortAddress}
                onClick={() => ble.forget(s.shortAddress)}>
                <SensorListItem sensor={s} />
              </SwipeableListItem>
            )
          }
          return null
        })

      renderedSensors = sensors
    }

    const ListFooter = (
      <>
        <div className="flex flex-col justify-center p-4 mt-auto">
          {!props.session && app_brand != 'bmpro' && app_brand != 'mttracker' && (
            <Link to="/register" className="text-xs text-center">
              <div dangerouslySetInnerHTML={createMarkupFromString(get_i18n('login_page_msg'))} />
            </Link>
          )}
          <div className="flex flex-col items-center mt-2">
            <img onClick={() => this.logoTapHandler()} className="w-6/12 h-full brand-logo" src={BrandLogo} />
            {app_brand == 'tankcheck' && (
              <span className="mt-4 text-xs">© 2020 Mopeka Products LLC. All rights reserved.</span>
            )}
          </div>
        </div>
        {/* Disabled for now. Activate by 5 taps on logo */}
        {/* <AddNearbyButton /> */}
      </>
    )

    // Rendering
    // Render case for more than 2 sensors
    if (Object.keys(props.sensors).length > 2 || (app_brand == 'lippert' && Object.keys(props.sensors).length > 0)) {
      return (
        <div className="flex flex-col" style={{ minHeight: '90vh' }}>
          {app_brand == 'lippert' ? (
            <div className="p-6">
              <div
                className={classNames('flex items-center justify-center mx-auto w-16 h-16 rounded-full relative', {
                  'mt-16': props.searchFilter,
                })}>
                <img src={LoadingImage} className="rounded-full" />
                <div className="pulsating-loader"></div>
                <div className="pulsating-loader-1"></div>
              </div>
            </div>
          ) : (
            <div className="fixed z-20 w-full">
              <BarLoader
                width={100}
                widthUnit="%"
                color="var(--color-secondary)"
                height={5}
                loading={props.scanActive}
              />
            </div>
          )}
          {!props.scanActive && (
            <a
              className="px-6 py-2 m-auto font-semibold text-white rounded-full bg-secondary"
              onClick={() => ble.startScan()}>
              {get_i18n('start_scan')}
            </a>
          )}
          {props.searchFilter && (
            <div className="fixed z-20 w-full mt-1 border-b border-gray-300">
              <input
                placeholder={get_i18n('filter_placeholder')}
                onChange={e => this.onFilterTextChange(e)}
                value={state.searchFilterText}
                className="w-full p-4 leading-tight appearance-none focus:outline-none"
                id="search"
                type="text"
              />
              <label
                onClick={() => this.clearSearchFilter()}
                className="absolute inset-y-0 right-0 flex items-center px-2 mr-3 text-gray-900">
                <FontAwesomeIcon icon={['fas', 'times']} size="lg" className="text-gray-500" />
              </label>
            </div>
          )}
          <div className={app_brand != 'lippert' ? (props.searchFilter ? 'mt-13' : 'mt-1') : ''}>{renderedSensors}</div>
          {ListFooter}
        </div>
      )
    } else if (Object.keys(props.sensors).length > 0 && app_brand != 'lippert') {
      // render case for sensor list with less than 2 sensors, but not empty
      return (
        <div className="flex flex-col" style={{ minHeight: '90vh' }}>
          {props.searchFilter && (
            <div className="absolute z-20 w-full border-b border-gray-300">
              <input
                placeholder="filter sensors..."
                onChange={e => this.onFilterTextChange(e)}
                value={state.searchFilterText}
                className="w-full p-4 leading-tight appearance-none focus:outline-none"
                id="search"
                type="text"
              />
              <label
                onClick={() => this.clearSearchFilter()}
                className="absolute inset-y-0 right-0 flex items-center px-2 mr-3 text-gray-900">
                <FontAwesomeIcon icon={['fas', 'times']} size="lg" className="text-gray-500" />
              </label>
            </div>
          )}
          <div className={`absolute w-full z-20 text-center bg-white ${props.searchFilter ? 'mt-15' : 'py-2'}`}>
            <ScaleLoader css={override} color="var(--color-secondary)" loading={props.scanActive} />
          </div>
          {!props.scanActive && (
            <a
              className="px-6 py-2 mx-auto mt-5 font-semibold text-white rounded-full bg-secondary"
              onClick={() => ble.startScan()}>
              {get_i18n('start_scan')}
            </a>
          )}
          <div className={props.searchFilter ? 'mt-28' : 'mt-16'}>{renderedSensors}</div>
          {ListFooter}
        </div>
      )
    } else {
      // render case for empty sensor list
      // Empty
      return app_brand == 'lippert' ? (
        <div className="flex flex-col p-6 text-center">
          {!props.scanActive ? (
            <a
              className="px-6 py-2 m-auto font-semibold text-white rounded-full bg-secondary"
              onClick={() => ble.startScan()}>
              {get_i18n('start_scan')}
            </a>
          ) : (
            <div className="relative flex items-center justify-center w-40 h-40 mx-auto rounded-full">
              <img src={LoadingImage} className="rounded-full" />
              <div className="pulsating-loader"></div>
              <div className="pulsating-loader-1"></div>
            </div>
          )}
          <span className="mt-6 -m-2 font-semibold text-center text-gray-900">{get_i18n('no_devices_message')}</span>
          <span
            dangerouslySetInnerHTML={createMarkupFromString(get_i18n('first_time_message1'))}
            className="mt-4 text-sm text-center text-gray-900"></span>
          <span
            dangerouslySetInnerHTML={createMarkupFromString(get_i18n('first_time_message2'))}
            className="my-5 text-sm text-center text-gray-900"></span>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-center p-4 mx-auto mt-auto">
            <div className="flex flex-col items-center mt-2">
              <img onClick={() => this.logoTapHandler()} className="w-6/12 h-full brand-logo" src={BrandLogo} />
            </div>
          </div>
          {/* Disabled for now. Activate by 5 taps on logo */}
          {/* <AddNearbyButton /> */}
        </div>
      ) : (
        <div className="flex flex-col p-6 text-center">
          <img className="object-contain w-2/3 mx-auto" src={SensorImage} />
          <span className="my-2 text-lg text-center text-gray-900">{get_i18n('no_devices_message')}</span>
          {!props.scanActive ? (
            <a
              className="px-6 py-2 m-auto font-semibold text-white rounded-full bg-secondary"
              onClick={() => ble.startScan()}>
              {get_i18n('start_scan')}
            </a>
          ) : (
            <ScaleLoader css={override} color="var(--color-secondary)" loading={props.scanActive} />
          )}
          <span
            dangerouslySetInnerHTML={createMarkupFromString(get_i18n('first_time_message1'))}
            className="mt-4 text-sm text-center text-gray-900"></span>
          <span
            dangerouslySetInnerHTML={createMarkupFromString(get_i18n('first_time_message2'))}
            className="my-5 mb-4 text-sm text-center text-gray-900"></span>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-center p-4 mx-auto mt-auto">
            <div className="flex flex-col items-center mt-2">
              <img onClick={() => this.logoTapHandler()} className="w-6/12 h-full brand-logo" src={BrandLogo} />
              {app_brand == 'tankcheck' && (
                <span className="mt-6 text-xs">© 2020 Mopeka Products LLC. All rights reserved.</span>
              )}
            </div>
          </div>
          {/* Disabled for now. Activate by 5 taps on logo */}
          {/* <AddNearbyButton /> */}
        </div>
      )
    }
  }
}

const nameComparer = (a, b) => {
  if (a.isGw) {
    return -1 // used to push gateways to the top
  } else if (b.isGw) {
    return 1 // used to push gateways to the top
  } else if (a.isNew) {
    return -1 // Keep in place if it is New
  } else if (b.isNew) {
    return 1
  }

  return a.name.localeCompare(b.name)
}

const levelComparer = (a, b) => {
  if (a.isGw) {
    return -1 // used to push gateways to the top
  } else if (b.isGw) {
    return 1 // used to push gateways to the top
  } else if (a.isNew) {
    return -1 // Keep in place if it is New
  } else if (b.isNew) {
    return 1
  }

  const tankA = a as TankCheck
  const tankB = b as TankCheck

  return tankB.levelPercent - tankA.levelPercent
}

const mapStateToProps = (state: RootState) => {
  return {
    sensors: state.sensors.sensors,
    scanActive: state.options.scanActive,
    searchFilter: state.options.searchFilter,
    groupSensors: state.options.groupSensors,
    sortPreferences: state.options.sortPreferences,
    session: state.user.session,
  }
}

function mapDispatchToProps(dispatch) {
  const actions = {
    setSelectedSensor: bindActionCreators(setSelectedSensor, dispatch),
    setOption: bindActionCreators(setOption, dispatch),
    clearPlotData: bindActionCreators(clearPlotData, dispatch),
    push: bindActionCreators(push, dispatch),
    clearFirmwareInfo: bindActionCreators(clearFirmwareInfo, dispatch),
  }
  return actions
}

export default connect(mapStateToProps, mapDispatchToProps)(SensorList)
