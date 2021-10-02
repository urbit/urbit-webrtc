import create from 'zustand';
import { UrbitRTCApp } from 'switchboard';
import Icepond from 'icepond';
import Urbit from '@urbit/http-api';
import { useMock } from './util';

const dap = 'urchatfm';

const mockCall = { peer: '~nocsyx-lassul', dap: '123', uuid: '123' }
export const mockIncomingCall = { 
  ...mockCall, 
  call: mockCall,
  urbit: {},
  configuration: {},
  answer: () => {},
  dial: () => {},
  reject: () => {} 
};

export type Call = {
  peer: string;
  dap: string;
  uuid: string;
}

export type Connection = Call & RTCPeerConnection & {
  initialize: () => void;
  dial: () => Promise<void>;
  ring: (uuid: string) => Promise<void>;
  subscribe: () => Promise<void>;
  close: () => void;
  remoteHungup: () => void;
  closeWithError: (err: string) => void;
}

export interface OngoingCall {
  conn: Connection;
  call: Call;
}

export interface IncomingCall extends Call {
  call: Call;
  urbit: Urbit;
  configuration: {}
  answer: () => Connection
  reject: () => {}
}

interface UrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: any;
  icepond: any;
  configuration: any;
  incomingCall: IncomingCall;
  ongoingCall: OngoingCall;
  isCaller: boolean;
  setUrbit: (ur: Urbit) => void;
  startIcepond: any;
  placeCall: (ship: string, setHandlers: (conn: Connection) => void) => Promise<any>;
  answerCall: (setHandlers: (ship: string, conn: Connection) => void) => Promise<any>;
  rejectCall: () => void;
  setOnTrack: (onTrack: (evt: Event & { track: MediaStreamTrack }) => void) => void;
  hangup: () => void;
  hungup: () => void;
}

const useUrchatStore = create<UrchatStore>((set, get) => {
  const configuration = { iceServers: [] };
  const urbitRtcApp = new UrbitRTCApp(dap, configuration);
  urbitRtcApp.addEventListener('incomingcall', incomingCallEvt => {
    if(get().incomingCall === null) {
      set({ incomingCall: incomingCallEvt });
    } else {
      incomingCallEvt.reject();
    }
  });

  const urbit = useMock ? { ship: '', subscribe: async () => {} } as any : new Urbit('', '');
  // requires <script> tag for /~landscape/js/session.js
  urbit.ship = (window as any).ship;
  urbitRtcApp.urbit = urbit;

  return {
    urbit,
    icepond: null,
    configuration: { iceServers: [] },
    urbitRtcApp,
    incomingCall: null,
    ongoingCall: null,
    isCaller: false,
    setUrbit: urbit => {
      const instance = useMock ? {} as Urbit : urbit;
      get().urbitRtcApp.urbit = instance;
      set({ urbit: instance });
    },
    startIcepond: () => set((state) => {
      if (useMock) {
        set({ icepond: {} })
      }

      const icepond = new Icepond(state.urbit);
      icepond.oniceserver = (evt) => {
        set((state) => {
          const newConfig = { ...state.configuration, iceServers: evt.iceServers };
          if(state.urbitRtcApp !== null) {
            state.urbitRtcApp.configuration = newConfig;
          }
          if(state.incomingCall !== null) {
            state.incomingCall.configuration = newConfig;
          }
          if(state.ongoingCall !== null) {
            state.ongoingCall.conn.setConfiguration(newConfig);
          }
          return { ...state, configuration: newConfig };
        }, true);
      };
      icepond.initialize();
      set({ icepond: icepond });
    }),
    placeCall: async (ship, setHandlers) => {
      const { urbitRtcApp, hungup, startIcepond } = get();
      console.log('placeCall');
      const conn = urbitRtcApp.call(ship, dap);
      setHandlers(conn);
      conn.addEventListener('hungupcall', hungup);
      await conn.initialize();
      const call = { peer: ship, dap: dap, uuid: conn.uuid };
      startIcepond();

      const ongoingCall = { conn, call };
      set({
        isCaller: true,
        ongoingCall
      });

      return ongoingCall;
    },
    answerCall: async setHandlers => {
      if (useMock) {
        const call = {
          peer: '~lassul-nocsyx',
          uuid: '000'
        } 
        setHandlers('~lassul-nocsyx', { ...call, addEventListener: () => {} } as any);
        const ongoingCall = { 
          conn: {
            ...call, 
            ontrack: () => {}, 
            addTrack: () => {},
            removeTrack: () => {},
            close: () => {}
          }, 
          call
        } as any;

        set({
          isCaller: false,
          ongoingCall,
          incomingCall: null
        })
        
        return ongoingCall;
      }

      const { incomingCall, hungup, startIcepond } = get();
      const call = incomingCall.call;
      const conn = incomingCall.answer();
      conn.addEventListener('hungupcall', hungup);
      setHandlers(call.peer, conn);
      await conn.initialize();
      startIcepond();

      const ongoingCall = { conn, call };
      set({ 
        isCaller: false,
        ongoingCall,
        incomingCall: null
      });

      return ongoingCall;
    },

    rejectCall: () => set((state) => {
      state.incomingCall.reject();
      return { incomingCall: null };
    }),

    setOnTrack: onTrack => set((state) => {
      state.ongoingCall.conn.ontrack = onTrack;
    }),

    hangup: () => set((state) => {
      if (!useMock && state.ongoingCall) {
        state.ongoingCall.conn.close();
      }
      return { ...state, ongoingCall: null };
    }),

    hungup: () => set({ ongoingCall: null })
  };
});

export default useUrchatStore;
