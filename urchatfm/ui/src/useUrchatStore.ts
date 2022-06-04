import create from 'zustand';
import { UrbitRTCApp, UrbitRTCIncomingCallEvent, UrbitRTCPeerConnection } from 'switchboard';
import Icepond from 'icepond';
import Pals from 'pals'
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

export interface OngoingCall {
  conn: UrbitRTCPeerConnection;
  call: Call;
}

interface UrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: UrbitRTCApp;
  icepond: Icepond;
  configuration: RTCConfiguration;
  incomingCall: UrbitRTCIncomingCallEvent;
  ongoingCall: OngoingCall;
  isCaller: boolean;
  setUrbit: (ur: Urbit) => void;
  startIcepond: () => void;
  fetchPals: () => void;
  placeCall: (ship: string, setHandlers: (conn: UrbitRTCPeerConnection) => void) => Promise<any>;
  answerCall: (setHandlers: (ship: string, conn: UrbitRTCPeerConnection) => void) => Promise<any>;
  rejectCall: () => void;
  hangup: () => void;
  hungup: () => void;
}

const useUrchatStore = create<UrchatStore>((set, get) => {
  const configuration = { iceServers: [] };
  const urbitRtcApp = new UrbitRTCApp(dap, configuration);
  urbitRtcApp.addEventListener('incomingcall', (incomingCallEvt: UrbitRTCIncomingCallEvent) => {
    if(get().incomingCall === null) {
      set({ incomingCall: incomingCallEvt });
    } else {
      incomingCallEvt.reject();
    }
  });
  console.log("useMock:" + useMock);

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
        set({ icepond: {} as Icepond })
      }

      console.log("attempting icepond");
      const icepond = new Icepond(state.urbit);
      icepond.oniceserver = (evt) => {
        set((state) => {
          const newConfig = { ...state.configuration, iceServers: evt.iceServers };
          console.log("icepond config:");
          console.log(newConfig);
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
    fetchPals: () => set((state) => {
      console.log("urchat store fetch pals");
      const p = new Pals(state.urbit);
      p.getPals();
    }),
    placeCall: async (ship, setHandlers) => {
      const { urbitRtcApp, hungup, startIcepond, fetchPals } = get();
      fetchPals();
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
    reconnectCall: async (uuid, setHandlers) => {
      const urbit = get().urbit;
      const conn = await UrbitRTCPeerConnection.reconnect({ urbit, uuid });
      const call = { uuid, peer: conn.peer, dap: conn.dap };
      const ongoingCall = { call, conn };
      
      const { hungup, startIcepond } = get();
      conn.addEventListener('hungupcall', hungup);
      setHandlers(call.peer, conn);
      await conn.initialize();
      startIcepond();

      set({ ongoingCall });
      return ongoingCall;
    },

    rejectCall: () => set((state) => {
      state.incomingCall.reject();
      return { incomingCall: null };
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
