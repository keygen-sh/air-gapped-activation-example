import React, { Component } from 'react'
import { QRCode } from 'react-qr-svg'
import QRReader from 'react-qr-reader'
import RSA from 'node-rsa'
import uuidv4 from 'uuid/v4'
import styles from './Client.scss'

// Don't forget to set this env var!
const { RSA_PUBLIC_KEY } = process.env
const rsa = new RSA(RSA_PUBLIC_KEY, 'public', { environment: 'browser' })

class Client extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    FAIL: 'FAIL',
    OK: 'OK'
  }

  constructor(props) {
    super(props)

    this.state = {
      activationCode: this.getActivationCode(),
      fingerprint: this.getFingerprint(),
      licenseKey: '',
      qrPayload: '',
      currentStep: 0,
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
    } catch(e) {
      console.error(e)
    }

    return fingerprint
  }

  getActivationCode = () => {
    return (Math.floor(Math.random() * 9e5) + 1e5).toString() // Random 6 digit code
  }

  handleLicenseKeyChange = event => {
    this.setState({ licenseKey: event.target.value })
  }

  handleLicenseKeySubmit = event => {
    event.preventDefault()

    const { currentStep, activationCode, fingerprint, licenseKey } = this.state
    const qrPayload = JSON.stringify({
      activationCode,
      fingerprint,
      licenseKey
    })

    this.setState({
      currentStep: currentStep + 1,
      qrPayload
    })
  }

  handleActivationSigScan = activationSig => {
    if (activationSig == null) {
      return
    }

    const { currentStep, activationCode } = this.state

    // Verify that the activation sig matches our activation code
    let ok = false
    try {
      ok = rsa.verify(activationCode, activationSig, 'utf8', 'hex')
    } catch(e) {}

    this.setState({
      currentStep: currentStep + 1,
      status: ok ? this.statuses.OK : this.statuses.FAIL
    })
  }

  handleScanError = err => {
    console.error(err)
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
        const { licenseKey } = this.state

        content = (
          <div>
            <p>
              Please enter your license key below to begin the activation process.
            </p>
            <form onSubmit={this.handleLicenseKeySubmit}>
              <input type='text' value={licenseKey} onChange={this.handleLicenseKeyChange} />
              <p>
                <small>Press enter to continue</small>
              </p>
            </form>
          </div>
        )

        break
      }
      case 1: {
        const { qrPayload, fingerprint, activationSig } = this.state

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
        content = (
          <div>
            <p>
              Using a webcam, scan the QR code displayed on your mobile device to finish activating this machine.
            </p>
            <div className={styles.QRReader}>
              <QRReader
                onScan={this.handleActivationSigScan}
                onError={this.handleScanError} />
            </div>
          </div>
        )

        break
      }
      case 3: {
        const { status } = this.state

        content = (
          <div>
            <p>
              {status === this.statuses.OK
                ? 'Machine has successfully been activated!'
                : 'Failed to activate machine.'}
            </p>
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