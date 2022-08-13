import classNames from 'classnames';
import React, { HTMLAttributes, useCallback } from 'react'
import { useHistory } from 'react-router';
import { Dialog, DialogContent, DialogTrigger } from './Dialog';
import { Camera } from '../icons/Camera';
import { Exit } from '../icons/Exit';
import { Mic } from '../icons/Mic';
import { Screenshare } from '../icons/Screenshare';
import { SettingsIcon } from '../icons/Settings';
import { IconToggle } from './IconToggle';
import { MediaInput } from './MediaInput';
import { useStore } from '../stores/root';
import { observer } from "mobx-react";

type ControlsProps = HTMLAttributes<HTMLDivElement>;

export const Controls = observer(({ className }: ControlsProps) => {
  const { push } = useHistory();
  const { mediaStore, urchatStore } = useStore();


  const leaveCall = useCallback(() => {
    urchatStore.hangup();
    mediaStore.stopAllTracks();
    push('/');
  }, [])

  return (
    <div className={classNames('flex justify-center p-3 space-x-3', className)}>
      <IconToggle
        className="w-10 h-10"
        pressed={mediaStore.video.enabled}
        onPressedChange={mediaStore.video.toggle}
      >
        <Camera className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
        <span className="sr-only">Video</span>
      </IconToggle>
      <IconToggle
        className="w-10 h-10"
        pressed={mediaStore.audio.enabled}
        onPressedChange={mediaStore.audio.toggle}
      >
        <Mic className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
        <span className="sr-only">Audio</span>
      </IconToggle>
      <IconToggle
        className="w-10 h-10"
        pressed={!mediaStore.sharedScreen.enabled}
        onPressedChange={() => mediaStore.toggleScreenShare(urchatStore.ongoingCall)}
        toggleClass="text-blue-900 bg-blue-500"
      >
        <Screenshare className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
        <span className="sr-only">Screenshare</span>
      </IconToggle>
      <Dialog>
        <DialogTrigger className="flex justify-center items-center w-10 h-10 text-gray-200 bg-gray-700 rounded-full default-ring">
          <SettingsIcon className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
          <span className="sr-only">Devices</span>
        </DialogTrigger>
        <DialogContent className="w-full max-w-xl py-8 px-12">
          <MediaInput />
        </DialogContent>
      </Dialog>
      <button className="flex justify-center items-center w-10 h-10 text-pink-900 bg-pink-500 rounded-full default-ring" onClick={leaveCall}>
        <Exit className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
        <span className="sr-only">Hang up</span>
      </button>
    </div>
  )
})