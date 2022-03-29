import { TailSpin } from 'react-loader-spinner'
import { eddsa as EdDSA } from 'elliptic'
import * as crypto from 'crypto-browserify'
import { useEffect } from 'react'

const verify = async (key: string, msg: string, sig: string): Promise<boolean> => {
  const ed25519 = new EdDSA('ed25519')
  const verifyKey = ed25519.keyFromPublic(key)
  const msgHex = Buffer.from(`machine/${msg}`).toString('hex')
  const sigHex = Buffer.from(sig, 'base64').toString('hex')

  return verifyKey.verify(msgHex, sigHex)
}

const decrypt = async (secret: string, ciphertext: string, iv: string, tag: string): Promise<string> => {
  const digest = crypto.createHash('sha256').update(secret).digest()
  const aes = crypto.createDecipheriv('aes-256-gcm', digest, Buffer.from(iv, 'base64'))

  aes.setAuthTag(Buffer.from(tag, 'base64'))
  aes.setAAD(Buffer.from(''))

  let plaintext = aes.update(Buffer.from(ciphertext, 'base64'), null, 'utf8')
  plaintext += aes.final('utf8')

  return plaintext
}

export default function({ publicKey, machineFingerprint, licenseKey, licenseFile, onResult, onError }) {
  useEffect(() => {
    const encodedPayload = licenseFile.replace(/-----(?:BEGIN|END) MACHINE FILE-----\n?/g, '')
    const decodedPayload = Buffer.from(encodedPayload, 'base64').toString()
    const data = JSON.parse(decodedPayload)

    const { enc, sig, alg } = data
    if (alg !== 'aes-256-gcm+ed25519') {
      onError(`License file algorithm is not supported.`)

      return
    }

    verify(publicKey, enc, sig)
      .then(ok => {
        if (!ok) {
          onError('License file verification failed')

          return null
        }

        const [ciphertext, iv, tag] = enc.split('.')

        return decrypt(licenseKey + machineFingerprint, ciphertext, iv, tag)
      })
      .catch(e => {
        console.error(e)

        onError('License file decryption failed')

        return null
      })
      .then(plaintext => {
        if (plaintext == null) {
          return null
        }

        const { meta, data, included } = JSON.parse(plaintext)
        const { issued, expiry } = meta
        if (new Date(issued).getTime() > Date.now() ||
            new Date(expiry).getTime() < Date.now()) {
          onError(`License file has expired.`)

          return null
        }

        onResult({
          meta,
          data,
          included,
        })
      })
      .catch(e => {
        console.error(e)

        onError('License file is invalid')
      })
  })

  return (
    <>
      <TailSpin color='#00f' />
      <p>Verifying...</p>
    </>
  )
}
