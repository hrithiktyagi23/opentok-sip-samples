const express = require('express');
const OpenTok = require('opentok');
const config = require('./config');
const twilio = require('twilio');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const OT = new OpenTok(config.apiKey, config.apiSecret);

/**
   * generatePin is used to create a 4 digit pin
   * @param {String} sessionId
   * @param {String} sipTokenData
*/

const generatePin = () => {
  const pin = Math.floor(Math.random() * 9000) + 1000;
  if (app.get(pin)) {
    return generatePin();
  }
  return pin;
};

/**
   * generateToken is used to create a token for a user
   * @param {String} sessionId
   * @param {String} sipTokenData
*/
const generateToken = (sessionId, sipTokenData = '') => OT.generateToken(sessionId, {
  role: 'publisher',
  data: sipTokenData,
});

/**
   * renderRoom is used to render the ejs template
   * @param {Object} res
   * @param {String} sessionId
   * @param {String} token
   * @param {Number} pinCode
   * @param {String} roomId
*/

const renderRoom = (res, sessionId, token, pinCode, roomId) => {
  res.render('index.ejs', {
    apiKey: config.apiKey,
    sessionId,
    token,
    pinCode,
    roomId,
    conferenceNumber: config.conferenceNumber,
  });
};

/**
   * setSessionDataAndRenderRoom is used to create an OpenTok session & create a token
   * It's to be used only once per roomId
   * @param {Object} res
   * @param {String} roomId
   * @param {Number} pinCode
*/

const setSessionDataAndRenderRoom = (res, roomId, pinCode) => {
  OT.createSession({
    mediaMode: 'routed',
  }, (error, session) => {
    const token = generateToken(session.sessionId);
    app.set(pinCode, session.sessionId);
    app.set(roomId, pinCode);
    renderRoom(res, session.sessionId, token, pinCode, roomId);
  });
};

/**
   * setSipOptions is used to set properties for the OT.dial API call
   * @param {String} roomId
   * @param {Number} pinCode
   * @param {String} conferenceNumber
*/

const setSipOptions = (roomId, conferenceNumber, pinCode) => ({
  headers: {
    'X-PH-ROOMNAME': encodeURIComponent(roomId),
    'X-PH-DIALOUT-NUMBER': conferenceNumber,
    'X-PH-PIN': pinCode,
  },
  auth: {
    username: config.sip.username,
    password: config.sip.password,
  },
});

/**
   * startConference is used initiate the conference call using Twilio's API
   * @param {Object} res
   * @param {String} sessionId
*/
const startConference = (res, sessionId) => {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  const dial = response.dial({
    callerId: config.callerId,
  });
  dial.conference(sessionId);
  response.say('The conference has started');
  res.send(response.toString());
};

/**
   * endConference is used to end the conference call by invoking the hangup method 
   * in Twilio's API
   * @param {Object} res
   * @param {String} sessionId
*/

const endConference = () => {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  response.hangup();
  console.log(response.toString());
};

/**
   * When the room/:rid request is made, either renderRoom or setSessionDataAndRenderRoom
   * function is called depending on if the roomId exists in memory
*/

app.get('/room/:rid', (req, res) => {
  const roomId = req.params.rid;
  let pinCode;
  if (app.get(roomId)) {
    pinCode = app.get(roomId);
    const sessionId = app.get(pinCode);
    const token = generateToken(sessionId);
    renderRoom(res, sessionId, token, pinCode, roomId);
  } else {
    pinCode = generatePin();
    setSessionDataAndRenderRoom(res, roomId, pinCode);
  }
});

/**
   * When the dial-out get request is made, the dial method of the OpenTok Dial API is invoked
*/

app.get('/dial-out', (req, res) => {
  const { roomId, conferenceNumber, pinCode } = req.query;
  const sipTokenData = `{"sip":true, "role":"client", "name":"'${conferenceNumber}'"}`;
  const sessionId = app.get(pinCode);
  const token = generateToken(sessionId, sipTokenData);
  const options = setSipOptions(roomId, conferenceNumber, pinCode);
  OT.dial(sessionId, token, config.sip.uri, options, (error, sipCall) => {
    if (error) {
      return res.json(error);
    }
    return res.json(sipCall);
  });
});

/**
   * When the voice get request is made, the startConference function is called
*/

app.get('/voice', (req, res) => {
  const pin = req.query['SipHeader_X-PH-PIN'];
  const sessionId = app.get(pin);
  startConference(res, sessionId);
});

/**
   * When the get-pin get request is made, the PSTN user is prompted to enter 
   * a 4 digit pin using Twilio's API
*/

app.get('/get-pin', (req, res) => {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  const gather = response.gather({
    numDigits: 4,
    action: '/start-conference',
    method: 'POST',
  });
  gather.say('Thank you for calling! Please enter your 4-digit pin code.');
  res.set('Content-Type', 'text/xml');
  res.send(response.toString());
});

/**
   * When the start-conference post request is made, the startConference function is called
*/

app.post('/start-conference', (req, res) => {
  const pin = req.body.Digits;
  if (app.get(pin)) {
    const sessionId = app.get(pin);
    startConference(res, sessionId);
  }
});

/**
   * When the hang-up get request is made, the forceDisconnect method of the OpenTok API is invoked
*/

app.get('/hang-up', (req, res) => {
  const pin = req.query.pinCode || '';
  const connectionId = req.query.connectionId || '';
  if (app.get(pin)) {
    const sessionId = app.get(pin);
    OT.forceDisconnect(sessionId, connectionId, (error) => {
      if (error) {
        return res.send({
          error,
        });
      }
      endConference();
      return res.send({
        hangUp: true,
      });
    });
  } else {
    res.send({
      error: 'Nothing to hangup',
    });
  }
});

const port = process.env.PORT || '3000';
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
