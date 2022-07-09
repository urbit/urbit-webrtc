import { makeObservable, observable, computed, action } from "mobx";
import { useMock } from "../util";
import { OngoingCall } from "./urchat";

// Types and interfaces
type Track = MediaStreamTrack & {
  sender: RTCRtpSender;
};

interface Media {
  enabled: boolean;
  device: MediaDeviceInfo | null;
  tracks: Track[];
  toggle: () => void;
  changeDevice: (device: MediaDeviceInfo, call: OngoingCall) => void;
}

interface IMediaStore {
  local: MediaStream;
  remote: MediaStream;
  video: Media;
  audio: Media;
  devices: MediaDeviceInfo[];
  getDevices: (call: OngoingCall) => Promise<void>;
  resetStreams: () => void;
}

/**
 * A class that is observable
 */
export class MediaStore implements IMediaStore {
  @observable local: MediaStream;
  @observable remote: MediaStream;
  @observable video: Media;
  @observable audio: Media;
  @observable devices: MediaDeviceInfo[];

  constructor() {
    this.local = new MediaStream();
    this.remote = new MediaStream();
    this.video = {
      enabled: true,
      device: null,
      tracks: [],
      changeDevice: (device: MediaDeviceInfo, call: OngoingCall) =>
        changeDevice(device, "video", this, call),
      toggle: () => {
        this.video = toggleMedia(this.video);
      },
    };
    this.audio = {
      enabled: true,
      device: null,
      tracks: [],
      changeDevice: (device: MediaDeviceInfo, call: OngoingCall) =>
        changeDevice(device, "audio", this, call),
      toggle: () => {
        this.audio = toggleMedia(this.audio);
      },
    };
    this.devices = [];
    makeObservable(this);
  }

  async getDevices(call: OngoingCall) {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    const videoDevs = devices.filter((dev) => dev.kind === "videoinput");
    const audioDevs = devices.filter((dev) => dev.kind === "audioinput");
    // Default to first video and audio device, and
    // trigger acquisition of microphone and camera permissions
    // via getUserMedia in effects below
    const video = await changeDevice(videoDevs[0], "video", this, call);
    const audio = useMock
      ? this.audio
      : await changeDevice(audioDevs[0], "audio", this, call);
    this.devices = devices;
    this.video = video;
    this.audio = audio;
  }

  @action
  resetStreams() {
    this.local = new MediaStream();
    this.remote = new MediaStream();
  }
}

function toggleMedia(media: Media): Media {
  media.enabled = !media.enabled;

  media.tracks.forEach((track) => {
    track.enabled = media.enabled;
  });

  return media;
}

const prefs = {
  video: {
    facingMode: "user",
    width: 1280,
    height: 719,
  },
  audio: null,
};

async function changeDevice(
  device: MediaDeviceInfo,
  type: "audio" | "video",
  state: MediaStore,
  call: OngoingCall
): Promise<Media> {
  const media = state[type];
  const addTrack = (track: MediaStreamTrack) => {
    console.log("Adding track to call", track);
    state.local.addTrack(track);
    const sender = call.conn?.addTrack(track);
    (track as Track).sender = sender;
    return track as Track;
  };

  const removeTrack = (track: Track) => {
    console.log("Removing track from call", track);
    state.local.removeTrack(track);
    try {
      call.conn?.removeTrack(track.sender);
    } catch (err) {
      console.log(err);
    }
    track.stop();
  };

  const constraints = { [type]: { deviceId: device.deviceId, ...prefs[type] } };
  const stream = await navigator.mediaDevices?.getUserMedia(constraints);

  media.tracks.forEach(removeTrack);
  media.tracks =
    type === "audio"
      ? stream.getAudioTracks().map(addTrack)
      : stream.getVideoTracks().map(addTrack);

  media.device = device;

  return media;
}
