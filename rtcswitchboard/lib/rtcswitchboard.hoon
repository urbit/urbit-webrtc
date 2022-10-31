/-  rtcswitchboard
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
    ^-  connection-state:rtcswitchboard
    (connection-state:rtcswitchboard (so jon))
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
    ^-  call-signal:rtcswitchboard
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
    ^-  signal:rtcswitchboard
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
    ^-  icecandidate:rtcswitchboard
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
    ^-  sdp:rtcswitchboard
    :-  %sdp
    ((ot ~[type+so sdp+so]) jon)
  ::  rtcswitchboard-from-client:dejs
  ++  rtcswitchboard-from-client
    |=  jon=json
    ^-  rtcswitchboard-from-client:rtcswitchboard
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
    |=  =incoming-call:rtcswitchboard
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
  :: rtcswitchboard-to-client:enjs
  ++  rtcswitchboard-to-client
    |=  =rtcswitchboard-to-client:rtcswitchboard
    ^-  json
    ?-  rtcswitchboard-to-client
        ::
        [%connection-state *]
      =/  state  connection-state.rtcswitchboard-to-client
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
      %-  sdp  rtcswitchboard-to-client
        ::
        [%icecandidate *]
      %-  icecandidate  rtcswitchboard-to-client
    ==
  :: sdp:enjs
  ++  sdp
    |=  =sdp:rtcswitchboard
    ^-  json
    %-  pairs
    :~
      tag+s+'sdp'
      type+s+type.sdp
      sdp+s+sdp.sdp
    ==
  :: last-remote:enjs
  ++  last-remote
  |=  =last-remote:rtcswitchboard
  ^-  json
  ?~  last-remote  ~
  %-  pairs
  :~
    count+(numb count.u.last-remote)
    msg+(sdp sdp.u.last-remote)
  ==
  :: call:enjs
  ++  call
    |=  =call:rtcswitchboard
    ^-  json
    %-  pairs
    :~
      ['uuid' (uuid uuid.call)]
      ['peer' (peer peer.call)]
      ['dap' (dap dap.call)]
    ==
  :: call-signal:enjs
  ++  call-signal
    |=  =call-signal:rtcswitchboard
    ^-  json
    %-  pairs
    :~
      ['uuid' (uuid uuid.call-signal)]
      ['signal' (signal signal.call-signal)]
    ==
  :: signal:enjs
  ++  signal
    |=  =signal:rtcswitchboard
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
    |=  =icecandidate:rtcswitchboard
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
    |=  =connection-state:rtcswitchboard
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
