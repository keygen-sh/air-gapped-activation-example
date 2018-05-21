// Don't forget to set these env vars!
const {
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  PORT = 8080
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

app.set('view engine', 'ejs')
app.set('views', __dirname)

// Serve static files from public server directory
app.use('/', express.static(path.join(__dirname, '../server')))

app.post('/api/activate', async (req, res) => {
  const { fingerprint, key } = req.body

  // Validate the provided license key within the scope of the current machine
  const validation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`
    },
    body: JSON.stringify({
      meta: {
        scope: { fingerprint },
        key
      }
    })
  })

  const { meta, data: license, errors } = await validation.json()
  if (errors) {
    return res.status(400).send({ errors })
  }

  // If our license is not valid for the current machine, attempt to activate it
  if (!meta.valid) {
    // See all constants at: https://keygen.sh/docs/api/#licenses-actions-validate-key-constants
    switch (meta.constant) {
      // Activate the license for the current machine if:
      //   1. it has associated machines but this machine isn't one of them
      //   2. it's only invalid because it has no machines associated with it yet
      case 'FINGERPRINT_SCOPE_MISMATCH': // #1
      case 'NO_MACHINES': // #2
      case 'NO_MACHINE': {
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
                  data: { type: 'licenses', id: license.id }
                }
              }
            }
          })
        })

        const { data: machine, errors: errs1 } = await activation.json()
        if (errs1) {
          return res.status(400).send({ errors: errs1 })
        }

        // Revalidate our license to get its newest state (since we added a new machine)
        const revalidation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`
          },
          body: JSON.stringify({
            meta: {
              scope: { fingerprint },
              key
            }
          })
        })

        const { meta: m, errors: errs2 } = await revalidation.json()
        if (errs2) {
          return res.status(400).send({ errors: errs2 })
        }

        // Replace our previous validation with the new state
        meta.constant = m.constant
        meta.detail = m.detail
        meta.valid = m.valid

        break
      }
      // Otherwise, respond with the reason the license is invalid
      default: {
        return res.send({ meta })
      }
    }
  }

  res.send({
    data: { fingerprint },
    meta
  })
})

process.on('unhandledRejection', err => {
  console.error(`Unhandled rejection: ${err}`, err.stack)
})

const server = app.listen(PORT, 'localhost', () => {
  const { address, port } = server.address()

  console.log(`Listening at http://${address}:${port}`)
})