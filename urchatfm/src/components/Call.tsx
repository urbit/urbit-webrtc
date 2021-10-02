import classNames from "classnames";
import React, { useCallback, useEffect } from "react";
import { useMediaStore } from "../useMediaStore";
import useUrchatStore from "../useUrchatStore";
import { useMock } from "../util";
import { Controls } from "./Controls";
import { Video } from "./Video";

export const Call = () => {
  const { local, remote, video } = useMediaStore(s => ({ local: s.local, remote: s.remote, video: s.video }));
  const { ongoingCall, setOnTrack } = useUrchatStore(s => ({ setOnTrack: s.setOnTrack, ongoingCall: s.ongoingCall }));
  const landscape = (video.tracks[0]?.getSettings()?.aspectRatio > 1) || true;

  const onTrack = useCallback((evt: Event & { track: MediaStreamTrack }) => {
    console.log('Incoming track event', evt);
    remote.addTrack(evt.track);
  }, [remote]);

  useEffect(() => {
    if (ongoingCall) {
      console.log('Setting up track callbacks');
      setOnTrack(onTrack);
    }
  }, [ongoingCall]);

  return (
    <>
      <div className="relative w-full h-full">
        <div className="absolute z-10 top-2 left-2 sm:top-6 sm:left-6">
          <Video 
            size={landscape ? 'mini' : 'xs-mini'} 
            muted
            srcObject={local} 
            className={classNames(
              'border border-white',
              landscape && 'aspect-w-16 aspect-h-9',
              !landscape && 'aspect-w-9 aspect-h-16'
            )}
          />
        </div>
        <Video size="large" className="absolute inset-0 h-full w-full" srcObject={useMock ? local : remote} muted={useMock} />
        <Controls className="absolute z-10 bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
    </>
  )
}