# Plivo-SIP-Conference

  This app shows how to connect to an OpenTok session, publish a stream, subscribe to **multiple streams**, use OpenTok SIP Interconnect with Plivo's Dial API to create an audio conference.

## Configuring the application

Before running the application, you need to configure the following credentials:
  * OpenTok
    * OpenTok Api Key
    * OpenTok Api Secret
  * Plivo
    * Sip URI
    * Authorized Username for the SIP URI
    * Authorized Password for the SIP URI
    * Account Auth ID
    * Account Auth Token
    * Plivo Phone Number

Open the `config.js` file in your project and set the `apiKey`, `apiSecret`, `sip.uri`, `sip.username`, `sip.password`, `plivo.authId`, `plivo.authToken`, `conferenceNumber`, and `serverURL` values.

```
  module.exports = {
    apiKey: '',
    apiSecret: '',
    sip: {
      uri: '',
      username: '',
      password: '',
    },
    plivo: {
      authId: '',
      authToken: '',
    },
    conferenceNumber: '',
    serverURL: '', // this your server url
  };
```

## Setting up OpenTok & Plivo projects
  For OpenTok:
  * Create an API Project to get the API Key and Secret.

  For Plivo:
  * Create a new Plivo [application](https://manage.plivo.com/app/). Make the following application
   settings:
    * *Application Name* -- Specify a unique identifying name. (This will only be used by your
     server code.)

    * *Answer URL* -- Add the public address for the /forward endpoint of this app's server.
     This is the webhook callback URL that Plivo calls when a call starts. (In response, this app's server responds with XML that includes the phone number to dial.) You must run this app on a publicly available URL -- you cannot test the dial-out code using localhost. For
     example, set this URL to `https://yourappdomain.com/forward`.

    * *Answer Method* -- Set this to GET.

    * *Hangup URL* -- Add the public address for the /plivo-hang-up endpoint of this app's server.
     This is the webhook callback URL that Plivo calls when a call ends. You must run this app on a publicly available URL -- you cannot test the dial-out code using localhost. For
     example, set this URL to `https://yourappdomain.com/plivo-hang-up`.

    * *Hangup Method* -- Set this to GET.

  * Create a new Plivo [endpoint](https://manage.plivo.com/endpoint/). Assign it a username and
   password, and assign the endpoint to the Plivo application you created.

  * Create a Plivo phone number
    * Create another Plivo application and assign it to this phone number:
      * *Application Name* -- Specify a unique identifying name. (This will only be used by your
     server code.)

      * *Answer URL* -- Add the public address for the /get-pin endpoint of this app's server.
     This is the webhook callback URL that Plivo calls when a call starts. (In response, this app's server responds with XML that includes the phone number to dial.)
      
      * *Answer Method* -- Set this to GET.

      * *Hangup URL* -- Add the public address for the /plivo-hang-up endpoint of this app's server.
      This is the webhook callback URL that Plivo calls when a call ends.

      * *Hangup Method* -- Set this to GET.

#### Note: You must run this app on a publicly available URL -- you cannot test the dial-out code using localhost.

## Starting the application
`npm start`
