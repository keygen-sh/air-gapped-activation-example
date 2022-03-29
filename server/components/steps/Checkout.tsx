import { TailSpin } from 'react-loader-spinner'
import { useEffect } from 'react'

export default function({ accountId, machineId, machineFingerprint, licenseKey, onSuccess, onError }) {
  useEffect(() => {
    const res = fetch(`https://api.keygen.sh/v1/accounts/${accountId}/machines/${encodeURIComponent(machineId || machineFingerprint)}/actions/check-out`, {
      method: 'POST',
      headers: {
        authorization: `License ${licenseKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        meta: {
          include: ['license'],
          encrypt: true,
        },
      })
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
        Generating license file...
      </p>
    </>
  )
}
