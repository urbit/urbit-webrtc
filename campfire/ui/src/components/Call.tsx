import classNames from "classnames";
import React from "react";
import { useMediaStore } from "../useMediaStore";
import { Controls } from "./Controls";
import { Spinner } from "./Spinner";
import { Video } from "./Video";

interface CallProps {
  connected: boolean;
}

const callStarting = () => {
  return (
    <>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center mb-2">
          <Spinner className="h-6 w-6 mr-2" />
          <h2 className="font-semibold text-xl text-pink-400">Connecting...</h2>
        </div>
        <p className="text-gray-300">This could take up to a minute.</p>
      </div>
    </>
  )
}

export const Call = ({ connected }: CallProps) => {
  const { local, remote, sharedScreen, video } = useMediaStore(s => ({ local: s.local, remote: s.remote, sharedScreen: s.sharedScreen, video: s.video }));
  const landscape = (video.tracks[0]?.getSettings()?.aspectRatio > 1) || true;

  const hasScreenshare = remote.getVideoTracks().length > 1;

  var localScreenShare = null;
  var remoteScreenShare = null;
  if (hasScreenshare) {
    const screensharetrack = remote.getVideoTracks()[1];
    remoteScreenShare = new MediaStream([screensharetrack]);
  }
  if (sharedScreen.enabled) {
    const screensharetrack = local.getVideoTracks()[1];
    localScreenShare = new MediaStream([screensharetrack]);
  }

  return (
    <>
      <div className="relative w-full h-full bg-gray-500 overflow-hidden lg:rounded-xl">
        <div className="absolute z-10 top-2 left-2 sm:top-6 sm:left-6">
          <Video
            size={landscape ? 'mini' : 'xs-mini'}
            muted={true}
            isScreenshare={false}
            srcObject={local}
            className={classNames(
              'border border-white',
              landscape && 'aspect-w-16 aspect-h-9',
              !landscape && 'aspect-w-9 aspect-h-16'
            )}
          />
          {sharedScreen.enabled &&
            <Video
              size={landscape ? 'mini' : 'xs-mini'}
              muted={true}
              isScreenshare={true}
              srcObject={localScreenShare}
              className={classNames(
                'border border-white',
                landscape && 'aspect-w-16 aspect-h-9',
                !landscape && 'aspect-w-9 aspect-h-16'
              )}
            />
          }
        </div>
        <div id="remotevideos" className="h-full w-full flex flex-col">
          <Video size="large" className="flex-1" isScreenshare={false} srcObject={remote} muted={false} />
          {hasScreenshare &&
            <Video size="large" className="flex-1" isScreenshare={true} controls={true} srcObject={remoteScreenShare} muted={false} />
          }
        </div>
        {!connected && callStarting()}
        <Controls className="absolute z-10 bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
    </>
  )
}