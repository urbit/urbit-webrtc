# Design: WebRTC for Urbit

[Urbit](https://urbit.org) is a decentralized platform for personal identity and connected applications. It aims to enable simple connectivity and interaction between people while removing the necessity of using centralized, privacy-invading cloud services.

WebRTC is a standard, implemented by all major web browsers, for real-time communication and media streaming between instances of a web application. It provides APIs for media capture from video and audio devices or the user's display (for screensharing), for negotiating encrypted peer-to-peer connections, and for streaming media over these connections.

We wish to add the ability to negotiate streaming media calls between two or more Urbit users, or to allow Urbit users to publish real-time media streams. Urbit already provides encrypted and identity-verified communication, as well as the ability for individual ships (Urbit instances) to serve application APIs and user interfaces over HTTP.

We will use Urbit as the server for a web application, and the signalling channel for negotiating WebRTC peer-to-peer connections.

## Technical background

### WebRTC

The WebRTC API provides two major abilities: the ability to discover and stream media from media hardware or the user's display (screen-capture functionality), and the ability to negotiate and stream media and data over peer-to-peer connections between browser-based application instances.

The former ability is only indirectly relevant to our design. We will make use of it to deliver a front-end application, but the Urbit components do not need to be aware of media streams or devices.

The latter ability leaves one key aspect to application implementers: that of identifying peers and signalling connection information to them. Each peer creates either an _offer_ or an _answer_, in the process using external services (see "ICE" below) to discover connectivity information. It uses this connectivity information as the _local description_, and then exchanges connectivity over a signalling channel with its peer. The information received from the peer is the _remote description_. By exchanging an offer and an answer, two peers can negotiate a connection. The contents of the offer and answer can be treated opaque to the signalling channel.

### ICE (Interactive Connectivity Establishment)

ICE is a combination of two standards for establishing connectivity between peers: STUN and TURN, as well as a common description format for connectivity discovered or provided by these methods, and an algorithm for selecting a particular route for connectivity (a "candidate"). An ICE "candidate" represents a possible way of communicating with a peer, either directly or
via a relay.

Clients can directly produce ICE candidates (for instance, by simply offering their local IP address and port as a candidate, or negotiating with their router to open a port via UnP or similar explicit NAT control protocols.) They can also use external services to either generate and discover connectivity via a publicly addressable address and port, or to authenticate to and use a relay, directly addressable on the public Internet, which will forward packets for them.

STUN (Session Traversal Utilities for NAT) is a method of establishing and discovering an external address/port combination which can be used to connect to a UDP socket on a host behind a NAT router. ICE candidates discovered via STUN enable direct peer-to-peer connections.

TURN (Traversal Using Relays around NAT) is a standard for media streaming relay servers, to be used as a fallback when peer-to-peer connections are impossible or undiscoverable. TURN servers on the public internet must require authentication, as bandwidth requirements can be very high.

The expectation is that peers will use ICE candidates received from their counter-peers and simultaneously attempt connections via all of them. Successful candidates (those for which connection attempts receive a response) are chosen from either by a pre-set priority or some other metric.

In the context of WebRTC, the API expects a list of STUN and/or TURN servers to be provided when initializing a peer connection. These servers are used to generate ICE candidates, which are sent as part of the offer or answer to the remote peer. The remote peer will return an offer or answer with its own candidates generated from its own set of servers. WebRTC implementations handle the selection of connections from among the candidates.


## Components

### `switchboard`: Negotiating connections

`switchboard` is a very simple Gall agent: it is a direct counterpart for the connection-negotiation API exposed by the [`RTCPeerConnection`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) object from the WebRTC Javascript API. In particular, it allows other agents to subscribe to receive calls directed to them, and to place calls and subscribe to receive answers. Calls and answers are transmitted as opaque SDP messages generated by the WebRTC implementations themselves.

### `icepond`: Advertising ICE servers

`icepond` is another Gall agent, which allows ships to request ICE server URLs and authentication information from their sponsoring ships. It is envisioned that stars will offer to their sponsored planets a set of STUN and (possibly) TURN servers, together with authentication information on either a per-ship or per-request basis.

A ship can obtain ICE server connection information in the following ways:

- A static configuration of which ICE servers it advertises to which ships
- A [thread](https://urbit.org/docs/tutorials/arvo/gall/#threads) which dynamically obtains this information (e.g. by making an HTTP call to an external TURN service to obtain an authentication token)
- ICE servers from a sponsor

By default, the ICE servers obtained by a ship are those it will forward to ships it sponsors. This behavior too can be changed in the same ways as above. This default behavior is useful so that e.g. moons can receive ICE candidates via their sponsoring planet from the planet's sponsoring star.

### `hyperluminal`: Application for calling between Azimuth points

`hyperluminal` is a Gall agent which serves a web application via [Eyre](https://urbit.org/docs/glossary/eyre/). It provides ship-to-ship media calls, multi-ship conference calls, and subscribable streams with ship-based URLs. It serves as a testbed for `switchboard` and `icepond`, as well as providing Urbit users an immediate solution for media calling and streaming.

### Minor and replaceable components

#### `urbit-ice`

This provides an example STUN/TURN server integration for a star. It would consist of containerized configurations of open-source STUN and TURN implementations, as well as a simple HTTP server which would proxy generating authentication tokens for the TURN server.

It would also provide a thread which would communicate with the HTTP server and provide the STUN and TURN URLs, and a generated authentication token for the TURN server, in response to any `icepond` request by a sponsored ship.

Candidates for STUN server:

- [STUNTMAN](https://github.com/jselbie/stunserver)
- [coturn](https://github.com/coturn/coturn)

Candidates for TURN server:

- [coturn](https://github.com/coturn/coturn)

## Future directions

The current design for using WebRTC with Urbit treats Urbit as a secure identity provider, application platform, and signalling channel. It does not forward any media through Urbit itself. This is by design, as Urbit is not yet ready to handle real-time computation or network streaming.

However, in the future it may be profitable to revisit this evaluation. In particular, an alternate design would see Urbit directly communicating real-time media streams between ships, and perhaps serving local WebRTC endpoints.

For media streaming over Urbit to be feasible, Urbit would need:

- Robust NAT-traversal capabilities.
  * This is desirable in any case, as Urbit itself relies on peer-to-peer communications. But the P2P implementation of Urbit will likely not use external ICE servers, but will rely on sponsoring ships for connectivity discovery, signalling, and last resort relays.
- Real-time computational performance
- Real-time networking
  * In particular, Urbit would need to be able to communicate between ships while allowing for packets to be dropped, and without writing packets to the event log.
  
The advantage over the current approach would be that applications within Urbit itself could make direct use of the real-time streaming functionality, and there would be an exact correspondence between the connectivity of Urbit ships and the connectivity of WebRTC applications implemented over Urbit.