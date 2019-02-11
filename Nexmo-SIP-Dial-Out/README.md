# Nexmo-SIP-Dial-Out

  This app shows how to connect to an OpenTok session, publish a stream, subscribe to **multiple streams**, and use OpenTok SIP Interconnect with Nexmo to call a phone number.

## Configuring the application

Before running the application, you need to configure the following credentials:
  * OpenTok
    * OpenTok API Key
    * OpenTok API Secret
  * Nexmo
    * Nexmo API Key
    * Nexmo API Secret

Open the `config.js` file in your project and set the `apiKey`, `apiSecret`, `sip.username`, and `sip.password` values.

```
  module.exports = {
    apiKey: '',
    apiSecret: '',
    sip: {
      username: '',
      password: '',
    },
  };
```

## Setting up OpenTok & Nexmo projects
  For OpenTok:
  * Create an API Project to get the API Key and Secret.

  For Nexmo:
  * Sign up for a [Nexmo](https://www.nexmo.com/) account to get the API Key and Secret.

## Starting the application    
'npm install'
`npm start`
