import React, { useEffect } from 'react';
import { sigil, reactRenderer } from '@tlon/sigil-js'
import ring from '/src/assets/ring.wav';

interface IncomingCallProps {
  caller: string;
  answerCall: () => void;
  rejectCall: () => void;
}

const Sigil = props => {
  return (
    <>{
      sigil({
        patp: props.patp,
        renderer: reactRenderer,
        size: 64,
        colors: ['black', 'white'],
      })
    }</>
  )
}

export const IncomingCall = ({ caller, answerCall, rejectCall }: IncomingCallProps) => {
  useEffect(() => {
    const audio = new Audio(ring);
    audio.play();
  }, []);

  return (

    <div className="fixed top-4 right-4 gap-x-3 flex inline-block px-8 py-4 bg-gray-100 rounded-xl shadow-lg" >
      <div className="flex-1">
        <Sigil patp={caller} />
      </div>
      <div className="flex-1">
        <h2>Call from ~<span className="font-mono font-semibold">{caller}</span></h2>
        <div className="flex space-x-3">
          <button className="flex-1 button text-green-900 bg-green-500" onClick={answerCall} >Answer</button>
          <button className="flex-1 button text-red-900 bg-red-500" onClick={rejectCall} >Reject</button>
        </div>
      </div>
    </div>
  )
}