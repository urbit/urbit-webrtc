import './App.css';
import Login from './Login.js';
import React from 'react';
import {UrbitRTCApp} from 'switchboard';
import {useState, useEffect, useRef} from 'react';

// TODO:
// test and bugfix
// call picked up event
// *hangup button*

function WithUrbitRTCApp(urbit, dap, configuration, component) {
  const urbitRtcAppRef = useRef(new UrbitRTCApp(dap, configuration, urbit));
  const urbitRtcApp = urbitRtcAppRef.current;
  useEffect(() => {
    urbitRtcApp.configuration = configuration;
    urbitRtcApp.dap = dap;
    urbitRtcApp.urbit = urbit;
    urbitRtcApp.onerror = (err) => console.log(`Urbit RTC app error: ${err.toString()}`);
  }, [urbit, dap, configuration]);
  
  return component(urbit, urbitRtcAppRef.current);
}

function Urchat(urbit, urbitRtcApp) {
  // if there is a call currently ringing, we place it here
  const [incomingCall, setIncomingCall] = useState(null);
  // if there is a call ongoing, we place it here
  const [ongoingCall, setOngoingCall] = useState(null);

  // Set up the incoming call handler
  useEffect( () => {
    urbitRtcApp.addEventListener("incomingcall", (incomingCallEvt) => {
      if(incomingCall === null && ongoingCall === null) {
        setIncomingCall(incomingCallEvt);
      } else {
        incomingCallEvt.reject();
      }
    });
  }, [urbitRtcApp]);

  return (
    <React.Fragment>
    {(incomingCall === null) ? "" : (<UrchatIncoming incoming={incomingCall} setIncoming={setIncomingCall} setOngoing={setOngoingCall} />)}
    {(ongoingCall === null) ? "" : (<UrchatChat ongoing={ongoingCall} setOngoing={setOngoingCall} />)}
    {(incomingCall === null && ongoingCall === null) ?  (<UrchatCall setOngoing={setOngoingCall} urbitRtcApp={urbitRtcApp} />) : ""}
    </React.Fragment>
  );
}

function UrchatIncoming({incoming, setIncoming, setOngoing}) {
  const answer = () => {
    setOngoing({call: incoming.call, conn: incoming.answer()});
    setIncoming(null);
  }

  const reject = () => {
    incoming.reject().then(() => setIncoming(null));
  }

  return (
    <div className="incoming-call">
      Call from ~{incoming.peer}
      <button type="button" onClick={answer}>Answer</button>
      <button type="button" onClick={reject}>Reject</button>
    </div>
  )
}

function UrchatChat({ongoing, setOngoing}) {
  const dataChannelRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [composedMessage, setComposedMessage] = useState("");
  const dataChannel = dataChannelRef.current;

  const incomingChatMessage = (evt) => {
    setMessages(messages.push({sender: ongoing.call.peer, message: evt.data}));
  }

  const sendMessage = (evt) => {
    dataChannel.send(composedMessage);
    setMessages(messages.push({sender: "me", message: composedMessage}));
    setComposedMessage("");
    evt.preventDefault()
  }

  const hangup = () => {
    ongoing.conn.close();
    setOngoing(null);
  }

  const hungup = () => {
    setOngoing(null);
  }

  const setupDataChannel = () => {
    dataChannelRef.current = ongoing.conn.createDataChannel("urchatfm", { id: 5, negotiated: true });
    dataChannelRef.addEventListener("message", incomingChatMessage);
  };

  useEffect(() => {
    ongoing.conn.addEventListener("statechanged", (evt) => { if(evt.state === "connected") { setupDataChannel() }});
  });

  const urchatMessage = ({sender, message}) => {
    return (
      <div className="msg">
        <span className="msg-sender">{sender}:</span>:
        <span className="msg-content">{message}</span>
      </div>
    )
  };

  return (
    <div className="Urchat-chat">
      <div className="messages">
        {messages.map(urchatMessage)}
      </div>
      <form onSubmit={sendMessage}>
        <input type="text" value={composedMessage} onChange={(evt) => setComposedMessage(evt.target.value)}/>
        <input type="submit" value="Send"/>
      </form>
      <button type="button" onClick={hangup}>Hang Up</button>
    </div>
  )
}

function UrchatCall({setOngoing, urbitRtcApp}) {
  const [ship, setShip] = useState("zod");
  
  const placeCall = (evt) => {
    const conn = urbitRtcApp.call(ship, "urchatfm");
    const call = { peer: ship, dap: "urchatfm", uuid: conn.uuid };
    setOngoing({ conn: conn, call: call });
    evt.preventDefault();
  };

  return (
    <form onSubmit={placeCall}>
      <label>
        Ship:
        <input type="text" value={ship} onChange={(evt) => setShip(evt.target.value)} />
      </label>
      <input type="submit" value="Call"/>
    </form>
  );
}

function App() {
  const rtcConfig = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
  return Login((urbit) => {
    return WithUrbitRTCApp(urbit, 'urchatfm', rtcConfig, Urchat)
  });
}

export default App;
