import { makeObservable, observable, action, runInAction } from "mobx";
import ring from "../assets/ring.wav";
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

interface ScreenMedia {
  enabled: boolean;
  tracks: Track[];
  toggle: (call: OngoingCall) => void;
}

interface IMediaStore {
  local: MediaStream;
  remote: MediaStream;
  remoteVideoTrackCounter: number;
  video: Media;
  audio: Media;
  outputSoundDevice: MediaDeviceInfo;
  sharedScreen: ScreenMedia;
  devices: MediaDeviceInfo[];
  getDevices: (call: OngoingCall) => Promise<void>;
  setOutputSoundDevice: (device: MediaDeviceInfo) => void;
  toggleScreenShare: (call: OngoingCall) => Promise<void>;
  resetStreams: () => void;
  addTrackToRemote: (track: MediaStreamTrack) => void;
}
export let ringing: HTMLAudioElement = new Audio(ring);
export const resetRing = () => {
  ringing = new Audio(ring);
};

/**
 * A class that is observable
 */
export class MediaStore implements IMediaStore {
  local: MediaStream;
  remote: MediaStream;
  remoteVideoTrackCounter: number;
  video: Media;
  audio: Media;
  outputSoundDevice: MediaDeviceInfo;
  sharedScreen: ScreenMedia;
  devices: MediaDeviceInfo[];

  constructor() {
    this.local = new MediaStream();
    this.remote = new MediaStream();
    this.remoteVideoTrackCounter = 0;
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
    this.outputSoundDevice = null;
    this.sharedScreen = {
      enabled: false,
      tracks: [],
      toggle: async (call: OngoingCall) => {
        const screenShareState = this.sharedScreen;
        if (screenShareState.enabled) {
          this.sharedScreen = await stopShareScreen(this, call);
        } else {
          this.sharedScreen = await startShareScreen(this, call);
        }
      },
    };
    this.devices = [];
    makeObservable(this, {
      local: observable,
      remote: observable,
      remoteVideoTrackCounter: observable,
      video: observable,
      audio: observable,
      outputSoundDevice: observable,
      sharedScreen: observable,
      devices: observable,
      getDevices: action.bound,
      setOutputSoundDevice: action.bound,
      toggleScreenShare: action.bound,
      resetStreams: action.bound,
      addTrackToRemote: action.bound,
      stopAllTracks: action.bound,
    });
  }

  async getDevices(call: OngoingCall) {
    console.log("GET DEVICES");
    const devices = await navigator.mediaDevices?.enumerateDevices();
    const videoDevs = devices.filter((dev) => dev.kind === "videoinput");
    const audioDevs = devices.filter((dev) => dev.kind === "audioinput");
    const outputDev = devices.filter((dev) => dev.kind === "audiooutput");
    // Default to first video and audio device, and
    // trigger acquisition of microphone and camera permissions
    // via getUserMedia in effects below
    const video = await changeDevice(videoDevs[0], "video", this, call);
    const audio = await changeDevice(audioDevs[0], "audio", this, call);
    runInAction(() => {
      this.devices = devices;
      this.video = video;
      this.audio = audio;
      this.outputSoundDevice = outputDev[0];
    });
  }

  setOutputSoundDevice(device: MediaDeviceInfo) {
    console.log("Setting new output sound device", device);
    this.outputSoundDevice = device;
  }

  async toggleScreenShare(call: OngoingCall) {
    if (this.sharedScreen.enabled) {
      console.log("stop share screen");
      const removeTrack = (track: Track) => {
        console.log("Removing screenshare track from call", track);
        this.local.removeTrack(track);
        call.conn?.removeTrack(track.sender);
        track.stop();
      };
      runInAction(() => {
        this.sharedScreen.tracks.forEach(removeTrack);
        this.sharedScreen.enabled = false;
      });
    } else {
      const addTrack = (track: MediaStreamTrack) => {
        track.onended = (event: Event) => {
          //this event is triggered when someone clicks the browser "stop sharing button"
          console.log(`${event} ON ENDED`);
          this.toggleScreenShare(call);
        };
        console.log("Adding screenshare track to call", track);
        track.contentHint = "screenshare";
        this.local.addTrack(track);
        const sender = call.conn?.addTrack(track);
        (track as Track).sender = sender;
        return track as Track;
      };
      const t = (await navigator.mediaDevices.getDisplayMedia())
        .getTracks()
        .map(addTrack);
      runInAction(() => {
        this.sharedScreen.tracks = t;
        this.sharedScreen.enabled = true;
      });
    }
  }

  resetStreams() {
    this.local = new MediaStream();
    this.remote = new MediaStream();
  }

  stopAllTracks() {
    this.video.tracks.forEach((track: Track) => {
      track.stop();
    });
    this.audio.tracks.forEach((track: Track) => {
      track.stop();
    });
  }

  addTrackToRemote(track: MediaStreamTrack) {
    this.remote.addTrack(track);
    // this is a hack so that state refreshes
    this.remoteVideoTrackCounter = this.remote.getVideoTracks().length;
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
  console.log("switching " + type + " device from " + media.device?.deviceId! + " to " + device?.deviceId!);
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

async function startShareScreen(
  state: MediaStore,
  call: OngoingCall
): Promise<ScreenMedia> {
  console.log("start share screen");
  const media = state.sharedScreen;

  const addTrack = (track: MediaStreamTrack) => {
    track.onended = (event: Event) => {
      //TODO: this event is triggered when someone clicks the browser "stop sharing button"
      // currently very buggy for stop sharing screen.
      console.log(`${event} ON ENDED`);
      // stopShareScreen(state);
    };
    console.log("Adding screenshare track to call", track);
    track.contentHint = "screenshare";
    state.local.addTrack(track);
    const sender = call.conn?.addTrack(track);
    (track as Track).sender = sender;
    return track as Track;
  };

  media.tracks = (await navigator.mediaDevices.getDisplayMedia())
    .getTracks()
    .map(addTrack);
  media.enabled = true;

  return media;
}

async function stopShareScreen(
  state: MediaStore,
  call: OngoingCall
): Promise<ScreenMedia> {
  console.log("stop share screen");
  const media = state.sharedScreen;

  const removeTrack = (track: Track) => {
    console.log("Removing screenshare track from call", track);
    state.local.removeTrack(track);
    try {
      call.conn?.removeTrack(track.sender);
    } catch (err) {
      console.log(err);
    }
    track.stop();
  };

  media.tracks.forEach(removeTrack);
  media.enabled = false;

  return media;
}
