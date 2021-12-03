import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import { setOption } from '../store/reducers/options/reducers'
import { showToast } from '../store/reducers/toaster/reducers'
import { ble } from '../../lib'

const RegisterSensor = props => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [rewards, setRewards] = useState('')
  const [promos, setPromos] = useState('1')

  useEffect(() => {
    props.setOption({
      name: 'title',
      val: {
        main: 'Register Sensor',
      },
    })
  }, [])

  const onFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value)
  }

  const onLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value)
  }

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const onRewardsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRewards(e.target.value)
  }

  const onPromosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPromos(e.target.value)
  }

  const register = async () => {
    const { id } = props.match.params
    await ble.registerSensor(id, firstName, lastName, email, rewards, promos)
    props.push(`/`)
    props.showToast({ type: 'info', message: 'Sensor Registered. Thank You' })
  }

  return (
    <div className="flex flex-col p-5">
      <div className="mb-5">
        <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="firstName">
          First Name
        </label>
        <input
          onChange={e => onFirstNameChange(e)}
          placeholder="John"
          className="shadow appearance-none border rounded w-full py-3 px-4 pr-8 text-gray-700 leading-tight outline-none focus:border-secondary"
          type="text"
          id="firstName"
        />
      </div>
      <div className="mb-5">
        <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="lastName">
          Last Name
        </label>
        <input
          onChange={e => onLastNameChange(e)}
          placeholder="Smith"
          className="shadow appearance-none border rounded w-full py-3 px-4 pr-8 text-gray-700 leading-tight outline-none focus:border-secondary"
          type="text"
          id="lastName"
        />
      </div>
      <div className="mb-5">
        <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="email">
          Email
        </label>
        <input
          onChange={e => onEmailChange(e)}
          placeholder="johnsmith@email.com"
          className="shadow appearance-none border rounded w-full py-3 px-4 pr-8 text-gray-700 leading-tight outline-none focus:border-secondary"
          type="text"
          id="email"
        />
      </div>
      <div className="mb-5">
        <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="aceRewards">
          ACE Rewards Number
        </label>
        <input
          onChange={e => onRewardsChange(e)}
          placeholder=""
          className="shadow appearance-none border rounded w-1/2 py-3 px-4 pr-8 text-gray-700 leading-tight outline-none focus:border-secondary"
          type="text"
          id="aceRewards"
        />
      </div>
      <div className="mb-5">
        <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="acePromo">
          Do you wish to receive promotions from Ace Hardware?
        </label>
        <div className="relative w-1/2">
          <select
            onChange={e => onPromosChange(e)}
            defaultValue="1"
            className="block appearance-none w-full bg-white shadow border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight outline-none focus:border-secondary">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      <a className="btn-primary button-primary-theme" onClick={() => register()}>
        Register Sensor
      </a>
    </div>
  )
}

const mapDispatch = { setOption, showToast, push }

export default withRouter(connect(null, mapDispatch)(RegisterSensor))
