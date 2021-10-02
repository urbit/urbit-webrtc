import React, { useCallback, useEffect } from "react";
import { Redirect } from "react-router";
import { useMediaStore } from "../useMediaStore";
import useUrchatStore from "../useUrchatStore";
import { useMock } from "../util";
import { Controls } from "./Controls";
import { MediaInput } from "./MediaInput";
import { Video } from "./Video";

export const Call = () => {
  const { local, remote } = useMediaStore(s => ({ local: s.local, remote: s.remote }));
  const { ongoingCall, setOnTrack } = useUrchatStore(s => ({ setOnTrack: s.setOnTrack, ongoingCall: s.ongoingCall }));

  const onTrack = useCallback((evt) => {
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
        <div className="absolute z-10 top-6 left-6">
          <Video size="mini" className="aspect-w-16 aspect-h-9 border border-white" srcObject={local} muted />
        </div>
        <Video size="large" className="absolute inset-0 h-full w-full object-contain" srcObject={useMock ? local : remote} muted={useMock} />
        <Controls className="absolute z-10 bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
    </>
  )
}