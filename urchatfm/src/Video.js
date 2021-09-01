import React from 'react';
import { useState, useEffect, useRef } from 'react';

export default MediaInput;
export { MediaInput, VideoFromStream };

// eslint-disable-next-line
function MediaInput({ addTrack, removeTrack }) {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Available devices, the chosen video input, and the chosen audio input
  const [devices, setDevices] = useState([]);
  const [videoDevice, setVideoDevice] = useState(null);
  const [audioDevice, setAudioDevice] = useState(null);

  // Tracks
  const [audioTracks, setAudioTracks] = useState([]);
  const [videoTracks, setVideoTracks] = useState([]);

  const readDevices = () => navigator.mediaDevices.enumerateDevices().then((devs) => {
    setDevices(devs);
    return devs;
  });

  // Set up callback to update device lists when a new device is added or removed
  useEffect(() => {
    readDevices().then((devs) => {
      const videoDevs = devs.filter(dev => dev.kind === 'videoinput');
      const audioDevs = devs.filter(dev => dev.kind === 'audioinput');
      // Default to first video and audio device, and
      // trigger acquisition of microphone and camera permissions
      // via getUserMedia in effects below
      if( videoDevs.length > 0 ) {
        setVideoDevice(videoDevs[0]);
      }
      if( audioDevs.length > 0 ) {
        setAudioDevice(audioDevs[0]);
      }
    });
    navigator.mediaDevices.addEventListener('devicechange', readDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', readDevices);
  }, []);

  // Replace the audio track whenever the audio device input changes
  useEffect(() => {
    if(audioDevice !== null) {
      navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioDevice.deviceId } })
        .then((stream) => {
          audioTracks.map((track) => {
            removeTrack(track);
            track.stop();
          });
          stream.getAudioTracks().map(addTrack);
          setAudioTracks(stream.getAudioTracks());
        });
    } else {
      setAudioTracks((tracks) => {
        tracks.map(track => track.stop());
        return [];
      });
    }
  // eslint-disable-next-line
  }, [audioDevice]);

  // Replace the video track whenever the video device input changes
  useEffect(() => {
    if(videoDevice !== null) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevice.deviceId } })
        .then((stream) => {
          audioTracks.map((track) => {
            removeTrack(track);
            track.stop();
          });
          stream.getVideoTracks().map(addTrack);
          setVideoTracks(stream.getVideoTracks());
        });
    } else {
      setVideoTracks((tracks) => {
        tracks.map(track => track.stop());
        return [];
      });
    }
  // eslint-disable-next-line
  }, [videoDevice]);

  // Set video track to enabled or disabled depending on the state setting
  useEffect(() => {
    videoTracks.map((track) => {
      track.enabled = videoEnabled;
      return null;
    });
  }, [videoTracks, videoEnabled]);

  useEffect(() => {
    audioTracks.map((track) => {
      track.enabled = audioEnabled;
      return null;
    });
  }, [audioTracks, audioEnabled]);

  const onVideoClick = dev => (evt) => {
    evt.preventDefault();
    setVideoDevice(dev);
  };

  const onAudioClick = dev => (evt) => {
    evt.preventDefault();
    setAudioDevice(dev);
  };

  const onVideoEnabledChanged = evt => setVideoEnabled(!evt.target.checked);

  const onAudioEnabledChanged = evt => setAudioEnabled(!evt.target.checked);

  return (
    <div className="MediaInput">
      <div className="VideoInputs">
        { devices.filter(dev => dev.kind === 'videoinput').map((dev, key) =>
          (
            <button key={key} onClick={onVideoClick(dev)}>{dev.label === '' ? dev.groupId : dev.label}</button>
          ))
        }
        <form>
          <label>Mute video
            <input type="checkbox" checked= {!videoEnabled } onChange={onVideoEnabledChanged} />
          </label>
        </form>
      </div>
      <div className="AudioInputs">
        { devices.filter(dev => dev.kind === 'audioinput').map((dev, key) =>
          (
            <button key={key} onClick={onAudioClick(dev)}>{dev.lable === '' ? dev.groupId : dev.label}</button>
          ))
        }
        <form>
          <label>Mute audio
            <input type="checkbox" checked= {!audioEnabled } onChange={onAudioEnabledChanged} />
          </label>
        </form>
      </div>
    </div>
  );
}

function VideoFromStream(attrs) {
  const srcObject = attrs.srcObject;
  const videoRef = useRef(null);
  const childAttrs = { ...attrs, 'ref': videoRef };
  delete childAttrs.srcObject;

  useEffect(() => {
    videoRef.current.srcObject = srcObject;
    if( srcObject !== null ) {
      videoRef.current.play();
    }
  }, [videoRef, srcObject]);

  return React.createElement('video', childAttrs, null);
}
