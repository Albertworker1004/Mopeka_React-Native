import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { connect } from 'react-redux'
import classNames from 'classnames'
import FadeLoader from 'react-spinners/FadeLoader'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { showToast } from '../store/reducers/toaster/reducers'
import { ble, get_i18n, i18n } from '../../lib'
import BrandLogo from '../../../www/img/mopekaproducts500x251.png'

const Login = props => {
  const history = useHistory()
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: get_i18n('signIn'),
      },
    })
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!busy) {
      console.log(`attemping to login with ${email}`)
      setBusy(true)
      const res = await ble.user.Login(email.trim(), password)
      if (res.ok) {
        props.showToast({ type: 'info', message: `You've been logged in` })
        history.push('/')
      } else if (res.shouldConfirm) {
        history.push('/register/confirm')
        console.log('NEED TO CONFIRM EMAIL')
        // navigate to confirm email page passing email as prop
      } else if (res.invalid) {
        console.log('EMAIL/PASSWORD INVALID')
      }
      setBusy(false)
    }
  }

  const startForgotPassword = async () => {
    if (!busy) {
      setBusy(true)
      await ble.user.doForgotPasswordSequence(email)
      setBusy(false)
    }
  }

  const buttonClases = classNames('btn-primary button-primary-theme disabled:opacity-50', {
    'opacity-50': busy,
  })

  return (
    <form className="flex flex-col p-5" onSubmit={handleSubmit}>
      <div className="absolute" style={{ left: 'calc(50% - 30px)', top: 'calc(50% - 30px)' }}>
        <FadeLoader loading={busy} />
      </div>
      <img className="object-contain" src={BrandLogo} />
      <h3 className="text-3xl font-semibold text-center text-gray-900">{get_i18n('signIn')}</h3>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="email">
          {get_i18n('email')}
        </label>
        <input
          tabIndex={1}
          placeholder="johnsmith@email.com"
          autoCapitalize="none"
          defaultValue={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="email"
          id="email"
        />
      </div>
      <div className="mb-10">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="password">
          {get_i18n('password')}
        </label>
        <input
          tabIndex={2}
          placeholder="********"
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="password"
          id="password"
        />
        <a onClick={startForgotPassword} className="float-right text-xs text-gray-600">
          {get_i18n('forgotPasswordPrompt')}
        </a>
      </div>
      <button disabled={!email || !password} tabIndex={3} type="submit" className={buttonClases}>
        {get_i18n('signIn')}
      </button>
      <Link to="/register" className="py-2 mt-2 text-lg font-semibold text-center text-gray-900 underline">
        {get_i18n('register')}
      </Link>
    </form>
  )
}

const mapStateToProps = (state: RootState) => {
  return {}
}

const mapDispatch = { setOption, showToast }

export default connect(mapStateToProps, mapDispatch)(Login)
