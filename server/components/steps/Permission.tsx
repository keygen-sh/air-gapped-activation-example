import { TailSpin } from 'react-loader-spinner'
import { useMemo } from 'react'

export default function({ onSuccess, onError }) {
  const media = useMemo(
    () => navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }),
    [],
  )

  media.then(onSuccess).catch(onError)

  return (
    <>
      <TailSpin color='#00f' />
    </>
  )
}
