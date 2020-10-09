import React, { Component } from 'react'
import { QRCode } from 'react-qr-svg'
import uuidv4 from 'uuid/v4'
import RSA from 'node-rsa'
import styles from './AirGappedDevice.css'

// Don't forget to set this env var!
const { KEYGEN_PUBLIC_KEY } = process.env
const rsa = new RSA(KEYGEN_PUBLIC_KEY, 'public', { environment: 'browser' })

class AirGappedDevice extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    FAIL: 'FAIL',
    OK: 'OK'
  }

  steps = {
    INPUT_LICENSE_KEY: 0,
    SCAN_QR_CODE: 1,
    INPUT_PROOF: 2,
  }

  constructor(props) {
    super(props)

    this.state = {
      status: this.statuses.NOT_ATTEMPTED,
      qrCodePayload: null,
      fingerprint: this.getFingerprint(),
      key: null,
      proof: null,
      step: 0,
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

    const { step, fingerprint, secret, key } = this.state
    const payload = JSON.stringify({
      fingerprint,
      secret,
      key
    })

    this.setState({
      qrCodePayload: btoa(payload),
      step: step + 1,
    })
  }

  handleActivationProofChange = event => {
    this.setState({ proof: event.target.value })
  }

  handleActivationProofSubmit = event => {
    event.preventDefault()

    const { step, proof, key, fingerprint } = this.state
    if (proof == null) {
      return
    }

    let ok = false
    try {
      // Extract dataset and signature from the activation proof string
      const [signingData, encodedSig] = proof.split('.')
      const [
        signingPrefix,
        encodedData,
      ] = signingData.split('/')
      if (signingPrefix !== 'proof') {
        throw new Error(`activation proof format is invalid`)
      }

      // Decode the data and ensure that the activation fingerprint matches our
      // current device's fingerprint (you can add additional checks here)
      const decodedData = atob(encodedData)
      const data = JSON.parse(decodedData)

      if (data.license.key !== key) {
        throw new Error(`license key does not match activation proof`)
      }

      if (data.machine.fingerprint !== fingerprint) {
        throw new Error(`device fingerprint does not match activation proof`)
      }

      // Cryptographically verify the activation proof
      ok = rsa.verify(`proof/${encodedData}`, encodedSig, 'utf8', 'base64')
    } catch (e) {
      alert(`Proof verification error: ${e.message}`)
    }

    this.setState({
      status: ok ? this.statuses.OK : this.statuses.FAIL,
      step: step + 1,
      proof,
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
      step: Math.max(0, this.state.step - 1)
    })
  }

  handleGoToNextStep = event => {
    event.preventDefault()

    this.setState({
      step: this.state.step + 1
    })
  }

  render() {
    const { step } = this.state
    let html = null

    switch (step) {
      case this.steps.INPUT_LICENSE_KEY: {
        const { key } = this.state

        html = (
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
      case this.steps.SCAN_QR_CODE: {
        const { qrCodePayload } = this.state

        html = (
          <div>
            <p>
              Scan this QR code using the Activation Portal's scanner on your mobile device.
            </p>
            <div className={styles.QRCode}>
              <QRCode value={qrCodePayload} bgColor='#f7f8fb' fgColor='#001331' />
            </div>
            <pre className={styles.QRCodeDataset}>
              <code>{qrCodePayload}</code>
            </pre>
            <button type='button' onClick={this.handleGoToNextStep}>
              Continue
            </button>
          </div>
        )

        break
      }
      case this.steps.INPUT_PROOF: {
        const { proof } = this.state

        html = (
          <div>
            <p>
              Input the activation proof displayed on your mobile device.
            </p>
            <form onSubmit={this.handleActivationProofSubmit}>
              <input type='text' value={proof} onChange={this.handleActivationProofChange} />
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

        html = (
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
      <div className={styles.AirGappedDevice}>
        <main>
          <h1>
            Air-gapped Client
          </h1>
          {html}
        </main>
      </div>
    )
  }
}

export default AirGappedDevice