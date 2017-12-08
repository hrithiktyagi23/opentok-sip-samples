# Twilio-SIP-Dial-Out

  This app shows how to connect to an OpenTok session, publish a stream, subscribe to **multiple streams**, use OpenTok SIP Interconnect with Twilio to call a phone number.

## Configuring the application

Before running the application, you need to configure the following credentials:
  * OpenTok
    * OpenTok Api Key
    * OpenTok Api Secret
  * Twilio
    * Sip URI
    * Authorized Username for the SIP URI
    * Authorized Password for the SIP URI
    * Caller ID (phone number) verified by Twilio

Open the `config.js` file in your project and set the `apiKey`, `apiSecret`, `sip.uri`, `sip.username`, `sip.password`, and `callerId` values.

```
  module.exports = {
    apiKey: '',
    apiSecret: '',
    sip: {
      uri: '',
      username: '',
      password: '',
    },
    callerId: '',
  };
```

## Setting up OpenTok & Twilio projects
  For OpenTok:
  * Create an API Project to get the API Key and Secret.

  For Twilio:
  * Create a SIP URI Endpoint and authorize a set of credentials for the SIP URI. 
    * Make sure to check `ENABLED` under SIP Registration.
    *   | Config      |   Option          |  URL  | Request Type  |
        | :-------------: |:-------------:| :-----:| :-----:|
        | REQUEST URL | Webhook | https://your-server.com/voice | GET |
  * Make sure to verify your phone number with Twilio so it can be used as the caller Id.

#### Note: You must run this app on a publicly available URL -- you cannot test the dial-out code using localhost.

## Starting the application
`npm start`
