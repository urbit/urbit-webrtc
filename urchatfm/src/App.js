import './App.css';
import Login from './Login.js';
import React from 'react';
import {UrbitRTCApp} from 'switchboard';
import {useState, useEffect, useRef} from 'react';

// TODO:
// oops
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
  // if we are the caller, this is true, otherwise false
  const [isCaller, setIsCaller] = useState(false);

  // Set up the incoming call handler
  useEffect( () => {
    urbitRtcApp.addEventListener("incomingcall", (incomingCallEvt) => {
      if(incomingCall === null && ongoingCall === null) {
        setIncomingCall(incomingCallEvt);
        console.log("incoming: ", incomingCallEvt);
      } else {
        incomingCallEvt.reject();
        console.log("rejected: ", incomingCallEvt);
      }
    });
  }, [urbitRtcApp]);

  return (
    <React.Fragment>
    {(incomingCall === null) ? "" : (<UrchatIncoming incoming={incomingCall} setIncoming={setIncomingCall} setOngoing={setOngoingCall} setIsCaller={setIsCaller} />)}
    {(ongoingCall === null) ? "" : (<UrchatChat ongoing={ongoingCall} setOngoing={setOngoingCall} isCaller={isCaller} />)}
    {(incomingCall === null && ongoingCall === null) ?  (<UrchatCall setOngoing={setOngoingCall} setIsCaller={setIsCaller} urbitRtcApp={urbitRtcApp} />) : ""}
    </React.Fragment>
  );
}

function UrchatIncoming({incoming, setIncoming, setOngoing, setIsCaller}) {
  const answer = () => {
    setOngoing({call: incoming.call, conn: incoming.answer()});
    setIncoming(null);
    setIsCaller(false);
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

function UrchatChat({ongoing, setOngoing, isCaller}) {
  const [dataChannel, setDataChannel] = useState(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [composedMessage, setComposedMessage] = useState("");

  const incomingChatMessage = (evt) => {
    setMessages(messages => messages.concat([{sender: ongoing.call.peer, message: evt.data}]));
  }

  const sendMessage = (evt) => {
    evt.preventDefault()
    dataChannel.send(composedMessage);
    setMessages(messages.concat([{sender: "me", message: composedMessage}]));
    setComposedMessage("");
  }

  const hangup = () => {
    ongoing.conn.close();
    setOngoing(null);
  }

  const hungup = () => {
    setOngoing(null);
  }

  const setupDataChannel = () => {
    const newDataChannel = ongoing.conn.createDataChannel("urchatfm", {});
    setDataChannel(newDataChannel);
    newDataChannel.addEventListener("open", () => { console.log("Data channel open"); setDataChannelOpen(true)});
    newDataChannel.addEventListener("close", () => { console.log("Data channel closed"); setDataChannelOpen(false)});
    newDataChannel.addEventListener("message", incomingChatMessage);
  };

  const receiveDataChannel = (evt) => {
    const newDataChannel = evt.channel;
    setDataChannel(newDataChannel);
    newDataChannel.addEventListener("open", () => { console.log("Data channel open"); setDataChannelOpen(true)});
    newDataChannel.addEventListener("close", () => { console.log("Data channel closed"); setDataChannelOpen(false)});
    newDataChannel.addEventListener("message", incomingChatMessage);
  }

  useEffect(() => {
    if(isCaller) {
      ongoing.conn.addEventListener("statechanged", (evt) => { console.log("state changed", evt.urbitState); if(evt.urbitState === "connected") { setupDataChannel() }});
    } else {
      ongoing.conn.addEventListener("datachannel", receiveDataChannel)
    }
  }, [ongoing]);

  const UrchatMessage = ({sender, message}) => {
    return (
      <div className="msg">
        <span className="msg-sender" style={{fontWeight: "bold"}}>{sender}: </span>
        <span className="msg-content">{message}</span>
      </div>
    )
  };

  return (
    <div className="Urchat-chat">
      <div className="messages">
          {messages.map((msg, index) => (
            <UrchatMessage key={index} sender={msg.sender} message={msg.message} />
          ))}
      </div>
      <form onSubmit={sendMessage}>
        <input type="text" value={composedMessage} onChange={(evt) => setComposedMessage(evt.target.value)}/>
        <input type="submit" value="Send" disabled={dataChannel === null || ! dataChannelOpen}/>
      </form>
      <button type="button" onClick={hangup}>Hang Up</button>
    </div>
  )
}

function UrchatCall({setOngoing, setIsCaller, urbitRtcApp}) {
  const [ship, setShip] = useState("zod");
  
  const placeCall = (evt) => {
    evt.preventDefault();
    const conn = urbitRtcApp.call(ship, "urchatfm");
    const call = { peer: ship, dap: "urchatfm", uuid: conn.uuid };
    setOngoing({ conn: conn, call: call });
    setIsCaller(true);
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
