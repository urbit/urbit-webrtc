import React from 'react';
import useUrchatStore from '../useUrchatStore';

// eslint-disable-next-line
function IceServers() {
  const servers = useUrchatStore(state => state.configuration.iceServers);

  return (
    <div className="iceServers">
      <h4>Ice servers</h4>
      { servers.map((server, idx) => (
        <pre key={idx}>{server}</pre>
      ))}
    </div>
  );
}