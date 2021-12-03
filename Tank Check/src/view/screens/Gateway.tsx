import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import PulseLoader from 'react-spinners/PulseLoader'
import { ble, get_i18n, show_help } from '../../lib'
import { Gateway as Bridge } from '../../lib/sensors/gateway'
import { utils } from '../../lib/utils'
import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'

type GatewayProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> & {
    sensor: Bridge
  }

type GatewayState = {
  [key: string]: string | number | boolean
  wifiName?: string
  password?: string
  passwordEnabled?: boolean
  updateRate?: number
  oldRate?: number
  connectedSSID: string
}

declare let WifiWizard2

class Gateway extends Component<GatewayProps, GatewayState> {
  static getDerivedStateFromProps(props, state: GatewayState) {
    const bridge = props.sensor as Bridge
    if (bridge.connectState === 'connected' && !state.didSet) {
      // TODO: mirror these in state, we are displaying them
      // TODO: test writing of new names/update rate, back out and look again

      const wifiName = bridge.pubsub.wap_ssid.pendingRead ? '...' : bridge.pubsub.wap_ssid?.value?.toString()

      return {
        wifiName: wifiName || state.connectedSSID,
        updateRate: bridge.pubsub.updateRate.pendingRead ? '-1' : bridge.pubsub.updateRate.value,
        oldRate: bridge.pubsub.updateRate.pendingRead ? '-1' : bridge.pubsub.updateRate.value,
        didSet: true,
      }
    }
    return null
  }

  state: GatewayState = {
    wifiName: '',
    updateRate: -1,
    password: '!~m@#@!~@#4!~!a@#@1#!~', // if this default fake password isn't changed then it won't attempt to update the password if none is set. otherwise check "no password"
    passwordEnabled: true,
    didSet: false,
    saveEnabled: true,
    connectedSSID: '',
  }

  constructor(props: GatewayProps) {
    super(props)
  }

  async componentDidMount() {
    this.props.setOption({
      name: 'title',
      val: {
        main: get_i18n('bridge'),
        subtitle: this.props.sensor.name,
      },
    })

    try {
      this.setState({ connectedSSID: await WifiWizard2.getConnectedSSID() })
    } catch (error) {
      utils.log("Couldn't grab device wifi SSID", error)
    }

    ble.connectToSensor(this.props.sensor)
  }

  componentWillUnmount() {
    ble.disconnectFromSensor(this.props.sensor)
  }

  handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  handleCheckChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      [e.target.name]: e.target.checked,
    })
  }

  setAsPhoneSSID() {
    this.setState({ wifiName: this.state.connectedSSID })
  }

  async saveSettings() {
    if (this.state.saveEnabled) {
      this.setState({ saveEnabled: false })
      await ble.saveGatewaySettings({
        shortAddress: this.props.sensor.shortAddress,
        wifiName: this.state.wifiName,
        password: this.state.passwordEnabled ? this.state.password : '',
        passwordEnabled: this.state.passwordEnabled,
        updateRate: this.state.updateRate != this.state.oldRate ? this.state.updateRate : null,
      })
      this.setState({ saveEnabled: true })
    }
  }

  render() {
    const bridge = this.props.sensor as Bridge
    if (bridge.connectState !== 'connected') {
      return (
        <div className="absolute w-1/2 text-center" style={{ transform: 'translateX(50%)', top: 'calc(50% - 30px)' }}>
          <PulseLoader loading={true} />
          <div>{bridge.statusMessage || 'Connecting'}</div>
        </div>
      )
    }

    const displayed = {
      wapState: bridge.pubsub.wap_state?.pendingRead ? 'Connected' : bridge.pubsub.wap_state.value?.toString(),
      ipAddress: bridge.pubsub.ip_address?.pendingRead ? '0.0.0.0' : bridge.pubsub.ip_address.value,
      pcbRevision: bridge.pubsub.pcb_revision?.pendingRead ? '?' : bridge.pubsub.pcb_revision.value,
      firmwareVersion: bridge.pubsub.firmware_version?.pendingRead ? '0' : bridge.pubsub.firmware_version.value,
      bdaStr: bridge.pubsub.bda_str?.pendingRead ? '0' : bridge.pubsub.bda_str.value,
    }

    return (
      <div className="flex flex-col p-5">
        <h2 className="mb-2 text-xl">{get_i18n('wifiSettings')}</h2>
        <div>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="wifiName">
              {get_i18n('wifiName')}
            </label>
            <input
              value={this.state.wifiName}
              onChange={e => this.handleChange(e)}
              maxLength={50}
              className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 border rounded shadow outline-none appearance-none focus:border-secondary"
              type="text"
              name="wifiName"
              id="wifiName"
            />
            {this.state.wifiName != this.state.connectedSSID && this.state.connectedSSID != '' && (
              <span onClick={() => this.setAsPhoneSSID()} className="text-blue-500 underline">
                Use the same network as your phone: {this.state.connectedSSID}
              </span>
            )}
          </div>
          <div className="mb-2">
            <label className="inline-flex items-center mt-3">
              <input
                onChange={e => this.handleCheckChange(e)}
                name="passwordEnabled"
                id="passwordEnabled"
                type="checkbox"
                className="w-5 h-5 text-gray-600 form-checkbox"
                checked={this.state.passwordEnabled}
              />
              <span className="ml-2 text-gray-700">Password Enabled</span>
            </label>
          </div>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-bold text-gray-900" htmlFor="password">
              Password
            </label>
            <input
              onChange={e => this.handleChange(e)}
              value={this.state.password}
              className="w-full px-4 py-3 pr-8 leading-tight text-gray-700 border rounded shadow outline-none appearance-none focus:border-secondary"
              type="password"
              name="password"
              id="password"
              disabled={!this.state.passwordEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            {/* <a className="px-4 py-2 btn-primary button-primary-theme" onClick={() => this.saveSettings()}>Save</a> */}
          </div>
        </div>
        <h2 className="mt-4 mb-2 text-xl">{get_i18n('cloudSettings')}</h2>
        <div className="mb-5">
          <div className="flex mb-2">
            <label className="block text-sm font-bold text-gray-900" htmlFor="updateRate">
              {get_i18n('updateRate')}
            </label>
            <FontAwesomeIcon
              onClick={() => show_help('updateRate')}
              icon={['fas', 'question-circle']}
              size="lg"
              className="m-auto ml-1 text-sm text-gray-500"
            />
          </div>
          <input
            defaultValue={this.state.updateRate}
            onChange={e => this.handleChange(e)}
            min={1}
            max={9999}
            pattern="[0-9]*"
            inputMode="decimal"
            type="number"
            className="w-1/2 px-4 py-3 pr-8 leading-tight text-gray-700 border rounded shadow outline-none appearance-none focus:border-secondary"
            name="updateRate"
            id="updateRate"
          />
        </div>
        <div>
          <a className="float-right px-4 py-2 btn-primary button-primary-theme" onClick={() => this.saveSettings()}>
            {get_i18n('save')}
          </a>
        </div>
        <h2 className="mb-2 text-xl">{get_i18n('bridgeInfo')}</h2>
        <span className="font-semibold">
          Wifi Status
          <span className="ml-2 font-normal">{displayed.wapState}</span>
        </span>
        <span className="font-semibold">
          Wifi Address
          <span className="ml-2 font-normal">{displayed.ipAddress}</span>
        </span>
        <span className="font-semibold">
          MAC Address
          <span className="ml-2 font-normal">{displayed.bdaStr}</span>
        </span>
        <span className="font-semibold">
          {get_i18n('fw_ver')}
          <span className="ml-2 font-normal">{displayed.firmwareVersion}</span>
        </span>
        <span className="font-semibold">
          PCB Revision
          <span className="ml-2 font-normal">{displayed.pcbRevision}</span>
        </span>
      </div>
    )
  }
}

const mapStateToProps = (state: RootState, props) => {
  const { id } = props.match.params
  return {
    sensor: state.sensors.sensors[id],
    ...props,
  }
}

function mapDispatchToProps(dispatch: any) {
  const actions = {
    setOption: (a: any) => dispatch(setOption(a)),
  }
  return actions
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Gateway))
