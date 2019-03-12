import React, { Component } from 'react'
import QRReader from 'react-qr-reader'
import otplib from 'otplib/otplib-browser'
import styles from './Server.scss'

const TOTPSpinner = ({ timer }) =>
  <div className={styles.TOTPSpinner}>
    <svg viewBox='0 0 36 36'>
      <path d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831' />
      <path
        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
        stroke-dasharray={`${timer}, 100`}
      />
    </svg>
  </div>

const TOTPCode = ({ totp, timer }) =>
  <div className={styles.TOTP}>
    <div className={styles.TOTPCode}>
      {totp}
    </div>
    <TOTPSpinner timer={timer} />
  </div>

class Server extends Component {
  statuses = {
    NOT_ATTEMPTED: 'NOT_ATTEMPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    NOT_VALID: 'NOT_VALID',
    FAIL: 'FAIL',
    OK: 'OK'
  }

  constructor(props) {
    super(props)

    this.state = {
      fingerprint: '',
      totp: '',
      timer: 0,
      qrPayload: '',
      currentStep: 0,
      status: this.statuses.NOT_ATTEMPTED
    }

    // Update TOTP timer according to system clock
    setInterval(() => {
      const now = new Date()
      let sec = now.getSeconds() + (now.getMilliseconds() / 1000)
      if (sec > 30) {
        sec -= 30
      }

      this.setState({ timer: sec / 30 * 100 })
    }, 50)
  }

  generateTotpToken = secret => {
    const gen = () => {
      const totp = otplib.totp.generate(secret)

      this.setState({ totp })
    }

    // Regenerate the TOTP every 30 seconds according to system clock
    setInterval(() => {
      const now = new Date()
      const sec = now.getSeconds()
      if (sec !== 0 && sec !== 30) {
        return
      }

      gen()
    }, 500)

    return gen()
  }

  handleActivationCodeScan = async body => {
    if (!body) {
      return
    }

    this.setState({ status: this.statuses.IN_PROGRESS })

    const { secret } = JSON.parse(body)
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
      fingerprint: data && data.fingerprint,
      status: meta.valid ? this.statuses.OK : this.statuses.NOT_VALID,
      res: { meta, data }
    })

    if (meta.valid) {
      setTimeout(() => {
        const { currentStep } = this.state

        this.setState({ currentStep: currentStep + 1 })
        this.generateTotpToken(secret)
      }, 2500)
    }
  }

  handleScanError = err => {
    alert(
      JSON.stringify(err, null, 2)
    )
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
            message = `Failed to activate the machine due to one or more errors: ${res.errors.map(e => e.detail).join(', ')}`
            break
          case this.statuses.NOT_VALID:
            message = `Failed to activate the machine because the license key ${res.meta.detail}.`
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
        const { totp, timer } = this.state

        content = (
          <div>
            <p>
              To finish the activation process, press continue on the device you're activating and input the following activation code.
            </p>
            <TOTPCode totp={totp} timer={timer} />
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
