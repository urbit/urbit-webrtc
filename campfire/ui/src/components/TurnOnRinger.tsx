import { Dialog, DialogClose, DialogContent } from '@radix-ui/react-dialog';
import React, { useCallback, useEffect } from 'react';

export const TurnOnRinger = () => {
  return (
    <Dialog defaultOpen>
      <DialogContent className="fixed bottom-4 right-4 inline-block max-w-sm px-8 py-4 space-y-4 bg-gray-100 rounded-xl shadow-lg" >
        <h2>You won't hear incoming calls until you hit this button or interact with the page</h2>
        <DialogClose className="flex-1 button text-pink-900 bg-pink-500 default-ring">Turn On Ringer</DialogClose>
      </DialogContent>
    </Dialog>
  )
}