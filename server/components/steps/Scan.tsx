import { ContinuousQrScanner } from 'react-webcam-qr-scanner.ts'

export default function({ onScan, onError }) {
  return (
    <ContinuousQrScanner
      onQrCode={onScan}
      onError={onError}
    />
  )
}
