import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';

interface DialerProps {
  placeCall: (ship: string) => void;
}

export const Dialer = ({ placeCall }: DialerProps) => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmitCall = useCallback(({ ship }) => {
    placeCall(ship);
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
          className="flex-1 input min-w-[200px] rounded-r-none focus:outline-none"
          {...register('ship')} 
        />
        <button type="submit" className="flex-none button px-6 text-pink-900 bg-pink-500 rounded-l-none">Call</button>
      </div>
    </form>
  );
}