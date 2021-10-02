import { deSig } from '@urbit/api';
import { isValidPatp } from 'urbit-ob';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';

interface DialerProps {
  placeCall: (ship: string) => void;
}

export const Dialer = ({ placeCall }: DialerProps) => {
  const { register, handleSubmit, reset, watch } = useForm<{ ship: string }>({
    mode: 'onChange',
    defaultValues: {
      ship: ''
    }
  });
  const ship = watch('ship');

  const onSubmitCall = useCallback(({ ship }) => {
    if (!ship) {
      return
    }
    
    placeCall(deSig(ship));
    reset();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmitCall)} className="p-12 bg-gray-200 rounded-xl shadow-xl">
      <label htmlFor="ship" className="sr-only">Ship</label>
      <div className="flex rounded-md focus-within:ring-2 ring-pink-300 focus-within:outline-none">
        <input 
          id="ship" 
          type="text" 
          placeholder="Ship"
          className="flex-1 input min-w-[200px] font-semibold font-mono rounded-r-none focus:outline-none"
          {...register('ship')} 
        />
        <button type="submit" className="flex-none button px-6 text-pink-900 bg-pink-500 disabled:text-gray-900 disabled:bg-gray-400 disabled:cursor-default rounded-l-none" disabled={!isValidPatp(ship || '') && ship.length > 0}>Call</button>
      </div>
    </form>
  );
}