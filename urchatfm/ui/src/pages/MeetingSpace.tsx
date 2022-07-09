import React, { FC, useState } from "react";
import styled from "styled-components";
import { Flex } from "@holium/design-system";
import { MediaStore } from "../stores/media";
import { UrchatStore } from "../stores/urchat";
import { useStore } from "../stores/root";
import { observer } from "mobx-react";
import { Call } from "../components/Call";

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

  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <Main>
      <section>{/* <Call connected={dataChannelOpen} /> */}</section>
      <aside></aside>
      {/* {incomingCall && (
        <IncomingCall
          caller={incomingCall.call.peer}
          answerCall={answerCall}
          rejectCall={rejectCall}
        />
      )}
      {isSecure && <TurnOnRinger />}
      {!isSecure && <SecureWarning />} */}
    </Main>
  );
});
