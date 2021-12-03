import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { HashRouter as Router, Route, Switch, useLocation } from 'react-router-dom'
import semver from 'semver'
import Nav from './components/Nav'
import Toaster from './components/toaster'
import useLocalStorage from './components/useLocalStorage'
import PrivateRoute from './PrivateRoute'
import Account from './screens/Account'
import ConfirmEmail from './screens/ConfirmEmail'
import ErrorBoundary from './screens/ErrorBoundary'
import Gateway from './screens/Gateway'
// import Diagnostic from './screens/Diagnostic'
import Login from './screens/Login'
import NearbySensors from './screens/NearbySensors'
import Options from './screens/Options'
import Plot from './screens/Plot'
import Register from './screens/Register'
import RegisterSensor from './screens/RegisterSensor'
import SensorDemo from './screens/SensorDemo'
import SensorDetails from './screens/SensorDetails'
import SensorList from './screens/SensorList'
import SensorOptions from './screens/SensorOptions'

const pageVariants = {
  initial: {
    opacity: 0,
    x: '-100%',
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '100%',
  },
}

const slideUpVariants = {
  initial: {
    opacity: 0,
    y: '100vh',
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: '100vh',
  },
}

const pageTransitions = {
  transition: 'linear',
  duration: 0.3,
}

const instantTransitions = {
  transition: 'linear',
  duration: 0,
}

const slideUpTransitions = {
  transition: 'linear',
  duration: 0.25,
}

const TransitionPage = props => {
  return (
    <motion.div
      className="page"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={props.skip ? instantTransitions : pageTransitions}>
      {props.children}
    </motion.div>
  )
}

const SlideUp = props => {
  return (
    <motion.div
      className="page"
      initial="initial"
      animate="in"
      exit="out"
      variants={slideUpVariants}
      transition={slideUpTransitions}>
      {props.children}
    </motion.div>
  )
}

const App = () => {
  const location = useLocation()
  // These localstorage variables get overwritten by a config file that is pulled down from a lambda endpoint
  // this allows us to change the message, link, and cooldown between messages without having to push an app update
  const [availableVersion] = useLocalStorage('availableVersion', '0.0.0')

  const [promoLastView, setPromoLastView] = useLocalStorage('promoLastViewed', 0)
  const [promoCooldown, setPromoCooldown] = useLocalStorage('promoCooldown', 1000 * 60 * 60 * 24 * 7)
  const [promoMessage, setPromoMessage] = useLocalStorage('promoMessage', '')
  const [promoLink, setPromoLink] = useLocalStorage('promoLink', '')
  const [isPromoOpen, setIsPromoOpen] = useState(false)

  const [alertLastView, setAlertLastView] = useLocalStorage('alertLastViewed', 0)
  const [alertCooldown, setAlertCooldown] = useLocalStorage('alertCooldown', 1000 * 60 * 60 * 24 * 7)
  const [alertMessage, setAlertMessage] = useLocalStorage('alertMessage', '')
  const [alertLink, setAlertLink] = useLocalStorage('alertLink', '')
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const [versionLastView, setVersionLastView] = useLocalStorage('versionLastViewed', 0)
  const [versionCooldown, setVersionCooldown] = useLocalStorage('versionCooldown', 1000 * 60 * 60 * 24 * 2)
  const [versionMessage, setVersionMessage] = useLocalStorage('versionMessage', '')
  const [versionLink, setVersionLink] = useLocalStorage('versionLink', '')
  const [isVersionOpen, setIsVersionOpen] = useState(false)

  useEffect(() => {
    const hasTimePastSince = (lastSeen, time) => {
      let now = Date.now()
      let last = lastSeen
      let dt = now - last
      return dt >= 0 && dt > time
    }

    setIsPromoOpen(hasTimePastSince(promoLastView, promoCooldown) && promoMessage)
    setIsAlertOpen(hasTimePastSince(alertLastView, alertCooldown) && alertMessage)

    if (semver.gt(availableVersion, APP_VERSION.replace('_DBG', ''))) {
      setIsVersionOpen(hasTimePastSince(versionLastView, versionCooldown) && versionMessage)
    } else {
      setIsVersionOpen(false)
    }
  }, [
    promoLastView,
    promoMessage,
    promoCooldown,
    alertLastView,
    alertMessage,
    alertCooldown,
    versionLastView,
    versionMessage,
    versionCooldown,
    availableVersion,
  ])

  const closePromo = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsPromoOpen(false)
    setPromoLastView(Date.now())
  }

  const openPromoLink = e => {
    e.preventDefault()
    e.stopPropagation()
    if (promoLink) {
      setIsPromoOpen(false)
      setPromoLastView(Date.now())
      window.open(promoLink, '_blank', 'location=true')
    }
  }

  const closeAlert = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsAlertOpen(false)
    setAlertLastView(Date.now())
  }

  const openAlertLink = e => {
    e.preventDefault()
    e.stopPropagation()
    if (alertLink) {
      setIsAlertOpen(false)
      setAlertLastView(Date.now())
      window.open(alertLink, '_blank', 'location=true')
    }
  }

  const closeVersionAlert = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsVersionOpen(false)
    setVersionLastView(Date.now())
  }

  return (
    <Router>
      {/* <Nav /> */}
      {location.pathname !== '/sensor/A1:B2:C3' && <Nav />}

      <div className="absolute left-0 right-0 z-50 p-4 space-y-1">
        {isPromoOpen && promoMessage && (
          <div
            onClick={openPromoLink}
            className="relative px-4 py-3 text-blue-700 bg-blue-100 border border-blue-400 rounded"
            role="alert">
            <strong className="font-bold">Promo</strong>
            <span className="block sm:inline">
              {promoMessage} {promoLink && <span className="text-blue-500">Tap to view!</span>}
            </span>
            <span onClick={closePromo} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="w-6 h-6 text-blue-500 fill-current"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        {isAlertOpen && alertMessage && (
          <div
            onClick={openAlertLink}
            className="relative px-4 py-3 text-blue-700 bg-blue-100 border border-blue-400 rounded"
            role="alert">
            <strong className="font-bold">Alert</strong>
            <span className="block sm:inline">
              {alertMessage} {alertLink && <span className="text-blue-500">Tap to view!</span>}
            </span>
            <span onClick={closeAlert} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="w-6 h-6 text-blue-500 fill-current"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        {isVersionOpen && versionMessage && (
          <div className="relative px-4 py-3 text-blue-700 bg-blue-100 border border-blue-400 rounded" role="alert">
            <strong className="font-bold">New Update</strong>
            <span className="block sm:inline">{versionMessage}</span>
            <span onClick={closeVersionAlert} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="w-6 h-6 text-blue-500 fill-current"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* <div className={`relative w-full w-screen mt-13`}> */}
      <div className={`relative w-full w-screen ${location.pathname == '/sensor/A1:B2:C3' ? '' : 'mt-13'}`}>
        <ErrorBoundary>
          <AnimatePresence>
            <Switch location={location} key={location.pathname}>
              <Route exact path="/options">
                <TransitionPage>
                  <Options />
                </TransitionPage>
              </Route>
              {/* <Route exact path="/options/diagnostic">
                  <TransitionPage>
                    <Diagnostic/>
                  </TransitionPage>
                </Route> */}
              <PrivateRoute exact path="/account">
                <TransitionPage>
                  <Account />
                </TransitionPage>
              </PrivateRoute>
              <Route exact path="/login">
                <TransitionPage>
                  <Login />
                </TransitionPage>
              </Route>
              <Route exact path="/register/confirm">
                <TransitionPage>
                  <ConfirmEmail />
                </TransitionPage>
              </Route>
              <Route exact path="/register">
                <TransitionPage>
                  <Register />
                </TransitionPage>
              </Route>
              <Route exact path="/gateway/:id">
                <TransitionPage>
                  <Gateway />
                </TransitionPage>
              </Route>
              <Route exact path="/sensor/A1\:B2\:C3">
                <TransitionPage skip={true}>
                  <SensorDemo />
                </TransitionPage>
              </Route>
              <Route exact path="/sensor/:id">
                <TransitionPage skip={true}>
                  <SensorDetails />
                </TransitionPage>
              </Route>
              <Route exact path="/sensor/:id/options">
                <TransitionPage>
                  <SensorOptions />
                </TransitionPage>
              </Route>
              <Route exact path="/sensor/:id/register">
                <TransitionPage>
                  <RegisterSensor />
                </TransitionPage>
              </Route>
              <Route exact path="/sensor/:id/plot">
                <TransitionPage skip={true}>
                  <Plot />
                </TransitionPage>
              </Route>
              <Route exact path="/nearby">
                <SlideUp>
                  <NearbySensors />
                </SlideUp>
              </Route>
              <Route path="/">
                <TransitionPage>
                  <SensorList />
                </TransitionPage>
              </Route>
            </Switch>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
      <Toaster />
    </Router>
  )
}

export default App
