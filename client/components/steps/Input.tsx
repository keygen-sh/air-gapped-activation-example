export default function({ licenseKey, onChange, onSubmit }) {
  return (
    <>
      <h1>
        Enter your license key
      </h1>
      <p>
        Please input your license key to begin.
      </p>
      <form onSubmit={onSubmit}>
        <input name='key' type='text' value={licenseKey} onChange={onChange} autoFocus required />
        <button type='submit' autoFocus>
          Continue
        </button>
      </form>
    </>
  )
}
