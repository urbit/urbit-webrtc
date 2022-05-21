import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Urchat } from './pages/Urchat';
import { useMock } from './util';

function App() {
  return (
    <BrowserRouter basename={useMock ? undefined : '/apps/urchatfm'}>
      <Urchat />
    </BrowserRouter>
  )
}

export default App;
