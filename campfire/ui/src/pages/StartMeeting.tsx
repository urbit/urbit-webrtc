import React, { FC, useEffect, useState, } from "react";
import { observer } from "mobx-react";
import { useHistory } from "react-router";
import { deSig } from '@urbit/api';
import { isValidPatp } from 'urbit-ob';
import {
  Button,
  Flex,
  Input,
  Text,
  theme,
} from "@holium/design-system";
import { Campfire } from "../icons/Campfire";
import { useStore } from "../stores/root";
import { PalsList } from "../components/PalsList";
import { SecureWarning } from "../components/SecureWarning";
import { IncomingCall } from "../components/IncomingCall";
import packageJson from '../../package.json';
import call from "../assets/enter-call.wav";


export const StartMeetingPage: FC<any> = observer(() => {
  console.log("Rerender StartMeetingPage");
  const [meetingCode, setMeetingCode] = useState("");
  const { mediaStore, urchatStore, palsStore } = useStore();
  const { push } = useHistory();

  const isSecure =
    location.protocol.startsWith("https") || location.hostname === "localhost";

  // play ringing call when incoming call
  useEffect(() => {
    if (isSecure && urchatStore.incomingCall) {
      console.log("incoming call");
      const audio = new Audio(call);
      audio.volume = 0.3;
      audio.play();
    }
  }, [urchatStore.incomingCall]);

  // update devices if chrome devices change (like a USB microphone gets plugged in)
  useEffect(() => {
    const updateDevices = () => mediaStore.getDevices(urchatStore.ongoingCall);
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    return () =>
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        updateDevices
      );
  })

  const onTrack = (evt: Event & { track: MediaStreamTrack }) => {
    console.log("Incoming track event", evt);
    mediaStore.addTrackToRemote(evt.track);
  };

  const placeCall = async (ship: string) => {
    mediaStore.resetStreams();
    const call = await urchatStore.placeCall(ship, (conn) => {
      urchatStore.setDataChannelOpen(false);
      urchatStore.setMessages([]);
      const channel = conn.createDataChannel("campfire");
      channel.onopen = () => {
        // called when we the connection to the peer is open - aka the call has started
        console.log("data channel opened");
        urchatStore.setDataChannelOpen(true);
      };
      channel.onmessage = (evt) => {
        const data = evt.data;
        const speakerId = deSig(ship);
        const new_messages = [{ speaker: speakerId, message: data }].concat(urchatStore.messages);
        urchatStore.setMessages(new_messages);
        console.log("channel message from " + speakerId + ": " + data);
      };
      urchatStore.setDataChannel(channel);
      conn.ontrack = onTrack;
    });
    mediaStore.getDevices(call);
  };

  const callPal = (ship: string) => {
    placeCall(deSig(ship));
  }

  const answerCall = async () => {
    mediaStore.resetStreams();

    const call = await urchatStore.answerCall((peer, conn) => {
      push(`/chat/${conn.uuid}`);
      urchatStore.setDataChannelOpen(false);
      urchatStore.setMessages([]);
      conn.addEventListener("datachannel", (evt) => {
        const channel = evt.channel;
        channel.onopen = () => urchatStore.setDataChannelOpen(true);
        channel.onmessage = (evt) => {
          const data = evt.data;
          const new_messages = [{ speaker: peer, message: data }].concat(urchatStore.messages);
          urchatStore.setMessages(new_messages);
          console.log("channel message from me to: " + data);
        };
        urchatStore.setDataChannel(channel);
      });
      conn.ontrack = onTrack;
    });
    mediaStore.getDevices(call);
  }
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
      flexDirection="columns"
    >
      <Flex
        minWidth={650}
        maxWidth={950}
        width="50%"
        flexDirection="row"
        justifyContent="space-between"
      >
        <section>
          <Flex mb={6} flexDirection="column">
            <Text mb={1} fontSize={9} fontWeight={600}>
              Gather around
            </Text>
            <Text fontSize={5} fontWeight={400} opacity={0.5}>
              Iniate a call with your friend
            </Text>
          </Flex>
          <Flex alignItems="flex-start" flexDirection="column">
            <Input
              bg="secondary"
              style={{
                fontSize: 18,
                height: 40,
                borderRadius: 6,
                minWidth: 370,
                background: theme.light.colors.bg.secondary,
              }}
              mb={4}
              placeholder="Enter a @p (~sampel-palnet)"
              value={meetingCode}
              rightInteractive
              rightIcon={
                <Button
                  disabled={!isValidPatp(`~${deSig(meetingCode)}` || '') && meetingCode.length > 0}
                  onClick={() => placeCall(deSig(meetingCode))}
                  bg="#F8E390"
                  color="#333333"
                >
                  <b>Call</b>
                </Button>
              }
              onChange={(evt: any) => setMeetingCode(evt.target.value)}
            />
            <div style={{
              width: "100%",
              height: "100px",
              overflowY: "auto"
            }}>
              <PalsList mutuals={palsStore.mutuals} callPal={callPal} />
            </div>
          </Flex>
        </section>
        <section>
          <Flex>
            <Campfire />
          </Flex>
        </section>
      </Flex>
      {!isSecure && <SecureWarning />}
      {urchatStore.incomingCall && (
        <IncomingCall
          caller={urchatStore.incomingCall?.call.peer}
          answerCall={answerCall}
          rejectCall={() => urchatStore.rejectCall}
        />
      )}
      <div
        style={{
          bottom: "0px", left: "0px", position: "absolute", margin: "10px"
        }}>
        <Flex
          alignItems="flex-start" flexDirection="row"
        >
          <Text fontSize={4} fontWeight={200} opacity={0.9}>
            v{packageJson.version}
          </Text>
          <a href="/docs/campfire/overview">
            <Text ml={5} fontSize={4} fontWeight={200} opacity={0.9} title="on %docs">
              Documentation
            </Text>
          </a>
          <Text ml={5} fontSize={4} fontWeight={200} opacity={0.9} onClick={() => console.log("open settings")}>
            Settings
          </Text>
        </Flex>
      </div>
    </Flex>
  );
});
