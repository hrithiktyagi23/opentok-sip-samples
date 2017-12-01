const session = OT.initSession(apiKey, sessionId);

session.on({
  streamCreated: (event) => {
    const subscriberClassName = `subscriber-${event.stream.streamId}`;
    const subscriber = document.createElement('div');
    subscriber.setAttribute('id', subscriberClassName);
    document.getElementById('subscribers').appendChild(subscriber);
    session.subscribe(event.stream, subscriberClassName);
  },
  streamDestroyed: (event) => {
    console.log(`Stream ${event.stream.name} ended because ${event.reason}.`);
  },
});

session.connect(token, (error) => {
  if (error) {
    console.log('error connecting to session');
  } else {
    const publisher = OT.initPublisher('publisher');
    session.publish(publisher);
  }
});
