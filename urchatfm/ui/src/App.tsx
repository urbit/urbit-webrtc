import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Urchat } from "./pages/Urchat";
import { ThemeProvider } from "styled-components";
import { theme } from "@holium/design-system";
import { StartMeetingPage } from "./pages/StartMeeting";

import { useMock } from "./util";

function App() {
  return (
    <ThemeProvider theme={theme.light}>
      <BrowserRouter basename={useMock ? undefined : "/apps/campfire"}>
        <StartMeetingPage />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
