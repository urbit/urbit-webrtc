import React, { FC, useEffect } from "react";
import styled from "styled-components";
import {
  Flex,
  Ship,
  Text,
  Dialog,
  Button,
  Icons,
  Card,
} from "@holium/design-system";
import { useStore } from "../stores/root";
import { observer } from "mobx-react";
import { Chat } from "../components/Chat";
import { Call } from "../components/Call";
import { Campfire } from "../icons/Campfire";
import { deSig } from "@urbit/api";
import { useHistory } from "react-router";
import "../styles/animations.css";
import { SectionHeader } from "../components/SectionHeader";
import hangup from "../assets/hangup.wav";
import { rgba } from "polished";
import { ringing } from "../stores/media";
import { Controls } from "../components/Controls";

export const MeetingSpace: FC<any> = observer(() => {
  const { mediaStore, urchatStore } = useStore();
  const { push } = useHistory();

  // hangup call (properly) if exiting page
  useEffect(() => {
    window.addEventListener("beforeunload", urchatStore.hangup);
    return () => window.removeEventListener("beforeunload", urchatStore.hangup);
  }, []);

  // update devices if chrome devices change (like a USB microphone gets plugged in)
  useEffect(() => {
    const updateDevices = () => mediaStore.getDevices(urchatStore.ongoingCall);
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
  });

  useEffect(() => {
    if (urchatStore.ongoingCall?.call?.peer) {
      document.title = "Call with ~" + urchatStore.ongoingCall.call.peer;
    }
  }, [urchatStore.ongoingCall]);

  const sendMessage = (msg: string) => {
    urchatStore.dataChannel?.send(msg);
    const newMessages = [{ speaker: "me", message: msg }].concat(
      urchatStore.messages
    );
    urchatStore.setMessages(newMessages);
  };
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
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
        style={{ background: "#EBEBEB", position: "relative" }}
        borderRadius={20}
        width="75%"
        height="90%"
        m={10}
        justifyContent="center"
        alignItems="center"
      >
        {!urchatStore.dataChannelOpen && urchatStore.ongoingCall && (
          <Flex
            flexDirection="column"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Campfire className="animate" />
            {urchatStore.connectionState == "dialing" && (
              <Flex mt={2}>
                <Text mr={1} fontSize={5} fontWeight={400} opacity={0.9}>
                  Dialing{" "}
                </Text>
                <Text fontSize={5} fontWeight={500} opacity={0.9}>
                  {"~" + deSig(urchatStore.ongoingCall.call.peer)}
                </Text>
                <Text fontSize={5} fontWeight={400} opacity={0.9}>
                  ...
                </Text>
              </Flex>
            )}
            {urchatStore.connectionState == "ringing" && (
              <Flex mt={2}>
                <Text mr={1} fontSize={5} fontWeight={400} opacity={0.9}>
                  Waiting for{" "}
                </Text>
                <Text fontSize={5} fontWeight={500} opacity={0.9}>
                  {"~" + deSig(urchatStore.ongoingCall.call.peer)} to answer the
                  call
                </Text>
                <Text fontSize={5} fontWeight={400} opacity={0.9}>
                  ...
                </Text>
              </Flex>
            )}
            {urchatStore.connectionState == "answering" && (
              <Flex mt={2}>
                <Text mr={1} fontSize={5} fontWeight={400} opacity={0.9}>
                  Answering{" "}
                </Text>
                <Text fontSize={5} fontWeight={500} opacity={0.9}>
                  {"~" + deSig(urchatStore.ongoingCall.call.peer)}'s call
                </Text>
                <Text fontSize={5} fontWeight={400} opacity={0.9}>
                  ...
                </Text>
              </Flex>
            )}
            {urchatStore.connectionState.includes("connected") && (
              <>
                <Flex mt={2}>
                  <Text fontSize={5} fontWeight={400} opacity={0.9}>
                    Please wait while you connect to{" "}
                  </Text>
                  <Text fontSize={5} fontWeight={500} opacity={0.9}>
                    {"~" + deSig(urchatStore.ongoingCall.call.peer)}
                  </Text>
                  <Text fontSize={5} fontWeight={400} opacity={0.9}>
                    ...
                  </Text>
                </Flex>
                <Text fontSize={2} fontWeight={200} opacity={0.9}>
                  may take a minute to start this p2p connection
                </Text>
              </>
            )}
            <Flex mt={3}>
              <Button
                style={{
                  fontSize: 20,
                  borderRadius: 24,
                  height: 40,
                  width: 40,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
                variant="custom"
                bg={rgba("#CF3535", 0.12)}
                onClick={() => {
                  ringing.pause();
                  const audio = new Audio(hangup);
                  audio.volume = 0.8;
                  audio.play();
                  urchatStore.hangup();
                  mediaStore.stopAllTracks();
                  push("/");
                }}
              >
                <Icons.Leave size={24} color="#CF3535" />
              </Button>
            </Flex>
          </Flex>
        )}
        {urchatStore.dataChannelOpen && <Call />}
      </Flex>
      <Flex width="25%" flexDirection="column" gap={6} m={10} height="90%">
        <SectionHeader
          header="Participants"
          icon={
            <Icons.Participants
              opacity={0.5}
              fontSize="20px"
              color="text.primary"
              aria-hidden
            />
          }
        />
        <Card
          elevation="none"
          borderRadius={9}
          mt={1}
          mb={3}
          style={{ padding: 8, gap: 4 }}
        >
          <Flex gap={4} flexDirection="column">
            {/* TODO load contact store into local storage and lookup sigil metadata */}
            <Ship patp={"~" + deSig(urchatStore.urbit.ship)} color="#000000" />
            {urchatStore.dataChannelOpen && (
              <Ship
                patp={"~" + deSig(urchatStore.ongoingCall.call.peer)}
                color="#000000"
              />
            )}
          </Flex>
        </Card>
        <SectionHeader
          header="Chat"
          icon={
            <Icons.ChatLine
              opacity={0.5}
              fontSize="20px"
              color="text.primary"
              aria-hidden
            />
          }
        />
        <Chat
          ready={urchatStore.dataChannelOpen}
          messages={urchatStore.messages}
          sendMessage={sendMessage}
        />
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
            onClick={() => {
              ringing.pause();
              const audio = new Audio(hangup);
              audio.volume = 0.8;
              audio.play();
              mediaStore.stopAllTracks();
              push("/");
            }}
          >
            Go to Campfire home
          </Button>
        }
        backdropOpacity={0.3}
        closeOnBackdropClick={false}
        isShowing={urchatStore.wasHungUp}
        onHide={() => {
          console.log("hiding");
        }}
      >
        The peer has hungup the call with you. Sad!
      </Dialog>
    </Flex>
  );
});
