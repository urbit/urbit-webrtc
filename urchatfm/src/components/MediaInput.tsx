import React, { useEffect } from 'react';
import { useMediaStore } from '../useMediaStore';
import useUrchatStore from '../useUrchatStore';



// eslint-disable-next-line
export function MediaInput() {
  const { ongoingCall } = useUrchatStore();
  const { audio, video, devices } = useMediaStore();

  const onVideoClick = dev => (evt) => {
    evt.preventDefault();
    video.changeDevice(dev, ongoingCall);
  };

  const onAudioClick = dev => (evt) => {
    evt.preventDefault();
    audio.changeDevice(dev, ongoingCall);
  };

  return (
    <div className="MediaInput">
      <div className="VideoInputs">
        { devices.filter(dev => dev.kind === 'videoinput').map((dev, key) =>
          (
            <button key={key} onClick={onVideoClick(dev)}>{dev.label === '' ? dev.groupId : dev.label}</button>
          ))
        }
      </div>
      <div className="AudioInputs">
        { devices.filter(dev => dev.kind === 'audioinput').map((dev, key) =>
          (
            <button key={key} onClick={onAudioClick(dev)}>{dev.label === '' ? dev.groupId : dev.label}</button>
          ))
        }
      </div> 
    </div>
  );
}