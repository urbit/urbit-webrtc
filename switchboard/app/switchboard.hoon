/-  switchboard
/+  default-agent, dbug, switchboard-lib=switchboard
:: Apps informed 2 ways about call state updates
:: - by notifications on the /call/[uuid] channel with the
::   %switchboard-connection-state mark
:: - by scrying the call uuid and seeing the state:qa
|%
+$  versioned-state
  $%  state-0
  ==
+$  state-0
    [%0 reachable=(map @tas @) calls=(map @ta call-state:switchboard) queue=(jar @ta signal:switchboard)]
+$  card  card:agent:gall
--
%-  agent:dbug
=|  state=state-0
^-  agent:gall
=<
|_  =bowl:gall
+*  this     .
    default  ~(. (default-agent this %|) bowl)
    helper   ~(. +> bowl)
::
++  on-init
  ^-  (quip card _this)
  `this(state [%0 reachable=*(map @tas @) calls=*(map @ta call-state:switchboard) queue=*(jar @ta signal:switchboard)])
++  on-save
  !>(state)
++  on-load  on-load:default
:: pokes
:: %call: external interface place a call, this will attempt to initiate all the necessary
::   cross-subscriptions and notify the remote peer's app
::   The en-vased type is call:switchboard, which comprises
::   -  uuid=@ta, a uuid for the call. See ++uuid in
::      lib/switchboard.hoon
::   -  peer=@p, the remote ship to call
::   -  dap=@tas, the remote app to call
:: %reject: Reject an incoming call
::   The envased type is just the uuid
:: %ring:
::   initial inter-ship call placement: tell a remote switchboard that
::   we want to call a particular dap
:: %signal: external interface for a message from the local peer destined for the remote peer
::   note that the en-vased type is call-signal:switchboard so we can
::   include the call UUID in the poke
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  ~|  "switchboard: poked with unknown mark: {<mark>}"  !!
      %switchboard-call
    =/  =call:switchboard  !<(call:switchboard vase)
    ~|  "switchboard: starting call: {<uuid.call>} with peer {<peer.call>}"
    =^  cards  state
    (move-to-state:helper call %starting)
    [cards this]
      ::
      %switchboard-call-signal
    =/  =call-signal:switchboard  !<(call-signal:switchboard vase)
    =/  call-state  (~(get by calls.state) uuid.call-signal)
    ?~  call-state
      ~|  "Tried to signal on non-existent call uuid {<uuid.call-signal>}"  !!
    ?+  connection-state.u.call-state
        `this(queue.state (~(add ja queue.state) uuid.call-signal signal.call-signal))
        ::
        %connected
      :_  this
      :~  :*
            %give  %fact
            ~[/call-peer/[uuid.call-signal]]
            %switchboard-signal  !>(signal.call-signal)
          ==
      ==
    ==
      ::
      %switchboard-ring
    =/  =ring:switchboard  !<(ring:switchboard vase)
    =^  cards  state
    (move-to-state:helper [uuid=uuid.ring peer=src.bowl dap=dap.ring] %incoming-ringing)
    [cards this]
      ::
      %switchboard-reject
    =/  uuid=@ta  !<(@ta vase)
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      ~|  "Tried to reject non-existent call uuid {<uuid>}"  !!
    ?+  connection-state.u.call-state  `this
        ::
        %ringing
      :_  this(calls.state (~(del by calls.state) uuid), queue.state (~(del by queue.state) uuid))
      :~
        :*
          %give  %kick
          ~[/call/[uuid]]
          ~
        ==
      ==
        ::
        %incoming-ringing
      :_  this(calls.state (~(del by calls.state) uuid), queue.state (~(del by queue.state) uuid))
      :~
        :*
          %pass  /reject-poke/[uuid]
          %agent  [peer.call.u.call-state %switchboard]
          %poke  [%switchboard-reject !>(uuid)]
        ==
      ==
    ==
  ==
:: watches
:: - /incoming/[dap] for agents to register to receive calls
:: - /call/[uuid] agents will be informed of call UUIDs at the /incoming
::   path and should subscribe here for SDP messages from the peer
:: - /call-peer/[uuid] switchboard instances cross-subscribe to each
::   other's call-peer paths for a call. Leaving represents hanging up
::   or dropping the call.
:: - /uuid convenience for web daps, have urbit generate a UUID
::
:: See the pokes comment for how agents send SDP messages to switchboard
:: for delivery to a peer
++  on-watch 
  |=  =path
  ^-  (quip card _this)
  ?+  path  (on-watch:default path)
    ::
    [%incoming @tas ~]
  =/  dap  +<.path
  `this(reachable.state (~(put by reachable.state) dap (add 1 (~(gut by reachable.state) dap 0))))
    ::
    [%call @ta ~]
    =/  uuid  +<.path
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      ~|  "No call with UUID {<uuid>}"  !!
    ?+  connection-state.u.call-state
        ~|  "Connection {<uuid>} in state {<connection-state.u.call-state>} cannot take /call watch"  !!
        :: We've already been rung by a remote switchboard, which is
        :: waiting on our dap to answer
        %incoming-ringing
      =^  cards  state
      (move-to-state:helper call.u.call-state %connecting)
      [cards this]
        :: We just got the %call poke and now the watch by the app
        %starting
      =^  cards  state
      (move-to-state:helper call.u.call-state %dialing)
      [cards this]
    ==
    ::
    [%call-peer @ta ~]
    =/  uuid  +<.path
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      ~|  "No call with UUID {<uuid>}"  !!
    ?+  connection-state.u.call-state 
      ~|  "Connection {<uuid>} in state {<connection-state.u.call-state>} cannot-take /call-peer watch"  !!
        ::
        %ringing
      =^  cards  state
      (move-to-state:helper call.u.call-state %answered)
      [cards this]
        ::
        %connecting
      =^  cards  state
      (move-to-state:helper call.u.call-state %connected)
      [cards this]
    ==
    ::
    [%uuid ~]
    :_  this
    :~
      :*
        %give  %fact
        ~[/uuid]
        %switchboard-uuid  !>((uuid:switchboard-lib bowl))
      ==
      :*
        %give  %kick
        ~[/uuid]
        ~
      ==
    ==
  ==
:: handle hanging up by kicking the call counterparty
++  on-leave
  |=  =path
  ^-  (quip card _this)
  ?+  path  (on-leave:default path)
      ::
      [%incoming @tas ~]
    =/  dap  +<.path
    =/  ct  (~(got by reachable.state) dap)
    ?:  (gte 1 ct)
      `this(reachable.state (~(del by reachable.state) dap))
    `this(reachable.state (~(put by reachable.state) dap (dec ct)))
      ::
      [%call-peer @ta ~]
    =/  uuid  +<.path
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      `this
    =^  cards  state
    (remote-disconnected:helper call.u.call-state)
    [cards this]
    ::
      [%call @ta ~]
    =/  uuid  +<.path
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      `this
    =^  cards  state
    (local-disconnected call.u.call-state)
    [cards this]
  ==
:: TODO: scry per-call for state
:: TODO: scry for registered daps
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+  path  (on-peek:default path)
      :: per-call state
      [%x %callstate @ta ~]
    ?>  (team:title our.bowl src.bowl)
    =/  uuid  +>-.path
    (biff (~(get by calls.state) uuid) |=(=call-state:switchboard ``[%noun !>(call-state)]))
      :: registered daps
      [%x %registered ~]
    ?>  (team:title our.bowl src.bowl)
    ``[%noun !>(((list @tas) ~(tap in ~(key by reachable.state))))]
  ==
:: state advancements for watch-ack and poke-ack
::
:: Call ending on %kick from remote agent
::
:: Fact relay from remote agent (the core functionality of switchboard)
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+  wire  (on-agent:default wire sign)
      ::
      [%peer-signal @ta ~]
    =/  uuid  +<.wire
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      ~|  "No call with UUID {<uuid>}"  !!
    ?+  -.sign  (on-agent:default wire sign)
        :: check positive watch-ack, if so and %answered, ->
        :: %connected
        :: if negative, kick dap
        %watch-ack
      ?+  connection-state.u.call-state ::-::
        ?~  +.sign
          `this
        =^  cards  state
        (remote-disconnected:helper call.u.call-state)
        [cards this]
          :: %answered -> %connected
          %answered
        =^  cards  state
        ?~  +.sign
          (move-to-state:helper call.u.call-state %connected)
        (remote-disconnected:helper call.u.call-state)
        [cards this]
      ==
        :: SDP message, relay to dap
        %fact
      :_  this
      :~
        :*
          %give  %fact
          ~[/call/[uuid]]
          cage.sign
        ==
      ==

        :: Hang up, kick dap
        %kick
      =^  cards  state
      (remote-disconnected:helper call.u.call-state)
      [cards this]
    ==
      ::
      [%ring-poke @ta ~]
    =/  uuid  +<.wire
    =/  call-state  (~(get by calls.state) uuid)
    ?~  call-state
      ~|  "No call with UUID {<uuid>}"  !!
    ?+  -.sign  (on-agent:default wire sign)
        :: check positive poke-ack, if so and %dialing, -> %ringing
        :: if negative, kick dap
        %poke-ack
      =^  cards  state
      ?~  +.sign
        (move-to-state:helper call.u.call-state %ringing)
      (remote-disconnected:helper call.u.call-state)
      [cards this]
    ==
  ==
++  on-arvo  on-arvo:default
++  on-fail   on-fail:default
--
:: Helper core
|_  bowl:gall
:: Produce the proper state transition and cards when moving a
:: connection into a state
::
:: The cards include, for all states where an app should be watching,
:: updates to the app about the call state.
++  move-to-state
  |=  [=call:switchboard =connection-state:switchboard]
  ^-  (quip card _state)
  ?-  connection-state
    :: We got a %call poke, add the call
      %starting
    ?<  (~(has by calls.state) uuid.call) :: don't overwrite an existing call!
    `state(calls (~(put by calls.state) uuid.call [call=call connection-state=%starting]))
    :: The local app is watching us now, poke the remote switchboard
    :: with %ring
      %dialing
    ?>  (~(has by calls.state) uuid.call)
    =/  state-call  call:(~(got by calls.state) uuid.call)
    :: make sure we are not modifying the call record, which should
    :: remain the same throughout
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%dialing]))
    :~
      :*
        %pass   /ring-poke/[uuid.call]
        %agent  [peer.call %switchboard]
        %poke   [%switchboard-ring !>([uuid=uuid.call dap=dap.call])]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-connection-state  !>((connection-state:switchboard %dialing))
      ==
    ==
    :: We got the poke-ack for our %ring poke, awaiting
    :: cross-subscription from the remote switchboard
      %ringing
    ?>  (~(has by calls.state) uuid.call)
    =/  state-call  call:(~(got by calls.state) uuid.call)
    :: make sure we are not modifying the call record, which should
    :: remain the same throughout
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%ringing]))
    :~
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-connection-state  !>((connection-state:switchboard %ringing))
      ==
    ==
    :: We got a subscription from the remote switchboard, subscribe back
    :: to them
     %answered
    ?>  (~(has by calls.state) uuid.call)
    =/  state-call  call:(~(got by calls.state) uuid.call)
    :: make sure we are not modifying the call record, which should
    :: remain the same throughout
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%answered]))
    :~
      :*
        %pass   /peer-signal/[uuid.call]
        %agent  [peer.call %switchboard]
        %watch  /call-peer/[uuid.call]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-connection-state  !>((connection-state:switchboard %answered))
      ==
    ==
    :: We got a %ring poke from a remote agent, let the proper app know
      %incoming-ringing
    ?<  (~(has by calls.state) uuid.call) :: don't overwrite an existing call!
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%incoming-ringing]))
    :~
      :*
        %give  %fact
        ~[/incoming/[dap.call]]
        %switchboard-incoming  !>([%incoming call])
      ==
    ==
    :: Local app watched the incoming call, subscribe to the
    :: remote(calling) switchboard
      %connecting
    ?>  (~(has by calls.state) uuid.call)
    =/  state-call  call:(~(got by calls.state) uuid.call)
    :: make sure we are not modifying the call record, which should
    :: remain the same throughout
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%connecting]))
    :~
      :*
        %pass   /peer-signal/[uuid.call]
        %agent  [peer.call %switchboard]
        %watch  /call-peer/[uuid.call]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-connection-state  !>((connection-state:switchboard %connecting))
      ==
    ==
    :: Remote switchboard (caller) subscribed to us (callee), or
    :: Remote switchboard (callee) watch-acked our (caller) subscription
      %connected
    ?>  (~(has by calls.state) uuid.call)
    =/  state-call  call:(~(got by calls.state) uuid.call)
    :: make sure we are not modifying the call record, which should
    :: remain the same throughout
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%connected]))
    =/  call-queue  (fall (~(get by queue.state) uuid.call) ~)
      :-
      :: Give state
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-connection-state  !>((connection-state:switchboard %connected))
      ==
      :: We've been queuing up any SDP messages from our app until now,
      :: it's time to send them to the remote switchboard
      :: TODO: clear the SDP message queue for the call
      %:  turn  call-queue
        |=  =signal:switchboard
          :*
            %give  %fact
            ~[/call-peer/[uuid.call]]
            %switchboard-signal  !>(signal)
          ==
    ==
  ==
++  remote-disconnected
  |=  =call:switchboard
  ^-  (quip card _state)
  =/  call-state  (~(got by calls.state) uuid.call)
  :_  state(calls (~(del by calls.state) uuid.call), queue (~(del by queue.state) uuid.call))
  ?+  connection-state.call-state
    :~
      :*
        %give  %kick
        ~[/call/[uuid.call]]
        ~
      ==
    ==
      ::
      :: in this case, tell the listening app that the call has been
      :: hung up on
      %incoming-ringing
    :~
      :*
        %give  %fact
        ~[/incoming/[dap.call]]
        %switchboard-incoming  !>([%hangup uuid.call])
      ==
    ==
  ==
++  local-disconnected
  |=  =call:switchboard
  ^-  (quip card _state)
  :_  state(calls (~(del by calls.state) uuid.call), queue (~(del by queue.state) uuid.call))
  :~
    :*
      %give  %kick
      ~[/call-peer/[uuid.call]]
      ~
    ==
  ==
--
