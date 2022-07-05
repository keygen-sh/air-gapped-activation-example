import 'webrtc-adapter'

import Permission from './steps/Permission'
import Scan from './steps/Scan'
import Validate from './steps/Validate'
import Activate from './steps/Activate'
import Checkout from './steps/Checkout'
import { useState } from 'react'

const {
  KEYGEN_ACCOUNT_ID = 'demo',
} = process.env

if (!KEYGEN_ACCOUNT_ID) {
  throw new Error('Environment var KEYGEN_ACCOUNT_ID is not set')
}

enum EStep {
  None = 0,
  Permission,
  Scan,
  Validate,
  Activate,
  Checkout,
  Result,
  Error,
}

export default function() {
  const [step, setStep] = useState(EStep.Permission)
  const [machineFingerprint, setMachineFingerprint] = useState('')
  const [machineId, setMachineId] = useState('')
  const [licenseFile, setLicenseFile] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [licenseId, setLicenseId] = useState('')
  const [error, setError] = useState('')

  switch (step) {
    case EStep.Permission: {
      const handleSuccess = () => setStep(EStep.Scan)
      const handleError = err => {
        setError(err.message)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Permission onSuccess={handleSuccess} onError={handleError} />
        </main>
      )
    }
    /**
     * First up, we scan the QR code displayed on our air-gapped client. This QR code
     *   will contain a license key and machine fingerprint.
     */
    case EStep.Scan: {
      const handleScan = code => {
        const payload = Buffer.from(code, 'base64').toString()
        const data = JSON.parse(payload)

        setMachineFingerprint(data.fingerprint)
        setLicenseKey(data.key)
        setStep(EStep.Validate)
      }

      const handleError = err => {
        setError(err.message)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Scan onScan={handleScan} onError={handleError} />
        </main>
      )
    }
    /**
     * Next, we'll validate the license key via the API.
     */
    case EStep.Validate: {
      const handleSuccess = ({ meta, data }) => {
        setLicenseId(data.id)

        switch (meta.code) {
          case 'FINGERPRINT_SCOPE_MISMATCH':
          case 'NO_MACHINES':
          case 'NO_MACHINE':
            setStep(EStep.Activate)

            break
          case 'VALID':
            setStep(EStep.Checkout)

            break
          default:
            setError(meta.detail)
            setStep(EStep.Error)
        }
      }

      const handleError = err => {
        setError(err.message)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Validate
            accountId={KEYGEN_ACCOUNT_ID}
            licenseKey={licenseKey}
            machineFingerprint={machineFingerprint}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </main>
      )
    }
    /**
     * After that, we'll attempt to activate the machine fingerprint if
     *   it's not already activated.
     */
    case EStep.Activate: {
      const handleSuccess = ({ data }) => {
        setMachineId(data.id)
        setStep(EStep.Checkout)
      }

      const handleError = err => {
        setError(err.message)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Activate
            accountId={KEYGEN_ACCOUNT_ID}
            licenseKey={licenseKey}
            licenseId={licenseId}
            machineFingerprint={machineFingerprint}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </main>
      )
    }
    /**
     * Lastly, we'll checkout the machine. This will generate a "license file"
     *   that we'll pass to our air-gapped client.
     */
    case EStep.Checkout: {
      const handleSuccess = ({ data }) => {
        setLicenseFile(data.attributes.certificate)

        if (!machineId) {
          setMachineId(data.relationships.machine.data.id)
        }

        setStep(EStep.Result)
      }

      const handleError = err => {
        setError(err.message)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Checkout
            accountId={KEYGEN_ACCOUNT_ID}
            licenseKey={licenseKey}
            machineFingerprint={machineFingerprint}
            machineId={machineId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </main>
      )
    }
    /**
     * All done. We'll display our license file and also provide an option to download
     *   it. The end-user should upload the license file via the air-gapped client.
     */
    case EStep.Result: {
      const handleDownload = event => {
        const blob = new Blob([licenseFile], { type: 'text/plain' })
        const element = document.createElement('a')

        element.href = URL.createObjectURL(blob)
        element.download = `${machineId}.lic`

        element.click()
      }

      const handleCopy = event => {
        navigator.clipboard.writeText(licenseFile)
      }

      return (
        <main>
          <h1>Almost done...</h1>
          <p>
            Your license is activated. Please copy the license file below and transfer it to the air-gapped client.
          </p>
          <pre>
            <code>{licenseFile}</code>
          </pre>
          <button type='button' onClick={handleDownload}>
            Download
          </button>
          <button type='button' onClick={handleCopy}>
            Copy
          </button>
          <p>
            <small>
              You can distribute the encrypted license file from this device to the air-gapped client via email, USB flash drive, dongle, etc.
            </small>
          </p>
        </main>
      )
    }
    /**
     * Fatal errors.
     */
    case EStep.Error: {
      return (
        <main>
          <h1>An error occurred</h1>
          <p>{error}</p>
        </main>
      )
    }
    /**
     * Shouldn't ever happen.
     */
    default: {
      return (
        <main>
          <p>
            Nothing to see here.
            <a onClick={() => setStep(EStep.Permission)}>
              Go back.
            </a>
          </p>
        </main>
      )
    }
  }
}
