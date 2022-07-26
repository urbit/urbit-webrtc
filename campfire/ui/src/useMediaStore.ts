import create from 'zustand';
import { OngoingCall } from './useUrchatStore';
import { useMock } from './util';

type Track = MediaStreamTrack & {
  sender: RTCRtpSender;
}

interface ScreenMedia {
  enabled: boolean;
  tracks: Track[];
  toggle: () => void;
}

interface Media {
  enabled: boolean;
  device: MediaDeviceInfo | null;
  tracks: Track[];
  toggle: () => void;
  changeDevice: (device: MediaDeviceInfo, call: OngoingCall) => void;
}

interface MediaStore {
  local: MediaStream;
  remote: MediaStream;
  video: Media;
  audio: Media;
  sharedScreen: ScreenMedia;
  devices: MediaDeviceInfo[];
  call: OngoingCall;
  getDevices: (call: OngoingCall) => Promise<void>;
  resetStreams: () => void;
  disconnectMedia: () => void;
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  local: new MediaStream(),
  remote: new MediaStream(),
  video: {
    enabled: true,
    device: null,
    tracks: [],
    changeDevice: (device: MediaDeviceInfo, call: OngoingCall) => changeDevice(device, 'video', get(), call),
    toggle: () => {
      set({ video: toggleMedia(get().video) })
    }
  },
  audio: {
    enabled: true,
    device: null,
    tracks: [],
    changeDevice: (device: MediaDeviceInfo, call: OngoingCall) => changeDevice(device, 'audio', get(), call),
    toggle: () => {
      set({ audio: toggleMedia(get().audio) })
    }
  },
  sharedScreen: {
    enabled: false,
    tracks: [],
    toggle: async () => {
      var screenShareState = get().sharedScreen;
      if(screenShareState.enabled){
        set({sharedScreen: await stopShareScreen(get())})
      } else{
        set({sharedScreen: await startShareScreen(get())})
      }
    }
  },
  devices: [],
  resetStreams: () => {
    set({
      local: new MediaStream(),
      remote: new MediaStream()
    })
  },
  call: null,
  getDevices: async (call: OngoingCall) => {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    const videoDevs = devices.filter(dev => dev.kind === 'videoinput');
    const audioDevs = devices.filter(dev => dev.kind === 'audioinput');

    // Default to first video and audio device, and
    // trigger acquisition of microphone and camera permissions
    // via getUserMedia in effects below
    const video = await changeDevice(videoDevs[0], 'video', get(), call);
    const audio = useMock ? get().audio :  await changeDevice(audioDevs[0], 'audio', get(), call);
    set({ devices, video, audio });
    set({call: call});
  },
  disconnectMedia: () => {
      var video = get().video;
      var audio = get().audio;
      var call = get().call;
      var local = get().local;

      const removeTrack = (track: Track) => {
        local.removeTrack(track);
        try {
          call.conn?.removeTrack(track.sender);
        } catch (err) {
          console.log(err);
        }
        track.stop();
      }
    

      video.tracks.map(removeTrack);
      audio.tracks.map(removeTrack);
  }
}))

function toggleMedia(media: Media): Media {
  media.enabled = !media.enabled;

  media.tracks.forEach(track => {
    track.enabled = media.enabled;
  });

  return media;
}

const prefs = {
  video: {
    facingMode: "user",
    width: 1280, 
    height: 719
  },
  audio: null
}

async function startShareScreen(state: MediaStore): Promise<ScreenMedia>{
  console.log("start share screen");
  const media = state.sharedScreen;
  const call = state.call;

  const addTrack = (track: MediaStreamTrack) => {
    track.onended = (event: Event) => {
      //TODO: this event is triggered when someone clicks the browser "stop sharing button"
      // currently very buggy for stop sharing screen.
      console.log(`${event} ON ENDED`);
      // stopShareScreen(state);
    };
    console.log('Adding screenshare track to call', track);
    track.contentHint = "screenshare";
    state.local.addTrack(track);
    const sender = call.conn?.addTrack(track);
    (track as Track).sender = sender;
    return track as Track;
  }

  media.tracks = (await navigator.mediaDevices.getDisplayMedia()).getTracks().map(addTrack);
  media.enabled = true;
    
  return media;
}

async function stopShareScreen(state: MediaStore): Promise<ScreenMedia>{
  console.log("stop share screen");
  const media = state.sharedScreen;
  const call = state.call;

  const removeTrack = (track: Track) => {
    console.log('Removing screenshare track from call', track);
    state.local.removeTrack(track);
    try {
      call.conn?.removeTrack(track.sender);
    } catch (err) {
      console.log(err);
    }
    track.stop();
  }

  media.tracks.forEach(removeTrack);
  media.enabled = false;
    
  return media;
}

async function changeDevice(device: MediaDeviceInfo, type: 'audio' | 'video', state: MediaStore, call: OngoingCall): Promise<Media> {
  const media = state[type];
  const addTrack = (track: MediaStreamTrack) => {
    console.log('Adding track to call', track);
    state.local.addTrack(track);
    const sender = call.conn?.addTrack(track);
    (track as Track).sender = sender
    return track as Track;
  }

  const removeTrack = (track: Track) => {
    console.log('Removing track from call', track);
    state.local.removeTrack(track);
    try {
      call.conn?.removeTrack(track.sender);
    } catch (err) {
      console.log(err);
    }
    track.stop();
  }

  const constraints = { [type]: { deviceId: device.deviceId, ...prefs[type] } };
  const stream = await navigator.mediaDevices?.getUserMedia(constraints);
  
  media.tracks.forEach(removeTrack);
    
  if(type==="audio"){
    media.tracks = stream.getAudioTracks().map(addTrack);
  } else if(type === "video"){
    media.tracks = stream.getVideoTracks().map(addTrack);
  }

  media.device = device;

  return media;
}
