/-  switchboard
/+  default-agent, dbug, switchboard-lib=switchboard, verb
:: Apps informed 2 ways about call state updates
:: - by notifications on the /call/[uuid] channel with the
::   %switchboard-connection-state mark
:: - by scrying the call uuid and seeing the state
|%
+$  versioned-state
  $%  state-0
      state-1
  ==
+$  state-0
    [%0 reachable=(map @tas @) calls=(map @ta call-state-0:switchboard)]
+$  state-1
    [%1 reachable=(map @tas @) calls=(map @ta call-state:switchboard)]
+$  card  card:agent:gall
--
%-  agent:dbug
%+  verb  %.n
=|  state=state-1
^-  agent:gall
=<
|_  =bowl:gall
+*  this      .
    default   ~(. (default-agent this %|) bowl)
::
++  on-init
  ^-  (quip card _this)
  `this
::
++  on-save
  !>(state)
::
++  on-load
  |=  vas=vase
  =/  stat  !<(versioned-state vas)
  ?-  stat
      :: Upgrade from version 0 by adding a null last-remote to all
      :: calls
      [%0 *]
    =/  cards
      %+  weld
        %+  turn  ~(tap in ~(key by reachable.stat))  kick-reachable
      %+  turn  ~(tap in ~(key by calls.stat))  kick-call
    =/  calls  (~(run by calls.stat) |=([=call:switchboard =connection-state:switchboard] ^-(call-state:switchboard [call connection-state ~])))
    [cards [%1 reachable=*(map @tas @) calls=calls]]
      :: No upgrade needed, just kick everyone so they know to
      :: resubscribe
      [%1 *]
    =/  cards
      %+  weld
        %+  turn  ~(tap in ~(key by reachable.stat))  kick-reachable
      %+  turn  ~(tap in ~(key by calls.stat))  kick-call
    [cards stat]
  ==
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:default mark vase)
      :: Poke from peer switchboard
      %switchboard-to-switchboard
    =/  incoming  !<(switchboard-to-switchboard:switchboard vase)
    =/  uuid  uuid.incoming
    =/  msg  +.incoming
    ?-  msg
        ::
        [%ring *]
      =/  =call:switchboard  [uuid=uuid peer=src.bowl dap=dap.msg]
      =^  cards  state
        (move-to-state call %incoming-ringing)
      [cards this]
        ::
        [%pickup *]
      =^  cards  state
        (connected-caller uuid)
      [cards this]
        ::
        [%hangup *]
      =^  cards  state
        (peer-disconnected uuid)
      [cards this]
        ::
        [%ask-turn *]
      =^  cards  state
        (give-turn uuid)
      [cards this]
        ::
        [%give-turn *]
      =^  cards  state
        (receive-turn uuid)
      [cards this]
        ::
        [%sdp *]
      =^  cards  state
        (receive-sdp uuid msg)
      [cards this]
        ::
        [%icecandidate *]
      =^  cards  state
        (receive-icecandidate uuid msg)
      [cards this]
    ==
      :: Poke from client
      %switchboard-from-client
    ?>  =(src.bowl our.bowl) :: we should only get client pokes from ourselves
    =/  incoming  !<(switchboard-from-client:switchboard vase)
    =/  uuid  uuid.incoming
    =/  msg  +.incoming
    ?-  msg
        ::
        [%place-call *]
      =^  cards  state
        (place-call uuid +.msg)
      [cards this]
        ::
        [%reject *]
      =^  cards  state
        (reject-call uuid)
      [cards this]
        ::
        [%ask-signal *]
      =^  cards  state
        (ask-signal uuid)
      [cards this]
        ::
        [%sdp *]
      =^  cards  state
        (send-sdp uuid msg)
      [cards this]
        ::
        [%icecandidate *]
      =^  cards  state
        (send-icecandidate uuid msg)
      [cards this]
    ==
  ==
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?+  path
    ~|  'No match for watch path'  !!
      ::
      [%incoming @tas ~]
    =/  dap  +<.path
    `this(reachable.state (~(put by reachable.state.this) dap (add 1 (~(gut by reachable.state.this) dap 0))))
      ::
      [%call @ta ~]
    =/  uuid  +<.path
    =^  cards  state
      (call-watched uuid)
    [cards this]
      ::
      [%uuid ~]
    =/  uuid  (scot %uv (shaw now.bowl 64 eny.bowl))
    :-
      :~
        :*
          %give  %fact
          ~[/uuid]
          %switchboard-uuid  !>(uuid)
        ==
        :*
          %give  %kick
          ~[/uuid]
          ~
        ==
      ==
    this
  ==
::
++  on-leave  
  |=  =path
  ^-  (quip card _this)
  ?+  path  (on-leave:default path)
      ::
      [%incoming @tas ~]
    =/  dap  +<.path
    =/  reachcount  (dec (~(gut by reachable.state.this) dap 1))
    `this(reachable.state (~(mar by reachable.state.this) dap ?:(=(0 reachcount) ~ (some reachcount))))
      ::
      [%call @ta ~]
    `this
  ==
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+  wire
    (on-agent:default wire sign)
      :: Our %pickup poke was acked, we are connected
      [%answer-poke @ta ~]
    =/  uuid  +<.wire
    =^  cards  state
      ?~  +.sign
        (connected-callee uuid)
      (peer-disconnected uuid)
    [cards this]
      :: our %ring poke was acked, call is ringing
      [%ring-poke @ta ~]
    =/  uuid  +<.wire
    =^  cards  state
      ?~  +.sign
        =/  callstate  (~(got by calls.state) uuid)
        (move-to-state call.callstate %ringing)
      (peer-disconnected uuid)
    [cards this]
  ==
::
++  on-peek
  |=  pax=path
  ^-  (unit (unit cage))
  ?+  pax  (on-peek:default pax)
      ::
      [%x %call @tas %last-remote ~]
    =/  uuid  +>-.pax
    =/  callstate  (~(get by calls.state) uuid)
    ?~  callstate  [~ ~]
    =/  [=call =connection-state =last-remote]  u.callstate
    ``switchboard-last-remote+last-remote
      ::
      [%x %call @tas %connection-state ~]
    =/  uuid  +>-.pax
    =/  callstate  (~(get by calls.state) uuid)
    ?~  callstate  [~ ~]
    =/  [=call =connection-state =last-remote]  u.callstate
    ``switchboard-connection-state+connection-state
  ==
::
++  on-arvo  on-arvo:default
::
++  on-fail  on-fail:default
--
:: Helper core
|%
:: Handle a call UUID being watched
++  call-watched
  |=  uuid=@tas
  =/  callstate  (~(got by calls.state) uuid)
  ?+  connection-state.callstate
    `state
      :: Watch after placing a call
    %placing
    (move-to-state call.callstate %dialing)
      :: Watch after receiving call
      %incoming-ringing
    (move-to-state call.callstate %answering)
  ==
:: Produce the proper state transition and cards when moving to a state
++  move-to-state
  |=  [=call:switchboard =connection-state:switchboard]
  ?+  connection-state  ~|('Cannot just move to state {<connection-state>} (call {<uuid.call>})' !!)
      :: We got a %call poke, add the call
      %placing
    ?<  (~(has by calls.state) uuid.call)
    `state(calls (~(put by calls.state) uuid.call [call=call connection-state=%placing last-remote=~])) 
      :: Our client watched the call so we will now tell the other switchboard
      %dialing
    ?>  (~(has by calls.state) uuid.call)
    =/  [state-call=call:switchboard =connection-state:switchboard =last-remote:switchboard]  (~(got by calls.state) uuid.call)
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%dialing last-remote=last-remote]))
    :~
      :*
        %pass   /ring-poke/[uuid.call]
        %agent  [peer.call %switchboard]
        %poke   [%switchboard-to-switchboard !>([uuid=uuid.call %ring dap=dap.call])]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-to-client  !>([%connection-state %dialing])
      ==
    ==
      :: We got the poke-ack from the remote switchboard so we know the
      :: call is ringing at their end
      %ringing
    ?>  (~(has by calls.state) uuid.call)
    =/  [state-call=call:switchboard =connection-state:switchboard =last-remote:switchboard]  (~(got by calls.state) uuid.call)
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%ringing last-remote=last-remote]))
    :~
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-to-client  !>([%connection-state %ringing])
      ==
    ==
      :: We've been poked by a remote switchboard for a call
      %incoming-ringing
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%incoming-ringing last-remote=~]))
    :~
      :*
        %give  %fact
        ~[/incoming/[dap.call]]
        %switchboard-incoming-call  !>([%incoming-call peer=peer.call uuid=uuid.call])
      ==
    ==
      :: The client watched the path for an incoming call
      %answering
    ?>  (~(has by calls.state) uuid.call)
    =/  [state-call=call:switchboard =connection-state:switchboard =last-remote:switchboard]  (~(got by calls.state) uuid.call)
    ?>  =(state-call call)
    :_  state(calls (~(put by calls.state) uuid.call [call=call connection-state=%answering last-remote=last-remote]))
    :~
      :*
        %pass   /answer-poke/[uuid.call]
        %agent  [peer.call %switchboard]
        %poke   [%switchboard-to-switchboard !>([uuid=uuid.call %pickup ~])]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-to-client  !>([%connection-state %answering])
      ==
    ==
  ==
++  connected-caller
  |=  uuid=@ta
  =/  callstate  (~(got by calls.state) uuid)
  ?>  =(connection-state.callstate %ringing)
  :_  state(calls (~(put by calls.state) uuid [call=call.callstate connection-state=%connected-our-turn last-remote=last-remote.callstate])) 
  :~
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>([%connection-state %connected-our-turn])
    ==
  ==
++  connected-callee
  |=  uuid=@ta
  =/  callstate  (~(got by calls.state) uuid)
  ?>  =(connection-state.callstate %answering)
  :_  state(calls (~(put by calls.state) uuid [call.callstate %connected-their-turn last-remote=last-remote.callstate]))
  :~
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>([%connection-state %connected-their-turn])
    ==
  ==
++  receive-sdp
  |=  [uuid=@ta =sdp:switchboard]
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  ::  we need to increment the sdp counter
  =/  sdp-counter
    .+  ?~  last-remote.call-state  0  -.last-remote.call-state
  =/  result-state
    ?+  connection-state.call-state
      ~|("Cannot receive SDP in state {<connection-state.call-state>} (call {<uuid>})" !!)
        ::
        %connected-their-turn
      %connected-our-turn
        ::
        %connected-want-turn
      %connected-our-turn-asked
    ==
  :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=result-state last-remote=`[sdp-counter sdp]]))
  :~
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>(sdp)
    ==
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>([%connection-state result-state])
    ==
  ==
++  receive-turn
  |=  uuid=@ta
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  ?>  =(connection-state.call-state %connected-want-turn)
  :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=%connected-our-turn-asked last-remote=last-remote.call-state]))
  :~
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>([%connection-state %connected-our-turn-asked])
    ==
  ==
++  give-turn
  |=  [uuid=@ta]
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  ?+  connection-state.call-state  `state
      :: it's our turn but our client has not asked to send anything
      :: so we can let the remote peer go
      %connected-our-turn
    :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=%connected-their-turn last-remote=last-remote.call-state]))
    :~
      :*
        %give  %fact
        ~[/call/[uuid]]
        %switchboard-to-client  !>([%connection-state %connected-their-turn])
      ==
      :*
        %pass  /inter-poke/[uuid]
        %agent  [peer.call.call-state %switchboard]
        %poke   [%switchboard-to-switchboard !>([uuid=uuid %give-turn ~])]
      ==
    ==
  ==
++  send-sdp
  |=  [uuid=@ta =sdp:switchboard]
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  =/  call  call.call-state
  ?>  =(connection-state.call-state %connected-our-turn-asked)
  :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=%connected-their-turn last-remote=last-remote.call-state]))
  :~
    :*
      %pass   /inter-poke/[uuid]
      %agent  [peer.call %switchboard]
      %poke   [%switchboard-to-switchboard !>([uuid=uuid sdp])]
    ==
    :*
      %give  %fact
      ~[/call/[uuid.call]]
      %switchboard-to-client  !>([%connection-state %connected-their-turn])
    ==
  ==
++  ask-signal
  |=  uuid=@ta
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  =/  call  call.call-state
  ?+  connection-state.call-state
    ~|("Cannot ask to send SDP in state {<connection-state.call-state>} (call {<uuid>})" !!)
      ::
      %connected-their-turn
    :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=%connected-want-turn last-remote=last-remote.call-state]))
    :~
      :*
        %pass  /inter-poke/[uuid]
        %agent  [peer.call %switchboard]
        %poke   [%switchboard-to-switchboard !>([uuid=uuid %ask-turn ~])]
      ==
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-to-client  !>([%connection-state %connected-want-turn])
      ==
    ==
      ::
      %connected-our-turn
    :_  state(calls (~(put by calls.state) uuid [call=call.call-state connection-state=%connected-our-turn-asked last-remote=last-remote.call-state]))
    :~
      :*
        %give  %fact
        ~[/call/[uuid.call]]
        %switchboard-to-client  !>([%connection-state %connected-our-turn-asked])
      ==
    ==
      ::
      %connected-our-turn-asked
    `state
      ::
      %connected-want-turn
    `state
  ==
++  receive-icecandidate
  |=  [uuid=@ta =icecandidate:switchboard]
  ?>  (~(has by calls.state) uuid)
  =/  connection-state  connection-state:(~(got by calls.state) uuid)
  =/  call  call:(~(got by calls.state) uuid)
  ?>
    ?|
      =(connection-state %connected-our-turn)
      =(connection-state %connected-our-turn-asked)
      =(connection-state %connected-their-turn)
      =(connection-state %connected-want-turn)
    ==
  :_  state
  :~
    :*
      %give  %fact
      ~[/call/[uuid]]
      %switchboard-to-client  !>(icecandidate)
    ==
  ==
++  send-icecandidate
  |=  [uuid=@ta =icecandidate:switchboard]
  ?>  (~(has by calls.state) uuid)
  =/  call-state  (~(got by calls.state) uuid)
  =/  call  call.call-state
  =/  connection-state  connection-state.call-state
  ?>
    ?|
      =(connection-state %connected-our-turn)
      =(connection-state %connected-our-turn-asked)
      =(connection-state %connected-their-turn)
      =(connection-state %connected-want-turn)
    ==
  :_  state
  :~
    :*
      %pass  /inter-poke/[uuid]
      %agent  [peer.call %switchboard]
      %poke  [%switchboard-to-switchboard !>([uuid=uuid icecandidate])]
    ==
  ==
++  place-call
  |=  [uuid=@ta peer=@p dap=@tas]
  (move-to-state [uuid peer dap] %placing)
++  reject-call
  |=  uuid=@ta
  =/  callstate  (~(got by calls.state) uuid)
  :_  state(calls (~(del by calls.state) uuid))
  :~
    :*
      %pass  /inter-poke/[uuid]
      %agent  [peer.call.callstate %switchboard]
      %poke  [%switchboard-to-switchboard !>([uuid=uuid [%hangup ~]])]
    ==
  ==
++  peer-disconnected
  |=  uuid=@ta
  =/  callstate  (~(got by calls.state) uuid)
  :_  state(calls (~(del by calls.state) uuid))
  ?+  connection-state.callstate
    :~
      :*
        %give  %fact
        ~[/call/[uuid]]
        %switchboard-to-client  !>([%hungup ~])
      ==
      :*
        %give  %kick
        ~[/call/[uuid]]
        ~
      ==
    ==
      ::
      %incoming-ringing
    :~
      :*
        %give  %fact
        ~[/incoming/[dap.call.callstate]]
        %switchboard-incoming-call  !>([%incoming-call-hangup uuid])
      ==
    ==
  ==
++  kick-reachable
  |=  dap=@tas
  ^-  card
  :*
    %give  %kick
    ~[/incoming/[dap]]
    ~
  ==
++  kick-call
  |=  uuid=@ta
  ^-  card
  :*
    %give  %kick
    ~[/call/[uuid]]
    ~
  ==
--
