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

const generatePin = () => {
  const pin = Math.floor(Math.random() * 9000) + 1000;
  if (app.get(pin)) {
    return generatePin();
  }
  return pin;
};

const generateToken = (sessionId, sipTokenData = '') => OT.generateToken(sessionId, {
  role: 'publisher',
  data: sipTokenData,
});

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

const startConference = (res, sessionId) => {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  const dial = response.dial({
    callerId: config.callerId,
  });
  dial.conference(sessionId);
  response.say('Hello Manik');
  res.send(response.toString());
};

const endConference = () => {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  response.hangup();
  console.log(response.toString());
};

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

app.get('/voice', (req, res) => {
  const pin = req.query['SipHeader_X-PH-PIN'];
  const sessionId = app.get(pin);
  startConference(res, sessionId);
});

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

app.post('/start-conference', (req, res) => {
  const pin = req.body.Digits;
  const sessionId = app.get(pin);
  startConference(res, sessionId);
});

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
