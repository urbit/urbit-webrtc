import classNames from "classnames";
import React from "react";
import { useStore } from "../stores/root";
import { Controls } from "./Controls";
import { Video } from "./Video";
import { observer } from "mobx-react";


export const Call = observer(() => {
  const { mediaStore } = useStore();
  const landscape = (mediaStore.video.tracks[0]?.getSettings()?.aspectRatio > 1) || true;
  console.log("rerender call");
  const hasRemoteScreenshare = mediaStore.remoteVideoTrackCounter > 1;

  var localScreenShare = null;
  var remoteScreenShare = null;
  if (hasRemoteScreenshare) {
    console.log("has remote screesnahre");
    const screensharetrack = mediaStore.remote.getVideoTracks()[1];
    remoteScreenShare = new MediaStream([screensharetrack]);
  }
  if (mediaStore.sharedScreen.enabled) {
    console.log("local screenshare")
    const screensharetrack = mediaStore.local.getVideoTracks()[1];
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
            srcObject={mediaStore.local}
            className={classNames(
              'border border-white',
              landscape && 'aspect-w-16 aspect-h-9',
              !landscape && 'aspect-w-9 aspect-h-16'
            )}
          />
          {mediaStore.sharedScreen.enabled &&
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
          <Video size="large" className="flex-1" isScreenshare={false} srcObject={mediaStore.remote} muted={false} />
          {hasRemoteScreenshare &&
            <Video size="large" className="flex-1" isScreenshare={true} controls={true} srcObject={remoteScreenShare} muted={false} />
          }
        </div>
        <Controls className="absolute z-10 bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
    </>
  )
})