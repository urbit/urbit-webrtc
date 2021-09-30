import React from 'react';

interface IncomingCallProps {
  caller: string;
  answerCall: () => void;
  rejectCall: () => void;
}

export const IncomingCall = ({ caller, answerCall, rejectCall }: IncomingCallProps) => {
  return (
    <section className="flex justify-center items-center w-full h-full p-4 sm:p-8">
      <div className="w-full max-w-sm p-4 space-y-4 bg-gray-200 rounded-xl" >
        <h2>Call from { caller }</h2>
        <div className="flex space-x-3">
          <button className="button text-white bg-green-500" onClick={ answerCall } >Answer</button>
          <button className="button text-white bg-red-500" onClick={ rejectCall } >Reject</button>
        </div>
      </div>
    </section>
  )
}