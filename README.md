# Air-gapped Activation Example
This is an example client/server implementation of license activation for
air-gapped (offline) machines using a mobile device to perform the activation
request. This type of activation is not limited to server-side applications,
it can also for example be used for desktop and on-premise software.

> **This example application is not 100% production-ready**, but it should
> get you 90% of the way there. You may need to add additional logging,
> error handling, as well as a similar system for machine deactivation.

![image](https://user-images.githubusercontent.com/6979737/35715082-03a35cfc-0796-11e8-93a5-7013d77f0ea5.png)

## Running the example

If you don't already have one, you can generate an RSA keypair using
the commands below:

#### Private key
```bash
openssl genrsa -out priv.pem 2048
```

#### Public key
```bash
openssl rsa -in priv.pem -out pub.pem -outform PEM -pubout
```

Once you've created a keypair, or if you already have one, configure
a few environment variables:
```bash
# RSA private key, 512-bit or higher (don't share this with anyone!)
export RSA_PRIVATE_KEY=$(printf %b \
  '-----BEGIN RSA PRIVATE KEY-----\n' \
  'MIIBPAIBAAJBAKGB3pm05k4P3qMSDaVHo5WHFVBH+PMzQT2xTqK6pwxnBphwVhmp\n' \
  # …
  'mYvFqfj3Y9/+DMypt/le5NLYjAlJTL5kslAn3wufoeI=\n' \
  '-----END RSA PRIVATE KEY-----')

# RSA public key, 512-bit or higher (this will be used on the client)
export RSA_PUBLIC_KEY=$(printf %b \
  '-----BEGIN PUBLIC KEY-----\n' \
  'zdL8BgMFM7p7+FGEGuH1I0KBaMcB/RZZSUu4yTBMu0pJw2EWzr3CrOOiXQI3+6bA\n' \
  # …
  'efK41Ml6OwZB3tchqGmpuAsCEwEAaQ==\n' \
  '-----END PUBLIC KEY-----')

# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):
```
yarn
```

Then start the server:
```
yarn run start-server
```

Open a new terminal tab in the same directory and start the client:
```
yarn run start-client
```

## Configuring an air-gapped policy

Visit [your dashboard](https://app.keygen.sh/policies) and create a new
policy with the following attributes:

```javascript
{
  requireFingerprintScope: true,
  protected: true,
  strict: true
}
```

You can leave all other attributes to their defaults, but feel free to
modify them if needed for your particular licensing model, e.g. add
a `maxMachines` limit, set it to `floating`, etc.

## Creating an air-gapped license

Visit [your dashboard](https://app.keygen.sh/licenses) and create a new
license which implements your air-gapped policy. You'll need the license
key later on during activation, so keep it handy.

## Testing the server

To access the activation server from a mobile device, create an [`ngrok`](https://ngrok.com)
tunnel for the server:
```
ngrok http 8080
```

Then visit the resulting `ngrok` HTTPS-enabled tunnel URL on your mobile
device.

## Testing the client

Visit the following url: http://localhost:8888. Follow the instructions,
using your mobile device to scan the initial QR code. In this example,
the client respresents your application. You may perform the client
operations while disconnected from the internet.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
