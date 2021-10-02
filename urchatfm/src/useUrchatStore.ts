import create from 'zustand';
import { UrbitRTCApp } from 'switchboard';
import Icepond from 'icepond';
import Urbit from '@urbit/http-api';
import { useMock } from './util';

const dap = 'urchatfm';

export const mockIncomingCall = { call: { peer: '~nocsyx-lassul' }, reject: () => {} };

interface UrchatStore {
  urbit: Urbit | null;
  urbitRtcApp: any;
  icepond: any;
  configuration: any;
  incomingCall: any;
  ongoingCall: any;
  isCaller: boolean;
  setUrbit: (ur: Urbit) => void;
  startIcepond: any;
  placeCall: any;
  answerCall: any;
  rejectCall: any;
  setOnTrack: any;
  hangup: any;
  hungup: any;
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

      set({
        isCaller: true,
        ongoingCall: { conn, call }
      });
    },
    answerCall: async setHandlers => {
      if (useMock) {
        setHandlers('~lassul-nocsyx', { uuid: '000', addEventListener: () => {} }, {});
        set({
          isCaller: false,
          ongoingCall: { conn: { 
            ontrack: () => {}, 
            addTrack: () => {},
            removeTrack: () => {},
            close: () => {}
          }, call: () => {} },
          incomingCall: null
        })
      }

      const { incomingCall, hungup, startIcepond } = get();
      const call = incomingCall.call;
      const conn = incomingCall.answer();
      conn.addEventListener('hungupcall', hungup);
      setHandlers(call.peer, conn, call);
      await conn.initialize();
      startIcepond();
      
      set({ 
        isCaller: false,
        ongoingCall: { conn, call },
        incomingCall: null
      });
    },

    rejectCall: () => set((state) => {
      state.incomingCall.reject();
      return { incomingCall: null };
    }),

    setOnTrack: onTrack => set((state) => {
      state.ongoingCall.conn.ontrack = onTrack;
    }),

    hangup: () => set((state) => {
      if (!useMock) {
        state.ongoingCall.conn.close();
      }
      return { ...state, ongoingCall: null };
    }),

    hungup: () => set({ ongoingCall: null })
  };
});

export default useUrchatStore;
