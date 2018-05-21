import React, { Component } from 'react'
import { QRCode } from 'react-qr-svg'
import uuidv4 from 'uuid/v4'
import otplib from 'otplib/otplib-browser'
import styles from './Client.scss'

class Client extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    FAIL: 'FAIL',
    OK: 'OK'
  }

  constructor(props) {
    super(props)

    this.state = {
      fingerprint: this.getFingerprint(),
      totp: '',
      key: '',
      currentStep: 0,
      qrPayload: '',
      status: this.statuses.NOT_ATTEMPTED
    }
  }

  getFingerprint = () => {
    let fingerprint = null

    // Fingerprint the current device by storing a uuid in local storage. If
    // you're doing this within e.g. an Electron app, it might be a better
    // idea to use something like a hash of the device's MAC address, etc.
    try {
      fingerprint = localStorage.fingerprint
      if (!fingerprint) {
        fingerprint = localStorage.fingerprint = uuidv4()
      }
    } catch (e) {
      alert(`Failed to fingerprint device: ${e}`)
    }

    return fingerprint
  }

  handleLicenseKeyChange = event => {
    this.setState({ key: event.target.value })
  }

  handleLicenseKeySubmit = event => {
    event.preventDefault()

    const { currentStep, fingerprint, key } = this.state
    const qrPayload = JSON.stringify({
      fingerprint,
      key
    })

    this.setState({
      currentStep: currentStep + 1,
      qrPayload
    })
  }

  handleActivationCodeChange = event => {
    this.setState({ totp: event.target.value })
  }

  handleActivationCodeSubmit = event => {
    const { totp } = this.state
    if (totp == null) {
      return
    }

    const { currentStep } = this.state
    let ok = false
    try {
      ok = otplib.totp.check(totp.toString(), this.state.fingerprint)
    } catch (e) {
      alert(e)
    }

    this.setState({
      currentStep: currentStep + 1,
      status: ok ? this.statuses.OK : this.statuses.FAIL
    })
  }

  handleScanError = err => {
    alert(
      JSON.stringify(err, null, 2)
    )
  }

  handleGoToPrevStep = event => {
    event.preventDefault()

    this.setState({
      currentStep: Math.max(0, this.state.currentStep - 1)
    })
  }

  handleGoToNextStep = event => {
    event.preventDefault()

    this.setState({
      currentStep: this.state.currentStep + 1
    })
  }

  render() {
    const { currentStep } = this.state
    let content

    switch (currentStep) {
      case 0: {
        const { key } = this.state

        content = (
          <div>
            <p>
              Please enter your license key below to begin the activation process.
            </p>
            <form onSubmit={this.handleLicenseKeySubmit}>
              <input type='text' value={key} onChange={this.handleLicenseKeyChange} />
              <p>
                <small>Press enter to continue</small>
              </p>
            </form>
          </div>
        )

        break
      }
      case 1: {
        const { qrPayload, fingerprint } = this.state

        content = (
          <div>
            <p>
              Scan this QR code using the scanner on your mobile device.
            </p>
            <div className={styles.QRCode}>
              <QRCode value={qrPayload} bgColor='#f7f8fb' fgColor='#001331' />
              <small>
                {fingerprint}
              </small>
            </div>
            <button type='button' onClick={this.handleGoToNextStep}>
              Continue
            </button>
          </div>
        )

        break
      }
      case 2: {
        const { totp } = this.state

        content = (
          <div>
            <p>
              Input the 6-digit activation code displayed on your mobile device.
            </p>
            <form onSubmit={this.handleActivationCodeSubmit}>
              <input type='number' value={totp} onChange={this.handleActivationCodeChange} />
              <p>
                <small>Press enter to continue</small>
              </p>
            </form>
          </div>
        )

        break
      }
      case 3: {
        const { status } = this.state
        let button = null

        if (status !== this.statuses.OK) {
          button = (
            <button type='button' onClick={this.handleGoToPrevStep}>
              Back
            </button>
          )
        }

        content = (
          <div>
            <p>
              {status === this.statuses.OK
                ? 'Machine has successfully been activated!'
                : 'Failed to activate machine.'}
            </p>
            {button}
          </div>
        )

        break
      }
    }

    return (
      <div className={styles.Client}>
        <main>
          <h1>
            Air-gapped Activation Client
          </h1>
          {content}
        </main>
      </div>
    )
  }
}

export default Client