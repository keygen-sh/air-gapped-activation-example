import QrCode from 'react-qr-code'

export default function({ payload, onSubmit }) {
  return (
    <>
      <h1>
        Scan to activate
      </h1>
      <p>
        Please visit <code>http://localhost:5678</code> on a mobile device and scan the QR code below.
        Use <code>ngrok</code> to create a secure tunnel to localhost.
      </p>
      <QrCode value={payload} />
      <form onSubmit={onSubmit}>
        <button type='submit' autoFocus>
          Continue
        </button>
      </form>
      <p>
        <small>
          Click <strong>continue</strong> when you're ready to upload or input a license file.
        </small>
      </p>
    </>
  )
}
