import React, { useState, useRef, useEffect } from 'react';
import useUrchatStore from '../useUrchatStore';
import { Video } from '../components/Video';
import { MediaInput } from '../components/MediaInput';
import { IncomingCall } from '../components/IncomingCall';

export function Urchat() {
  const {
    incomingCall,
    ongoingCall,
    answerCall: answerCallState,
    placeCall: placeCallState,
    rejectCall,
    hangup: hangupCall
  } = useUrchatStore();

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

  return (
    <main className="flex w-full h-full p-4 sm:p-8">
      {incomingCall && <IncomingCall caller={ incomingCall.call.peer } answerCall={ answerCall } rejectCall={ rejectCall } />}
      {ongoingCall && <UrchatOngoing sendMessage={ sendMessage } messages={ messages } ready={ dataChannelOpen } hangupCall = { hangupCall } />}
      {!incomingCall && !ongoingCall && <UrchatPlaceCall placeCall={ placeCall } />}
    </main>
  )
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
      <section className="flex-1 flex flex-col justify-center">
        <div className="relative">
          <div className="absolute z-10 top-6 left-6">
            <Video size="mini" srcObject={localStream} muted />
          </div>
          <Video size="large" srcObject={import.meta.env.MODE === 'mock' ? localStream : remoteStream} />
        </div>
        <MediaInput addTrack={debugAddTrackToCall} removeTrack={debugRemoveTrackFromCall} />
      </section>
      <aside className="flex-none w-full max-w-sm">
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
        </div>
      </aside>
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