import React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import { Urchat } from './pages/Urchat';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/chat" component={Urchat} />
        <Route path={["/", "/login"]} component={Login} />
      </Switch>
    </BrowserRouter>
  )
}

export default App;
