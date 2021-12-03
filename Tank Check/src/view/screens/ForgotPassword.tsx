// import React, { useEffect, useState } from 'react'
// import { connect } from 'react-redux'
// import { push } from 'connected-react-router'
// import { Link } from 'react-router-dom'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import classNames from 'classnames'

// import { RootState } from '../store/reducers'
// import { setOption } from '../store/reducers/options'
// import { ble } from '../../lib'

// const ForgotPassword = (props) => {
//   const [email, setEmail] = useState(localStorage.getItem("userEmail") || '')
//   const [password, setPassword] = useState('')
//   const [busy, setBusy] = useState(false)

//   useEffect(() => {
//     props.setOption({
//       name: 'title',
//       val: {
//         main: 'Forgot Password'
//       }
//     })
//   }, [])

//   const login = async () => {
//     if (!busy) {
//       setBusy(true)
//       const res = await ble.user.Login(email.trim(), password)

//       setBusy(false)
//     }
//   }

//   const buttonClases = classNames('btn-primary button-primary-theme', {
//     'opacity-50': busy
//   })

//   return (
//     <div className="p-5 flex flex-col">
//       <FontAwesomeIcon icon={['fas', 'unlock-alt']} size="7x" className="text-gray-500" />
//       <h3 className="text-3xl text-center font-semibold text-gray-900">Forgot Password</h3>
//       <div className="mb-4">
//         <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="email">Email</label>
//         <input autoCapitalize="none" defaultValue={email} onChange={e => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-none" type="text" id="email"/>
//       </div>
//       <div className="mb-10">
//         <label className="text-sm font-bold text-gray-900 mb-2 block" htmlFor="password">Password</label>
//         <input onChange={e => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-none" type="password" id="password"/>
//         <a className="text-xs text-gray-600 float-right">Forgot your password?</a>
//       </div>
//       <a className={buttonClases} onClick={login}>Log In</a>
//       <Link to="/register" className="text-gray-900 text-center text-lg py-2 font-semibold mt-2">Register</Link>
//     </div>
//   )
// }

// const mapStateToProps = (state: RootState) => {
//   return {
//   }
// }

// const mapDispatch = { setOption, push }

// export default connect(mapStateToProps, mapDispatch)(ForgotPassword)
