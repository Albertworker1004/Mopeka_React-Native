import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import classNames from 'classnames'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { ble } from '../../lib'

const ConfirmEmail = props => {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEnabled, setConfirmEnabled] = useState(false)

  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: 'Email Confirmation',
      },
    })
  }, [])

  useEffect(() => {
    if (code.length == 6) {
      setConfirmEnabled(true)
    } else {
      setConfirmEnabled(false)
    }
  }, [code])

  const confirm = async () => {
    if (confirmEnabled) {
      setBusy(true)
      const res = await ble.user.confirmAccount(email, code)
      setBusy(false)
      if (res.ok) {
        props.push('/account')
      }
    }
  }

  const resend = async () => {
    if (!busy) {
      setBusy(true)
      ble.user.resendConfirmation(email)
      setBusy(false)
    }
  }

  const buttonClases = classNames('btn-primary button-primary-theme', {
    'opacity-50': !confirmEnabled,
  })

  return (
    <div className="p-5 flex flex-col text-center justify-center">
      <h1 className="text-3xl">Verify your email</h1>
      <p className="text-xs w-3/4 self-center">
        A code was sent to <span className="font-semibold">{email ? email : 'the email'}</span> used during the sign up
        process
      </p>
      <div>
        <input
          placeholder="000000"
          className="pl-2 self-center text-4xl text-center tracking-super w-56 my-16 appearance-none border-b border-gray-500"
          maxLength={6}
          onChange={e => setCode(e.target.value)}
          pattern="[0-9]*"
          inputMode="decimal"
          type="text"
        />
      </div>
      <a className={buttonClases} onClick={confirm}>
        Verify Email
      </a>
      <a onClick={resend} className="text-gray-900 text-center py-2 mt-2">
        Resend Verification Code
      </a>
    </div>
  )
}

const mapStateToProps = (state: RootState) => {
  return {}
}

const mapDispatch = { setOption, push }

export default connect(mapStateToProps, mapDispatch)(ConfirmEmail)
