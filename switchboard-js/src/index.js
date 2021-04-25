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
    this.done = null;
  }

  initialize() {
    console.log('UrbitRTCApp initialize');
    return new Promise((resolveOuter) => {
      this.done = new Promise(resolve => this._urbit.subscribe({ app: 'switchboard', path: `/incoming/${this.dap}`, err: err => this.onerror(err), event: evt => this.handleIncoming(evt), quit: () => resolve() }).then(() => resolveOuter()));
    });
  }

  handleIncoming(evt) {
    if(evt.type == 'incoming') {
      this.incomingCall(evt.call);
    } else if (evt.type == 'hangup') {
      this.hungupCall(evt.uuid);
    }
  }

  set urbit(u) {
    this._urbit = u;
    this.initialize();
  }

  /**
   * dispatch events for an incoming call
   * @param {Object} call the incoming call to dispatch
   * @returns {void}
   */
  incomingCall(call) {
    const callEvent = new UrbitRTCIncomingCallEvent(call.peer, call.dap, call.uuid, this._urbit, this.configuration);
    console.log('Configuration for incoming call: ', this.configuration);
    this.onincomingcall(callEvent);
    this.dispatchEvent(callEvent);
  }

  /**
   * dispatch events for a hung-up call
   *
   * @param {string} uuid The uuid of the call that hung up
   * @returns {void}
   */
  hungupCall(uuid) {
    const hungupEvent = new UrbitRTCHungupCallEvent(uuid);
    this.onhungupcall(hungupEvent);
    this.dispatchEvent(hungupEvent);
  }

  /**
   * place an outgoing call
   *
   * @param {string} peer the ship name to call
   * @param {string} dap the app identifier to call on the remote ship
   * @returns {UrbitRTCPeerConnection} connection which is awaiting pick-up by the remote
   */
  call(peer, dap) {
    console.log('Configuration for outgoing call: ', this.configuration);
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
    console.log("UrbitRTCPeerConnection configuration", configuration);
    // Urbit airlock
    this.urbit = urbit;
    // Name of ship we are calling
    this.peer = peer;
    // dap of application we are calling
    this.dap = dap;
    // uuid of the call
    // If left unspecified then we are the caller and need to generate one
    this.uuid = uuid;
    // Subscription ID of our subscription to /call/[uuid]
    this.subscriptionId = null;
    // Error-handling callback
    this.onerror = (err) => {};
    // State-change callback
    this.onurbitstatechanged = (state) => {};
    // ICE candidate callback
    this.onicecandidate = (evt) => {
      // Always trickle ICE candidates, if we can
      if((evt.candidate !== null) && this.canTrickleIceCandidates) {
        console.log('Sending ICE candidate: ', evt.candidate);
        this.urbit.poke({ app: 'switchboard', mark: 'switchboard-call-signal', json: { uuid: this.uuid, signal: { type: 'icecandidate', icecandidate: evt.candidate.toJSON() } } }).catch(err => this.closeWithError(err));
      }
    };

    // Renegotiation callback, called when media channels are added/deleted
    //
    // Create an SDP offer and send it to our peer
    this.onnegotiationneeded = () => this.renegotiate();

    // Urbit state is null until we initialize
    this.urbitState = null;
  }

  initialize() {
    // Kick things off
    if(typeof this.uuid == 'undefined') {
      this.dispatchUrbitState('dialing');
      this.dial();
    } else {
      this.dispatchUrbitState('incoming-ringing');
      this.subscribe();
    }
  }

  sendIceCandidate(evt) {
    if((evt.candidate !== null) && this.canTrickleIceCandidates) {
      console.log('Sending ICE candidate: ', evt.candidate);
      this.urbit.poke({
        app: 'switchboard',
        mark: 'switchboard-call-signal',
        json: {
          uuid: this.uuid,
          signal: {
            type: 'icecandidate',
            icecandidate: evt.candidate.toJSON()
          }
        }
      });
    }
  }

  /**
   * Obtain a UUID and start a call
   *
   * @return {Promise} a promise which resolves when the call is ringing
   */
  async dial() {
    console.log('getting uuid');
    await this.urbit.subscribe({
      app: 'switchboard',
      path: '/uuid',
      err: err => this.closeWithError(err),
      event: uuid => this.ring(uuid),
      quit: () => console.log('quit uuid')
    });
  }

  /** With a UUID, tell switchboard about our call
   * @param {string} uuid the UUID of our new call
   * @returns {Promise} a promise which resolves when we have successfuly subscribed to the call.
   */
  async ring(uuid) {
    this.uuid = uuid;
    console.log('poking call with uuid ', uuid);
    await this.urbit.poke({
      app: 'switchboard',
      mark: 'switchboard-call',
      json: {
        uuid: this.uuid,
        peer: this.peer,
        dap: this.dap
      }
    }).catch(err => console.log(err));
    return this.subscribe();
  }

  /**
   * Subscribe to incoming SDP offers/answers and ICE candidates
   *
   * @returns {Promise} a promise which resolves when we have successfully subscribed to the call
   */
  async subscribe() {
    this.subscriptionId = await this.urbit.subscribe({
      app: 'switchboard',
      path: `/call/${this.uuid}`,
      err: err => this.closeWithError(err),
      event: signal => this.handleSignal(signal),
      quit: () => this.remoteHungup()
    });
  }

  /**
   * Make sure that when .close() is called we unsubscribe from the Urbit channel as well
   *
   * @returns {void}
   */
  close() {
    this.urbit.unsubscribe(this.subscriptionId).then(super.close());
  }

  /**
   * Call hung up remotely
   *
   * @returns {void}
   */
  remoteHungup() {
    super.close();
    super.dispatchEvent(new UrbitRTCHungupCallEvent(this.uuid));
  }

  /**
   * Close and call the error callback
   *
   * @param {string} err The error
   * @returns {void}
   */
  closeWithError(err) {
    this.close();
    this.onerror(err);
  }

  /**
   * Handle an incoming signal on the signalling channel
   * - sdp offer: pass to setRemoteDescription and create an answer
   * - sdp answer: pass to setRemoteDescription
   * - ice candidate: pass to addIceCandidate
   * - state string: pass to state watcher
   *
   * @param {(Object|string)} signal The JSON of the signal we were sent
   * @returns {Promise} a promise which resolves after handling the signal
   */
  async handleSignal(signal) {
    switch (typeof signal) {
      case 'string':
        this.dispatchUrbitState(signal);
        break;
      case 'object':
        switch(signal.type) {
          case 'sdp':
            console.log('Setting remote description', signal.sdp);
            // Tell the RTCPeerConnection logic about the remote signal
            await this.setRemoteDescription(signal.sdp);
            // If this was an offer, then the remote peer is trying to (re)negotiate
            // and we should answer them
            if(signal.sdp.type === 'offer') {
              const answer = await this.createAnswer();
              console.log('Sending answer', answer);
              await this.setLocalDescription(answer);
              if(! this.canTrickleIceCandidates) {
                await this.iceCandidatesGathered();
              }
              return this.sendSDP();
            }
            return;
          case 'icecandidate':
            // We got an ICE candidate from the remote peer
            // try it out
            console.log('adding ICE candidate', signal.icecandidate);
            return this.addIceCandidate(signal.icecandidate);
        }
        break;
    }
  }

  dispatchUrbitState(signal) {
    this.urbitState = signal;
    const evt = new UrbitRTCStateChangedEvent(this.uuid, signal);
    this.dispatchEvent(evt);
    this.onurbitstatechanged(evt);
  }

  /** Called when negotiation is required
   *
   * @returns {Promise} a promise which resolves when renegotiation is complete
   */
  async renegotiate() {
    const offer = await this.createOffer();
    console.log('Sending offer: ', offer);
    await this.setLocalDescription(offer);
    if(! this.canTrickleIceCandidates) {
      await this.iceCandidatesGathered();
    }
    return this.sendSDP();
  }

  /**
   * Automagically do an ICE restart if we switch out which servers we use.
   * this will trigger onnegotiationneed event which calls `renegotiate()`
   *
   * @param {Object} configuration The RTCPeerConnection configuration
   * @return {void}
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
   *
   * @returns {Promise} a promise which resolves when the SDP message has been sent to Urbit for forwarding to
   * the remote peer. Resolution does *not* entail receipt by the remote peer.
   */
  async sendSDP() {
    console.log('localDescription', this.localDescription);
    console.log('pendingLocalDescription', this.pendingLocalDescription);
    console.log('currentLocalDescription', this.currentLocalDescription);
    return this.urbit.poke({ app: 'switchboard', mark: 'switchboard-call-signal', json: { uuid: this.uuid, signal: { type: 'sdp', sdp: this.localDescription.toJSON() } } });
  }

  /**
   * Return a promise that resolves immediately if the iceGatheringState is "complete",
   * or remains unresolved until the iceGatheringState becomes "complete"
   *
   * @returns {Promise} a promise which resolves when the 'iceGatheringState' changes to 'complete'
   */
  async iceCandidatesGathered() {
    const controller = new AbortController();
    const p = new Promise((resolve) => {
      this.addEventListener('icegatheringstatechange', () => {
        if(this.iceGatheringState == 'complete') {
          resolve();
        }
      }, { signal: controller.signal });
      if(this.iceGatheringState == 'complete') {
        p.resolve();
      }
}).then(() => controller.abort());
    return p;
  }
}

/**
 * Event for incoming calls
 */
class UrbitRTCIncomingCallEvent extends Event {
  /**
   * Not to be called by application code
   *
   * @param {string} peer The peer ship calling
   * @param {string} dap The peer dap calling
   * @param {string} uuid The UUID of the call
   * @param {Object} urbit The Urbit airlock
   * @param {Object} configuration The configuration for the new connection if answered
   */
  constructor(peer, dap, uuid, urbit, configuration) {
    super('incomingcall');
    this.peer = peer;
    this.dap = dap;
    this.uuid = uuid;
    this.urbit = urbit;
    this.configuration = configuration;
  }

  get call() {
    return { peer: this.peer, dap: this.dap, uuid: this.uuid };
  }

  /**
   * Answer the call.
   *
   * @returns {UrbitRTCPeerConnection} An UrbitRTCPeerConnection connected to the caller
   */
  answer() {
    return new UrbitRTCPeerConnection(this.peer, this.dap, this.uuid, this.urbit, this.configuration);
  }

  async reject() {
    return this.urbit.poke({ app: 'switchboard', mark: 'switchboard-reject', json: this.uuid });
  }
}

class UrbitRTCHungupCallEvent extends Event {
  /**
   * Not to be called by application code
   *
   * @param {string} uuid The UUID of the call which hung up
   */
  constructor(uuid) {
    super('hungupcall');
    this.uuid = uuid;
  }
}

class UrbitRTCStateChangedEvent extends Event {
  constructor(uuid, state) {
    super('statechanged');
    this.uuid = uuid;
    this.urbitState = state;
  }
}

export default UrbitRTCApp;
export { UrbitRTCApp, UrbitRTCPeerConnection };

