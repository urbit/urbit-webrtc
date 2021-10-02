import React, { ChangeEvent, useEffect } from 'react';
import { useMediaStore } from '../useMediaStore';
import useUrchatStore from '../useUrchatStore';



// eslint-disable-next-line
export function MediaInput() {
  const { ongoingCall } = useUrchatStore();
  const { audio, video, devices } = useMediaStore();
  const videoDevices = devices.filter(dev => dev.kind === 'videoinput');
  const audioDevices = devices.filter(dev => dev.kind === 'audioinput');

  const onVideoChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const device = videoDevices[parseInt(evt.target.value)];
    video.changeDevice(device, ongoingCall);
  };

  const onAudioChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const device = audioDevices[parseInt(evt.target.value)];
    audio.changeDevice(device, ongoingCall);
  };

  return (
    <div className="space-y-6">
      <div className="VideoInputs">
        <h2 className="font-semibold">Camera</h2>
        <select className="input default-ring bg-gray-200" onChange={onVideoChange}>
          { videoDevices.map((dev, key) =>
            (
              <option key={key} value={key}>{dev.label === '' ? dev.groupId : dev.label}</option>
            ))
          }
        </select>
      </div>
      <div className="AudioInputs">
        <h2 className="font-semibold">Microphone</h2>
        <select className="input default-ring bg-gray-200" onChange={onAudioChange}>
          { audioDevices.map((dev, key) =>
            (
              <option key={key} value={key}>{dev.label === '' ? dev.groupId : dev.label}</option>
            ))
          }
        </select>
      </div> 
    </div>
  );
}