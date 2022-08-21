# @holium/campfire

This project is forked from the urbit-webrtc project, building on the gall agents developed for this grant: https://grants.urbit.org/proposals/21131866-webrtc-gall-agent-and-external-app

The campfire app is a totally rewritten UI fixing many bugs and issues in the urchatfm app. 

## Packages
- `icepond`: Gall agent and marks for ICE server acquisition
- `icepond-js`: Javascript library for fetching ICE servers over airlock from icepond
- `icepond-test`: React app demonstrating icepond
- `switchboard`: Gall agent and marks for signalling WebRTC peer connections
- `switchboard-js` Javascript library for setting up WebRTC peer connections via Urbit airlock to switchboard
- `campfire`: Rebuilt UI by Holium.

## Design
See [DESIGN.md](DESIGN.md)

## Getting Started

Run `npm i && npm run bootstrap` to get started. This project uses [lerna](https://lerna.js.org/) to manage the `switchboard-js` and `icepond-js` packages. Add a `.env.local` file to the `urchatfm` directory with the following entry `VITE_SHIP_URL=https://yourshipurl.com` replacing "https://yourshipurl.com" with your actual url.

Whenever working you can simply run `npm run dev` from the root directory which will simultaneously watch both packages for any changes and run the development server for `urchatfm`. It will proxy requests to the ship url added above. That ship will have to have `urchatfm` installed.

When it's time to release `urchatfm` running `npm run build` will build all packages and `urchatfm` itself. The resulting `urchatfm/dist` folder is then ready to be made into a glob.

If either `switchboard-js` or `icepond-js` are updated, they can be published to npm using `npm run publish`.
