import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Urchat } from "./pages/Urchat";
import { ThemeProvider } from "styled-components";
import { theme } from "@holium/design-system";
import { StartMeetingPage } from "./pages/StartMeeting";
import { MeetingSpace } from "./pages/MeetingSpace";

import { useMock } from "./util";
import { rootStore, StoreProvider } from "./stores/root";
import { MediaStore } from "./stores/media";
import { UrchatStore } from "./stores/urchat";

function App() {
  return (
    <StoreProvider store={rootStore}>
      <ThemeProvider theme={theme.light}>
        <BrowserRouter basename={useMock ? undefined : "/apps/campfire"}>
          <Switch>
            <Route path="/" exact>
              <StartMeetingPage />
            </Route>
            <Route path="/chat">
              <MeetingSpace />
            </Route>
            <Route path="/old">
              <Urchat />
            </Route>
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
