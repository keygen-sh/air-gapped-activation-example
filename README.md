# Air-gapped Activation Example

 > [!IMPORTANT] 
 > **Looking for a way to activate node-locked licenses offline, without human interaction?** Take a look at [Keygen Relay](https://github.com/keygen-sh/keygen-relay), a small on-premise licensing server we developed for distributing crytographically signed and encrypted license files to nodes on an air-gapped network.

This is an example client/server implementation for air-gapped license activation. Essentially, the client displays a QR code which is read by the server, and the server will perform an activation request on behalf of the air-gapped client. The server will [validate][validate], [activate][activate], and finally [check-out][check-out] a license file. Lastly, once the license file is distributed to the client, the client can cryptographically verify and decrypt the license file.

![image](https://user-images.githubusercontent.com/6979737/160709628-16e8231e-6510-454e-b188-d20f7c4ff9dc.png)

Here's a detailed outline of the entire air-gapped licensing flow:

1. The client will prompt for the end-user's license key.
1. The client will fingerprint the air-gapped device.
1. The client will generate a QR code containing the license key and fingerprint.
1. The end-user, using the server app, will scan the QR code and extract the license key and fingerprint.
1. The server will perform a license validation request for the license key, scoped to the fingerprint.
1. The server will activate the fingerprint when required.
1. The server will checkout a machine file, containing an encrypted license and machine object.
1. The end-user will download the machine `.lic` file and transfer it to the client.
1. The client will cryptographically verify the file using Ed25519.
1. The client will decrypt the file using AES-256-GCM.

**This example application is not 100% production-ready and only serves as an example implementation.**

## Running the example

First up, configure a few environment variables:

```bash
# Your Keygen account's Ed25519 verify key
export KEYGEN_VERIFY_KEY="e8601e48b69383ba520245fd07971e983d06d22c4257cfd82304601479cee788"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="1fddcec8-8dd3-4d8d-9b16-215cac0f9b52"
```

You can either run each line above within your terminal session before starting the app, or you can add the above contents to your `~/.bashrc` file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`][yarn]:

```
yarn
```

Then start the air-gapped client and the activation server:

```
yarn start
```

### Services

| Service    | Port   |                                                                                                   |
|:-----------|:-------|:--------------------------------------------------------------------------------------------------|
| **Client** | `1234` | Represents the air-gapped client. None of the client code requires an internet connection.        |
| **Server** | `5678` | Represents an activation portal. The server will communicate with Keygen on behalf of the client. |

## Testing the activation server

To access the activation server from a mobile device, create an [`ngrok`][ngrok] tunnel for the server:

```
ngrok http 5678
```

Then visit the resulting `ngrok` HTTPS-enabled tunnel URL on your mobile device.

## Testing the air-gapped client

Visit `http://localhost:1234` and follow the on-screen instructions. Use your mobile device to scan the QR code. You may perform the client operations while disconnected from the internet. Upon successful activation, you will see a new machine resource created in your Keygen account, and both the activated machine and mobile device will let you know that the activation was a success.

Looking at your account's [request logs][logs], you should see a license validation request, an activation request, and a check-out request.

## Questions?

Reach out at [support@keygen.sh][support] if you have any
questions or concerns!

[validate]: https://keygen.sh/docs/api/licenses/#licenses-actions-validate
[activate]: https://keygen.sh/docs/api/machines/#machines-create
[check-out]: https://keygen.sh/docs/api/machines/#machines-actions-check-out
[yarn]: https://yarnpkg.org
[ngrok]: https://ngrok.com
[logs]: https://app.keygen.sh/request-logs
[support]: mailto:support@keygen.sh
