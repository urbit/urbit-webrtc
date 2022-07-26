
import { Ship, Button, Flex, Text, Dialog, Sigil } from "@holium/design-system";
import { observer } from "mobx-react";
import React, { useEffect } from 'react';
import { deSig } from '@urbit/api';
import ring from '/src/assets/ring.wav';

interface IncomingCallProps {
    caller: string;
    answerCall: () => void;
    rejectCall: () => void;
}

export const IncomingCall = observer(({ caller, answerCall, rejectCall }: IncomingCallProps) => {
    useEffect(() => {
        const audio = new Audio(ring);
        audio.play();
    }, []);

    return (
        <div className="fixed top-4 right-4 gap-x-3 flex inline-block px-8 py-4 bg-gray-100 rounded-xl shadow-lg" >
            <Flex gap={7} flexDirection="row" justifyContent="space-between">
                <Sigil patp={caller} size={80} color={["black", "white"]} simple={false} />
                <Flex flexDirection="column" justifyContent="space-between">
                    <Text
                        fontSize={5} fontWeight={400} opacity={0.8}>
                        Call from ~{deSig(caller)}
                    </Text>
                    <Flex gap={7} flexDirection="row" justifyContent="space-between">
                        <Button
                            style={{ fontSize: 20, borderRadius: 6 }}
                            bg="rgb(34 197 94)"
                            color="#333333"
                            onClick={answerCall}>
                            Answer
                        </Button>
                        <Button
                            style={{ fontSize: 20, borderRadius: 6 }}
                            bg="rgb(220 38 38)"
                            color="#333333"
                            onClick={rejectCall}>
                            Reject
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </div>
    );

})