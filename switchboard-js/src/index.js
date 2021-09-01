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
    return new Promise((resolveOuter) => {
      this.done = new Promise(resolve => this._urbit.subscribe({ app: 'switchboard', path: `/incoming/${this.dap}`, err: err => this.onerror(err), event: evt => this.handleIncoming(evt), quit: () => resolve() }).then(() => resolveOuter()));
    });
  }

  handleIncoming(evt) {
    if(evt.type == 'incoming') {
      this.incomingCall(evt);
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
    const callEvent = new UrbitRTCIncomingCallEvent(call.peer, this.dap, call.uuid, this._urbit, this.configuration);
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
    // uuid of the call
    // If left unspecified then we are the caller and need to generate one
    this.uuid = uuid;
    // Subscription ID of our subscription to /call/[uuid]
    this.subscriptionId = null;
    // Error-handling callback
    this.onerror = (err) => {};
    // State-change callback
    this.onurbitstatechanged = (state) => {};
    // Signal readiness to send SDP messages
    this.signallingReady = null;
    // Urbit ready signalling state
    this.signallingReadyPromise = new Promise(ready => this.signallingReady = () => {
      this.signallingReady = () => { return; };
      ready();
    });
    // ICE candidate callback
    this.onicecandidate = (evt) => this.signallingState.whenDoneSending(() => {
      // Always trickle ICE candidates, if we can
      if((evt.candidate !== null) && this.canTrickleIceCandidates) {
        this.signallingReadyPromise.then(() => { 
          if(this.urbit.verbose) {
            console.log("Sending ICE candidate for address ${evt.candidate.address}:${evt.candidate.port}");
          };
          this.urbit.poke({ app: 'switchboard', mark: 'switchboard-from-client', json: { 'uuid': this.uuid, 'tag': 'icecandidate', ...evt.candidate.toJSON() } }) }).catch(err => this.closeWithError(err));
        };
      });

    // Renegotiation callback, called when media channels are added/deleted
    //
    // Create an SDP offer and send it to our peer
    this.onnegotiationneeded = () => this.renegotiate();

    // Urbit state is null until we initialize
    this.urbitState = null;

    // Signalling state is used to prevent client-side races
    this.signallingState = new UrbitRTCSignallingState();

    // 
  }

  async initialize() {
    // Kick things off
    if(typeof this.uuid == 'undefined') {
      this.dispatchUrbitState('dialing');
      await this.dial();
    } else {
      this.dispatchUrbitState('incoming-ringing');
      await this.subscribe();
    }
  }

  /**
   * Obtain a UUID and start a call
   *
   * @return {Promise} a promise which resolves when the call is ringing
   */
  async dial() {
    await this.urbit.subscribe({
      app: 'switchboard',
      path: '/uuid',
      err: err => this.closeWithError(err),
      event: uuid => this.ring(uuid),
      quit: () => { return; }
    });
  }

  /** With a UUID, tell switchboard about our call
   * @param {string} uuid the UUID of our new call
   * @returns {Promise} a promise which resolves when we have successfuly subscribed to the call.
   */
  async ring(uuid) {
    this.uuid = uuid;
    if(this.urbit.verbose) {
      console.log('Call UUID:', this.uuid);
    }
    await this.urbit.poke({
      app: 'switchboard',
      mark: 'switchboard-from-client',
      json: {
        'uuid': this.uuid,
        'tag': 'place-call',
        'peer': this.peer,
        'dap': this.dap
      }
    }).catch(err => this.closeWithError(err));
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
      event: fact => this.handleFact(fact),
      quit: () => this.remoteHungup()
    });
  }

  /**
   * Make sure that when .close() is called we unsubscribe from the Urbit channel as well
   *
   * @returns {void}
   */
  close() {
    this.urbit.poke({ app: 'switchboard', mark: 'switchboard-from-client', json: {'tag': 'reject', 'uuid': this.uuid } }).then(this.urbit.unsubscribe(this.subscriptionId)).then(super.close());
  }

  /**
   * Call hung up remotely
   *
   * @returns {void}
   */
  remoteHungup() {
    if(this.connectionState != 'closed') {
      super.close();
      super.dispatchEvent(new UrbitRTCHungupCallEvent(this.uuid));
    }
  }

  /**
   * Close and call the error callback
   *
   * @param {string} err The error
   * @returns {void}
   */
  closeWithError(err) {
    this.close();
    console.log('Closed with error', err);
    this.onerror(err);
  }

  // Actually send a signal when we are ready to
  async sendSignal() {
    const signalType = this.signallingState.waitingType();
    if(this.urbit.verbose) {
      console.log("Sending SDP ${signalType}");
    }
    this.signallingState.sending();
    if(signalType === 'offer') {
      const offer = await this.createOffer();
      await this.setLocalDescription(offer);
      if(!this.canTrickleIceCandidates) {
        await this.iceCandidatesGathered();
      }
    } else {
      const answer = await this.createAnswer();
      await this.setLocalDescription(answer);
      if(!this.canTrickleIceCandidates) {
        await this.iceCandidatesGathered();
      }
    }
    await this.urbit.poke({ app: 'switchboard', mark: 'switchboard-from-client', json: { 'uuid': this.uuid, 'tag': 'sdp', ...this.localDescription.toJSON() } });
    await this.signallingState.doneSending(this.askSignal);
  }

  async askSignal() {
    await this.urbit.poke({ app: 'switchboard', mark: 'switchboard-from-client', json: { 'uuid': this.uuid, 'tag': 'ask-signal' } });
  }

  // Move to a state to await sending?
  async askSendSignal(signalType) {
    await this.signallingReadyPromise;
    switch(signalType) {
      case 'offer':
        this.signallingState.needToMakeOffer();
        break;
      case 'answer':
        this.signallingState.gotOffer();
        break;
      default:
        throw('signalType must be offer or answer');
    }
    await this.askSignal();
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
  handleFact(fact) {
    switch(fact.tag) {
      case 'connection-state':
        this.signallingState.whenDoneSettingRemote(() => this.dispatchUrbitState(fact.connectionState));
        return;
      case 'hungup':
        this.remoteHungup();
        return;
      case 'sdp':
        if(this.urbit.verbose) {
          console.log("Got SDP ${fact.type}");
        }
        this.signallingState.startSettingRemote();
        this.handleSDP(fact).then(() => this.signallingState.doneSettingRemote());
        return;
      case 'icecandidate':
        if(this.urbit.verbose) {
          const candidate = new RTCIceCandidate(fact);
          console.log("Got ICE candidate with address ${candidate.address}:${candidate.port}");
        }
        // We got an ICE candidate from the remote peer
        // try it out
        this.signallingState.whenDoneSettingRemote(() => {
          this.addIceCandidate(fact);
        });
    }
  }

  async handleSDP(sdp) {
    // Tell the RTCPeerConnection logic about the remote signal
    await this.setRemoteDescription(sdp);
    // If this was an offer, then the remote peer is trying to (re)negotiate
    // and we should answer them
    if(sdp.type === 'offer') {
      await this.askSendSignal('answer');
    }
    return;
  }

  dispatchUrbitState(state) {
    if(this.urbit.verbose) {
      console.log('Switchboard state', state)
    };
    switch(state) {
      case 'connected-our-turn':
      case 'connected-their-turn':
        this.signallingReady();
        break;
      case 'connected-our-turn-asked':
        this.sendSignal().catch(err => this.closeWithError(err));
        break;
      default:
        break;
    };
    this.urbitState = state;
    const evt = new UrbitRTCStateChangedEvent(this.uuid, state);
    this.dispatchEvent(evt);
    this.onurbitstatechanged(evt);
  }

  /** Called when negotiation is required
   *
   * @returns {Promise} a promise which resolves when renegotiation is complete
   */
  async renegotiate() {
    await this.askSendSignal('offer');
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
        resolve();
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
    return this.urbit.poke({ app: 'switchboard', mark: 'switchboard-from-client', json: {'tag': 'reject', 'uuid': this.uuid } });
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

// signalling state
// 'stable'
// 'waiting-to-send-offer'
// 'waiting-to-send-answer'
// 'sending'
// 'sending-waiting-to-send-offer'
class UrbitRTCSignallingState extends EventTarget {
  constructor() {
    super();
    this._settingRemote = false;
    this._settingRemoteDoneK = () => { return; }
    this._whenDoneSendingK = () => { return; }
    this._state = 'stable';
  };

  startSettingRemote() {
    this._settingRemote = true;
  }

  doneSettingRemote() {
    this._settingRemote = false;
    this._settingRemoteDoneK();
    this._settingRemoteDoneK = () => { return; }
  }

  whenDoneSettingRemote(k) {
    if(this._settingRemote) {
      const oldK = this._settingRemoteDoneK;
      this._settingRemoteDoneK = () => { oldK(); k(); };
    } else {
      k()
    }
  }

  needToMakeOffer() {
    switch(this._state) {
      case 'stable':
        this._state = 'waiting-to-send-offer';
        break;
      case 'sending':
        this._state = 'sending-waiting-to-send-offer';
        break;
      case 'waiting-to-send-offer':
      case 'waiting-to-send-answer':
      case 'sending-waiting-to-send-offer':
        break;
    }
  }

  gotOffer() {
    switch(this._state) {
      case 'stable':
      case 'waiting-to-send-offer':
        this._state = 'waiting-to-send-answer';
        break;
      case 'waiting-to-send-answer':
        break;
      case 'sending':
      case 'sending-waiting-to-send-offer':
        throw('Cannot receive SDP while sending');
        break;
    }
  }

  sending() {
    switch(this._state) {
      case 'waiting-to-send-offer':
      case 'waiting-to-send-answer':
        this._state = 'sending';
        break;
      case 'sending':
      case 'sending-waiting-to-send-offer':
        throw('Cannot send while sending');
        break;
      case 'stable':
        throw('Cannot send with nothing to send');
        break;
    }
  }

  doneSending(sendOfferK) {
    switch(this._state) {
      case 'sending':
        this._state = 'stable';
        this._whenDoneSendingK();
        this._whenDoneSendingK = () => { return; }
        break;
      case 'sending-waiting-to-send-offer':
        this._state = 'waiting-to-send-offer';
        this._whenDoneSendingK();
        this._whenDoneSendingK = () => { return; }
        sendOfferK();
        break;
      default:
        throw('Cannot be done sending if not sending');
    }
  }

  whenDoneSending(k) {
    switch(this._state) {
      case 'stable':
        k(); break;
      default:
        const oldK = this._whenDoneSendingK;
        this._whenDoneSendingK = () => { oldK(); k(); }
    }
  }

  waitingType() {
    switch(this._state) {
      case 'waiting-to-send-offer':
        return 'offer';
      case 'waiting-to-send-answer':
        return 'answer';
      default:
        throw('Asked for waiting type but not waiting to send anything');
    }
  }
}

export default UrbitRTCApp;
export { UrbitRTCApp, UrbitRTCPeerConnection };

