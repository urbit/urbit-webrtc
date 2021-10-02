import React, { useCallback, useEffect, useState } from 'react';
import useUrchatStore from '../useUrchatStore';
import { IncomingCall } from '../components/IncomingCall';
import { Route, Switch, useHistory } from 'react-router';
import { Chat } from '../components/Chat';
import { Call } from '../components/Call';
import { Dialer } from '../components/Dialer';
import { useMediaStore } from '../useMediaStore';
import { useMock } from '../util';
import call from '/src/assets/enter-call.wav';
import { TurnOnRinger } from '../components/TurnOnRinger';

export interface Message {
  speaker: string;
  message: string;
}

export function Urchat() {
  const {
    incomingCall,
    ongoingCall,
    answerCall: answerCallState,
    placeCall: placeCallState,
    rejectCall
  } = useUrchatStore();
  const getDevices = useMediaStore(s => s.getDevices);
  const { push } = useHistory();

  // local state
  const [dataChannel, setDataChannel] = useState(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  console.log(messages);

  // Set up callback to update device lists when a new device is added or removed
  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  useEffect(() => {
    if (ongoingCall) {
      const audio = new Audio(call);
      audio.volume = .3
      audio.play();
      push(`/chat/${ongoingCall.conn.uuid}`)
    }
  }, [ongoingCall]);

  // state-changing methods
  const answerCall = async () => {
    const call = await answerCallState((peer, conn) => {
      setDataChannelOpen(false);
      setMessages([]);
      conn.addEventListener('datachannel', (evt) => {
        const channel = evt.channel;
        channel.onopen = () => setDataChannelOpen(true);
        channel.onmessage = (evt) => {
          const data = evt.data;
          setMessages(messages => [{ speaker: peer, message: data }].concat(messages));
          console.log('channel message', data);
        };
        setDataChannel(channel);
      });
    });

    getDevices(call)
  }

  const placeCall = async ship => {
    const call = await placeCallState(ship, (conn) => {
      console.log('placing call');
      setDataChannelOpen(false);
      setMessages([]);
      const channel = conn.createDataChannel('urchatfm');
      channel.onopen = () => setDataChannelOpen(true);
      channel.onmessage= (evt) => {
        const data = evt.data;
        setMessages(messages => [{ speaker: ship, message: data }].concat(messages));
        console.log('channel message', data);
      };
      setDataChannel(channel);
    });

    getDevices(call)
  }

  const sendMessage = useCallback((msg: string) => {
    if (!useMock) {
      dataChannel?.send(msg);
    }
    
    const newMessages = [{ speaker: 'me', message: msg }].concat(messages);
    console.log(messages, newMessages);
    setMessages(newMessages);
  }, [messages]);

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
      <aside className="flex-none w-[33vw] max-w-sm">
        <Switch>
          <Route path="/chat/:id">
            <Chat sendMessage={sendMessage} messages={messages} ready={dataChannelOpen} />
          </Route>
          <Route path="/">
            <div className="h-full bg-gray-300 rounded-xl" />
          </Route>
        </Switch>
      </aside>
      
      {incomingCall && (
        <IncomingCall caller={incomingCall.call.peer} answerCall={answerCall} rejectCall={rejectCall} />
      )}
      <TurnOnRinger />
    </main>
  )
}