import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { showToast } from '../store/reducers/toaster/reducers'
import { ble, get_i18n, i18n } from '../../lib'
import { ApiSensor } from '../../lib/mopekaUser'
import { useHistory } from 'react-router-dom'

type AccountProps = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps> & {}

const Account = (props: AccountProps) => {
  const history = useHistory()
  const [busy, setBusy] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const ref = useRef()

  // mount
  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: get_i18n('account'),
      },
    })

    refreshSensors(true)

    const cachedRef = ref.current as Element
    const observer = new IntersectionObserver(
      ([e]) => {
        setIsSticky(e.intersectionRatio < 0.55)
      },
      { threshold: [0.25, 0.5, 0.75, 1] }
    )

    observer.observe(cachedRef)

    // unmount
    return function () {
      observer.unobserve(cachedRef)
    }
  }, [history.location])

  const itemClicked = (e, key) => {
    e.stopPropagation()
    ble.user.accountSensorToggle(key)
  }

  const itemDelete = (e, key) => {
    e.stopPropagation()
    ble.user.deleteSensor(key)
  }

  const logout = () => {
    ble.user.doLogout()
    props.showToast({ type: 'info', message: 'Logged out' })
    props.push('/')
  }

  const refreshSensors = async (silent = false) => {
    if (!busy) {
      setBusy(true)
      await ble.user.refreshAccountSensors()
      if (!silent) {
        props.showToast({ type: 'info', message: 'Account sensors refreshed' })
      }
      setBusy(false)
    }
  }

  if (!props.session) {
    return null
  }

  const sensors = Object.entries(props.accountSensors).map(([key, value]) => {
    const s = value as ApiSensor

    const isLocal = props.sensors.hasOwnProperty(key)

    return (
      <div
        key={key}
        className="flex justify-between px-6 py-3 mt-1 border rounded first:mt-0"
        onClick={e => itemClicked(e, key)}>
        <div className="flex flex-col justify-center">
          {isLocal ? (
            <FontAwesomeIcon icon={['fas', 'map-marker-alt']} size="2x" className="text-gray-500" />
          ) : (
            <FontAwesomeIcon icon={['fas', 'cloud']} size="2x" className="text-gray-500" />
          )}
        </div>
        <div className="flex flex-col">
          <h3>{s.name}</h3>
          <span className="text-sm text-gray-600">{s.address}</span>
        </div>
        <div className="flex flex-col justify-center" onClick={e => itemDelete(e, key)}>
          <FontAwesomeIcon icon={['fas', 'times-circle']} size="lg" className="text-red-500" />
        </div>
      </div>
    )
  })

  const refreshIconClasses = classNames('text-gray-700 ml-1', {
    'fa-spin': busy,
  })

  const classes = classNames('self-end mb-3 transition-all', {
    'rounded bg-white shadow py-2 px-3 fixed': isSticky,
  })

  return (
    <div className="flex flex-col p-6">
      <div className="sticky flex flex-col" style={{ top: '-5px' }} ref={ref}>
        <div className="flex justify-between mb-10">
          <div className="flex flex-col">
            <h1 className="text-2xl leading-tight text-gray-900">{get_i18n('accountSensor')}</h1>
            <span className="text-sm leading-none text-gray-700">{props.session.idToken.payload.email}</span>
          </div>
          <a className="btn-secondary button-secondary-theme" onClick={() => logout()}>
            {get_i18n('signOut')}
          </a>
        </div>
        <span className={classes} style={{ top: '60px' }} onClick={() => refreshSensors()}>
          {get_i18n('refresh')} <FontAwesomeIcon icon={['fas', 'sync-alt']} size="lg" className={refreshIconClasses} />
        </span>
      </div>
      <div className="flex flex-col mb-24">{sensors}</div>
      <div className="fixed bottom-0 left-0 flex flex-col items-center pt-4 pb-8 bg-white">
        <div className="text-center">
          <span className="text-xs">
            <FontAwesomeIcon icon={['fas', 'map-marker-alt']} size="lg" className="mr-1 text-gray-500" />
            {get_i18n('localAccount')}
          </span>
          <span className="ml-2 text-xs">
            <FontAwesomeIcon icon={['fas', 'cloud']} size="lg" className="mr-1 text-gray-500" />
            {get_i18n('accountOnly')}
          </span>
        </div>
        <p className="w-3/4 text-xs text-center text-gray-600">{get_i18n('accountSensorFooter')}</p>
      </div>
    </div>
  )
}

const mapStateToProps = (state: RootState, props) => {
  return {
    session: state.user.session,
    accountSensors: state.user.sensors,
    sensors: state.sensors.sensors,
    ...props,
  }
}

function mapDispatchToProps(dispatch) {
  const actions = {
    setOption: bindActionCreators(setOption, dispatch),
    push: bindActionCreators(push, dispatch),
    showToast: bindActionCreators(showToast, dispatch),
  }
  return actions
}

export default connect(mapStateToProps, mapDispatchToProps)(Account)
