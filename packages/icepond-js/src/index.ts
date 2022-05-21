import Urbit from '@urbit/http-api'

declare global {
  interface Window {
    urbit: Urbit;
  }
}

export type IcepondState = 
  | 'uninitialized'
  | 'acquiring'
  | 'done'
  | 'error';

/**
 * Acquire ICE servers from the `icepond` agent running on an Urbit
 *
 * After creation you should handle at least the "iceserver" event
 * either via addEventListener or by setting oniceserver.
 *
 * You can also optionally watch for errors or completion of ICE server
 * collection by listening for "statechange" events (or setting `onstatechange`)
 * and watching for e.g. the "error" or "done" state.
 *
 * Already-collected ICE servers will accumulate in the `iceServers` property.
 * "iceserver" events carry both this property and property `newIceServer` which
 * is just the new ICE server triggering the event.
 *
 * The state can be seen at the `state` property of either the Icepond object or a
 * state event. The possible states are
 * - 'uninitialized': `initialize` has not yet completed
 * - 'acquiring': initialize has completed and we are awaiting ICE servers
 * - 'error': There was an error acquiring ICE servers
 * - 'done': icepond has no more ICE servers to give us
 *
 * Once your event handlers are in place you should call ethe `initialize` method
 * to initiate acquisition.
 */
class Icepond extends EventTarget {
  urbit: Urbit;
  iceServers: RTCIceServer[];
  state: IcepondState;
  uid: string;

  oniceserver: (evt: NewIcepondServer) => void;
  onstatechange: (evt: IcepondStateChange) => void;

  constructor(urbit = window.urbit) {
    super();
    this.urbit = urbit;
    this.iceServers = [];
    this.state = 'uninitialized';
    this.oniceserver = () => {};
    this.onstatechange = () => {};
    this.uid = '';
    for(let i = 0; i < 32; i++) {
      this.uid += Math.floor(Math.random() * 16).toString(16);
    };
  }

  async initialize() {
    await this.urbit.subscribe({
      app: 'icepond',
      path: `/ice-servers/${this.uid}`,
      err: err => this.handleError(err),
      event: evt => this.iceServer(evt),
      quit: () => this.done()
    });
    this.iceServers = [];
    
    this.state = 'acquiring';
    const evt = new IcepondStateChange(this.state);
    this.dispatchEvent(evt);
    this.onstatechange(evt); 
  }

  handleError(err: Error) {
    console.log('icepond error: ', err);
    this.state = 'error';
    const evt = new IcepondStateChange(this.state);
    this.dispatchEvent(evt);
    this.onstatechange(evt);
  }

  iceServer(server: RTCIceServer) {
    if(this.iceServers.includes(server) == false){
      this.iceServers.push(server);
    }
    const evt = new NewIcepondServer(server, this.iceServers);
    this.dispatchEvent(evt);
    this.oniceserver(evt);
  }

  done() {
    this.state = 'done';
    const evt = new IcepondStateChange(this.state);
    this.dispatchEvent(evt);
    this.onstatechange(evt);
  }
}

export class IcepondStateChange extends Event {
  state: IcepondState;

  constructor(state: IcepondState) {
    super('statechange');
    this.state = state;
  }
}

export class NewIcepondServer extends Event {
  newIceServer: RTCIceServer;
  iceServers: RTCIceServer[];

  constructor(newIceServer: RTCIceServer, iceServers: RTCIceServer[]) {
    super('iceserver');

    this.newIceServer = newIceServer;
    this.iceServers = iceServers;
  }
}

export default Icepond;
export { Icepond };
