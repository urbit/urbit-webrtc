import React, { useEffect, useState } from 'react';
import useUrchatStore from '../useUrchatStore';
import { IncomingCall } from '../components/IncomingCall';
import { Route, Switch, useHistory } from 'react-router';
import { Chat } from '../components/Chat';
import { Call } from '../components/Call';
import { Dialer } from '../components/Dialer';
import { useMediaStore } from '../useMediaStore';

export function Urchat() {
  const {
    incomingCall,
    answerCall: answerCallState,
    placeCall: placeCallState,
    rejectCall
  } = useUrchatStore();
  const getDevices = useMediaStore(s => s.getDevices);
  const { push } = useHistory();

  // local state
  const [dataChannel, setDataChannel] = useState(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Set up callback to update device lists when a new device is added or removed
  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  // state-changing methods
  const answerCall = () => answerCallState((peer, conn, call) => {
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

    getDevices(call)
    push(`/chat/${conn.uuid}`)
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
    <main className="relative flex gap-6 w-full h-full p-4 sm:p-8 text-gray-700">
      <section className="flex-1 flex flex-col justify-center">
        <Switch>
          <Route path="/chat/:id" component={Call} />
          <Route path="/">
            <div className="flex justify-center items-center w-full h-full bg-pink-100 rounded-xl">
              <div>
                <h1 className="mb-6 mx-12 text-3xl font-semibold font-mono">urChatFM</h1>
                <Dialer placeCall={placeCall} />
              </div>
            </div>
          </Route>
        </Switch>
      </section>
      <aside className="flex-none w-full max-w-sm">
        <Chat sendMessage={ sendMessage } messages={ messages } ready={ dataChannelOpen } />
      </aside>
      
      {incomingCall && (
        <IncomingCall caller={incomingCall.call.peer} answerCall={answerCall} rejectCall={rejectCall} />
      )}
    </main>
  )
}