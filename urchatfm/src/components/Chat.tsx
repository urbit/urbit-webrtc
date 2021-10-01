import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMock } from '../util';

interface Message {
  speaker: string;
  message: string;
}

interface ChatProps { 
  sendMessage: (msg: string) => void;
  messages: Message[]
  ready: boolean;
}

export const Chat = ({ sendMessage, messages, ready }: ChatProps) => {
  const { register, handleSubmit, reset } = useForm();
  const onSubmitMessage = useCallback(({ message }) => {
    sendMessage(message);
    reset();
  }, []);

  if (!ready && !useMock) {
    return (
      <div className="h-full bg-gray-300 rounded-xl" />
    )
  }

  return (
    <div className="flex flex-col h-full p-6 bg-pink-100 rounded-xl overflow-hidden">
      <div className="flex-1 flex flex-col justify-end px-4 py-3 space-y-6 bg-white rounded-md overflow-y-auto">
        { messages.map((msg, idx) => (
            <div className="message" key={idx}>
              <span className="font-bold mr-3">{ msg.speaker }:</span>
              {msg.message}
            </div>
          ))
        }
      </div>
      <form className="flex-none flex mt-6 relative rounded-md focus-within:ring-2 ring-pink-300 focus-within:outline-none" onSubmit={handleSubmit(onSubmitMessage)}>
        <label htmlFor="message" className="sr-only">Send a Message:</label>
        <input id="message" type="text" className="flex-1 input rounded-r-none focus:outline-none" {...register('message')} />
        <button type="submit" className="flex-none button px-6 text-pink-900 bg-pink-500 rounded-l-none">Send</button>
      </form>
    </div>
  )
}