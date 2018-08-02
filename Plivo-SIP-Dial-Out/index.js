const express = require('express');
const OpenTok = require('opentok');
const plivo = require('plivo');
const config = require('./config');

const app = express();

app.use(express.static(`${__dirname}/public`));

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
   * @param {String} roomId
*/

const renderRoom = (res, sessionId, token, roomId) => {
  res.render('index.ejs', {
    apiKey: config.apiKey,
    sessionId,
    token,
    roomId,
  });
};

/**
   * setSessionDataAndRenderRoom is used to create an OpenTok session & create a token
   * It's to be used only once per roomId
   * @param {Object} res
   * @param {String} roomId
*/

const setSessionDataAndRenderRoom = (res, roomId) => {
  OT.createSession({
    mediaMode: 'routed',
  }, (error, session) => {
    const token = generateToken(session.sessionId);
    app.set(roomId, session.sessionId);
    renderRoom(res, session.sessionId, token, roomId);
  });
};

/**
   * setSipOptions is used to set properties for the OT.dial API call
   * @param {String} roomId
   * @param {String} phoneNumber
*/

const setSipOptions = (roomId, phoneNumber) => ({
  headers: {
    'X-PH-ROOMNAME': encodeURIComponent(roomId),
    'X-PH-DIALOUT-NUMBER': phoneNumber,
  },
  auth: {
    username: config.sip.username,
    password: config.sip.password,
  },
  secure: true,
});

/**
   * startCall is used initiate the phone call using Plivo's API
   * @param {Object} res
   * @param {String} phoneNumber
*/
const startCall = (res, phoneNumber) => {
  const plivoResponse = plivo.Response();
  const params = {
    callerId: config.callerId,
  };
  plivoResponse.addDial(params)
    .addNumber(phoneNumber);
  res.send(plivoResponse.toXML());
};

/**
   * When the room/:rid request is made, either renderRoom or setSessionDataAndRenderRoom
   * function is called depending on if the roomId exists in memory
*/

app.get('/room/:rid', (req, res) => {
  const roomId = req.params.rid;
  if (app.get(roomId)) {
    const sessionId = app.get(roomId);
    const token = generateToken(sessionId);
    renderRoom(res, sessionId, token, roomId);
  } else {
    setSessionDataAndRenderRoom(res, roomId);
  }
});

/**
   * When the dial-out get request is made, the dial method of the OpenTok Dial API is invoked
*/

app.get('/dial-out', (req, res) => {
  const { roomId, phoneNumber } = req.query;
  const sipTokenData = `{"sip":true, "role":"client", "name":"'${phoneNumber}'"}`;
  const sessionId = app.get(roomId);
  const token = generateToken(sessionId, sipTokenData);
  const options = setSipOptions(roomId, phoneNumber);
  OT.dial(sessionId, token, config.sip.uri, options, (error, sipCall) => {
    if (error) {
      return res.json(error);
    }
    app.set(phoneNumber, sipCall.connectionId);
    return res.json(sipCall);
  });
});

/**
   * When the forward get request is made, the startCall function is called
*/
app.get('/forward', (req, res) => {
  const phoneNumber = req.query['X-PH-DIALOUT-NUMBER'];
  startCall(res, phoneNumber);
});

/**
   * When the hang-up get request is made, the forceDisconnect method of the OpenTok API is invoked
*/
app.get('/hang-up', (req, res) => {
  const { roomId, phoneNumber } = req.query;
  const connectionId = app.get(phoneNumber);
  if (app.get(roomId)) {
    const sessionId = app.get(roomId);
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
   * When the plivo-hang-up webhook, the forceDisconnect method of the OpenTok API & the
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

const port = process.env.PORT || '3000';
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
