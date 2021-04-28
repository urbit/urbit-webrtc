import Urbit from '@urbit/http-api';
import useStatefulRef from '@bedrock-layout/use-stateful-ref';
import { useState } from 'react';
import React from 'react';

// eslint-disable-next-line
function Login(After) {
  const urbit = useStatefulRef(null);
  const [urbitErr, setUrbitErr] = useState('');
  const [awaitingUrbit, setAwaitingUrbit] = useState(false);
  const [ship, setShip] = useState('zod');
  const [url, setUrl] = useState('localhost:8081');
  const [code, setCode] = useState('lidlut-tabwed-pillex-ridrup');
  const handleSubmit = (event) => {
    Urbit.authenticate({ ship: ship, url: url, code: code, 'verbose': true })
      .then((ur) => {
        urbit.current = ur;
        setAwaitingUrbit(false);
      })
      .catch((err) => {
        setUrbitErr(err.toString());
        setAwaitingUrbit(false);
      });
    setAwaitingUrbit(true);
    event.preventDefault();
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Ship:
          <input type="text" value={ship} onChange={event => setShip(event.target.value)} disabled={awaitingUrbit} />
        </label>
        <label>
          URL:
          <input type="text" value={url} onChange={event => setUrl(event.target.value)} disabled={awaitingUrbit} />
        </label>
        <label>
          Code:
          <input type="password" value={code} onChange={event => setCode(event.target.value)} disabled={awaitingUrbit} />
        </label>
        <input type="submit" value="Connect" disabled={awaitingUrbit} />
      </form>
      <span className="Urbit-conn">
        {urbit.current === null ? 'disconnected' : urbit.current.channelUrl}
      </span>
      <div className="Urbit-err">
        {urbitErr}
      </div>
      <div className="Urbit-embedded-app">
        {urbit.current === null ? '' : (
         <After urbit={urbit.current} />
        )}
      </div>
    </div>
  );
}

export default Login;
