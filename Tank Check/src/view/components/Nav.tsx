import React, { useCallback, useEffect } from 'react'
import { connect } from 'react-redux'
import { Link, useHistory, withRouter } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import LogoImage from '../../../www/img/bottlecheck_logo.png'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { get_i18n, i18n } from '../../lib'
import { utils } from '../../lib/utils'

const Nav = props => {
  const history = useHistory()

  useEffect(() => {
    utils.log(`Current screen: ${JSON.stringify(history.location)}`)
  }, [history.location.pathname])

  // Some dummy elements that are hidden to take up space
  let leftButton = (
    <div className="w-10 p-2 opacity-0">
      <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
    </div>
  )
  let rightButton = (
    <div className="w-10 p-2 opacity-0">
      <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
    </div>
  )

  const goBack = useCallback(() => {
    history.goBack()
  }, [history, history.location])

  const backButton = (
    <button className="w-10 p-2" onClick={goBack}>
      <FontAwesomeIcon icon={['fas', 'arrow-left']} size="lg" />
    </button>
  )

  const rootButton = (
    <Link className="w-10 p-2" to="/">
      <FontAwesomeIcon icon={['fas', 'arrow-left']} size="lg" />
    </Link>
  )

  switch (true) {
    case /account/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /nearby/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /sensor\/.+\/options/.test(history.location.pathname):
      leftButton = backButton
      break
    case /sensor\/.+\/plot/.test(history.location.pathname):
      leftButton = backButton
      break
    case /sensor\/.+\/register/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /sensor/.test(history.location.pathname):
      leftButton = rootButton
      rightButton = (
        <Link className="w-10 p-2" to={`${history.location.pathname}/options`}>
          <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
        </Link>
      )
      break
    case /gateway/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /register|login/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /options\/diagnostic/.test(history.location.pathname):
      leftButton = rootButton
      break
    case /options/.test(history.location.pathname):
      leftButton = rootButton
      // rightButton = (
      //   <Link className="w-10 p-2" to={`/options/diagnostic`}>
      //     <FontAwesomeIcon icon={['fas', 'stethoscope']} size="lg" />
      //   </Link>
      // )
      break
    default:
      // failed other checks so assumes main screen
      leftButton = (
        <Link className="w-10 p-2" to="/account">
          <FontAwesomeIcon icon={['fas', 'user-circle']} size="lg" />
        </Link>
      )

      rightButton = (
        <Link className="w-10 p-2" to="/options">
          <FontAwesomeIcon icon={['fas', 'bars']} size="lg" />
        </Link>
      )
      break
  }

  return (
    <nav id="nav" className="fixed top-0 z-50 flex justify-between w-full w-screen px-2 py-3 shadow-md h-13 nav-theme">
      <div className="flex flex-col justify-center">{leftButton}</div>
      {app_brand == 'lippert' && props.title.main == get_i18n('title') ? (
        <img
          style={{
            width: '50%',
            margin: 'auto',
            maxHeight: '31px',
            maxWidth: '260px',
          }}
          src={LogoImage}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-tight">{props.title.main}</span>
          <span className="text-xs leading-tight">{props.title.subtitle}</span>
        </div>
      )}
      <div className="flex flex-col justify-center">{rightButton}</div>
    </nav>
  )
}

const mapStateToProps = (state: RootState, props) => {
  return {
    title: state.options.title,
    session: state.user.session,
    ...props,
  }
}

const mapDispatch = { setOption }

export default connect(mapStateToProps, mapDispatch)(Nav)
