import create from 'zustand';
import { UrbitRTCApp } from 'switchboard';
import Icepond from 'icepond';
import Urbit from '@urbit/http-api';

const dap = 'urchatfm';

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
  addTrackToCall: any;
  removeTrackFromCall: any;
  setOnTrack: any;
  hangup: any;
  hungup: any;
}

const useMock = import.meta.env.MODE === 'mock';

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
  return {
    urbit: null,
    icepond: null,
    configuration: { iceServers: [] },
    urbitRtcApp,
    incomingCall: useMock ? { call: { peer: '~nocsyx-lassul' }, reject: () => {} } : null,
    ongoingCall: null,
    isCaller: false,
    setUrbit: urbit => {
      const instance = useMock ? {} as Urbit : urbit;
      get().urbitRtcApp.urbit = instance;
      set({ urbit: instance });
    },
    startIcepond: () => set((state) => {
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
    placeCall: (ship, setHandlers) => set((state) => {
      console.log('placeCall');
      const conn = state.urbitRtcApp.call(ship, dap);
      setHandlers(conn);
      conn.addEventListener('hungupcall', state.hungup);
      conn.initialize();
      const call = { peer: ship, dap: dap, uuid: conn.uuid };
      state.startIcepond();
      return {
        ...state,
        isCaller: true,
        ongoingCall: { conn: conn, call: call }
      };
    }),
    answerCall: setHandlers => set((state) => {
      if (useMock) {
        setHandlers('~lassul-nocsyx', { uuid: '000', addEventListener: () => {} }, {});
        return {
          ...state,
          isCaller: false,
          ongoingCall: { conn: { 
            ontrack: () => {}, 
            addTrack: () => {},
            removeTrack: () => {},
            close: () => {}
          }, call: () => {} },
          incomingCall: null
        }
      }

      const call = state.incomingCall.call;
      const conn = state.incomingCall.answer();
      conn.addEventListener('hungupcall', state.hungup);
      setHandlers(call.peer, conn);
      conn.initialize();
      state.startIcepond();
      return {
        ...state, 
        isCaller: false,
        ongoingCall: { conn, call },
        incomingCall: null
      };
    }),

    rejectCall: () => set((state) => {
      state.incomingCall.reject();
      return { incomingCall: null };
    }),

    setOnTrack: onTrack => set((state) => {
      state.ongoingCall.conn.ontrack = onTrack;
    }),

    hangup: () => set((state) => {
      state.ongoingCall.conn.close();
      return { ...state, ongoingCall: null };
    }),

    hungup: () => set({ ongoingCall: null })
  };
});

export default useUrchatStore;
