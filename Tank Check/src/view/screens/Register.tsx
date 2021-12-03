import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import classNames from 'classnames'
import FadeLoader from 'react-spinners/FadeLoader'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import BrandLogo from '../../../www/img/mopekaproducts500x251.png'
import { ble, get_i18n, i18n } from '../../lib'

const Register = props => {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [emailsMatch, setEmailsMatch] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: get_i18n('register'),
      },
    })
  }, [])

  useEffect(() => {
    setEmailsMatch(email === emailConfirm)
  }, [email, emailConfirm])

  const register = async e => {
    e.preventDefault()
    if (!busy) {
      console.log(`attemping to register with ${email} using password ${password} and ${passwordConfirm}`)
      setBusy(true)
      const res = await ble.user.register(email.trim(), password, passwordConfirm)
      if (res.ok) {
        props.push('/')
      } else if (res.shouldConfirm) {
        props.push('/register/confirm')
      } else if (res.invalid) {
        console.log('invlid input')
      } else {
        console.log('Something went wrong while trying to register', email, password, passwordConfirm)
      }
      setBusy(false)
    }
  }

  const goToLogin = () => {
    localStorage.setItem('userEmail', email)
    props.push('/login')
  }

  const buttonClases = classNames('btn-primary button-primary-theme disabled:opacity-50', {
    'opacity-50': busy,
  })

  return (
    <form className="flex flex-col p-5" onSubmit={register}>
      <div className="absolute" style={{ left: 'calc(50% - 30px)', top: 'calc(50% - 30px)' }}>
        <FadeLoader loading={busy} />
      </div>
      <img className="object-contain" src={BrandLogo} />
      <h3 className="text-3xl font-semibold text-center text-gray-900">{get_i18n('register')}</h3>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="email">
          {get_i18n('email')}
        </label>
        <input
          tabIndex={1}
          placeholder="johnsmith@email.com"
          autoCapitalize="none"
          onChange={e => setEmail(e.target.value.trimEnd())}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="email"
          id="email"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="email">
          {get_i18n('confirmEmail')}
        </label>
        <input
          tabIndex={1}
          placeholder="johnsmith@email.com"
          autoCapitalize="none"
          onChange={e => setEmailConfirm(e.target.value.trimEnd())}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="emailConfirm"
          id="emailConfirm"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="password">
          {get_i18n('password')}
        </label>
        <input
          tabIndex={2}
          minLength={6}
          placeholder="********"
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="password"
          id="password"
        />
      </div>
      <div className="mb-10">
        <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="confirmPasword">
          {get_i18n('confirmPassword')}
        </label>
        <input
          tabIndex={3}
          minLength={6}
          placeholder="********"
          onChange={e => setPasswordConfirm(e.target.value)}
          className="w-full px-3 py-2 leading-tight text-gray-700 rounded outline-none appearance-none input-text-theme focus:border-secondary"
          type="password"
          id="confirmPasword"
        />
      </div>
      <button
        disabled={!email || !emailConfirm || !password || !passwordConfirm || !emailsMatch}
        type="submit"
        className={buttonClases}>
        {get_i18n('register')}
      </button>
      <div className="flex justify-center mt-2">
        <span className="mr-2 text-gray-900">{get_i18n('existingAccount')}</span>
        <span onClick={() => goToLogin()} className="font-semibold text-gray-900 underline">
          {get_i18n('signIn')}
        </span>
      </div>
    </form>
  )
}

const mapStateToProps = (state: RootState) => {
  return {}
}

const mapDispatch = { setOption, push }

export default connect(mapStateToProps, mapDispatch)(Register)
