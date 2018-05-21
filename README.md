# Air-gapped Activation Example
This is an example client/server implementation of license activation for
air-gapped (offline) machines using a mobile device to perform the activation
request. This type of activation is not limited to server-side applications,
it can also for example be used for desktop and on-premise software.

> **This example application is not 100% production-ready**, but it should
> get you 90% of the way there. You may need to add additional logging,
> error handling, license activation persistence, as well as a similar
> system for machine deactivation.

![image](https://user-images.githubusercontent.com/6979737/35715082-03a35cfc-0796-11e8-93a5-7013d77f0ea5.png)

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
The server's frontend is backed by a simple activation API.

The client represents your air-gapped software application.

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
