import React from 'react';
import { useStore } from '../stores/root';

// eslint-disable-next-line
export const IceServers = () => {
  const { urchatStore } = useStore();
  const servers = urchatStore.configuration.iceServers;

  return (
    <div className="iceServers">
      <h4>ICE servers</h4>
      {servers.map((server, idx) => (
        <pre key={idx}>{server.urls}</pre>
      ))}
    </div>
  );
}