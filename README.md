# Air-gapped Activation Example
This is an example client/server implementation of license activation for
air-gapped (offline) devices using a mobile device to perform the activation
request. This type of activation is not limited to server-side applications,
it can also for example be used for desktop and on-premise software.

> **This example application is not 100% production-ready and only serves as an
> example implementation**, but it should get you 90% of the way there. You may
> need to also add additional logging, error handling, license activation persistence,
> as well as a similar system for device deactivation.

![image](https://user-images.githubusercontent.com/6979737/35715082-03a35cfc-0796-11e8-93a5-7013d77f0ea5.png)

## Overview of Activation Flow

In general, the example setup requires a server to host the QR code scanner portal app. When your software is booted and it has not yet been activated, it will display a QR code which must be scanned from the mobile device to continue. The QR code has some data encoded into it such as the machine’s `fingerprint` (e.g. HDD ID, MAC address, etc.), which will be used to activate the machine for the current license from the mobile device (which has an internet connection and can communicate with the Keygen API).

After successful activation, the activation portal will display [an "activation proof"](https://keygen.sh/docs/api#machines-actions-generate-offline-proof) — a cryptographically signed payload that will be verified on the air-gapped device to complete the activation process. You can deliver the proof from the mobile device to the air-gapped device via email, USB flash drive, dongle, etc.

After activation, you can store an activation flag somewhere in the device's environment/registry/cache (so they’re not prompted again on next software boot), and you can also do whatever needs to be done to prep it for another activation at a pre-defined interval e.g. store a `reactivation-required-at` timestamp in a registry, which is queried periodically to determine if a reactivation is needed, in which case this activation process is restarted.

_Note: since the local application does not have access to the Keygen API or the internet, since it’s air-gapped, it will cryptographically verify an activation proof at the end of the activation process to complete the activation._

## Running the example

First up, configure a few environment variables:

```bash
# Keygen product token for server-side use only (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"

# Your Keygen account's public key (make sure it is *exact* - newlines and all)
export KEYGEN_PUBLIC_KEY=$(printf %b \
  '-----BEGIN PUBLIC KEY-----\n' \
  'zdL8BgMFM7p7+FGEGuH1I0KBaMcB/RZZSUu4yTBMu0pJw2EWzr3CrOOiXQI3+6bA\n' \
  # …
  'efK41Ml6OwZB3tchqGmpuAsCEwEAaQ==\n' \
  '-----END PUBLIC KEY-----')
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):

```
yarn
```

Then start the air-gapped device and the activation portal:

```
yarn start
```

The activation portal represents a small app used to perform the activation on
behalf of the air-gapped device. The portal will be hosted on your infrastructure.
The activation portal's frontend is backed by a simple activation API server.
The air-gapped device represents your air-gapped software application.

### Service ports

```
activation-portal: localhost:3000
air-gapped-device: localhost:4000
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

## Testing the activation portal

To access the activation portal from a mobile device, create an [`ngrok`](https://ngrok.com)
tunnel for the server:

```
ngrok http 3000
```

Then visit the resulting `ngrok` HTTPS-enabled tunnel URL on your mobile
device.

## Testing the air-gapped device

Visit the following URL: http://localhost:4000. Follow the instructions,
using your mobile device to scan the initial QR code. You may perform the
air-gapped device operations while disconnected from the internet.

Upon successful activation, you will see a new machine resource created
in your Keygen account, and both the activated machine and mobile device
will let you know that the activation was a success.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
