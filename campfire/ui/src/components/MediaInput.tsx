import { Text } from "@holium/design-system";
import React, { ChangeEvent } from "react";
import { useStore } from "../stores/root";

// eslint-disable-next-line
export function MediaInput() {
  const { mediaStore, urchatStore } = useStore();
  const videoDevices = mediaStore.devices.filter(
    (d) => d.kind === "videoinput"
  );
  const audioDevices = mediaStore.devices.filter(
    (d) => d.kind === "audioinput"
  );
  const audioOutputDevices = mediaStore.devices.filter(
    (d) => d.kind === "audiooutput"
  );

  const onVideoChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const device = videoDevices[parseInt(evt.target.value)];
    mediaStore.video.changeDevice(device, urchatStore.ongoingCall);
  };

  const onAudioChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const device = audioDevices[parseInt(evt.target.value)];
    mediaStore.audio.changeDevice(device, urchatStore.ongoingCall);
  };


  const onAudioOutChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const device = audioOutputDevices[parseInt(evt.target.value)];
    mediaStore.setOutputSoundDevice(device.deviceId);
  };

  return (
    <div className="space-y-6 h-fit w-full">
      <div className="VideoInputs w-full">
        <Text variant="label" pb={1}>
          Camera
        </Text>
        <select
          className="input default-ring bg-gray-200"
          onChange={onVideoChange}
          defaultValue={videoDevices.findIndex(d => {
            return d.deviceId === mediaStore.video.device.deviceId;
          })}
        >
          {videoDevices.map((dev, key) => (
            <option key={key} value={key}>
              {dev.label === "" ? dev.groupId : dev.label}
            </option>
          ))}
        </select>
      </div>
      <div className="AudioInputs w-full">
        <Text variant="label" pb={1}>
          Microphone
        </Text>
        <select
          className="input default-ring bg-gray-200"
          onChange={onAudioChange}
          defaultValue={audioDevices.findIndex(d => {
            return d.deviceId === mediaStore.audio.device.deviceId;
          })}
        >
          {audioDevices.map((dev, key) => (
            <option key={key} value={key}>
              {dev.label === "" ? dev.groupId : dev.label}
            </option>
          ))}
        </select>
      </div>
      <div className="AudioOutputs w-full">
        <Text variant="label" pb={1}>
          Audio Output
        </Text>
        <select
          className="input default-ring bg-gray-200"
          onChange={onAudioOutChange}
        >
          {audioOutputDevices.map((dev, key) => (
            <option key={key} value={key}>
              {dev.label === "" ? dev.groupId : dev.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
