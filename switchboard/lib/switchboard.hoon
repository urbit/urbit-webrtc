/-  switchboard
|%
:: Helper to generate a call UUID
++  uuid
  |=  =bowl:agent:gall
  ^-  @ta
  (scot %uv (sham now.bowl our.bowl eny.bowl))
::
++  dejs
  =,  dejs:format
  |%
  :: uuid:dejs
  ++  uuid  so
  :: connection-state:dejs
  ++  connection-state
    |=  jon=json
    ^-  connection-state:switchboard
    (connection-state:switchboard (so jon))
  :: peer:dejs
  ++  peer  (su fed:ag)
  :: dap:dejs
  ++  dap  so
  :: call:dejs
  ++  call
    %-  ot
    :~  uuid+uuid
        peer+peer
        dap+dap
    ==
  :: call-signal:dejs
  ++  call-signal
    |=  jon=json
    ^-  call-signal:switchboard
    ?+  jon  ~|  'jon must be object'  !!
        ::
        [%o *]
      :*
        (so (~(got by p.jon) 'uuid'))
        (signal (~(got by p.jon) 'signal'))
      ==
    ==
  :: signal:dejs
  ++  signal
    |=  jon=json
    ^-  signal:switchboard
    ?+  jon  ~|  'jon must be object'  !!
        ::
        [%o *]
      ?:  =((~(got by p.jon) 'tag') [%s 'sdp'])
        (sdp jon)
      ?:  =((~(got by p.jon) 'tag') [%s 'icecandidate'])
        (icecandidate jon)
      ~|  'signal tag must be sdp or icecandidate'  !!
    ==
  :: icecandidate:dejs
  ++  icecandidate
    |=  jon=json
    ^-  icecandidate:switchboard
    ?+  jon  ~|  'jon must be object'  !!
        ::
        [%o *]
      :*
          %icecandidate
          (fall (bind (~(get by p.jon) 'candidate') so) '')
          (bind (~(get by p.jon) 'sdpMid') so)
          (bind (~(get by p.jon) 'sdpMLineIndex') ni)
          (bind (~(get by p.jon) 'usernameFragment') so)
      ==
    ==
  ::  sdp:dejs
  ++  sdp
    |=  jon=json
    ^-  sdp:switchboard
    :-  %sdp
    ((ot ~[type+so sdp+so]) jon)
  ::  switchboard-from-client:dejs
  ++  switchboard-from-client
    |=  jon=json
    ^-  switchboard-from-client:switchboard
    ?>  ?=  [%o *]  jon
    ~|  p.jon
    =/  tag  (so (~(got by p.jon) 'tag'))
    =/  uuid  (uuid (~(got by p.jon) 'uuid'))
    :-  uuid
    ?:  =(tag 'place-call')
      :-  %place-call
      ((ot ~[peer+peer dap+dap]) jon)
    ?:  =(tag 'ask-signal')
      [%ask-signal ~]
    ?:  =(tag 'sdp')
      %:  sdp  jon  ==
    ?:  =(tag 'icecandidate')
      %:  icecandidate  jon  ==
    ?:  =(tag 'reject')
      [%reject ~]
    ~|  "tag should be one of ask-signal, sdp, or icecandidate"  !!
  --
::
++  enjs
  =,  enjs:format
  |%
  :: incoming-call:enjs
  ++  incoming-call
    |=  =incoming-call:switchboard
    ^-  json
    ?-  incoming-call
        ::
        [%incoming-call *]
      %-  pairs
      :~  ['peer' (peer peer.incoming-call)]
          ['uuid' (uuid uuid.incoming-call)]
          ['type' s+%incoming]
      ==
        ::
        [%incoming-call-hangup *]
      %-  pairs
      :~  ['uuid' (uuid uuid.incoming-call)]
          ['type' s+%hangup]
      ==
    ==
  :: switchboard-to-client:enjs
  ++  switchboard-to-client
    |=  =switchboard-to-client:switchboard
    ^-  json
    ?-  switchboard-to-client
        ::
        [%connection-state *]
      =/  state  connection-state.switchboard-to-client
      %-  pairs
      :~
        tag+s+'connection-state'
        :-  'connectionState'  s+state
      ==
        ::
        [%hungup ~]
      %-  pairs
      :~
        tag+s+'hungup'
      ==
        ::
        [%sdp *]
      %-  sdp  switchboard-to-client
        ::
        [%icecandidate *]
      %-  icecandidate  switchboard-to-client
    ==
  :: sdp:enjs
  ++  sdp
    |=  =sdp:switchboard
    ^-  json
    %-  pairs
    :~
      tag+s+'sdp'
      type+s+type.sdp
      sdp+s+sdp.sdp
    ==
  :: call:enjs
  ++  call
    |=  =call:switchboard
    ^-  json
    %-  pairs
    :~
      ['uuid' (uuid uuid.call)]
      ['peer' (peer peer.call)]
      ['dap' (dap dap.call)]
    ==
  :: call-signal:enjs
  ++  call-signal
    |=  =call-signal:switchboard
    ^-  json
    %-  pairs
    :~
      ['uuid' (uuid uuid.call-signal)]
      ['signal' (signal signal.call-signal)]
    ==
  :: signal:enjs
  ++  signal
    |=  =signal:switchboard
    ^-  json
    ?-  signal
        ::
        [%icecandidate *]
      (icecandidate signal)
        ::
        [%sdp *]
      (sdp signal)
    ==
  :: icecandidate:enjs
  ++  icecandidate
    |=  =icecandidate:switchboard
    ^-  json
    %-  pairs
    :-  tag+s+'icecandidate'
    %-  zing
    :~
      :_  ~  :-  'candidate'  [%s candidate.icecandidate]
      ?~  sdp-mid.icecandidate
        ~
      :_  ~  :-  'sdpMid'  [%s u.sdp-mid.icecandidate]
      ?~  sdp-m-line-index.icecandidate
        ~
      :_  ~  :-  'sdpMLineIndex'  %-  numb  u.sdp-m-line-index.icecandidate
      ?~  username-fragment.icecandidate
        ~
      :_  ~  :-  'usernameFragment'  [%s u.username-fragment.icecandidate]
    ==
  :: uuid:enjs
  ++  uuid
    |=  uuid=@ta
    ^-  json
    s+uuid
  :: connection-state:enjs
  ++  connection-state
    |=  =connection-state:switchboard
    ^-  json
    s+connection-state
  :: peer:enjs
  ++  peer  ship
  :: dap:enjs
  ++  dap
    |=  dap=@tas
    ^-  json
    s+dap
  --
--
