import classNames from 'classnames';
import React, { HTMLAttributes, useCallback } from 'react'
import { useHistory } from 'react-router';
import { Camera } from '../icons/Camera';
import { Exit } from '../icons/Exit';
import { Mic } from '../icons/Mic';
import { useMediaStore } from '../useMediaStore';
import useUrchatStore from '../useUrchatStore';
import { IconToggle } from './IconToggle';

type ControlsProps = HTMLAttributes<HTMLDivElement>;

export const Controls = ({ className }: ControlsProps) => {
  const { push } = useHistory();
  const { audio, video } = useMediaStore(s => ({ audio: s.audio, video: s.video }));
  const hangup = useUrchatStore(s => s.hangup);

  const leaveCall = useCallback(() => {
    hangup();
    push('/chat');
  }, [])

  return (
    <div className={classNames('flex justify-center p-3 space-x-3', className)}>
      <IconToggle 
        className="w-10 h-10" 
        pressed={video.enabled} 
        onPressedChange={video.toggle}
      >
        <Camera className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
      </IconToggle>
      <IconToggle 
        className="w-10 h-10" 
        pressed={audio.enabled} 
        onPressedChange={audio.toggle}
      >
        <Mic className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
      </IconToggle>
      <button className="flex justify-center items-center w-10 h-10 text-pink-900 bg-pink-500 rounded-full default-ring" onClick={leaveCall}>
        <Exit className="w-6 h-6" primary="fill-current opacity-80" secondary="fill-current" />
        <span className="sr-only">Hang up</span>
      </button>
    </div>
    
  )
}