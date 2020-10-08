// Don't forget to set these env vars!
const {
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  PORT = 3000
} = process.env

const fetch = require('node-fetch')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const path = require('path')
const express = require('express')
const app = express()

app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(morgan('combined'))

// Serve static files from public server directory
app.use('/', express.static(path.join(__dirname, '../dist/activation-portal')))

async function validateLicenseKeyAndFingerprint(key, fingerprint) {
  const encodedKey = encodeURIComponent(key)
  const validation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/${encodedKey}/actions/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`
    },
    body: JSON.stringify({
      meta: {
        scope: { fingerprint },
      }
    })
  })

  const { data, meta, errors } = await validation.json()
  if (errors) {
    return { errors }
  }

  return {
    meta,
    data
  }
}

async function activateMachineForLicense(licenseId, fingerprint) {
  const activation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`
    },
    body: JSON.stringify({
      data: {
        type: 'machines',
        attributes: { fingerprint },
        relationships: {
          license: {
            data: { type: 'licenses', id: licenseId }
          }
        }
      }
    })
  })

  const { data, errors } = await activation.json()
  if (errors) {
    return { errors }
  }

  return {
    data
  }
}

async function generateOfflineProofForMachine(machineId) {
  const proof = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines/${machineId}/actions/generate-offline-proof`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`
    }
  })

  const { data, meta, errors } = await proof.json()
  if (errors) {
    return { errors }
  }

  return {
    meta,
    data
  }
}

function toErrorMessage(errors) {
  const [error] = errors

  return error
}

app.post('/api/activate', async (req, res) => {
  const { fingerprint, key } = req.body

  // Validate the provided license key within the scope of the current machine
  const validation = await validateLicenseKeyAndFingerprint(key, fingerprint)
  if (validation.errors) {
    console.error(`Error during validation: key=${key} fingerprint=${fingerprint} payload=${JSON.stringify({ validation })}`)

    return res.status(422).send({ error: toErrorMessage(validation.errors) })
  }

  // Exit early for certain validation codes (no use in activating for these codes)
  if (!validation.meta.valid) {
    const code = validation.meta.constant
    if (code === 'EXPIRED' || code === 'SUSPENDED') {
      console.warn(`Skipping activation because license key is invalid: code=${code} key=${key} fingerprint=${fingerprint}`, { validation })

      return res.status(422).send({ error: { title: 'Unprocessable Entity', detail: `activation failed because the license key ${validation.meta.detail}` } })
    }
  }

  // Activate the current machine fingerprint for the license
  const activation = await activateMachineForLicense(validation.data.id, fingerprint)
  if (activation.errors) {
    console.error(`Error during activation: key=${key} fingerprint=${fingerprint} payload=${JSON.stringify({ activation })}`)

    return res.status(422).send({ error: toErrorMessage(activation.errors) })
  }

  // Revalidate our license to get its newest state (since we added a new machine)
  const revalidation = await validateLicenseKeyAndFingerprint(key, fingerprint)
  if (revalidation.errors) {
    console.error(`Error during revalidation: key=${key} fingerprint=${fingerprint} payload=${JSON.stringify({ revalidation })}`)

    return res.status(422).send({ error: toErrorMessage(revalidation.errors) })
  }

  // Generate an offline activation proof
  const proof = await generateOfflineProofForMachine(activation.data.id)
  if (proof.errors) {
    console.error(`Error generating offline activation proof: key=${key} fingerprint=${fingerprint} payload=${JSON.stringify({ proof })}`)

    return res.status(422).send({ error: toErrorMessage(proof.errors) })
  }

  res.send({
    activation: proof.meta,
    validation: revalidation.meta,
  })
})

process.on('unhandledRejection', err => {
  console.error(`Unhandled rejection: ${err}`, err.stack)
})

const server = app.listen(PORT, 'localhost', () => {
  const { address, port } = server.address()

  console.log(`Listening at http://${address}:${port}`)
})