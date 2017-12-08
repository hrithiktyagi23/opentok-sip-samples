const express = require('express');
const OpenTok = require('opentok');
const plivo = require('plivo');
const config = require('./config');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const OT = new OpenTok(config.apiKey, config.apiSecret);

/**
   * endCall is used to end the phone call by invoking the hangup_call method
   * in Plivo's API
   * @param {String} callUUID
   * @param {Object} res

*/

const endCall = (callUUID, res) => {
  const plivoClient = plivo.RestAPI({
    authId: config.plivo.authId,
    authToken: config.plivo.authToken,
  });
  plivoClient.hangup_call({ callUUID }, (error) => {
    if (error) {
      res.json({
        error,
      });
    } else {
      res.json({
        hangUp: true,
      });
    }
  });
};

/**
   * generatePin is used to create a 4 digit pin
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
   * @param {String} conferenceNumber
   * @param {Number} pinCode
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
   * startConference is used initiate the conference call using Twilio's API
   * @param {Object} res
   * @param {String} sessionId
*/
const startConference = (res, sessionId) => {
  const plivoResponse = plivo.Response();
  plivoResponse.addSpeak('You will now be placed into a demo conference.');
  plivoResponse.addConference(sessionId);
  res.send(plivoResponse.toXML());
};

/**
   * When the dial-out get request is made, the dial method of the OpenTok Dial API is invoked
*/

app.get('/dial-out', (req, res) => {
  const { pinCode, roomId, conferenceNumber } = req.query;
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
   * When the forward get request is made, the startConference function is called
*/

app.get('/forward', (req, res) => {
  const pin = req.query['X-PH-PIN'];
  const sessionId = app.get(pin);
  startConference(res, sessionId);
});

/**
   * When the hang-up get request is made, the forceDisconnect method of the OpenTok API is invoked
*/

app.get('/hang-up', (req, res) => {
  const { pinCode, connectionId } = req.query;
  if (app.get(pinCode)) {
    const sessionId = app.get(pinCode);
    OT.forceDisconnect(sessionId, connectionId, (error) => {
      if (error) {
        res.send({
          error,
        });
      } else {
        res.send({
          hangUp: true,
        });
      }
    });
  } else {
    res.send({
      error: 'Nothing to hangup',
    });
  }
});

/**
   * When the plivo-hang-up webhook is called, the forceDisconnect method of the OpenTok API & the
   * endCall function is invoked
*/

app.get('/plivo-hang-up', (req, res) => {
  const phoneNumber = req.query['X-PH-DIALOUT-NUMBER'];
  const roomId = req.query['X-PH-ROOMNAME'];
  const callUUID = req.query.CallUUID;
  const sessionId = app.get(roomId);
  const connectionId = app.get(phoneNumber);
  OT.forceDisconnect(sessionId, connectionId, (error) => {
    if (error) {
      res.send({
        error,
      });
    } else {
      endCall(callUUID, res);
    }
  });
});

/**
   * When the get-pin get request is made, the PSTN user is prompted to enter
   * a 4 digit pin using Plivo's API
*/

app.get('/get-pin', (req, res) => {
  const plivoResponse = plivo.Response();
  const params = {
    numDigits: 4,
    action: `${config.serverURL}/start-conference`,
    method: 'POST',
    retries: 1,
    timeout: 5,
  };
  const getDigits = plivoResponse.addGetDigits(params);
  getDigits.addSpeak('Please enter your 4 digit pin code');
  plivoResponse.addSpeak('No input recieved. Goodbye');
  res.set({
    'Content-Type': 'text/xml',
  });
  res.send(plivoResponse.toXML());
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

const port = process.env.PORT || '3000';
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
