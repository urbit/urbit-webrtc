import React, { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useHistory } from "react-router";
import { deSig } from "@urbit/api";
import { isValidPatp } from "urbit-ob";
import { Button, Flex, Input, Text, theme } from "@holium/design-system";
import { Campfire } from "../icons/Campfire";
import { useStore } from "../stores/root";
import { PalsList } from "../components/PalsList";
import { SecureWarning } from "../components/SecureWarning";
import { IncomingCall } from "../components/IncomingCall";
import packageJson from "../../package.json";
import callwav from "../assets/enter-call.wav";
import ring from "../assets/ring.wav";
import { createField, createForm } from "mobx-easy-form";

export const StartMeetingPage: FC<any> = observer(() => {
  console.log("Rerender StartMeetingPage");
  document.title = "Campfire";
  const { form, meetingCode } = useMemo(meetingCodeForm, []);
  const { mediaStore, urchatStore, palsStore } = useStore();
  const { push } = useHistory();

  const isSecure =
    location.protocol.startsWith("https") || location.hostname === "localhost";

  // change title when there's an incoming call
  useEffect(() => {
    if (isSecure && urchatStore.incomingCall) {
      console.log("incoming call");
      document.title = "Call from ~" + urchatStore.incomingCall.peer;
    }
  }, [urchatStore.incomingCall]);

  // update devices if chrome devices change (like a USB microphone gets plugged in)
  useEffect(() => {
    const updateDevices = () => mediaStore.getDevices(urchatStore.ongoingCall);
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
  });

  const onTrack = (evt: Event & { track: MediaStreamTrack }) => {
    console.log("Incoming track event", evt);
    mediaStore.addTrackToRemote(evt.track);
  };

  const placeCall = async (ship: string) => {
    // TODO make "ring" loop until the call is fully connected, then play "enter-call"
    const audio = new Audio(ring);
    audio.volume = 0.3;
    audio.play();
    mediaStore.resetStreams();
    const call = await urchatStore.placeCall(ship, (call) => {
      push(`/chat/${call.conn.uuid}`);
      mediaStore.getDevices(call);
      urchatStore.setDataChannelOpen(false);
      urchatStore.setMessages([]);
      const channel = call.conn.createDataChannel("campfire");
      channel.onopen = () => {
        // called when we the connection to the peer is open - aka the call has started
        console.log("data channel opened");
        urchatStore.setDataChannelOpen(true);
      };
      channel.onmessage = (evt) => {
        const data = evt.data;
        const speakerId = deSig(ship);
        const new_messages = [{ speaker: speakerId, message: data }].concat(
          urchatStore.messages
        );
        urchatStore.setMessages(new_messages);
        console.log("channel message from " + speakerId + ": " + data);
      };
      urchatStore.setDataChannel(channel);
      call.conn.ontrack = onTrack;
    });
  };

  const callPal = (ship: string) => {
    placeCall(deSig(ship));
  };

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
          const new_messages = [{ speaker: peer, message: data }].concat(
            urchatStore.messages
          );
          urchatStore.setMessages(new_messages);
          console.log("channel message from me to: " + data);
        };
        urchatStore.setDataChannel(channel);
      });
      conn.ontrack = onTrack;
    });
    mediaStore.getDevices(call);
  };

  const pals =
    useMemo(
      () =>
        palsStore.mutuals?.filter(
          (p) =>
            p.includes(deSig(meetingCode.state.value)) ||
            deSig(meetingCode.state.value) === "" ||
            !meetingCode.state.value
        ),
      [palsStore.mutuals, meetingCode.state.value]
    ) || [];
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
            <Text fontSize={9} fontWeight={500}>
              Gather around
            </Text>
            <Text fontSize={4} fontWeight={400} opacity={0.5}>
              Start a call with your friend.
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
              spellCheck={false}
              rightInteractive
              rightIcon={
                <Button
                  size="sm"
                  variant="custom"
                  height={26}
                  disabled={
                    !meetingCode.computed.isDirty ||
                    meetingCode.computed.error !== undefined
                  }
                  onClick={() => {
                    const formData = form.actions.submit();
                    placeCall(deSig(formData.meetingCode));
                  }}
                  bg="#F8E390"
                  color="#333333"
                >
                  Call
                </Button>
              }
              onFocus={() => meetingCode.actions.onFocus()}
              onBlur={() => meetingCode.actions.onBlur()}
              onChange={(evt: any) => {
                meetingCode.actions.onChange(evt.target.value);
              }}
            />
            <div
              style={{
                width: "100%",
                height: pals.length ? "100px" : 0, // if there are no pals, don't show element
                overflowY: "auto",
              }}
            >
              <PalsList mutuals={pals} callPal={callPal} />
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
      {isSecure && urchatStore.incomingCall && (
        <IncomingCall
          caller={urchatStore.incomingCall?.call.peer}
          answerCall={answerCall}
          rejectCall={() => urchatStore.rejectCall()}
        />
      )}
      <div
        style={{
          bottom: "0px",
          left: "0px",
          position: "absolute",
          margin: "10px",
        }}
      >
        <Flex alignItems="flex-start" flexDirection="row">
          <Text fontSize={4} fontWeight={200} opacity={0.9}>
            v{packageJson.version}
          </Text>
          <a href="/docs/campfire/overview">
            <Text
              ml={5}
              fontSize={4}
              fontWeight={200}
              opacity={0.9}
              title="on %docs"
            >
              Documentation
            </Text>
          </a>
          {/* <Text ml={5} fontSize={4} fontWeight={200} opacity={0.9} onClick={() => setShowSettings(true)}>
            Settings
          </Text> */}
        </Flex>
      </div>
    </Flex>
  );
});

export const meetingCodeForm = (
  defaults: any = {
    meetingCode: "",
  }
) => {
  const form = createForm({
    onSubmit({ values }) {
      return values;
    },
  });

  const meetingCode = createField({
    id: "meetingCode",
    form: form,
    initialValue: defaults.meetingCode || "",
    validate: (patp: string) => {
      if (patp.length > 1 && isValidPatp("~" + deSig(patp))) {
        return { error: undefined, parsed: patp };
      }

      return { error: "Invalid patp", parsed: undefined };
    },
  });

  return {
    form,
    meetingCode,
  };
};
