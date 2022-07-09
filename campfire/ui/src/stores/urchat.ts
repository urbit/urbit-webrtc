import create from "zustand";
import {
  UrbitRTCApp,
  UrbitRTCIncomingCallEvent,
  UrbitRTCPeerConnection,
} from "switchboard";
import Icepond from "icepond";
import Urbit from "@urbit/http-api";
import { useMock } from "../util";
import { action, makeObservable } from "mobx";

const dap = "campfire";

const mockCall = { peer: "~nocsyx-lassul", dap: "123", uuid: "123" };
export const mockIncomingCall = {
  ...mockCall,
  call: mockCall,
  urbit: {},
  configuration: {},
  answer: () => {},
  dial: () => {},
  reject: () => {},
};

export type Call = {
  peer: string;
  dap: string;
  uuid: string;
};

export interface OngoingCall {
  conn: UrbitRTCPeerConnection;
  call: Call;
}

interface IUrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: UrbitRTCApp;
  icepond: Icepond;
  configuration: RTCConfiguration;
  incomingCall: UrbitRTCIncomingCallEvent;
  ongoingCall: OngoingCall;
  isCaller: boolean;
  setUrbit: (ur: Urbit) => void;
  startIcepond: () => void;
  placeCall: (
    ship: string,
    setHandlers: (conn: UrbitRTCPeerConnection) => void
  ) => Promise<any>;
  answerCall: (
    setHandlers: (ship: string, conn: UrbitRTCPeerConnection) => void
  ) => Promise<any>;
  rejectCall: () => void;
  hangup: () => void;
  hungup: () => void;
}

export class UrchatStore implements IUrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: UrbitRTCApp;
  icepond: Icepond;
  configuration: RTCConfiguration;
  incomingCall: UrbitRTCIncomingCallEvent;
  ongoingCall: OngoingCall;
  isCaller: boolean;

  constructor() {
    makeObservable(this);
    this.configuration = { iceServers: [] };
    this.urbitRtcApp = new UrbitRTCApp(dap, this.configuration);
    this.urbitRtcApp.addEventListener(
      "incomingcall",
      (incomingCallEvt: UrbitRTCIncomingCallEvent) => {
        if (this.incomingCall === null) {
          this.incomingCall = incomingCallEvt;
        } else {
          incomingCallEvt.reject();
        }
      }
    );

    this.urbit = useMock
      ? ({ ship: "", subscribe: async () => {} } as any)
      : new Urbit("", "");
    // requires <script> tag for /~landscape/js/session.js
    this.urbit.ship = (window as any).ship;
    this.urbitRtcApp.urbit = this.urbit;
  }

  @action
  setUrbit(urbit: Urbit) {
    const instance = useMock ? ({} as Urbit) : urbit;
    this.urbitRtcApp.urbit = instance;
    this.urbit = instance;
  }

  @action
  startIcepond() {
    if (useMock) {
      this.icepond = {} as Icepond;
    }
    console.log("YOU HAVE AUTHED WITH: " + this.urbit.ship);
    console.log("attempting icepond");
    const icepond = new Icepond(this.urbit);
    // on start
    icepond.oniceserver = (evt) => {
      const newConfig = {
        ...this.configuration,
        iceServers: evt.iceServers,
      };
      console.log("icepond config:");
      console.log(newConfig);
      if (this.urbitRtcApp !== null) {
        this.urbitRtcApp.configuration = newConfig;
      }
      if (this.incomingCall !== null) {
        this.incomingCall.configuration = newConfig;
      }
      if (this.ongoingCall !== null) {
        this.ongoingCall.conn.setConfiguration(newConfig);
      }

      return { ...this, configuration: newConfig };
    };
    icepond.initialize();
    this.icepond = icepond;
  }

  @action
  async placeCall(
    ship: string,
    setHandlers: (conn: UrbitRTCPeerConnection) => void
  ) {
    const { urbitRtcApp, hungup, startIcepond } = this;
    console.log("placeCall");
    const conn = urbitRtcApp.call(ship, dap);
    setHandlers(conn);
    conn.addEventListener("hungupcall", hungup);
    await conn.initialize();
    const call = { peer: ship, dap: dap, uuid: conn.uuid };
    startIcepond();

    const ongoingCall = { conn, call };
    (this.isCaller = true), (this.ongoingCall = ongoingCall);

    return ongoingCall;
  }
  async answerCall(
    setHandlers: (ship: string, conn: UrbitRTCPeerConnection) => void
  ) {
    if (useMock) {
      const call = {
        peer: "~lassul-nocsyx",
        uuid: "000",
      };
      setHandlers("~lassul-nocsyx", {
        ...call,
        addEventListener: () => {},
      } as any);
      const ongoingCall = {
        conn: {
          ...call,
          ontrack: () => {},
          addTrack: () => {},
          removeTrack: () => {},
          close: () => {},
        },
        call,
      } as any;

      this.isCaller = false;
      this.ongoingCall = ongoingCall;
      this.incomingCall = null;

      return ongoingCall;
    }
    const { incomingCall, hungup, startIcepond } = this;
    const call = incomingCall.call;
    const conn = incomingCall.answer();
    conn.addEventListener("hungupcall", hungup);
    setHandlers(call.peer, conn);
    await conn.initialize();
    startIcepond();

    const ongoingCall = { conn, call };
    this.isCaller = false;
    this.ongoingCall = ongoingCall;
    this.incomingCall = null;

    return ongoingCall;
  }

  async reconnectCall(uuid, setHandlers) {
    const urbit = this.urbit;
    const conn = await UrbitRTCPeerConnection.reconnect({ urbit, uuid });
    const call = { uuid, peer: conn.peer, dap: conn.dap };
    const ongoingCall = { call, conn };

    const { hungup, startIcepond } = this;
    conn.addEventListener("hungupcall", hungup);
    setHandlers(call.peer, conn);
    await conn.initialize();
    startIcepond();

    this.ongoingCall = ongoingCall;
    return ongoingCall;
  }
  rejectCall() {
    this.incomingCall.reject();
    return { incomingCall: null };
  }
  hangup() {
    if (!useMock && this.ongoingCall) {
      this.ongoingCall.conn.close();
    }
    return { ...this, ongoingCall: null };
  }
  hungup() {
    this.ongoingCall = null;
  }
}
