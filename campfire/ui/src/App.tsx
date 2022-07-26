import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "@holium/design-system";
import { StartMeetingPage } from "./pages/StartMeeting";
import { MeetingSpace } from "./pages/MeetingSpace";

import { rootStore, StoreProvider } from "./stores/root";

function App() {
  return (
    <StoreProvider store={rootStore}>
      <ThemeProvider theme={theme.light}>
        <BrowserRouter basename={"/apps/campfire"}>
          <Switch>
            <Route path="/" exact>
              <StartMeetingPage />
            </Route>
            <Route path="/chat">
              <MeetingSpace />
            </Route>
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
