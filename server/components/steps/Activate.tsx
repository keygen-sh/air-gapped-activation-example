import { TailSpin } from 'react-loader-spinner'
import { useEffect } from 'react'

export default function({ accountId, licenseId, licenseKey, machineFingerprint, onSuccess, onError }) {
  useEffect(() => {
    const res = fetch(`https://api.keygen.sh/v1/accounts/${accountId}/machines`, {
      method: 'POST',
      headers: {
        authorization: `License ${licenseKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'machines',
          relationships: {
            license: {
              data: { type: 'licenses', id: licenseId },
            },
          },
          attributes: {
            fingerprint: machineFingerprint,
          },
        }
      }),
    })

    res.then(r => r.json())
      .then(({ data, errors }) => {
        if (errors) {
          const err = new Error(errors.map(e => `${e.code ?? ''} ${e.title}: ${e.detail}`)[0])

          onError(err)

          return
        }

        onSuccess({ data })
      })
      .catch(onError)
  }, [])

  return (
    <>
      <TailSpin color='#00f' />
      <p>
        Activating license...
      </p>
    </>
  )
}
