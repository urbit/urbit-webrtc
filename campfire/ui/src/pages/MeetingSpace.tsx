import React, { FC, useState } from "react";
import styled from "styled-components";
import { Flex, Spinner, Ship, Text, Dialog, Button } from "@holium/design-system";
import { useStore } from "../stores/root";
import { observer } from "mobx-react";
import { Chat } from "../components/Chat";
import { Call } from "../components/Call";
import { Campfire } from "../icons/Campfire";
import { deSig } from '@urbit/api';
import { useHistory } from "react-router";
import "../styles/animations.css"

const Main = styled.main`
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  background: #fbfbfb;
`;

export const MeetingSpace: FC<any> = observer(() => {
  const { mediaStore, urchatStore } = useStore();
  const { push } = useHistory();
  // const [showSidebar, setShowSidebar] = useState(false);

  const sendMessage = (msg: string) => {
    urchatStore.dataChannel?.send(msg);
    const newMessages = [{ speaker: "me", message: msg }].concat(urchatStore.messages);
    console.log(urchatStore.messages, newMessages);
    urchatStore.setMessages(newMessages);
  }

  return (
    <Flex
      style={{ background: "#FBFBFB" }}
      flex={1}
      height="100vh"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
      <Flex
        style={{ background: "#EBEBEB" }}
        width="75%"
        height="90%"
        m={10}
        justifyContent="center"
        alignItems="center"
      >
        {!urchatStore.dataChannelOpen && (
          <Flex
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Campfire className="animate" />
            <Text fontSize={5} fontWeight={400} opacity={0.9}>Please wait while your ship connects to the call...</Text>
          </Flex>
        )}
        {urchatStore.dataChannelOpen && (
          <Call />
        )}
      </Flex>
      <Flex
        width="25%"
        flexDirection="column"
        gap={6}
        m={10}
        height="90%"
      >
        <Text fontSize={5} fontWeight={400} opacity={0.9}>Participants</Text>
        <Ship patp={"~" + deSig(urchatStore.urbit.ship)} />
        {urchatStore.dataChannelOpen && (
          <Ship patp={"~" + deSig(urchatStore.ongoingCall.call.peer)} />
        )}
        <Text fontSize={5} fontWeight={400} opacity={0.9} size={20} title="Messages sent over WebRTC">Chat</Text>
        <Chat ready={urchatStore.dataChannelOpen} messages={urchatStore.messages} sendMessage={sendMessage} />
      </Flex>
      <Dialog
        title="Remote Hangup"
        variant="simple"
        hasCloseButton={false}
        primaryButton={
          <Button
            style={{ fontSize: 20, borderRadius: 6, width: "100%" }}
            variant="custom"
            bg="#F8E390"
            color="#333333"
            onClick={() => push("/")}
          >Go to Campfire home</Button>
        }
        backdropOpacity={0.3}
        closeOnBackdropClick={false}
        isShowing={urchatStore.wasHungUp}
      >
        The peer has hungup the call with you. Sad!
      </Dialog>
    </Flex>
  );
});
