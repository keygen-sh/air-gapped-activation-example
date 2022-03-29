import Input from './steps/Input'
import Scan from './steps/Scan'
import Upload from './steps/Upload'
import Verify from './steps/Verify'
import { useState } from 'react'

const {
  KEYGEN_VERIFY_KEY = 'e8601e48b69383ba520245fd07971e983d06d22c4257cfd82304601479cee788',
} = process.env

if (!KEYGEN_VERIFY_KEY) {
  throw new Error('Environment var KEYGEN_VERIFY_KEY is not set')
}

enum EStep {
  None = 0,
  Input,
  Scan,
  Upload,
  Verify,
  Result,
  Error,
}

export default function() {
  const [step, setStep] = useState(EStep.Input)
  const [machineFingerprint, _setMachineFingerprint] = useState(localStorage.getItem('guid'))
  const [licenseFile, setLicenseFile] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [license, setLicense] = useState(null)
  const [machine, setMachine] = useState(null)
  const [issuedAt, setIssuedAt] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [error, setError] = useState('')

  switch (step) {
    /**
     * The first step, prompting the air-gapped device for a license key.
     */
    case EStep.Input: {
      const handleChange = event => setLicenseKey(event.currentTarget.value)
      const handleSubmit = event => {
        event.preventDefault()

        if (!licenseKey) {
          return
        }

        setStep(EStep.Scan)
      }

      return (
        <main>
          <Input
            licenseKey={licenseKey}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </main>
      )
    }
    /**
     * Next up the QR code needs to be scanned from a mobile device using the
     *   activation portal (i.e. the server application). The QR code's dataset
     *   consists of the license key and the device's fingerprint. These values
     *   will be used to 1) validate the license key, and 2) perform a machine
     *   activation for the license. These actions will be performed on the
     *   air-gapped device's behalf, using the mobile device.
     */
    case EStep.Scan: {
      const data = JSON.stringify({ key: licenseKey, fingerprint: machineFingerprint })
      const payload = Buffer.from(data).toString('base64')

      const handleSubmit = event => {
        event.preventDefault()

        setStep(EStep.Upload)
      }

      return (
        <main>
          <Scan
            payload={payload}
            onSubmit={handleSubmit}
          />
        </main>
      )
    }
    /**
     * After the QR code is scanned via the portal, a license file will be
     *   displayed on the mobile phone. This file should be transferred to the
     *   air-gap device via email USB, or some other way. Once transferred,
     *   it will be uploaded on this step.
     */
    case EStep.Upload: {
      const handleChange = event => setLicenseFile(event.currentTarget.value)
      const handleSubmit = event => {
        event.preventDefault()

        if (!licenseFile) {
          return
        }

        if (!licenseFile.includes('-----BEGIN MACHINE FILE-----') ||
            !licenseFile.includes('-----END MACHINE FILE-----')) {
          alert(`License file is not formatted correctly.`)

          return
        }

        setStep(EStep.Verify)
      }

      const handleDrop = (files: FileList) => {
        const reader = new FileReader()

        reader.addEventListener('error', () => {
          setError(`Failed to read license file. Please try again.`)
          setStep(EStep.Error)
        })

        reader.addEventListener('load', () => {
          const content = reader.result as string

          setLicenseFile(content)
        })

        const [file] = files
        if (file) {
          reader.readAsText(file)
        }
      }

      return (
        <main>
          <Upload
            licenseFile={licenseFile}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onDrop={handleDrop}
          />
        </main>
      )
    }
    /**
     * After uploading the license file, we'll decode the license file and
     *   cryptographically verify its payload before using it.
     */
    case EStep.Verify: {
      const handleResult = ({ meta, data, included }) => {
        setMachine(data)
        setLicense(included?.find(i => i.type === 'licenses'))
        setIssuedAt(new Date(meta.issued))
        setExpiresAt(new Date(meta.expiry))
        setStep(EStep.Result)
      }

      const handleError = err => {
        setError(err)
        setStep(EStep.Error)
      }

      return (
        <main>
          <Verify
            publicKey={KEYGEN_VERIFY_KEY}
            licenseKey={licenseKey}
            licenseFile={licenseFile}
            machineFingerprint={machineFingerprint}
            onResult={handleResult}
            onError={handleError}
          />
        </main>
      )
    }
    /**
     * We're all done. We should now have a license and machine objects, as well
     *   as an expiry value that tells us if our license file has expired.
     */
    case EStep.Result: {
      return (
        <main>
          <h1>Activation complete</h1>
          <p>
            Your license has been activated!
          </p>
          <table>
            <thead>
              <tr>
                <th>License ID</th>
                <th>Machine ID</th>
                <th>Issued On</th>
                <th>Expires On</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{license.id.substring(0, 8)}</td>
                <td>{machine.id.substring(0, 8)}</td>
                <td>{issuedAt.toLocaleString('en-US', { timezone: 'UTC' })}</td>
                <td>{expiresAt.toLocaleString('en-US', { timezone: 'UTC' })}</td>
              </tr>
            </tbody>
          </table>
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
            <a onClick={() => setStep(EStep.Input)}>
              Go back.
            </a>
          </p>
        </main>
      )
    }
  }
}
