import React, { Component } from 'react'
import QRReader from 'react-qr-reader'
import styles from './ActivationPortal.css'

class ActivationPortal extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    NOT_VALID: 'NOT_VALID',
    FAIL: 'FAIL',
    OK: 'OK',
  }

  steps = {
    SCAN_QR_CODE: 0,
    INPUT_PROOF: 1,
  }

  constructor(props) {
    super(props)

    this.state = {
      status: this.statuses.NOT_ATTEMPTED,
      step: this.steps.SCAN_QR_CODE,
      res: {},
    }
  }

  handleActivationCodeScan = async qrCodePayload => {
    if (!qrCodePayload) {
      return
    }

    this.setState({ status: this.statuses.IN_PROGRESS })

    const body = atob(qrCodePayload)
    const res = await fetch(`/api/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body,
    })

    const data = await res.json()
    if (data.error) {
      return this.setState({ status: this.statuses.FAIL, res: data })
    }

    this.setState({
      status: data.validation.valid ? this.statuses.OK : this.statuses.NOT_VALID,
      res: data
    })

    if (data.validation.valid) {
      setTimeout(() => {
        const { step } = this.state

        this.setState({ step: step + 1 })
      }, 2500)
    }
  }

  handleScanError = err => {
    alert(
      `Scanner error: ${JSON.stringify(err, null, 2)}`
    )
  }

  render() {
    const { step } = this.state
    let html = null

    switch (step) {
      case this.steps.SCAN_QR_CODE: {
        const { status, res } = this.state
        let message = null

        switch (status) {
          case this.statuses.NOT_ATTEMPTED:
            message = 'Waiting…'
            break
          case this.statuses.IN_PROGRESS:
            message = 'Activation in progress…'
            break
          case this.statuses.FAIL:
            message = (
              <span>
                Failed to activate the machine due to an API error:
                <pre>
                  <code>{JSON.stringify(res.error, null, 2)}</code>
                </pre>
              </span>
            )
            break
          case this.statuses.NOT_VALID:
            message = `Failed to activate the machine because the license key ${res.validation.detail}.`
            break
          case this.statuses.OK:
            message = 'Activation successful! Please wait…'
            break
        }

        html = (
          <div>
            <p>
              Use the scanner below to scan the QR code displayed on the device you want to activate.
            </p>
            <div className={styles.QRReader}>
              {status === this.statuses.NOT_ATTEMPTED
                ? <QRReader onScan={this.handleActivationCodeScan} onError={this.handleScanError} />
                : null}
              <p>
                <small>{message}</small>
              </p>
            </div>
          </div>
        )

        break
      }
      case this.steps.INPUT_PROOF: {
        const { res } = this.state

        html = (
          <div>
            <p>
              To finish the activation process, press "continue" on the device you're activating and input the following activation proof:
            </p>
            <pre className={styles.ActivationProof}>
              <code>{res.activation.proof}</code>
            </pre>
          </div>
        )

        break
      }
    }

    return (
      <div className={styles.ActivationPortal}>
        <main>
          <h1>
            Activation Portal
          </h1>
          {html}
        </main>
      </div>
    )
  }
}

export default ActivationPortal
