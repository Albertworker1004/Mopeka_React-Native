import { Route, Redirect } from 'react-router-dom'
import React from 'react'
import { connect } from 'react-redux'
import { RootState } from './store/reducers'
import { motion } from 'framer-motion'

const PrivateRoute = ({ isLoggedIn, ...props }) => {
  let userEmail = localStorage.getItem('userEmail')
  return isLoggedIn ? (
    <motion.div className="page" exit={{ opacity: 0 }} animate={{ opacity: 1 }} initial={{ opacity: 1 }}>
      <Route {...props} />
    </motion.div>
  ) : (
    <motion.div className="page" exit={{ opacity: 0 }} animate={{ opacity: 1 }} initial={{ opacity: 1 }}>
      <Redirect to={userEmail ? '/login' : '/register'} />
    </motion.div>
  )
}

function mapStateToProps(state: RootState) {
  return {
    isLoggedIn: state.user.session,
  }
}

export default connect(mapStateToProps)(PrivateRoute)
