# urbit-webrtc
Gall agents, Javascript packages, and a video call app.

## Packages
- `icepond`: Gall agent and marks for ICE server acquisition
- `icepond-js`: Javascript library for fetching ICE servers over airlock from icepond
- `icepond-test`: React app demonstrating icepond
- `switchboard`: Gall agent and marks for signalling WebRTC peer connections
- `switchboard-js` Javascript library for setting up WebRTC peer connections via Urbit airlock to switchboard
- `pals-js` Javascript library for fetching %pals over the airlock. Not official.
- `campfire`: React app for p2p WebRTC video+voice calls.

## Design
See [DESIGN.md](DESIGN.md)

## Getting Started

Run `npm i && npm run bootstrap` to get started. This project uses [lerna](https://lerna.js.org/) to manage the `switchboard-js` and `icepond-js` packages. Add a `.env.local` file to the `campfire` directory with the following entry `VITE_SHIP_URL=https://yourshipurl.com` replacing "https://yourshipurl.com" with your actual url.

