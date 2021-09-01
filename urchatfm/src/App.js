import useUrchatStore from './Store.js';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import Urbit from '@urbit/http-api';
import { MediaInput, VideoFromStream } from './Video.js';

export default App;

function App() {
  const urbit = useUrchatStore(state => state.urbit);
  return (urbit === null) ? (
    <Login />
  ) : (
    <Urchat />
  );
}

function Urchat() {
  const incomingCall = useUrchatStore(state => state.incomingCall);
  const ongoingCall = useUrchatStore(state => state.ongoingCall);
  const answerCallState = useUrchatStore(state => state.answerCall);
  const placeCallState = useUrchatStore(state => state.placeCall);
  const rejectCall = useUrchatStore(state => state.rejectCall);
  const hangupCall = useUrchatStore(state => state.hangup);

  // local state
  const [dataChannel, setDataChannel] = useState(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // state-changing methods
  const answerCall = () => answerCallState((peer, conn) => {
    setDataChannelOpen(false);
    setMessages([]);
    conn.addEventListener('datachannel', (evt) => {
      const channel = evt.channel;
      channel.onopen = () => setDataChannelOpen(true);
      channel.onmessage = (evt) => {
        const data = evt.data;
        setMessages(messages => messages.concat([{ speaker: peer, message: data }]));
      };
      setDataChannel(channel);
    });
  });

  const placeCall = ship => placeCallState(ship, (conn) => {
    console.log('placing call');
    setDataChannelOpen(false);
    setMessages([]);
    const channel = conn.createDataChannel('urchatfm');
    channel.onopen = () => setDataChannelOpen(true);
    channel.onmessage= (evt) => {
      const data = evt.data;
      setMessages(messages => messages.concat([{ speaker: ship, message: data }]));
    };
    setDataChannel(channel);
  });

  const sendMessage = (msg) => {
    dataChannel.send(msg);
    setMessages(messages.concat([{ speaker: 'me', message: msg }]));
  };

  if(incomingCall !== null) {
    return (
      <UrchatIncoming caller={ incomingCall.call.peer } answerCall={ answerCall } rejectCall={ rejectCall } />
    );
  } else if (ongoingCall !== null) {
    return (
      <UrchatOngoing sendMessage={ sendMessage } messages={ messages } ready={ dataChannelOpen } hangupCall = { hangupCall } />
    );
  } else {
    return (
      <UrchatPlaceCall placeCall={ placeCall } />
    );
  }
}

function UrchatIncoming({ caller, answerCall, rejectCall }) {
  return (
    <div className="incoming-call" >
      Call from { caller }
      <button onClick={ answerCall } >Answer</button>
      <button onClick={ rejectCall } >Reject</button>
    </div>
  );
}

function UrchatOngoing({ sendMessage, messages, ready, hangupCall }) {
  const [message, setMessage] = useState('');
  const localStreamRef = useRef(new MediaStream());
  const localStream = localStreamRef.current;
  const remoteStreamRef = useRef(new MediaStream());
  const remoteStream = remoteStreamRef.current;

  const addTrackToCall = useUrchatStore(state => state.addTrackToCall);
  const removeTrackFromCall = useUrchatStore(state => state.removeTrackFromCall);
  const setOnTrack = useUrchatStore(state => state.setOnTrack);

  const debugOnTrack = (evt) => {
    console.log('Incoming track event', evt);
    remoteStream.addTrack(evt.track);
  };

  const debugAddTrackToCall = (track) => {
    console.log('Adding track to call', track);
    localStream.addTrack(track);
    addTrackToCall(track);
  };

  const debugRemoveTrackFromCall = (track) => {
    console.log('Removing trakc from call', track);
    localStream.removeTrack(track);
    removeTrackFromCall(track);
  };

  useEffect(() => {
    console.log('Setting up track callbacks');
    setOnTrack(debugOnTrack);
  }, []);

  const onSubmitMessage = (evt) => {
    evt.preventDefault();
    sendMessage(message);
    setMessage('');
  };

  return (
    <>
      <div className="remoteMedia">
        <VideoFromStream srcObject={remoteStream} style={{ 'max-height': '75%' }} />
      </div>
      <div className="inputMedia">
        <VideoFromStream srcObject={localStream} muted="true" style={{ 'max-height': '10%' }} />
        <MediaInput addTrack={debugAddTrackToCall} removeTrack={debugRemoveTrackFromCall} />
      </div>
      <div className="urchatChat">
        <div className="messages">
        { messages.map((msg, idx) => (
            <div className="message" key={idx}>
              <span style={{ fontWeight: 'bold' }}> {msg.speaker} </span>
              {msg.message}
            </div>
          ))
        }
        </div>
        <form onSubmit={onSubmitMessage} >
          <label>
            Message:
          <input type="text" value={message} onChange={evt => setMessage(evt.target.value)} />
          </label>
          <input type="submit" value="Send" disabled={ ! ready } />
        </form>
        <button onClick={hangupCall} >Hang up</button>
      </div>
    </>
  );
}

// eslint-disable-next-line
function IceServers() {
  const servers = useUrchatStore(state => state.configuration.iceServers);

  return (
    <div className="iceServers">
    <h4>Ice servers</h4>
    { servers.map((server, idx) => (
      <pre key={idx}>{server}</pre>
    ))}
    </div>
  );
}

function UrchatPlaceCall({ placeCall }) {
  const [ship, setShip] = useState('');

  const onSubmitCall = (evt) => {
    evt.preventDefault();
    placeCall( ship );
    setShip('');
  };

  return (
    <form onSubmit={ onSubmitCall }>
      <label>
        Ship:
        <input type="text" value={ship} onChange={ evt => setShip(evt.target.value) } />
      </label>
      <input type="submit" value="Call" />
    </form>
  );
}

function Login () {
  const setUrbit = useUrchatStore(state => state.setUrbit);
  const [host, setHost] = useState(window.location.host);
  const [ship, setShip] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [errTimeout, setErrTimeout] = useState(null);

  const makeUrbit = (evt) => {
    evt.preventDefault();
    setErr('');
    Urbit.authenticate({ ship: ship, url: host, code: code, verbose: true })
      .then(urbit => setUrbit(urbit))
      .catch((err) => {
        setErr(err.toString());
        if( errTimeout !== null ) {
          clearTimeout(errTimeout);
          setErrTimeout(null);
        }
        setErrTimeout(setTimeout(() => {
          setErr('');
          setErrTimeout(null);
        }, 5000));
      });
  };

  return (
    <>
      <div id="loginError">{err}</div>
      <form onSubmit={makeUrbit}>
        <label>Ship
          <input type="text" value={ship} onChange={evt => setShip(evt.target.value)} />
        </label>

        <label>Host
          <input type="text" value={host} onChange={evt => setHost(evt.target.value)} />
        </label>

        <label>Code
          <input type="password" value={code} onChange={evt => setCode(evt.target.value)} />
        </label>
        <input type="submit" value="Login" />
      </form>
    </>
  );
}

