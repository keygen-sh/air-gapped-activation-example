import React, { Component } from 'react'
import { QRCode } from 'react-qr-svg'
import QRReader from 'react-qr-reader'
import styles from './Server.scss'

class Server extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    VALID: 'VALID',
    FAIL: 'FAIL',
    OK: 'OK'
  }

  constructor(props) {
    super(props)

    this.state = {
      qrPayload: '',
      currentStep: 0,
      status: this.statuses.NOT_ATTEMPTED
    }
  }

  handleActivationCodeScan = async body => {
    if (!body) {
      return
    }

    this.setState({ status: this.statuses.IN_PROGRESS })

    const res = await fetch('/api/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    })

    const { meta, data, errors } = await res.json()
    if (errors) {
      return this.setState({ status: this.statuses.FAIL, res: { errors } })
    }

    this.setState({
      status: meta.valid ? this.statuses.OK : this.statuses.NOT_VALID,
      res: { meta, data }
    })

    if (meta.valid) {
      setTimeout(() => {
        const { currentStep } = this.state

        this.setState({
          currentStep: currentStep + 1,
          qrPayload: data // This contains our activation sig from our API
        })
      }, 2500)
    }
  }

  handleScanError = err => {
    console.error(err)
  }

  render() {
    const { currentStep } = this.state
    let content

    switch (currentStep) {
      case 0: {
        const { status, res } = this.state
        let message

        switch (status) {
          case this.statuses.NOT_ATTEMPTED:
            message = 'Waiting…'
            break
          case this.statuses.IN_PROGRESS:
            message = 'Activation in progress…'
            break
          case this.statuses.FAIL:
            message = `Failed to activate machine due to one or more errors: ${res.errors.map(e => e.detail).join(', ')}`
            break
          case this.statuses.NOT_VALID:
            message = `Failed to activate machine because the license ${res.meta.detail}.`
            break
          case this.statuses.OK:
            message = 'Activation successful! Loading…'
            break
        }

        content = (
          <div>
            <p>
              Use the scanner below to scan the QR code on the machine you want to activate.
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
      case 1: {
        const { qrPayload } = this.state

        content = (
          <div>
            <p>
              To finish the activation process, scan this QR code from the machine you are activating.
            </p>
            <div className={styles.QRCode}>
              <QRCode value={qrPayload} bgColor='#f7f8fb' fgColor='#001331' />
            </div>
          </div>
        )

        break
      }
    }

    return (
      <div className={styles.Server}>
        <main>
          <h1>
            Air-gapped Activation Server
          </h1>
          {content}
        </main>
      </div>
    )
  }
}

export default Server
