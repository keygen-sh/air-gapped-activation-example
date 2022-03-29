import { TailSpin } from 'react-loader-spinner'
import { useEffect } from 'react'

export default function({ accountId, licenseKey, machineFingerprint, onSuccess, onError }) {
  useEffect(() => {
    const res = fetch(`https://api.keygen.sh/v1/accounts/${accountId}/licenses/${encodeURIComponent(licenseKey)}/actions/validate`, {
      method: 'POST',
      headers: {
        authorization: `License ${licenseKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        meta: {
          scope: { fingerprint: machineFingerprint },
        }
      }),
    })

    res.then(r => r.json())
      .then(({ meta, data, errors }) => {
        if (errors) {
          const err = new Error(errors.map(e => `${e.code ?? ''} ${e.title}: ${e.detail}`)[0])

          onError(err)

          return
        }

        onSuccess({ meta, data })
      })
      .catch(onError)
  }, [])

  return (
    <>
      <TailSpin color='#00f' />
      <p>
        Validating license...
      </p>
    </>
  )
}
