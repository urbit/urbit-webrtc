import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Message } from '../pages/Urchat';
import { useMock } from '../util';

interface ChatProps { 
  sendMessage: (msg: string) => void;
  messages: Message[]
  ready: boolean;
}

export const Chat = ({ sendMessage, messages, ready }: ChatProps) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { message: '' }
  });
  const onSubmitMessage = useCallback(({ message }) => {
    console.log(message)
    sendMessage(message);
    reset();
  }, [sendMessage]);

  if (!ready && !useMock) {
    return null
  }

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 text-sm bg-pink-100 lg:rounded-xl overflow-hidden">
      <div className="flex-1 h-full px-4 py-3 bg-white rounded-md overflow-y-auto">
        <div className="flex flex-col-reverse justify-start">
          { messages.map((msg, idx) => (
              <div className="mt-4" key={idx}>
                <span className="font-bold mr-3">{ msg.speaker }:</span>
                {msg.message}
              </div>
            ))
          }
        </div>
      </div>
      <form className="flex-none flex mt-3 sm:mt-6 relative rounded-md focus-within:ring-2 ring-pink-300 focus-within:outline-none" onSubmit={handleSubmit(onSubmitMessage)}>
        <label htmlFor="message" className="sr-only">Send a Message:</label>
        <input 
          id="message" 
          type="text" 
          className="flex-1 input rounded-r-none focus:outline-none" 
          {...register('message')} 
        />
        <button 
          type="submit" 
          className="flex-none button px-6 text-pink-900 bg-pink-500 rounded-l-none"
        >
          Send
        </button>
      </form>
    </div>
  )
}