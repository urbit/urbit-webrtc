import React from 'react';
import { useStore } from '../stores/root';
import { Button, Text } from "@holium/design-system";

// eslint-disable-next-line
export const IceServers = () => {
  const { urchatStore } = useStore();
  const servers = urchatStore.configuration.iceServers;

  // poking from dojo works well with something like
  // :icepond &set-fetcher-config [%these-servers ~[[%server urls=~['stun:coturn.holium.live:3478'] auth=~]]]
  // const clickButton = () => {
  //   console.log("hit button");
  //   urchatStore.urbit.poke({
  //       app: 'icepond',
  //       mark: 'ice-server',
  //       json: {
  //         "server": {
  //           "urls": ["turn:asdad"],
  //           "authentication": {}
  //         }
  //       }
  //     }
  //   )
  // }


  return (
    <div className="iceServers">
      <Text fontSize={6} fontWeight={400}>
        ICE servers
      </Text>
      {servers.map((server, idx) => (
        <Text key={idx} fontSize={3} fontWeight={100}>{server.urls}</Text>
      ))}
      <br />
      <a href="/docs/campfire/iceservers" title="link to %docs">
        <Text fontSize={4} fontWeight={300}>%docs for configuring ICE servers</Text>
      </a>
      {/* <Button onClick={clickButton}>Add new server</Button> */}
    </div>
  );
}