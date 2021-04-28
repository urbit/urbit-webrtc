import './App.css';
import Login from './Login.js';
import React from 'react';
import { UrbitRTCApp } from 'switchboard';
import Icepond from 'icepond';
import { useState, useEffect, useRef } from 'react';

function WithIcepond(urbit, component, configuration = {}) {
  const icepondRef = useRef(new Icepond(urbit));
  const [iceServers, setIceServers] = useState([]);
  useEffect(() => {
    icepondRef.current.oniceserver = (evt) => {
      const server = evt.newIceServer;
      setIceServers(servers => servers.concat([server]));
      console.log('Got server: ', server);
    };
    icepondRef.current.initialize();
  }, [urbit]);
  console.log('Servers:', iceServers);
  const fixedServers = (typeof configuration.iceServers === 'undefined') ? [] : configuration.iceServers;
  const iceConf = { iceServers: fixedServers.concat(iceServers) };
  return component(urbit, { ...configuration, ...iceConf });
}

function WithUrbitRTCApp(urbit, dap, configuration, component) {
  const urbitRtcAppRef = useRef(new UrbitRTCApp(dap, configuration, urbit));
  const urbitRtcApp = urbitRtcAppRef.current;
  useEffect(() => {
    urbitRtcApp.urbit = urbit;
  // eslint-disable-next-line
  }, [urbit]);

  useEffect(() => {
    urbitRtcApp.dap = dap;
  // eslint-disable-next-line
  }, [dap]);

  useEffect(() => {
    urbitRtcApp.configuration = configuration;
    console.log('urbitRtcApp.configuration set to', configuration);
  // eslint-disable-next-line
  });

  useEffect(() => {
    urbitRtcApp.onerror = err => console.log(`Urbit RTC app error: ${err.toString()}`);
  // eslint-disable-next-line
  }, []);

  return component(urbit, urbitRtcAppRef.current);
}

function Urchat(urbit, urbitRtcApp) {
  // if there is a call currently ringing, we place it here
  const [incomingCall, setIncomingCall] = useState(null);
  // if there is a call ongoing, we place it here
  const [ongoingCall, setOngoingCall] = useState(null);
  // if we are the caller, this is true, otherwise false
  const [isCaller, setIsCaller] = useState(false);

  // Set up the incoming call handler
  useEffect( () => {
    urbitRtcApp.addEventListener('incomingcall', (incomingCallEvt) => {
      if(incomingCall === null && ongoingCall === null) {
        setIncomingCall(incomingCallEvt);
        console.log('incoming: ', incomingCallEvt);
      } else {
        incomingCallEvt.reject();
        console.log('rejected: ', incomingCallEvt);
      }
    });
  // eslint-disable-next-line
  }, [urbitRtcApp]);

  return (
    <React.Fragment>
    <IceServerList servers={ urbitRtcApp.configuration.iceServers } />
    {(incomingCall === null) ? '' : (<UrchatIncoming incoming={incomingCall} setIncoming={setIncomingCall} setOngoing={setOngoingCall} setIsCaller={setIsCaller} />)}
    {(ongoingCall === null) ? '' : (<UrchatChat ongoing={ongoingCall} setOngoing={setOngoingCall} isCaller={isCaller} />)}
    {(incomingCall === null && ongoingCall === null) ?  (<UrchatCall setOngoing={setOngoingCall} setIsCaller={setIsCaller} urbitRtcApp={urbitRtcApp} />) : ''}
    </React.Fragment>
  );
}

function UrchatIncoming({ incoming, setIncoming, setOngoing, setIsCaller }) {
  const answer = () => {
    const conn = incoming.answer();
    conn.initialize();
    setOngoing({ call: incoming.call, conn: conn });
    setIncoming(null);
    setIsCaller(false);
  };

  const reject = () => {
    incoming.reject().then(() => setIncoming(null));
  };

  return (
    <div className="incoming-call">
      Call from ~{incoming.peer}
      <button type="button" onClick={answer}>Answer</button>
      <button type="button" onClick={reject}>Reject</button>
    </div>
  );
}

// eslint-disable-next-line
function UrchatChat({ ongoing, setOngoing, isCaller }) {
  const [dataChannel, setDataChannel] = useState(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [composedMessage, setComposedMessage] = useState('');

  const incomingChatMessage = (evt) => {
    setMessages(messages => messages.concat([{ sender: ongoing.call.peer, message: evt.data }]));
  };

  const sendMessage = (evt) => {
    evt.preventDefault();
    dataChannel.send(composedMessage);
    setMessages(messages.concat([{ sender: 'me', message: composedMessage }]));
    setComposedMessage('');
  };

  const hangup = () => {
    ongoing.conn.close();
    setOngoing(null);
  };

  const hungup = () => {
    setOngoing(null);
  };

  const setupDataChannel = () => {
    const newDataChannel = ongoing.conn.createDataChannel('urchatfm', {});
    setDataChannel(newDataChannel);
    newDataChannel.addEventListener('open', () => {
      console.log('Data channel open');
      setDataChannelOpen(true);
    });
    newDataChannel.addEventListener('close', () => {
      console.log('Data channel closed');
      setDataChannelOpen(false);
    });
    newDataChannel.addEventListener('message', incomingChatMessage);
  };

  const receiveDataChannel = (evt) => {
    const newDataChannel = evt.channel;
    setDataChannel(newDataChannel);
    newDataChannel.addEventListener('open', () => {
      console.log('Data channel open');
      setDataChannelOpen(true);
    });
    newDataChannel.addEventListener('close', () => {
      console.log('Data channel closed');
      setDataChannelOpen(false);
    });
    newDataChannel.addEventListener('message', incomingChatMessage);
  };

  useEffect(() => {
    if(isCaller) {
      ongoing.conn.addEventListener('statechanged', (evt) => {
        console.log('state changed', evt.urbitState);
        if(evt.urbitState === 'connected') {
          setupDataChannel();
        }
      });
    } else {
      ongoing.conn.addEventListener('datachannel', receiveDataChannel);
    }
    ongoing.conn.addEventListener('hungupcall', hungup);
  // eslint-disable-next-line
  }, [ongoing]);

  const UrchatMessage = ({ sender, message }) => {
    return (
      <div className="msg">
        <span className="msg-sender" style={{ fontWeight: 'bold' }}>{sender}: </span>
        <span className="msg-content">{message}</span>
      </div>
    );
  };

  return (
    <div className="Urchat-chat">
      <div className="messages">
          {messages.map((msg, index) => (
            <UrchatMessage key={index} sender={msg.sender} message={msg.message} />
          ))}
      </div>
      <form onSubmit={sendMessage}>
        <input type="text" value={composedMessage} onChange={evt => setComposedMessage(evt.target.value)} />
        <input type="submit" value="Send" disabled={dataChannel === null || ! dataChannelOpen} />
      </form>
      <button type="button" onClick={hangup}>Hang Up</button>
    </div>
  );
}

function IceServerList({ servers }) {
  console.log('Servers sent to component: ', servers);
  const serverUrls = [];
  for(const i in servers) {
    const server = servers[i];
    console.log(server);
    console.log('Type of server.urls: ', typeof server.urls);
    if(typeof server.urls === 'string') {
        serverUrls.push(server.urls);
    } else {
      for(const j in server.urls) {
        serverUrls.push(server.urls[j]);
      }
    }
  }
  return (
    <div>
      <h2>ICE servers</h2>
      <ul>{ serverUrls.map((url, i) => (
        <li key={ i }><code style={{ display: 'inline' }} >{ url } </code></li>
      ))}
      </ul>
    </div>
   );
}

function UrchatCall({ setOngoing, setIsCaller, urbitRtcApp }) {
  const [ship, setShip] = useState('zod');

  const placeCall = (evt) => {
    evt.preventDefault();
    const conn = urbitRtcApp.call(ship, 'urchatfm');
    conn.initialize();
    const call = { peer: ship, dap: 'urchatfm', uuid: conn.uuid };
    setOngoing({ conn: conn, call: call });
    setIsCaller(true);
  };

  return (
    <form onSubmit={placeCall}>
      <label>
        Ship:
        <input type="text" value={ship} onChange={evt => setShip(evt.target.value)} />
      </label>
      <input type="submit" value="Call" />
    </form>
  );
}

function App() {
  return Login(({ urbit }) => {
    return WithIcepond( urbit, (urbit, configuration) => {
      return WithUrbitRTCApp(urbit, 'urchatfm', configuration, Urchat);
    });
  });
}

export default App;
