import './App.css';
import { Icepond } from 'icepond';
import Urbit from '@urbit/http-api';
import { useEffect, useState } from 'react';
import useStatefulRef from '@bedrock-layout/use-stateful-ref';
import React from 'react';

function App() {
  const urbitRef = useStatefulRef(null);

  useEffect(() => {
    Urbit.authenticate({
        ship: 'zod',
        url: 'localhost:8080',
        code: 'lidlut-tabwed-pillex-ridrup',
        verbose: 'true'
      }).then((ur) => {
        urbitRef.current = ur;
      });
  // We are setting up a ref, we don't want to trip again when it changes
  // eslint-disable-next-line
  }, []);

  const urbit = urbitRef.current;

  const [iceState, setIceState] = useState(null);
  const [iceServers, setIceServers] = useState([]);

  const canStartIce = (urbitRef.current !== null) && ((iceState === null) || (iceState === 'done') || (iceState === 'error'));

  const startIce = () => {
    const icepond = new Icepond(urbit);
    setIceServers([]);
    icepond.addEventListener('statechanged', evt => setIceState(evt.state));
    icepond.addEventListener('iceserver', evt => setIceServers(icepond.iceServers));
    icepond.initialize();
  };

  return (
    <div>
      <div><span style={{ 'fontWeight': 'bold' }}>ICE state</span>{iceState === null ? '' : iceState}</div>
      <div><ul>{iceServers.map((server, i) =>
                <li key={i}>{JSON.stringify(server)}</li>
              )}
           </ul>
      </div>
      <button onClick={startIce} disabled={!canStartIce}>Start ICE Acquisition</button>
    </div>
  );
}

export default App;
