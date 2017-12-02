# Twilio-SIP-Conference

  This app shows how to connect to an OpenTok session, publish a stream, subscribe to **multiple streams**, use OpenTok SIP Interconnect with Twilio's Dial API to create an audio conference.

## Configuring the application

Before running the application, you need to configure the following credentials:
  * OpenTok
    * OpenTok Api Key
    * OpenTok Api Secret
  * Twilio
    * Sip URI
    * Sip Username
    * Sip Password
    * Twilio Account SID
    * Twilio Account Token
    * Caller ID verified by Twilio
    * Twilio Phone Number

For OpenTok, you can get the Api Key and Secret from your API Project.

For Twilio, please create a project so you can generate an SID and Token. Additonally, create a SIP URI and authorize a set of credentials for the SIP URI. To use the conferencing, please make sure to verify your phone number, and create a Twilio phone number so it can be used as the conference number.

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