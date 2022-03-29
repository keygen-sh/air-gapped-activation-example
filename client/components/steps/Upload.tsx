import { FileDrop } from 'react-file-drop'
import { useRef } from 'react'

export default function({ licenseFile, onDrop, onChange, onSubmit }) {
  const fileInputRef = useRef(null)

  const handleChange = event => onDrop(event.currentTarget.files)
  const handleClick = () => fileInputRef.current.click()

  return (
    <>
      <h1>
        Upload a license file
      </h1>
      <p>
        You can obtain a license file by visiting <code>http://localhost:5678</code> on a mobile device
        and scanning the QR code from the previous step.
      </p>
      <FileDrop onDrop={onDrop} onTargetClick={handleClick}>
        <input
          onChange={handleChange}
          ref={fileInputRef}
          type='file'
        />

        Drag and drop a <code>.lic</code> license file here or click to select (or input manually below)
      </FileDrop>
      <form onSubmit={onSubmit}>
        <textarea value={licenseFile} onChange={onChange} autoFocus required />
        <button type='submit' autoFocus>
          Continue
        </button>
      </form>
      <p>
        <small>
          The license file should begin with <code>-----BEGIN MACHINE FILE-----</code> and end with <code>-----END MACHINE FILE-----</code>.
          Please ensure your license file is correctly formatted.
        </small>
      </p>
    </>
  )
}
