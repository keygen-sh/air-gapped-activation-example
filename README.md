# Air-gapped Activation Example
This is an example client/server implementation of license activation for
air-gapped (offline) machines using a mobile device to perform the activation
request. This type of activation is not limited to server-side applications,
it can also for example be used for desktop and on-premise software.

> **This example application is not 100% production-ready and only serves as an
> example implementation**, but it should get you 90% of the way there. You may
> need to also add additional logging, error handling, license activation persistence,
> as well as a similar system for machine deactivation.

![image](https://user-images.githubusercontent.com/6979737/35715082-03a35cfc-0796-11e8-93a5-7013d77f0ea5.png)

## Overview of Activation Flow

In general, the example setup requires a server to host the QR code scanner app. When your software is booted and it has not yet been activated, it will display a QR code which must be scanned from the mobile device to continue. The QR code has some data encoded into it such as the machine’s `fingerprint` (e.g. HDD ID, MAC address, etc.) and a secret key, which will be used to activate the machine for the current license from the mobile device (which has an internet connection and can communicate with the Keygen API).

After successful activation, the mobile device will reveal a timed 6-digit code (a [TOTP](https://en.wikipedia.org/wiki/Time-based_One-time_Password_algorithm) code which resets every 30 seconds) that is cryptographically signed using a random secret only kept in memory that was encoded into the QR code, which can be input on the air-gapped machine to complete the activation process. You may choose to do something else for that step, if the TOTP code does not meet your specific requirements.

After activation, you can store an activation flag somewhere in the machine’s environment/registry/cache (so they’re not prompted again on next software boot), and you can also do whatever needs to be done to prep it for another activation at a pre-defined interval e.g. store a `reactivation-required-at` timestamp in a registry, which is queried periodically to determine if a reactivation is needed, in which case this activation process is restarted.

_Note: since the local application does not have access to the Keygen API or the internet, since it’s air-gapped, it will validate a cryptographically signed 6-digit code (TOTP) at the end of the activation process to complete the activation._

## Running the example

First up, configure a few environment variables:

```bash
# Keygen product token for server-side use only (don't share this!)
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

Then start the client and server:

```
yarn start
```

The server represents your activation server, hosted on your infrastructure.
The server's frontend is backed by a simple activation API. The client
represents your air-gapped software application.

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

Upon successful activation, you will see a new machine resource created
in your Keygen account, and both the activated machine and mobile device
will let you know that the activation was a success.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
