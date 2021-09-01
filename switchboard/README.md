# `switchboard`: WebRTC SDP message exchange over Urbit

## Use
The `switchboard` agent provides the following functionality:
- 2-way connection setup
  - call notification
  - call answering
  - hangup notification
- Turn-based SDP message exchange
- Out-of-turn ICE candidate exchange

Its external interface is designed to be leveraged either directly by off-urbit code via airlock, or the upcoming "Kahn" socket interface,
or via other Urbit userspace agents.

Switchboard may be poked using the `%switchboard-from-client` mark, and will provide subscription updates about incoming calls using the `%switchboard-incoming-call` mark
on a path `/incoming/[dap]` where `dap` is a developer-chosen name for a WebRTC application, used to distinguish which application should receive incoming calls.
Per-call facts are provided on the `/call/[uuid]` path where `uuid` is a short, randomly-generated identifier specified when first placing a call.

During a call, when an application wishes to send an SDP message, it should:
- Poke switchboard with the `%ask-turn` poke
- Await a `%connection-state` update of `%connected-our-turn-asked`
- Create the SDP offer or answer and set it as the 'local description'
- Send the SDP offer or answer using the `%sdp` poke

Sending an ICE candidate message is simpler. So long as a poke acknowledgement has been received for the last SDP message sent,
an ICE candidate resulting from that offer or answer can safely be sent.

Applications sending JSON over an SDP airlock should note that the mode of the poke is set using the `tag` field of the top-level JSON.
The included library `switchboard-js` may be consulted as a reference or used directly.

## Design
Switchboard must translate the guarantees provided by arvo and ames (transactional state updates/effect production and in-order/exactly once Ames delivery per flow)
into turn-based delivery of SDP messages and in-order delivery across both SDP and ICE candidate messages.

Switchboard uses a per-call state machine with two major phases, which we term call initiation and connected call.
This state machine is used to ensure clients will not miss updates or send SDP messages out of turn.

When a client wishes to place a call, their ships `switchboard` agent responds to the poke by entering the `%dialing` state.
The client is then expected to watch the path for the call, which triggers the transition to the `%ringing` state and a poke
to the remote ship's `switchboard` agent notifying them of the call.

The remote ship enters the `%incoming-ringing` state and emits a fact on the `/incoming/[dap]` path (where dap is specified
by the initial `%place-call` poke notifying clients of the incoming call. A client can `%reject` the call with a poke to 
its local switchboard, which will remove the call from the local state and notify the calling switchboard via a poke to do
likewise, or it can watch the `/call/[uuid]` path (where UUID is a unique identifier for the call, specified in the %place-call poke),
which moves the receiving switchboard to the `%answering` state and triggers a poke to the calling switchboard notifying it that the
call is accepted. On receiving this poke, the calling switchboard transitions to the `%connected-our-turn` state while, upon receiving the poke ack,
the receiving switchboard transitions to the `%connected-their-turn` state.

When a switchboard receives a `%ask-signal` poke from its client, it transitions as follows:

From the `%connected-our-turn` state it transitions immediately to the `%connected-our-turn-asked` state and notifies the client, which may now create and send an SDP offer or answer.

From the `%connected-their-turn` state it transitions to the `%connected-want-turn` state, and sends a poke to the remote switchboard requesting it to yield its turn.

From other connected states no transition is made. Clients should avoid placing the `%ask-signal` poke in other states.

When a switchboard receives a `%ask-turn` poke from its peer in a call, it transitions as follows:

From the `%connected-our-turn` state it transitions immediately to the `%connected-their-turn` state, and
sends a `%give-turn` poke to the peer, which transitions the peer to `%connected-our-turn-asked`

From the `%connected-our-turn-asked` state it ignores the `%ask-turn` poke, since the SDP message which is
sent from this state will yield the turn in any case.

From the `%connected-their-turn` state it ignores the `%ask-turn` poke, since this means a `%give-turn` poke
or an SDP message has already been sent.

Sending a `%give-turn` poke or an SDP message transitions an agent to the `%connected-their-turn` state.
Receiving a `%give-turn` poke or an SDP message in the `%connected-want-turn` state transitions an agent to the `%connected-our-turn-asked` state. Receiving an SDP message in the `%connected-their-turn` state transitions an agent to the
`%connected-our-turn state`.
