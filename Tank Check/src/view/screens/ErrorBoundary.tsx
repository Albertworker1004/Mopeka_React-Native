import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import { rollbar } from '../../lib'
import { RootState } from '../store/reducers'

class ErrorBoundary extends Component<{ history; uuid }, { hasError: boolean }> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }

    const { history } = this.props

    history.listen((location, action) => {
      if (this.state.hasError) {
        this.setState({
          hasError: false,
        })
      }
    })
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    rollbar.critical(error, errorInfo)
    console.log(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center mt-32">
          <span>Something went wrong. Please provide this reference with your support request.</span>
          <span className="mb-4">Reference: {this.props.uuid}</span>
          <button className="btn-primary button-primary-theme" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    uuid: state.options.errorUUID,
  }
}

export default compose(withRouter, connect(mapStateToProps))(ErrorBoundary)
