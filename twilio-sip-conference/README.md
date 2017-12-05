# Twilio-SIP-Conference

  This app shows how to connect to an OpenTok session, publish a stream, subscribe to **multiple streams**, use OpenTok SIP Interconnect with Twilio's Dial API to create an audio conference.

## Configuring the application

Before running the application, you need to configure the following credentials:
  * OpenTok
    * OpenTok Api Key
    * OpenTok Api Secret
  * Twilio
    * Sip URI
    * Authorized Username for the SIP URI
    * Authorized Password for the SIP URI
    * Twilio Account SID
    * Twilio Account Token
    * Caller ID verified by Twilio
    * Twilio Phone Number

## Setting up OpenTok & Twilio project
  For OpenTok:
  * Create an API Project to get the API Key and Secret.

  For Twilio:
  * Create a project so you can generate an SID and Token.
  * Create a SIP URI Endpoint and authorize a set of credentials for the SIP URI. 
    * Make sure to check `ENABLED` under SIP Registration.
    *   | Config      |   Option          |  URL  | Request Type  |
        | :-------------: |:-------------:| :-----:| :-----:|
        | REQUEST URL | Webhook | https://your-server.com/voice | GET |
  * Create a Twilio phone number so it can be used as the conference number.
    *   | Config      |   Option          |  URL  | Request Type  |
        | :-------------: |:-------------:| :-----:| :-----:|
        | A CALL COMES IN | Webhook | https://your-server.com/get-pin | GET |
  * Make sure to verify your phone number with Twilio so it can be used as the caller Id. 


Open the `config.js` file in your project and set the `apiKey`, `apiSecret`, `sip.uri`, `sip.username`, `sip.password`, `twilioAccount.sid`, `twilioAccount.token`, `callerId`, and `conferenceNumber` values.

```
  module.exports = {
    apiKey: '',
    apiSecret: '',
    sip: {
      uri: '',
      username: '',
      password: '',
    },
    twilioAccount: {
      sid: '',
      token: '',
    },
    callerId: '',
    conferenceNumber: '',
  };
```

## Starting the application
`npm start`