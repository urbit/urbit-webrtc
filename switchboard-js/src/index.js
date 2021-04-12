'use strict';
/**
 * Factory for UrbitRTCPeerConnections, which can be made either by calling a peer or receiving a call from a peer
 */
class UrbitRTCApp extends EventTarget {
  constructor(dap, configuration, urbit = window.urbit) {
    super();
    this._urbit = urbit;
    this.configuration = configuration;
    this.dap = dap;
    this.onincomingcall = () => {};
    this.onhungupcall = () => {};
    this.onerror = () => {};
    this.subscriptionId = null;
    this.done = urbit === null ? new Promise(resolve => resolve()) : this.subscribeToIncoming( urbit );
  }

  subscribeToIncoming( u ) {
    if (u !== this._urbit && u !== null) {
      this.done = new Promise((resolve) => u.subscribe({app: 'switchboard', path: `/incoming/${this.dap}`, err: (err) => this.onerror(err), event: (evt) => handleIncoming(evt), quit: () => resolve()}));
    }
  }

  handleIncoming(evt) {
    if(evt.type == "call") {
      this.incomingCall(evt.call);
    } else if (evt.type == "hangup") {
      this.hungupCall(evt.uuid);
    }
  }

  set urbit(u) {
    this.subscribeToIncoming(u);
    this._urbit = u;
  }

  /**
   * dispatch events for an incoming call
   */
  incomingCall(call) {
    let callEvent = new UrbitRTCIncomingCallEvent(call.peer, call.dap, call.uuid, this._urbit, this.configuration);
    this.onincomingcall(callEvent);
    this.dispatchEvent(callEvent); 
  }

  /**
   * dispatch events for a hung-up call
   */
  hungupCall(uuid) {
    let hungupEvent = new UrbitRTCHungupCallEvent(uuid);
    this.onhungupcall(hungupEvent);
    this.dispatchEvent(hungupEvent);
  }

  /**
   * place an outgoing call
   *
   * @param peer the ship name to call
   * @param dap the app identifier to call on the remote ship
   */
  call(peer, dap) {
    return new UrbitRTCPeerConnection(peer, dap, undefined, this._urbit, this.configuration);
  }
}

/**
 * An RTCPeerConnection signalled over an Urbit airlock side channel
 *
 * This should usually not be constructed directly, an UrbitRTCApplication
 * will return this either as the result of the `call` method or the `answer` callback
 * to an `incomingcall` event
 */
class UrbitRTCPeerConnection extends RTCPeerConnection {
  constructor(peer, dap, uuid = undefined, urbit, configuration = undefined) {
    super(configuration);
    // Urbit airlock
    this.urbit = urbit;
    // Name of ship we are calling
    this.peer = peer;
    // dap of application we are calling
    this.dap = dap;
    // Subscription ID of our subscription to /call/[uuid]
    this.subscriptionId = null;
    // Error-handling callback
    this.onerror = (err) => {};
    // State-change callback
    this.onurbitstatechanged = (state) => {};
    // ICE candidate callback
    this.onicecandidate = (evt) => {
      // Always trickle ICE candidates, if we can
      if((! evt.candidate === null) && this.canTrickleIceCandidates) {
        this.urbit.poke({app: 'switchboard', mark: 'switchboard-signal', json: { uuid: this.uuid, signal: { type: "icecandidate", icecandidate: evt.candidate.toJSON() }}}).catch((err) => this.closeWithError(err));
      }
    };

    // Renegotiation callback, called when media channels are added/deleted
    // 
    // Create an SDP offer and send it to our peer
    this.onnegotiationneeded = () => this.renegotiate();

    // Kick things off
    if(typeof uuid == "undefined") { this.urbitState = "dialing"; this.dial(); }
    else { this.uuid = uuid; this.urbitState = "incoming-ringing"; this.subscribe(); }
  }

  // Obtain a UUID and start a call      
  async dial() {
    return this.urbit.subscribe({app: 'switchboard', path: '/uuid', err: (err) => this.closeWithError(err), event: (uuid) => this.ring(uuid)});
  }

  /** With a UUID, tell switchboard about our call */
  async ring(uuid) {
    this.uuid = uuid;
    console.log("calling");
    const id = await this.urbit.poke({app: 'switchboard', mark: 'switchboard-call', json: { uuid: this.uuid, peer: this.peer, dap: this.dap }}).catch((err) => console.log(err));
    console.log("sent call poke", id);
    return this.subscribe();
  }

  /**
   * Subscribe to incoming SDP offers/answers and ICE candidates
   */
  async subscribe() {
    this.subscriptionId = await this.urbit.subscribe({app: 'switchboard', path: `/call/${this.uuid}`, err: (err) => this.closeWithError(err), event: (signal) => this.handleSignal(signal), quit: () => remoteHungup()});
  }

  /**
   * Make sure that when .close() is called we unsubscribe from the Urbit channel as well
   */
  close() {
    this.urbit.unsubscribe(this.subscriptionId).then(super.close());
  }

  /**
   * Call hung up remotely
   */
  remoteHungup() {
    super.close();
    super.dispatchEvent(new UrbitRTCHungupEvent(this.uuid));
  }

  /**
   * Close and call the error callback
   */
  closeWithError(err) {
    this.close()
    this.onerror(err);
  }

  /**
   * Handle an incoming signal on the signalling channel
   * - sdp offer: pass to setRemoteDescription and create an answer
   * - sdp answer: pass to setRemoteDescription
   * - ice candidate, pass to addIceCandidate
   */
  async handleSignal(signal) {
    switch (typeof signal) {
      case 'string':
        this.urbitState = signal;
        const evt = new UrbitRTCStateChangedEvent(this.uuid, signal);
        this.dispatchEvent(evt);
        this.onurbitstatechanged(evt);
        break;
      case 'object':
        switch(signal.type) {
          case "sdp":
            // Tell the RTCPeerConnection logic about the remote signal
            await this.setRemoteDescription(signal.sdp);
            // If this was an offer, then the remote peer is trying to (re)negotiate
            // and we should answer them
            if(signal.sdp.type == "offer") {
              const answer = await this.createAnswer();
              this.setLocalDescription(answer);
              if(! this.canTrickleIceCandidates) {
                await this.iceCandidatesGathered();
              }
              return this.sendSDP();
            }
            return;
            break;
          case "icecandidate":
            // We got an ICE candidate from the remote peer
            // try it out
            return this.addIceCandidate(signal.icecandidate);
            break;
        }
        break;
    }
  }

  /** Called when negotiation is required */
  async renegotiate() {
    const offer = await this.createOffer();
    this.setLocalDescription(offer);
    if(! this.canTrickleIceCandidates) {
      await this.iceCandidatesGathered();
    }
    return this.sendSDP();
  }

  /**
   * Automagically do an ICE restart if we switch out which servers we use.
   * this will trigger onnegotiationneed event which calls `renegotiate()`
   */
  setConfiguration(configuration) {
    const oldIceServers = super.getConfiguration().iceServers;
    super.setConfiguration(configuration);
    if(configuration.iceServers !== oldIceServers) {
      this.restartIce();
    }
  }

  /**
   * Pack up the current `localDescription` as JSON and send it as an SDP signal
   * to the peer over the signalling channel
   */
  async sendSDP() {
    return this.urbit.poke({app: 'switchboard', mark: 'switchboard-signal', json: { uuid: this.uuid, signal: { type: "sdp", sdp: this.localDescription.toJSON() }}});
  }

  /**
   * Return a promise that resolves immediately if the iceGatheringState is "complete",
   * or remains unresolved until the iceGatheringState becomes "complete"
   */
  async iceCandidatesGathered() {
    const controller = new AbortController();
    const p = new Promise(resolve => {
      this.addEventListener("icegatheringstatechange", () => {
        if(this.iceGatheringState == "complete") {
          resolve();
        }
      }, { signal: controller.signal });
      if(this.iceGatheringState == "complete") {
        p.resolve();
      }}).then(() => controller.abort());
    return p;
  }
}

/**
 * Event for incoming calls
 */
class UrbitRTCIncomingCallEvent extends Event {
  /**
   * Not to be called by application code
   */
  constructor(peer, dap, uuid, urbit, configuration) {
    super("incomingcall");
    this.peer = peer;
    this.dap = dap;
    this.uuid = uuid;
  }

  get call() {
    return { peer: peer, dap: dap, uuid: uuid };
  }

  /**
   * Answer the call.
   *
   * @returns An UrbitRTCPeer connection connected to the caller
   */
  answer() {
    return new UrbitRTCPeerConnection(this.peer, this.dap, this.uuid, this.urbit, this.configuration); 
  }

  async reject() {
    return this.urbit.poke({app: 'switchboard', mark: 'switchboard-reject', json: uuid});
  }
}

class UrbitRTCHungUpCallEvent extends Event {  
  /**
   * Not to be called by application code
   */
  constructor(uuid) {
    super("hungupcall");
    this.uuid = uuid;
  }
}

class UrbitRTCStateChangedEvent extends Event {
  constructor(uuid, state) {
    super("statechanged");
    this.uuid = uuid;
    this.urbitState = state;
  }
}

export default UrbitRTCApp;
export { UrbitRTCApp, UrbitRTCPeerConnection };

