import { Card, Flex, Text, Sigil } from "@holium/design-system";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import { deSig } from "@urbit/api";
import { resetRing, ringing } from "../stores/media";
import { Answer } from "../icons/Answer";
import { RejectCall } from "../icons/RejectCall";

interface IncomingCallProps {
  caller: string;
  answerCall: () => void;
  rejectCall: () => void;
}

export const IncomingCall = observer(
  ({ caller, answerCall, rejectCall }: IncomingCallProps) => {
    useEffect(() => {
      resetRing();
      ringing.loop = true;
      ringing.play();
    }, []);

    return (
      <div className="fixed top-4 right-4">
        <Card
          elevation="two"
          style={{
            borderRadius: 12,
            padding: "12px 12px",
            borderColor: "transparent",
            background: "#3E4345",
          }}
          minWidth={400}
          width="fit-content"
        >
          <Flex gap={12} flexDirection="row" alignItems="center">
            <Sigil
              borderRadiusOverride="6px"
              simple
              patp={caller}
              size={40}
              color={["black", "white"]}
            />
            <Flex
              gap={50}
              justifyContent="space-between"
              alignItems="center"
              flexDirection="row"
              flexGrow={1}
            >
              <Flex flexGrow={0} flexDirection="column">
                <Text color="white" fontSize={4} fontWeight={500} opacity={1}>
                  ~{deSig(caller)}
                </Text>
                <Text color="white" fontSize={3} fontWeight={400} opacity={0.6}>
                  Incoming call...
                </Text>
              </Flex>
              <Flex gap={8} flexDirection="row" justifyContent="space-between">
                <button
                  className="flex justify-center items-center w-10 h-10 text-white bg-green-500 rounded-full default-ring"
                  onClick={answerCall}
                >
                  <Answer
                    className="w-6 h-6"
                    primary="fill-current opacity-80"
                    secondary="fill-current"
                  />
                  <span className="sr-only">Answer</span>
                </button>
                <button
                  className="flex justify-center items-center w-10 h-10 text-white bg-red-500 rounded-full default-ring"
                  onClick={rejectCall}
                >
                  <RejectCall
                    className="w-6 h-6"
                    primary="fill-current opacity-80"
                    secondary="fill-current"
                  />
                  <span className="sr-only">Reject</span>
                </button>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </div>
    );
  }
);
