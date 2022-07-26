import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Ship, Button, Flex, Text, Dialog, Sigil } from "@holium/design-system";
import { readSync } from 'fs';

export interface Message {
  speaker: string;
  message: string;
}
interface ChatProps {
  sendMessage: (msg: string) => void;
  messages: Message[]
  ready: boolean;
}

export const Chat = ({ sendMessage, messages, ready }: ChatProps) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { message: '' }
  });
  const disabled = !ready;
  const onSubmitMessage = useCallback(({ message }) => {
    console.log(message)
    sendMessage(message);
    reset();
  }, [sendMessage]);

  const test_messages = [
    { speaker: "zod", message: "test of the chat app" },
    { speaker: "bus", message: "love this bro" },
    { speaker: "zod", message: "excellent time hanging out" },
  ]

  return (
    <div className={`flex flex-col h-full p-1 sm:p-2 text-sm bg-gray-300 lg:rounded-xl overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 h-full px-2 py-1 bg-white rounded-md overflow-y-auto">
        <div className="flex flex-col-reverse justify-start">
          {messages.map((msg, idx) => (
            <div className="mt-4" key={idx}>
              <span className="font-bold mr-3">{msg.speaker}:</span>
              {msg.message}
            </div>
          ))
          }
        </div>
      </div>
      <form className="flex-none flex mt-2 sm:mt-6 relative rounded-md focus-within:ring-2 ring-yellow-300 focus-within:outline-none" onSubmit={handleSubmit(onSubmitMessage)}>
        <label htmlFor="message" className="sr-only">Send a Message:</label>
        <input
          id="message"
          type="text"
          className="flex-1 input rounded-r-none focus:outline-none"
          {...register('message')}
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={disabled}
        >
          Send
        </Button>
      </form>
    </div>
  )
}