import React, { FC, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useHistory } from "react-router";
import { deSig } from "@urbit/api";
import { isValidPatp } from "urbit-ob";
import { Button, Flex, Input, Text, theme } from "@holium/design-system";
import { Campfire } from "../icons/Campfire";
import { Dialog, DialogContent, DialogTrigger } from "../components/Dialog";
import { useStore } from "../stores/root";
import { PalsList } from "../components/PalsList";
import { SecureWarning } from "../components/SecureWarning";
import { IncomingCall } from "../components/IncomingCall";
import packageJson from "../../package.json";
import { createField, createForm } from "mobx-easy-form";
import { resetRing, ringing } from "../stores/media";
import { IceServers } from "../components/IceServers";

export const StartMeetingPage: FC<any> = observer(() => {
  console.log("Rerender StartMeetingPage");
  document.title = "Campfire";
  const { form, meetingCode } = useMemo(meetingCodeForm, []);
  const { mediaStore, urchatStore, palsStore } = useStore();
  const { push } = useHistory();
  // const audio = new Audio(ring);

  //fetch icepond config initally so we can display them in "Settings"
  urchatStore.startIcepond();

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
    // only do this if secure, because otherwise navigator will be null
    if (isSecure) {
      const updateDevices = () => mediaStore.getDevices(urchatStore.ongoingCall);
      navigator.mediaDevices.addEventListener("devicechange", updateDevices);
      return () =>
        navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
    }
  });

  const onTrack = (evt: Event & { track: MediaStreamTrack }) => {
    console.log("Incoming track event", evt);
    mediaStore.addTrackToRemote(evt.track);
  };

  const placeCall = async (ship: string) => {
    // TODO make "ring" loop until the call is fully connected, then play "enter-call"
    ringing.volume = 0.8;
    ringing.loop = true;
    ringing.play();
    mediaStore.resetStreams();
    await urchatStore.placeCall(ship, (call) => {
      push(`/chat/${call.conn.uuid}`);
      mediaStore.getDevices(call);
      urchatStore.setDataChannelOpen(false);
      urchatStore.setMessages([]);
      const channel = call.conn.createDataChannel("campfire");
      channel.onopen = () => {
        ringing.pause();
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
      flexDirection="column"
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
                    resetRing();
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
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
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
          answerCall={() => {
            ringing.pause();
            answerCall();
          }}
          rejectCall={() => {
            ringing.pause();
            urchatStore.rejectCall();
          }}
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
          <Text fontSize={2} fontWeight={500} opacity={0.5}>
            v{packageJson.version}
          </Text>
          <a href="/docs/campfire/overview">
            <Text
              ml={5}
              fontSize={2}
              fontWeight={200}
              opacity={0.5}
              title="on %docs"
            >
              Documentation
            </Text>
          </a>
          <Dialog>
            <DialogTrigger className="flex justify-center items-center">
              <Text
                ml={5}
                fontSize={2}
                fontWeight={200}
                opacity={0.5}
                title="settings"
              >
                Settings
              </Text>
            </DialogTrigger>
            <DialogContent className="w-200 min-h-60 max-w-xl pt-4 pb-6 px-8">
              <IceServers />
            </DialogContent>
          </Dialog>
        </Flex>
      </div>
    </Flex>
  );
});

export const meetingCodeForm = (
  defaults = {
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
